import { IGameMetadata, GameRule as CharacterGameRule } from '../types/gameMetadata';
import { ICharacterEncyclopedia } from '../types/characterEncyclopedia';

/**
 * AI Context Helper
 * Formats game metadata, character rules, and movesets for AI prompts
 */

/**
 * Formatted game metadata for AI prompt
 */
export interface FormattedGameMetadata {
  constantsText: string;
  globalMechanicsText: string;
  fullContextText: string;
}

/**
 * Formatted character game rules for AI prompt
 */
export interface FormattedCharacterRules {
  rulesText: string;
  hasRules: boolean;
}

/**
 * Format GameMetadata for AI prompts
 * Converts structured data into human-readable text for the AI model
 */
export function formatGameMetadataForAI(metadata: IGameMetadata | null): FormattedGameMetadata {
  if (!metadata) {
    return {
      constantsText: '',
      globalMechanicsText: '',
      fullContextText: '',
    };
  }

  // Format constants
  const constants: string[] = [];
  if (metadata.constants) {
    if (metadata.constants.team_size !== undefined) {
      constants.push(`Team Size: ${metadata.constants.team_size} (${metadata.constants.team_size > 1 ? 'Team-based' : '1v1'})`);
    }
    if (metadata.constants.has_air_dash !== undefined) {
      constants.push(`Air Dash: ${metadata.constants.has_air_dash ? 'Available' : 'Not available'}`);
    }
    if (metadata.constants.has_3d_movement !== undefined) {
      constants.push(`3D Movement: ${metadata.constants.has_3d_movement ? 'Available (Sidestep/Dodge)' : '2D only'}`);
    }
    if (metadata.constants.has_assists !== undefined) {
      constants.push(`Assists: ${metadata.constants.has_assists ? 'Available' : 'Not available'}`);
    }
    if (metadata.constants.has_dhc !== undefined) {
      constants.push(`DHC (Delayed Hyper Combo): ${metadata.constants.has_dhc ? 'Available' : 'Not available'}`);
    }
    if (metadata.constants.has_team_supers !== undefined) {
      constants.push(`Team Supers: ${metadata.constants.has_team_supers ? 'Available' : 'Not available'}`);
    }
    if (metadata.constants.max_meter !== undefined) {
      constants.push(`Max Meter: ${metadata.constants.max_meter}`);
    }
  }

  const constantsText = constants.length > 0 ? constants.join('\n- ') : 'No constants defined';

  // Format global mechanics
  const mechanics: string[] = [];
  if (metadata.global_mechanics && metadata.global_mechanics.length > 0) {
    for (const mechanic of metadata.global_mechanics) {
      let mechanicText = `- ${mechanic.key}: `;

      // Format value based on type
      if (typeof mechanic.value === 'object' && mechanic.value !== null) {
        mechanicText += JSON.stringify(mechanic.value);
      } else {
        mechanicText += String(mechanic.value);
      }

      if (mechanic.description) {
        mechanicText += ` (${mechanic.description})`;
      }

      mechanics.push(mechanicText);
    }
  } else {
    mechanics.push('No global mechanics defined');
  }

  const globalMechanicsText = mechanics.join('\n');

  // Combine into full context
  const fullContextText = `GAME CONTEXT:
${constantsText}

GLOBAL MECHANICS:
${globalMechanicsText}`;

  return {
    constantsText,
    globalMechanicsText,
    fullContextText,
  };
}

/**
 * Format character game rules for AI prompts
 * Converts character-specific rules into human-readable text
 */
export function formatCharacterGameRulesForAI(
  rules: CharacterGameRule[] | null | undefined,
  characterLabel: string = 'Character'
): FormattedCharacterRules {
  if (!rules || rules.length === 0) {
    return {
      rulesText: '',
      hasRules: false,
    };
  }

  const formattedRules: string[] = [];
  formattedRules.push(`${characterLabel.toUpperCase()} GAME RULES:`);

  for (const rule of rules) {
    let ruleText = `- ${rule.key}: `;

    // Format value based on type
    if (typeof rule.value === 'object' && rule.value !== null) {
      ruleText += JSON.stringify(rule.value);
    } else {
      ruleText += String(rule.value);
    }

    if (rule.ui_type) {
      ruleText += ` [Type: ${rule.ui_type}]`;
    }

    if (rule.description) {
      ruleText += ` (${rule.description})`;
    }

    formattedRules.push(ruleText);
  }

  return {
    rulesText: formattedRules.join('\n'),
    hasRules: true,
  };
}

/**
 * Format character moveset for AI prompts
 */
export function formatCharacterMovesetForAI(
  encyclopedia: ICharacterEncyclopedia | null | undefined,
  characterLabel: string = 'Character'
): string {
  if (!encyclopedia || !encyclopedia.moveset) return '';

  const parts: string[] = [`${characterLabel.toUpperCase()} MOVESET & FRAME DATA:`];
  const { normals, specials, ex_moves, supers } = encyclopedia.moveset;

  const formatMove = (m: any) => 
    `- ${m.name} (${m.command}): Startup:${m.startup || '?'}f | Active:${m.active || '?'}f | Recovery:${m.recovery || '?'}f | Block:${m.on_block > 0 ? '+' : ''}${m.on_block || '0'} | Hit:${m.on_hit > 0 ? '+' : ''}${m.on_hit || '0'}`;

  if (normals?.length) {
    parts.push('NORMALS:');
    normals.slice(0, 15).forEach(m => parts.push(formatMove(m)));
  }
  if (specials?.length) {
    parts.push('SPECIALS:');
    specials.slice(0, 10).forEach(m => parts.push(formatMove(m)));
  }
  if (supers?.length) {
    parts.push('SUPERS:');
    supers.forEach(m => parts.push(formatMove(m)));
  }

  return parts.join('\n');
}

/**
 * Builds a hard move-name constraint (not descriptive prose) from a character's
 * encyclopedia moveset. Used to stop Gemini from inventing move names that don't
 * exist for the character (e.g. "cr.LK" on a character that has no such move).
 */
export function formatMoveWhitelistForAI(
  p1Encyclopedia: ICharacterEncyclopedia | null | undefined,
  p2Encyclopedia: ICharacterEncyclopedia | null | undefined,
  p1Label: string = 'Player 1',
  p2Label: string = 'Player 2'
): string {
  const collectMoveNames = (encyclopedia: ICharacterEncyclopedia | null | undefined): string[] => {
    if (!encyclopedia?.moveset) return [];
    const { normals, specials, ex_moves, supers, assists, dhc, team_supers } = encyclopedia.moveset as any;
    const categories = [normals, specials, ex_moves, supers, assists, dhc, team_supers];
    const names: string[] = [];
    for (const category of categories) {
      if (!category?.length) continue;
      for (const move of category) {
        if (move?.name) names.push(move.name);
      }
    }
    return names;
  };

  const p1Names = collectMoveNames(p1Encyclopedia);
  const p2Names = collectMoveNames(p2Encyclopedia);

  if (p1Names.length === 0 && p2Names.length === 0) return '';

  const parts: string[] = [
    '═══ MOVE NAME CONSTRAINT (MANDATORY) ═══',
    'You MUST set move_used to EXACTLY one of the listed names for that character.',
    'If no listed move matches what you observe, set move_used to "unlisted_move" and explain in the description — never invent a name.',
  ];

  if (p1Names.length > 0) {
    parts.push(`\n${p1Label.toUpperCase()} — VALID MOVE NAMES:`);
    p1Names.forEach(n => parts.push(`- ${n}`));
  }
  if (p2Names.length > 0) {
    parts.push(`\n${p2Label.toUpperCase()} — VALID MOVE NAMES:`);
    p2Names.forEach(n => parts.push(`- ${n}`));
  }

  parts.push('═══ END CONSTRAINT ═══');

  return parts.join('\n');
}

/**
 * Format full game context for AI prompt
 * Combines game metadata and character rules into a single formatted string
 */
export function formatFullGameContextForAI(
  gameMetadata: IGameMetadata | null,
  p1Rules: CharacterGameRule[] | null | undefined,
  p2Rules: CharacterGameRule[] | null | undefined,
  p1Encyclopedia?: ICharacterEncyclopedia | null,
  p2Encyclopedia?: ICharacterEncyclopedia | null
): string {
  const parts: string[] = [];

  // Add game metadata
  if (gameMetadata) {
    const formattedMetadata = formatGameMetadataForAI(gameMetadata);
    if (formattedMetadata.fullContextText) {
      parts.push(formattedMetadata.fullContextText);
    }
  }

  // Add P1 character rules & moveset
  if (p1Rules && p1Rules.length > 0) {
    const p1Formatted = formatCharacterGameRulesForAI(p1Rules, 'Player 1');
    if (p1Formatted.hasRules) {
      parts.push(p1Formatted.rulesText);
    }
  }
  if (p1Encyclopedia) {
    const p1Moveset = formatCharacterMovesetForAI(p1Encyclopedia, 'Player 1');
    if (p1Moveset) parts.push(p1Moveset);
  }

  // Add P2 character rules & moveset
  if (p2Rules && p2Rules.length > 0) {
    const p2Formatted = formatCharacterGameRulesForAI(p2Rules, 'Player 2');
    if (p2Formatted.hasRules) {
      parts.push(p2Formatted.rulesText);
    }
  }
  if (p2Encyclopedia) {
    const p2Moveset = formatCharacterMovesetForAI(p2Encyclopedia, 'Player 2');
    if (p2Moveset) parts.push(p2Moveset);
  }

  // If no context available, return empty string
  if (parts.length === 0) {
    return '';
  }

  return `\n\n---\n${parts.join('\n\n')}\n---\n`;
}

/**
 * Format game constants as a simple key-value list for AI
 */
export function formatGameConstantsForAI(constants: Record<string, unknown> | undefined | null): string {
  if (!constants || Object.keys(constants).length === 0) {
    return '';
  }

  const formatted: string[] = [];

  for (const [key, value] of Object.entries(constants)) {
    if (value !== undefined && value !== null) {
      formatted.push(`${key}: ${String(value)}`);
    }
  }

  return formatted.join(', ');
}
