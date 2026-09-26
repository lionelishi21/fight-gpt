/**
 * LangGraph pipeline for the 3-stage Gemini analysis.
 *
 *   screen → (not gameplay) → END
 *   screen → (gameplay)     → flash
 *   flash  → (≥5 events)   → END
 *   flash  → (<5 events)   → pro → END
 *
 * Uses raw @google/generative-ai SDK (YouTube URL support) wrapped in
 * traceable() so every Gemini call appears as an LLM span in LangSmith.
 */

import { Annotation, StateGraph, START, END } from "@langchain/langgraph";
import { GoogleGenerativeAI } from "@google/generative-ai";
import { traceable } from "langsmith/traceable";
import { VersionResolver } from "../helpers/VersionResolver";
import { IVectorRepository } from "../repositories/VectorRepository";
import { AnalysisRequest, AnalysisResponse } from "../types";
import { Logger } from "../helpers/logger";
import { buildFewShotExamples } from "../helpers/fewShotRanker";
import { formatFullGameContextForAI, formatMoveWhitelistForAI } from "../helpers/aiContextHelper";
import { ICharacterEncyclopediaService } from "../services/CharacterEncyclopediaService";
import { IGameMetadataService } from "../services/GameMetadataService";
import { IPlayerTendencyRepository } from "../repositories/PlayerTendencyRepository";

// ── Types ──────────────────────────────────────────────────────────────────────
interface ScreenResult {
  is_gameplay: boolean;
  game_detected: string;
  p1_character: string;
  p2_character: string;
  confidence: string;
  rejection_reason: string;
}

interface UsageRecord {
  stage: string;
  model: string;
  events?: number;
}

// ── State ──────────────────────────────────────────────────────────────────────
const AnalysisAnnotation = Annotation.Root({
  request:      Annotation<AnalysisRequest>,
  videoUri:     Annotation<string | null>,

  stage: Annotation<"screen" | "flash" | "pro" | "done" | "rejected">({
    reducer: (_, next) => next,
    default: () => "screen",
  }),

  screenResult: Annotation<ScreenResult | null>({
    reducer: (_, next) => next,
    default: () => null,
  }),

  // Populated by groundNode once real characters are known (post-screen) —
  // encyclopedia movesets + character-filtered, patch-ranked few-shot examples.
  groundedContext: Annotation<string>({
    reducer: (_, next) => next,
    default: () => "",
  }),

  // Populated by fgsmNode — mathematical frame-by-frame data directly from Computer Vision
  fgsmTimeline: Annotation<string>({
    reducer: (_, next) => next,
    default: () => "",
  }),

  resolvedCharacters: Annotation<{ p1?: string; p2?: string }>({
    reducer: (_, next) => next,
    default: () => ({}),
  }),

  analysis: Annotation<AnalysisResponse | null>({
    reducer: (_, next) => next,
    default: () => null,
  }),

  usage: Annotation<UsageRecord[]>({
    reducer: (prev, next) => [...prev, ...next],
    default: () => [],
  }),
});

export type AnalysisState = typeof AnalysisAnnotation.State;

// ── Video content parts (raw SDK format, supports GCS + YouTube URLs) ─────────
function videoParts(state: AnalysisState): any[] {
  if (state.videoUri?.startsWith("gs://")) {
    const mimeType = state.videoUri.endsWith(".webm") ? "video/webm" : "video/mp4";
    return [{ fileData: { mimeType, fileUri: state.videoUri } }];
  }
  if (state.request.youtube_url) {
    return [{ fileData: { fileUri: state.request.youtube_url } }];
  }
  throw new Error("[AnalysisGraph] No video source in state");
}

// ── JSON parse helper ─────────────────────────────────────────────────────────
function parseJson(text: string): any {
  return JSON.parse(text.replace(/```json\n?/g, "").replace(/```\n?/g, "").trim());
}

// ── 429 check ─────────────────────────────────────────────────────────────────
function is429(err: any): boolean {
  return (
    err?.status === 429 ||
    err?.message?.includes("429") ||
    err?.message?.includes("prepayment credits") ||
    err?.message?.includes("Too Many Requests")
  );
}

// ── Model selection ───────────────────────────────────────────────────────────
// Model names come from the environment so a model that a key can no longer use
// (e.g. "no longer available to new users") is a config change, not a deploy.
const FLASH_MODEL = process.env.GEMINI_FLASH_MODEL || 'gemini-2.5-flash';
// Tried in order after the requested model fails with a capacity/permission error.
const FALLBACK_MODELS = (process.env.GEMINI_FALLBACK_MODELS || '')
  .split(',').map(s => s.trim()).filter(Boolean);

const sleep = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

function errorText(err: any): string {
  return String(err?.message || err || '');
}

// Overloaded ("high demand") responses are usually gone within seconds.
function isOverloaded(err: any): boolean {
  const s = err?.status;
  return s === 503 || s === 500 || s === 504 || /\b(503|500|504)\b|high demand|overloaded|UNAVAILABLE/i.test(errorText(err));
}

// Errors that are specific to one model: try the next model instead of giving up.
function isModelSpecific(err: any): boolean {
  const s = err?.status;
  return isOverloaded(err) || is429(err) || s === 403 || s === 404 ||
    /\b(403|404)\b|no longer available|PERMISSION_DENIED|not found/i.test(errorText(err));
}

// ── Screen prompt ──────────────────────────────────────────────────────────────
const SCREEN_PROMPT = `You are a fighting game video classifier. Watch this video and answer ONLY:

Return exactly this JSON (no markdown):
{
  "is_gameplay": true/false,
  "game_detected": "sf6 | tekken8 | mk1 | ggst | dbfz | mvc3 | other | unknown",
  "p1_character": "character name or null",
  "p2_character": "character name or null",
  "confidence": "high | medium | low",
  "rejection_reason": "null if gameplay, else brief reason e.g. 'patch notes video'"
}

is_gameplay = true ONLY if two players actively fight in a versus match with rounds and health bars.
NOT gameplay: combo tutorials, tier lists, patch notes, story mode, interviews.`;

// ── Factory ───────────────────────────────────────────────────────────────────
export function createAnalysisGraph(deps: {
  vectorRepository?: IVectorRepository;
  generateEmbedding: (text: string) => Promise<number[]>;
  apiKey: string;
  fallbackApiKey?: string;
  modelName: string;
  characterEncyclopediaService?: ICharacterEncyclopediaService;
  gameMetadataService?: IGameMetadataService;
  playerTendencyRepository?: IPlayerTendencyRepository;
}) {
  const {
    vectorRepository, generateEmbedding, apiKey, fallbackApiKey, modelName,
    characterEncyclopediaService, gameMetadataService, playerTendencyRepository,
  } = deps;

  // Traceable Gemini call — shows as LLM span in LangSmith
  const callGemini = traceable(
    async (key: string, model: string, parts: any[], config?: any): Promise<string> => {
      const genAI   = new GoogleGenerativeAI(key);
      const gemini  = genAI.getGenerativeModel({ model });
      const result  = await gemini.generateContent({
        contents: [{ role: "user", parts }],
        ...(config || {}),
      });
      return result.response.candidates?.[0]?.content?.parts?.[0]?.text || "";
    },
    { name: "gemini_generate", run_type: "llm" }
  );

  // One model: retry with the fallback key on 429
  async function generateWithKeys(model: string, parts: any[], config?: any): Promise<string> {
    try {
      return await callGemini(apiKey, model, parts, config);
    } catch (err: any) {
      if (is429(err) && fallbackApiKey) {
        Logger.warn(`[AnalysisGraph] Primary key quota hit — switching to fallback for ${model}`);
        return await callGemini(fallbackApiKey, model, parts, config);
      }
      throw err;
    }
  }

  // Requested model first (with short retries while it is overloaded), then each
  // GEMINI_FALLBACK_MODELS entry in order. Only model-specific errors move on.
  async function generate(model: string, parts: any[], config?: any): Promise<string> {
    const candidates = [model, ...FALLBACK_MODELS.filter(m => m !== model)];
    const overloadRetryDelaysMs = [2000, 6000];
    let lastErr: any;

    for (const candidate of candidates) {
      for (let attempt = 0; ; attempt++) {
        try {
          const text = await generateWithKeys(candidate, parts, config);
          if (candidate !== model) Logger.info(`[AnalysisGraph] Served by fallback model ${candidate} (requested ${model})`);
          return text;
        } catch (err: any) {
          lastErr = err;
          if (isOverloaded(err) && attempt < overloadRetryDelaysMs.length) {
            Logger.warn(`[AnalysisGraph] ${candidate} overloaded — retry ${attempt + 1} in ${overloadRetryDelaysMs[attempt] / 1000}s`);
            await sleep(overloadRetryDelaysMs[attempt]);
            continue;
          }
          if (!isModelSpecific(err)) throw err;
          Logger.warn(`[AnalysisGraph] ${candidate} failed (${errorText(err).slice(0, 120)}) — trying next model`);
          break;
        }
      }
    }
    throw lastErr;
  }

  // ── Node 1: Screen ───────────────────────────────────────────────────────────
  async function screenNode(state: AnalysisState): Promise<Partial<AnalysisState>> {
    let screenResult: ScreenResult;
    try {
      const text = await generate(
        FLASH_MODEL,
        [...videoParts(state), { text: SCREEN_PROMPT }],
        { generationConfig: { responseMimeType: "application/json" } }
      );
      screenResult = parseJson(text);
    } catch (err) {
      Logger.warn("[AnalysisGraph] Screen failed, defaulting to gameplay=true");
      screenResult = {
        is_gameplay: true,
        game_detected: state.request.game_id || "unknown",
        p1_character: "", p2_character: "",
        confidence: "low", rejection_reason: "",
      };
    }

    Logger.info(
      `[AnalysisGraph] Screen: ${screenResult.is_gameplay ? "✓ gameplay" : "✗ rejected"} ` +
      `| ${screenResult.game_detected} | ${screenResult.p1_character} vs ${screenResult.p2_character} (${screenResult.confidence})`
    );

    return {
      screenResult,
      stage: screenResult.is_gameplay ? "flash" : "rejected",
      usage: [{ stage: "screen", model: FLASH_MODEL }],
    };
  }

  // ── Node 1.5: Ground (encyclopedia + character-filtered few-shot, post-screen) ─
  // Runs after screenNode has identified the real characters. If the caller already
  // supplied both character IDs upfront (start.gg pre-label) and the upstream
  // enrichment already built ai_context for those exact characters, reuse it instead
  // of re-fetching — avoids a redundant duplicate fetch in the already-correct path.
  const groundContext = traceable(
    async (
      gameId: string,
      p1: string | undefined,
      p2: string | undefined,
      queryText: string,
      userId: string | undefined,
    ): Promise<string> => {
      let context = "";

      if (characterEncyclopediaService) {
        try {
          const [p1Rules, p2Rules, p1Enc, p2Enc] = await Promise.all([
            p1 ? characterEncyclopediaService.getGameRules(gameId, p1) : Promise.resolve(null),
            p2 ? characterEncyclopediaService.getGameRules(gameId, p2) : Promise.resolve(null),
            p1 ? characterEncyclopediaService.getCurrentEncyclopediaByGameAndCharacter(gameId, p1) : Promise.resolve(null),
            p2 ? characterEncyclopediaService.getCurrentEncyclopediaByGameAndCharacter(gameId, p2) : Promise.resolve(null),
          ]);
          const gameMetadataRes = gameMetadataService
            ? await gameMetadataService.getCurrentGameMetadataByGameId(gameId).catch(() => null)
            : null;

          const p1EncData = p1Enc && (p1Enc as any).success ? (p1Enc as any).data : null;
          const p2EncData = p2Enc && (p2Enc as any).success ? (p2Enc as any).data : null;

          context += formatFullGameContextForAI(
            gameMetadataRes?.success ? gameMetadataRes.data || null : null,
            p1Rules && (p1Rules as any).success ? (p1Rules as any).data : null,
            p2Rules && (p2Rules as any).success ? (p2Rules as any).data : null,
            p1EncData,
            p2EncData,
          );

          const moveWhitelist = formatMoveWhitelistForAI(p1EncData, p2EncData, 'Player 1', 'Player 2');
          if (moveWhitelist) context += `\n\n${moveWhitelist}`;
        } catch (err: any) {
          Logger.warn(`[AnalysisGraph] Encyclopedia grounding failed: ${err?.message}`);
        }
      }

      if (vectorRepository) {
        try {
          const currentPatch = gameMetadataService
            ? await gameMetadataService.getCurrentGameMetadataByGameId(gameId)
              .then(r => r.success ? r.data?.patch_version : null).catch(() => null)
            : null;

          // Look up this user's tendency profile for whichever of p1/p2 they've
          // actually been recorded playing before — most users only ever play one
          // side, so at most one of these will have an accumulated profile.
          let tendencyVector: number[] | undefined;
          if (playerTendencyRepository && userId) {
            const profiles = await Promise.all([
              p1 ? playerTendencyRepository.findByOwnerAndCharacter('user', userId, gameId, p1) : Promise.resolve(null),
              p2 ? playerTendencyRepository.findByOwnerAndCharacter('user', userId, gameId, p2) : Promise.resolve(null),
            ]);
            const withVector = profiles.find(p => p?.tendency_vector?.length);
            tendencyVector = withVector?.tendency_vector;
          }

          const fewShot = await buildFewShotExamples({
            vectorRepository,
            generateEmbedding,
            gameId,
            characters: [p1, p2].filter(Boolean) as string[],
            currentPatchVersion: currentPatch,
            queryText,
            tendencyVector,
          });
          if (fewShot) context += fewShot;
        } catch (err: any) {
          Logger.warn(`[AnalysisGraph] Few-shot grounding failed: ${err?.message}`);
        }
      }

      return context;
    },
    { name: "ground_context_build", run_type: "retriever" },
  );

  async function groundNode(state: AnalysisState): Promise<Partial<AnalysisState>> {
    const gameId = state.request.game_id || "sf6";
    const p1 = state.request.p1_character_id || state.screenResult?.p1_character || undefined;
    const p2 = state.request.p2_character_id || state.screenResult?.p2_character || undefined;

    const wasPreLabeled = !!(state.request.p1_character_id && state.request.p2_character_id);
    if (wasPreLabeled && state.request.ai_context) {
      // Upstream enrichment already grounded this against the correct, known characters.
      return { resolvedCharacters: { p1, p2 }, groundedContext: state.request.ai_context };
    }

    const queryText = [gameId.toUpperCase(), p1, p2, state.request.video_title].filter(Boolean).join(" — ");
    const groundedContext = await groundContext(gameId, p1, p2, queryText, (state.request as any).userId);

    return { resolvedCharacters: { p1, p2 }, groundedContext };
  }

  // ── Node 1.75: FGSM Vision Engine (Mathematical Frame Extraction) ─────────────
  async function fgsmNode(state: AnalysisState): Promise<Partial<AnalysisState>> {
    // Off by default: the FGSM service only returns real detections once its
    // trained models are wired in. Its log is presented to Gemini as ground
    // truth, so feeding it placeholder data would actively corrupt analyses.
    if (process.env.FGSM_ENABLED !== "true") {
      return {};
    }
    if (!state.request.youtube_url) {
      Logger.info("[AnalysisGraph] FGSM skipped (no youtube_url)");
      return {};
    }

    Logger.info("[AnalysisGraph] FGSM Vision Engine extraction running...");
    let fgsmTimeline = "";
    
    try {
      const response = await fetch("http://localhost:8000/api/analyze", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ youtube_url: state.request.youtube_url })
      });
      
      if (response.ok) {
        const jsonResponse = await response.json();
        if (jsonResponse.success && jsonResponse.timeline) {
          fgsmTimeline = JSON.stringify(jsonResponse.timeline, null, 2);
          Logger.info(`[AnalysisGraph] FGSM extracted ${jsonResponse.timeline.length} events successfully.`);
        }
      } else {
        Logger.warn(`[AnalysisGraph] FGSM returned status ${response.status}`);
      }
    } catch (err: any) {
      Logger.warn(`[AnalysisGraph] FGSM engine failed or offline: ${err?.message}`);
    }

    return { fgsmTimeline };
  }

  // ── Node 2: Flash + thinking ─────────────────────────────────────────────────
  async function flashNode(state: AnalysisState): Promise<Partial<AnalysisState>> {
    const enrichedRequest: AnalysisRequest = {
      ...state.request,
      p1_character_id: state.resolvedCharacters.p1,
      p2_character_id: state.resolvedCharacters.p2,
    };

    const basePrompt = VersionResolver.resolvePromptForGame(
      enrichedRequest.game_id || "sf6",
      enrichedRequest.match_format || "1v1",
      enrichedRequest.p1_team,
      enrichedRequest.p2_team,
    );
    const notation = VersionResolver.getMoveNotationGuide(enrichedRequest.game_id || "sf6");

    let fullPrompt = basePrompt;
    if (state.groundedContext)       fullPrompt += `\n\nContext:\n${state.groundedContext}`;
    
    if (state.fgsmTimeline) {
      fullPrompt += `\n\n--- MATHEMATICAL FRAME LOG ---\n`;
      fullPrompt += `The following is 100% accurate structural data extracted by our Computer Vision engine. Base your analysis completely on this data where available, do not hallucinate visual events that contradict this mathematical log.\n`;
      fullPrompt += state.fgsmTimeline;
    }
    
    if (enrichedRequest.video_title) fullPrompt += `\n\nVideo Title: ${enrichedRequest.video_title}`;
    fullPrompt += notation;

    let analysis: AnalysisResponse;
    try {
      const text = await generate(
        FLASH_MODEL,
        [...videoParts(state), { text: fullPrompt }],
        {
          generationConfig: {
            responseMimeType: "application/json",
            thinkingConfig: { thinkingBudget: 1024 },
            maxOutputTokens: 8192,
          },
        }
      );
      analysis = parseJson(text);
    } catch (err: any) {
      Logger.warn(`[AnalysisGraph] Flash failed: ${err?.message} — escalating to Pro`);
      return { stage: "pro", usage: [{ stage: "flash", model: FLASH_MODEL, events: 0 }] };
    }

    if ((analysis as any).is_gameplay_video === false || (analysis as any).status === "not_gameplay") {
      Logger.info(`[AnalysisGraph] Flash rejected: ${(analysis as any).reason || "not gameplay"}`);
      return { stage: "rejected", usage: [{ stage: "flash", model: FLASH_MODEL, events: 0 }] };
    }

    const timelineLength = analysis.timeline?.length ?? 0;
    Logger.info(`[AnalysisGraph] Flash: ${timelineLength} events → ${timelineLength >= 5 ? "done" : "escalating to Pro"}`);

    return {
      analysis,
      stage: timelineLength >= 5 ? "done" : "pro",
      usage: [{ stage: "flash", model: FLASH_MODEL, events: timelineLength }],
    };
  }

  // ── Node 3: Pro escalation ───────────────────────────────────────────────────
  async function proNode(state: AnalysisState): Promise<Partial<AnalysisState>> {
    Logger.info("[AnalysisGraph] Pro escalation running");

    const basePrompt = VersionResolver.resolvePromptForGame(
      state.request.game_id || "sf6",
      state.request.match_format || "1v1",
      state.request.p1_team,
      state.request.p2_team,
    );

    let fullPrompt = basePrompt;
    if (state.groundedContext)     fullPrompt += `\n\nContext:\n${state.groundedContext}`;
    
    if (state.fgsmTimeline) {
      fullPrompt += `\n\n--- MATHEMATICAL FRAME LOG ---\n`;
      fullPrompt += `The following is 100% accurate structural data extracted by our Computer Vision engine. Base your analysis completely on this data where available, do not hallucinate visual events that contradict this mathematical log.\n`;
      fullPrompt += state.fgsmTimeline;
    }
    
    if (state.request.video_title) fullPrompt += `\n\nVideo Title: ${state.request.video_title}`;

    const text = await generate(
      modelName,
      [...videoParts(state), { text: fullPrompt }],
      { generationConfig: { responseMimeType: "application/json", maxOutputTokens: 16384 } }
    );

    const analysis = parseJson(text) as AnalysisResponse;

    if ((analysis as any).is_gameplay_video === false || (analysis as any).status === "not_gameplay") {
      return { stage: "rejected", usage: [{ stage: "pro", model: modelName }] };
    }

    return { analysis, stage: "done", usage: [{ stage: "pro", model: modelName }] };
  }

  // ── Routing ───────────────────────────────────────────────────────────────────
  function afterScreen(state: AnalysisState): "ground" | typeof END {
    return state.stage === "rejected" ? END : "ground";
  }

  function afterFlash(state: AnalysisState): "pro" | typeof END {
    return state.stage === "pro" ? "pro" : END;
  }

  // ── Compile ───────────────────────────────────────────────────────────────────
  return new StateGraph(AnalysisAnnotation)
    .addNode("screen", screenNode)
    .addNode("ground", groundNode)
    .addNode("fgsm", fgsmNode)
    .addNode("flash",  flashNode)
    .addNode("pro",    proNode)
    .addEdge(START, "screen")
    .addConditionalEdges("screen", afterScreen)
    .addEdge("ground", "fgsm")
    .addEdge("fgsm", "flash")
    .addConditionalEdges("flash",  afterFlash)
    .addEdge("pro", END)
    .compile();
}
