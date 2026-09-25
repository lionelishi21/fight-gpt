/**
 * Adds SF6 characters that are missing from the character encyclopedia, using the
 * move tables scraped by fgsm-vision-engine/src/scripts/scrape_ufd_full.py.
 *
 * Dry run by default (prints what it would write, touches nothing). Pass --apply
 * to write to the database in MONGODB_URI.
 *
 *   npx ts-node src/scripts/importUfdEncyclopedia.ts <scraped.json> [--apply]
 *
 * The source page has no motion notation (236P etc.), so `input` holds the button
 * shorthand when the move name has one and the move name otherwise.
 */
import fs from 'fs';
import dotenv from 'dotenv';
import { Database } from '../config/database';
import { CharacterEncyclopedia } from '../models/CharacterEncyclopedia';
import { Move, MoveCategory, Moveset } from '../types/characterEncyclopedia';
import { Logger } from '../helpers/logger';

dotenv.config();

interface ScrapedMove {
  name: string;
  section: string | null;
  startup: string | null;
  active: string | null;
  recovery: string | null;
  on_hit: string | null;
  on_block: string | null;
  damage: string | null;
  attack_type: string | null;
  cancellable: string | null;
  notes: string | null;
}

const BUTTONS: Record<string, string> = {
  'light punch': 'LP', 'medium punch': 'MP', 'heavy punch': 'HP',
  'light kick': 'LK', 'medium kick': 'MK', 'heavy kick': 'HK',
  'overdrive': 'OD',
};

const num = (text: string | null | undefined): number | undefined => {
  const m = /[+-]?\d+/.exec(text || '');
  return m ? parseInt(m[0], 10) : undefined;
};

function inputFor(name: string): string {
  const paren = /\(([^)]+)\)/.exec(name)?.[1]?.toLowerCase();
  if (!paren) return name;
  const parts = paren.split(/\s+or\s+/).map(p => BUTTONS[p.trim()]).filter(Boolean);
  return parts.length ? parts.join('/') : name;
}

function toMove(m: ScrapedMove, category: MoveCategory): Move {
  const properties = [m.attack_type, m.cancellable && m.cancellable !== '--' ? `Cancel: ${m.cancellable}` : null]
    .filter((p): p is string => !!p && p !== '--');
  return {
    name: m.name,
    input: inputFor(m.name),
    how_to_perform: m.name,
    category,
    properties,
    frame_data: {
      startup: num(m.startup) ?? 0,
      active: num(m.active) ?? 0,
      recovery: num(m.recovery) ?? 0,
      on_block: num(m.on_block) ?? 0,
      on_hit: num(m.on_hit),
      damage: num(m.damage),
    },
  };
}

export function buildMoveset(moves: ScrapedMove[]): Moveset {
  const moveset: Moveset = { normals: [], specials: [], ex_moves: [], supers: [], throws: [] };
  for (const m of moves) {
    switch (m.section) {
      case 'Normal Attacks':
      case 'Jump Attacks':
      case 'Target Combos':
        moveset.normals.push(toMove(m, 'normal'));
        break;
      case 'Unique Attacks':
        moveset.normals.push(toMove(m, 'unique_action'));
        break;
      case 'Special Moves':
        if (/\(overdrive\)/i.test(m.name)) moveset.ex_moves.push(toMove(m, 'ex'));
        else moveset.specials.push(toMove(m, 'special'));
        break;
      case 'Super Arts':
        moveset.supers.push(toMove(m, 'super'));
        break;
      case 'Misc.':
        if (/throw|grab/i.test(m.name)) moveset.throws!.push(toMove(m, 'normal'));
        break;
    }
  }
  return moveset;
}

async function main() {
  const file = process.argv[2];
  const apply = process.argv.includes('--apply');
  if (!file) {
    console.error('usage: importUfdEncyclopedia.ts <scraped.json> [--apply]');
    process.exit(1);
  }
  const scraped: Record<string, ScrapedMove[]> = JSON.parse(fs.readFileSync(file, 'utf8'));

  const built = Object.entries(scraped).map(([slug, moves]) => ({ slug, moveset: buildMoveset(moves) }));
  for (const { slug, moveset } of built) {
    Logger.info(
      `${slug}: normals=${moveset.normals.length} specials=${moveset.specials.length} ` +
      `ex=${moveset.ex_moves.length} supers=${moveset.supers.length} throws=${moveset.throws!.length}`,
    );
  }
  if (!apply) {
    Logger.info('Dry run - nothing written. Re-run with --apply to write to the database.');
    return;
  }

  await Database.connect();
  try {
    // Game rules are shared across SF6 characters; reuse an existing entry's.
    const template = await CharacterEncyclopedia.findOne({ game_id: 'sf6', character_id: 'ryu', is_current_patch: true });
    if (!template) throw new Error('No existing sf6 "ryu" entry to copy game_rules from');

    for (const { slug, moveset } of built) {
      const existing = await CharacterEncyclopedia.findOne({ game_id: 'sf6', character_id: slug });
      if (existing) {
        Logger.warn(`${slug}: already in the encyclopedia, skipping`);
        continue;
      }
      await new CharacterEncyclopedia({
        game_id: 'sf6',
        character_id: slug,
        patch_version: template.patch_version,
        is_current_patch: true,
        moveset,
        game_rules: template.game_rules,
        last_updated: new Date(),
      }).save();
      Logger.info(`${slug}: created`);
    }
  } finally {
    await Database.disconnect();
  }
}

if (require.main === module) {
  main().catch(err => {
    Logger.error('Import failed:', err);
    process.exit(1);
  });
}
