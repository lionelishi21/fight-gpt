import dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.join(__dirname, '../.env') });

import { AppConfig } from '../src/config/app';
import { Database } from '../src/config/database';
import { AiService } from '../src/services/AiService';
import { AnalysisService } from '../src/services/AnalysisService';
import { GameMetadataService } from '../src/services/GameMetadataService';
import { CharacterEncyclopediaService } from '../src/services/CharacterEncyclopediaService';
import { GameMetadataRepository } from '../src/repositories/GameMetadataRepository';
import { CharacterEncyclopediaRepository } from '../src/repositories/CharacterEncyclopediaRepository';
import { AnalysisRepository } from '../src/repositories/AnalysisRepository';
import { VectorRepository } from '../src/repositories/VectorRepository';
import { IngestionJob } from '../src/models/IngestionJob';

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

async function main() {
    info('Connecting to MongoDB...');
    await Database.connect();
    ok('MongoDB connected');

    const job = await IngestionJob.findOne({ status: 'pending' }).sort({ created_at: 1 });
    
    if (!job) {
        log(`${YELLOW}No pending videos found in queue.${RESET}`);
        process.exit(0);
    }

    job.status = 'processing';
    await job.save();

    const youtubeUrl = job.youtube_url;
    const gameId = job.game_id || 'sf6';

    log('');
    log(`${BOLD}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${RESET}`);
    log(`${BOLD} FightGPT Local LangGraph Analysis Pipeline${RESET}`);
    log(`${BOLD}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${RESET}`);
    log('');
    info(`URL:  ${youtubeUrl}`);
    info(`Game: ${gameId.toUpperCase()}`);

    const tracingOn =
        process.env.LANGSMITH_TRACING === 'true' ||
        process.env.LANGSMITH_TRACING_V2 === 'true' ||
        process.env.LANGCHAIN_TRACING_V2 === 'true';
    const hasApiKey = !!(process.env.LANGSMITH_API_KEY || process.env.LANGCHAIN_API_KEY);
    
    if (tracingOn && hasApiKey) {
        ok(`LangSmith tracing ON`);
    } else {
        warn(`LangSmith tracing OFF`);
    }

    const gameMetadataRepo          = new GameMetadataRepository();
    const characterEncyclopediaRepo = new CharacterEncyclopediaRepository();
    const analysisRepo              = new AnalysisRepository();
    const vectorRepo                = new VectorRepository();

    const gameMetadataService         = new GameMetadataService(gameMetadataRepo);
    const characterEncyclopediaService = new CharacterEncyclopediaService(characterEncyclopediaRepo);

    const aiService = new AiService(
        AppConfig.GEMINI_API_KEY,
        AppConfig.GEMINI_MODEL,
        gameMetadataService,
        characterEncyclopediaService,
        vectorRepo,
    );

    const analysisService = new AnalysisService(
        analysisRepo,
        aiService,
        gameMetadataService,
        characterEncyclopediaService,
        undefined,
        vectorRepo,
    );

    log('');
    info('Running pipeline: screen → flash → pro (via LangGraph)...');
    const start = Date.now();

    try {
        const result = await analysisService.analyzeVideo({
            youtube_url: youtubeUrl,
            game_id: gameId,
            force: true,
        });

        const elapsed = ((Date.now() - start) / 1000).toFixed(1);

        if (!result.success || !result.data) {
            job.status = 'failed';
            job.error_message = result.error || 'Unknown error';
            await job.save();
            err(`Analysis failed: ${result.error}`);
            process.exit(1);
        }

        job.status = 'completed';
        await job.save();

        log('');
        log(`${GREEN}${BOLD} ANALYSIS COMPLETE${RESET}  ${DIM}(${elapsed}s)${RESET}`);
        log(`${DIM}LangSmith trace recorded (if enabled)${RESET}`);
        
    } catch (e: any) {
        job.status = 'failed';
        job.error_message = e.message;
        await job.save();
        err(`Pipeline error: ${e.message}`);
        process.exit(1);
    } finally {
        await Database.disconnect();
    }
}

main();
