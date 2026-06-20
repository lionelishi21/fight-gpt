/**
 * LangGraph pipeline for the 3-stage Gemini analysis.
 *
 * Replaces the nested try/catch waterfall in AiService.generateAnalysis() with
 * an explicit state graph that LangSmith can trace end-to-end:
 *
 *   screen → (not gameplay) → END
 *   screen → (gameplay)     → flash
 *   flash  → (≥5 events)   → END
 *   flash  → (<5 events)   → pro → END
 *
 * Usage — drop into AiService:
 *   const graph = createAnalysisGraph({ vectorRepository, generateEmbedding, apiKey, modelName });
 *   const state = await graph.invoke({ request, videoUri });
 *   if (state.stage === "rejected") throw NotGameplayError;
 *   return state.analysis;
 */

import { Annotation, StateGraph, START, END } from "@langchain/langgraph";
import { ChatGoogleGenerativeAI } from "@langchain/google-genai";
import { HumanMessage } from "@langchain/core/messages";
import { traceable } from "langsmith/traceable";
import { VersionResolver } from "../helpers/VersionResolver";
import { IVectorRepository } from "../repositories/VectorRepository";
import { AnalysisRequest, AnalysisResponse } from "../types";
import { Logger } from "../helpers/logger";

// ── Screen result shape ────────────────────────────────────────────────────────
interface ScreenResult {
  is_gameplay: boolean;
  game_detected: string;
  p1_character: string;
  p2_character: string;
  confidence: string;
  rejection_reason: string;
}

// ── Usage record (lightweight — token counts come from LangSmith) ─────────────
interface UsageRecord {
  stage: string;
  model: string;
  events?: number;
}

// ── State annotation ───────────────────────────────────────────────────────────
const AnalysisAnnotation = Annotation.Root({
  request:      Annotation<AnalysisRequest>,
  videoUri:     Annotation<string | null>,  // null = use request.youtube_url

  stage: Annotation<"screen" | "flash" | "pro" | "done" | "rejected">({
    reducer: (_, next) => next,
    default: () => "screen",
  }),

  screenResult: Annotation<ScreenResult | null>({
    reducer: (_, next) => next,
    default: () => null,
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

// ── Build video content part for LangChain messages ───────────────────────────
function videoContent(state: AnalysisState): object {
  if (state.videoUri?.startsWith("gs://")) {
    const mimeType = state.videoUri.endsWith(".webm") ? "video/webm" : "video/mp4";
    return { type: "media", fileUri: state.videoUri, mimeType };
  }
  if (state.request.youtube_url) {
    return { type: "media", fileUri: state.request.youtube_url };
  }
  throw new Error("[AnalysisGraph] No video source in state");
}

// ── Few-shot block from vector DB (same logic as AiService.buildFewShotBlock) ─
const buildFewShotBlock = traceable(
  async (
    request: AnalysisRequest,
    vectorRepository: IVectorRepository,
    generateEmbedding: (text: string) => Promise<number[]>,
  ): Promise<string> => {
    try {
      const gameId = request.game_id || "sf6";
      const characters = [request.p1_character_id, request.p2_character_id].filter(Boolean) as string[];
      const contextText = characters.length
        ? `${gameId} match: ${characters.join(" vs ")}`
        : `${gameId} high level tournament match`;

      const embedding = await generateEmbedding(contextText);
      const scenarios = await vectorRepository.findSimilarScenarios(embedding, gameId, 3);
      if (!scenarios.length) return "";

      const examples = scenarios
        .map((s, i) => {
          const chars = s.characters_involved?.join(" vs ") || "unknown";
          const tags  = s.tags?.join(", ") || "";
          return `Example ${i + 1} [${chars}${tags ? ` | ${tags}` : ""}]:\n  Context: ${s.context}\n  Description: ${s.description}`;
        })
        .join("\n\n");

      return `REFERENCE SCENARIOS FROM PRO MATCH DATABASE (use as calibration examples):\n\n${examples}\n\n---`;
    } catch {
      return "";
    }
  },
  { name: "build_few_shot_block", run_type: "retriever" },
);

// ── Screen prompt ──────────────────────────────────────────────────────────────
const SCREEN_PROMPT = `You are a fighting game video classifier. Watch this video and answer ONLY:

Return exactly this JSON:
{
  "is_gameplay": true/false,
  "game_detected": "sf6 | tekken8 | mk1 | ggst | dbfz | mvc3 | other | unknown",
  "p1_character": "character name or null",
  "p2_character": "character name or null",
  "confidence": "high | medium | low",
  "rejection_reason": "null if gameplay, else brief reason e.g. 'patch notes video'"
}

is_gameplay = true ONLY if two players actively fight in a versus match with rounds and health bars.
NOT gameplay: combo tutorials, tier lists, patch notes, story mode, interviews.

Return ONLY the JSON. No markdown.`;

// ── Key-aware invoke — retries with fallback key on quota exhaustion ──────────
function is429(err: any): boolean {
  return (
    err?.status === 429 ||
    err?.message?.includes('429') ||
    err?.message?.includes('prepayment credits') ||
    err?.message?.includes('Too Many Requests')
  );
}

async function invokeWithFallback(
  primaryKey: string,
  fallbackKey: string | undefined,
  modelId: string,
  opts: Record<string, unknown>,
  messages: any[]
): Promise<any> {
  const primary = new ChatGoogleGenerativeAI({ model: modelId, apiKey: primaryKey, ...opts });
  try {
    return await primary.invoke(messages);
  } catch (err: any) {
    if (is429(err) && fallbackKey) {
      Logger.warn(`[AnalysisGraph] Primary key quota depleted — switching to fallback key for ${modelId}`);
      const fallback = new ChatGoogleGenerativeAI({ model: modelId, apiKey: fallbackKey, ...opts });
      return await fallback.invoke(messages);
    }
    throw err;
  }
}

// ── Factory ───────────────────────────────────────────────────────────────────
export function createAnalysisGraph(deps: {
  vectorRepository?: IVectorRepository;
  generateEmbedding: (text: string) => Promise<number[]>;
  apiKey: string;
  fallbackApiKey?: string;  // antigravity / secondary Gemini key
  modelName: string;
}) {
  const { vectorRepository, generateEmbedding, apiKey, fallbackApiKey, modelName } = deps;

  // ── Node 1: Screen ──────────────────────────────────────────────────────────
  // Cheap Flash call — rejects non-gameplay before any expensive call runs.
  async function screenNode(state: AnalysisState): Promise<Partial<AnalysisState>> {
    const msg = new HumanMessage({
      content: [videoContent(state), { type: "text", text: SCREEN_PROMPT }] as any,
    });

    let screenResult: ScreenResult;
    try {
      const result = await invokeWithFallback(apiKey, fallbackApiKey, "gemini-2.5-flash", { temperature: 0 }, [msg]);
      const text = typeof result.content === "string"
        ? result.content
        : JSON.stringify(result.content);
      const cleaned = text.replace(/```json\n?/g, "").replace(/```\n?/g, "").trim();
      screenResult = JSON.parse(cleaned);
    } catch (err) {
      Logger.warn("[AnalysisGraph] Screen parse failed, defaulting to gameplay=true");
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
      usage: [{ stage: "screen", model: "gemini-2.5-flash" }],
    };
  }

  // ── Node 2: Flash + thinking ────────────────────────────────────────────────
  // Full structured analysis. Escalates to Pro only if timeline is thin (< 5 events).
  async function flashNode(state: AnalysisState): Promise<Partial<AnalysisState>> {
    const enrichedRequest: AnalysisRequest = {
      ...state.request,
      p1_character_id: state.request.p1_character_id || state.screenResult?.p1_character || undefined,
      p2_character_id: state.request.p2_character_id || state.screenResult?.p2_character || undefined,
    };

    const basePrompt = VersionResolver.resolvePromptForGame(
      enrichedRequest.game_id || "sf6",
      enrichedRequest.match_format || "1v1",
      enrichedRequest.p1_team,
      enrichedRequest.p2_team,
    );
    const notation = VersionResolver.getMoveNotationGuide(enrichedRequest.game_id || "sf6");

    const fewShot = vectorRepository
      ? await buildFewShotBlock(enrichedRequest, vectorRepository, generateEmbedding)
      : "";

    let fullPrompt = fewShot ? fewShot + "\n\n" + basePrompt : basePrompt;
    if (enrichedRequest.ai_context)  fullPrompt += `\n\nContext:\n${enrichedRequest.ai_context}`;
    if (enrichedRequest.video_title) fullPrompt += `\n\nVideo Title: ${enrichedRequest.video_title}`;
    fullPrompt += notation;

    const msg = new HumanMessage({
      content: [videoContent(state), { type: "text", text: fullPrompt }] as any,
    });

    let analysis: AnalysisResponse;
    try {
      const result = await invokeWithFallback(
        apiKey, fallbackApiKey, "gemini-2.5-flash",
        { temperature: 0, maxOutputTokens: 8192 },
        [msg]
      );

      const text = typeof result.content === "string"
        ? result.content
        : JSON.stringify(result.content);
      analysis = JSON.parse(text.replace(/```json\n?/g, "").replace(/```\n?/g, "").trim());
    } catch (err: any) {
      Logger.warn(`[AnalysisGraph] Flash failed: ${err?.message} — escalating to Pro`);
      return {
        stage: "pro",
        usage: [{ stage: "flash", model: "gemini-2.5-flash", events: 0 }],
      };
    }

    if ((analysis as any).is_gameplay_video === false || (analysis as any).status === "not_gameplay") {
      const reason = (analysis as any).reason || "Not gameplay";
      Logger.info(`[AnalysisGraph] Flash rejected: ${reason}`);
      return {
        stage: "rejected",
        usage: [{ stage: "flash", model: "gemini-2.5-flash", events: 0 }],
      };
    }

    const timelineLength = analysis.timeline?.length ?? 0;
    Logger.info(`[AnalysisGraph] Flash: ${timelineLength} timeline events → ${timelineLength >= 5 ? "done" : "escalating to Pro"}`);

    return {
      analysis,
      stage: timelineLength >= 5 ? "done" : "pro",
      usage: [{ stage: "flash", model: "gemini-2.5-flash", events: timelineLength }],
    };
  }

  // ── Node 3: Pro escalation ──────────────────────────────────────────────────
  // Rare path — runs only when Flash returns < 5 timeline events.
  async function proNode(state: AnalysisState): Promise<Partial<AnalysisState>> {
    Logger.info("[AnalysisGraph] Pro escalation running");

    const basePrompt = VersionResolver.resolvePromptForGame(
      state.request.game_id || "sf6",
      state.request.match_format || "1v1",
      state.request.p1_team,
      state.request.p2_team,
    );

    const fewShot = vectorRepository
      ? await buildFewShotBlock(state.request, vectorRepository, generateEmbedding)
      : "";

    let fullPrompt = fewShot ? fewShot + "\n\n" + basePrompt : basePrompt;
    if (state.request.ai_context)  fullPrompt += `\n\nContext:\n${state.request.ai_context}`;
    if (state.request.video_title) fullPrompt += `\n\nVideo Title: ${state.request.video_title}`;

    const msg = new HumanMessage({
      content: [videoContent(state), { type: "text", text: fullPrompt }] as any,
    });

    const result = await invokeWithFallback(
      apiKey, fallbackApiKey, modelName,
      { temperature: 0, maxOutputTokens: 16384 },
      [msg]
    );
    const text = typeof result.content === "string"
      ? result.content
      : JSON.stringify(result.content);

    const analysis = JSON.parse(
      text.replace(/```json\n?/g, "").replace(/```\n?/g, "").trim()
    ) as AnalysisResponse;

    if ((analysis as any).is_gameplay_video === false || (analysis as any).status === "not_gameplay") {
      return {
        stage: "rejected",
        usage: [{ stage: "pro", model: modelName }],
      };
    }

    return {
      analysis,
      stage: "done",
      usage: [{ stage: "pro", model: modelName }],
    };
  }

  // ── Conditional routing ─────────────────────────────────────────────────────
  function afterScreen(state: AnalysisState): "flash" | typeof END {
    return state.stage === "rejected" ? END : "flash";
  }

  function afterFlash(state: AnalysisState): "pro" | typeof END {
    return state.stage === "pro" ? "pro" : END;
  }

  // ── Compile ──────────────────────────────────────────────────────────────────
  return new StateGraph(AnalysisAnnotation)
    .addNode("screen", screenNode)
    .addNode("flash",  flashNode)
    .addNode("pro",    proNode)
    .addEdge(START, "screen")
    .addConditionalEdges("screen", afterScreen)
    .addConditionalEdges("flash",  afterFlash)
    .addEdge("pro", END)
    .compile();
}
