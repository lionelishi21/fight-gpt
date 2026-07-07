import dotenv from 'dotenv';
dotenv.config();

/**
 * Local analysis script — driven by the Claude Code /analyze skill.
 *
 * Usage:
 *   npx tsx src/scripts/localAnalyzeVideo.ts <youtube_url> [game_id]
 *
 * game_id defaults to sf6. Supported: sf6 | tekken8 | ggst | mk1 | dbfz
 */

import { AppConfig } from '../config/app';
import { Database } from '../config/database';
import { AiService } from '../services/AiService';
import { AnalysisService } from '../services/AnalysisService';
import { GameMetadataService } from '../services/GameMetadataService';
import { CharacterEncyclopediaService } from '../services/CharacterEncyclopediaService';
import { GameMetadataRepository } from '../repositories/GameMetadataRepository';
import { CharacterEncyclopediaRepository } from '../repositories/CharacterEncyclopediaRepository';
import { AnalysisRepository } from '../repositories/AnalysisRepository';
import { VectorRepository } from '../repositories/VectorRepository';
import { PlayerTendencyRepository } from '../repositories/PlayerTendencyRepository';

const RESET  = '\x1b[0m';
const BOLD   = '\x1b[1m';
const RED    = '\x1b[31m';
const GREEN  = '\x1b[32m';
const YELLOW = '\x1b[33m';
const CYAN   = '\x1b[36m';
const DIM    = '\x1b[2m';

function log(msg: string)  { console.log(msg); }
function ok(msg: string)   { log(`${GREEN}✓${RESET} ${msg}`); }
function warn(msg: string) { log(`${YELLOW}⚠${RESET}  ${msg}`); }
function err(msg: string)  { log(`${RED}✗${RESET} ${msg}`); }
function info(msg: string) { log(`${CYAN}→${RESET} ${msg}`); }
function dim(msg: string)  { log(`${DIM}${msg}${RESET}`); }

async function main() {
  const youtubeUrl = process.argv[2];
  const gameId     = process.argv[3] || 'sf6';

  if (!youtubeUrl || !youtubeUrl.startsWith('http')) {
    err('Usage: npx tsx src/scripts/localAnalyzeVideo.ts <youtube_url> [game_id]');
    err('Example: npx tsx src/scripts/localAnalyzeVideo.ts "https://youtu.be/abc123" tekken8');
    process.exit(1);
  }

  log('');
  log(`${BOLD}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${RESET}`);
  log(`${BOLD} FightGPT Local Analysis Pipeline${RESET}`);
  log(`${BOLD}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${RESET}`);
  log('');
  info(`URL:  ${youtubeUrl}`);
  info(`Game: ${gameId.toUpperCase()}`);

  // LangSmith tracing status (SDK checks LANGSMITH_* then LANGCHAIN_* as fallback)
  const tracingOn =
    process.env.LANGSMITH_TRACING === 'true' ||
    process.env.LANGSMITH_TRACING_V2 === 'true' ||
    process.env.LANGCHAIN_TRACING_V2 === 'true';
  const hasApiKey = !!(process.env.LANGSMITH_API_KEY || process.env.LANGCHAIN_API_KEY);
  const project   = process.env.LANGSMITH_PROJECT || process.env.LANGCHAIN_PROJECT || 'default';
  const endpoint  = process.env.LANGSMITH_ENDPOINT || 'https://api.smith.langchain.com';
  if (tracingOn && hasApiKey) {
    ok(`LangSmith tracing ON → project: ${project} | endpoint: ${endpoint}`);
  } else {
    warn(`LangSmith tracing OFF (tracing=${tracingOn}, apiKey=${hasApiKey ? 'set' : 'MISSING'})`);
  }

  // Fallback key status
  if (AppConfig.GEMINI_API_KEY_2) {
    ok('Fallback Gemini key (GEMINI_API_KEY_2) loaded — will auto-switch on 429');
  }

  log('');

  // Connect
  info('Connecting to MongoDB...');
  await Database.connect();
  ok('MongoDB connected');

  // Init services
  const gameMetadataRepo          = new GameMetadataRepository();
  const characterEncyclopediaRepo = new CharacterEncyclopediaRepository();
  const analysisRepo              = new AnalysisRepository();
  const vectorRepo                = new VectorRepository();
  const playerTendencyRepo        = new PlayerTendencyRepository();

  const gameMetadataService         = new GameMetadataService(gameMetadataRepo);
  const characterEncyclopediaService = new CharacterEncyclopediaService(characterEncyclopediaRepo);

  const aiService = new AiService(
    AppConfig.GEMINI_API_KEY,
    AppConfig.GEMINI_MODEL,
    gameMetadataService,
    characterEncyclopediaService,
    vectorRepo,
    playerTendencyRepo,
  );

  const analysisService = new AnalysisService(
    analysisRepo,
    aiService,
    gameMetadataService,
    characterEncyclopediaService,
    undefined,
    vectorRepo,
    undefined,
    undefined,
    undefined,
    playerTendencyRepo,
  );

  log('');
  info('Running pipeline: screen → flash → pro (if needed)...');
  const start = Date.now();

  try {
    const result = await analysisService.analyzeVideo({
      youtube_url: youtubeUrl,
      game_id: gameId,
      force: process.argv[4] === '--force',
    });

    const elapsed = ((Date.now() - start) / 1000).toFixed(1);

    if (!result.success || !result.data) {
      err(`Analysis failed: ${result.error}`);
      process.exit(1);
    }

    const d = result.data;
    log('');
    log(`${BOLD}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${RESET}`);
    log(`${GREEN}${BOLD} ANALYSIS COMPLETE${RESET}  ${DIM}(${elapsed}s)${RESET}`);
    log(`${BOLD}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${RESET}`);
    log('');

    log(`${BOLD}${d.p1_name || 'P1'}  ${DIM}(${d.p1_character})${RESET}  vs  ${BOLD}${d.p2_name || 'P2'}${RESET}  ${DIM}(${d.p2_character})${RESET}`);
    if (d.match_winner) {
      const winner = d.match_winner === 'p1' ? (d.p1_name || d.p1_character || 'P1') : (d.p2_name || d.p2_character || 'P2');
      log(`${GREEN}Winner: ${winner}${RESET}`);
    }
    log('');

    // Timeline
    if (d.timeline?.length) {
      log(`${BOLD}TIMELINE${RESET}  ${DIM}(${d.timeline.length} events)${RESET}`);
      log(DIM + '─'.repeat(55) + RESET);
      d.timeline.slice(0, 12).forEach((ev: any) => {
        const actor = ev.actor === 'p1' ? `${CYAN}P1${RESET}` : `${RED}P2${RESET}`;
        log(`  ${DIM}${ev.timestamp}${RESET}  ${actor}  ${BOLD}${ev.move_used}${RESET}  ${DIM}[${ev.event_type}]${RESET}`);
        log(`       ${ev.description}`);
        if (ev.coach_advice) log(`       ${YELLOW}▸ ${ev.coach_advice}${RESET}`);
      });
      if (d.timeline.length > 12) dim(`       … and ${d.timeline.length - 12} more events`);
      log('');
    }

    // Tips
    if (d.top_3_tips?.length) {
      log(`${BOLD}TOP TIPS${RESET}`);
      d.top_3_tips.forEach((tip: string, i: number) => log(`  ${i + 1}. ${tip}`));
      log('');
    }

    // Mission
    if (d.daily_mission) {
      log(`${BOLD}DAILY MISSION:${RESET} ${d.daily_mission.title}`);
      d.daily_mission.drill_steps?.forEach((s: string) => log(`  → ${s}`));
      log('');
    }

    // LangSmith link
    if (tracingOn && hasApiKey) {
      log(`${DIM}LangSmith trace → smith.langchain.com → project: ${project}${RESET}`);
    }

    log(`${DIM}Analysis ID: ${(result as any).analysis_id || 'saved'}${RESET}`);
    log('');

  } catch (e: any) {
    const elapsed = ((Date.now() - start) / 1000).toFixed(1);
    log('');
    if (e.name === 'NotGameplayError') {
      warn(`Not gameplay (${elapsed}s): ${e.message}`);
    } else {
      err(`Pipeline error (${elapsed}s): ${e.message}`);
      if (process.env.DEBUG) console.error(e);
    }
    process.exit(1);
  } finally {
    await Database.disconnect();
  }
}

main();
