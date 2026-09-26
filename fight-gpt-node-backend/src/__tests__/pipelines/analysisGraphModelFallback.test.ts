/**
 * The graph's Gemini calls must survive one model being overloaded or off-limits
 * for the API key: retry briefly on 503, then move to GEMINI_FALLBACK_MODELS.
 */

process.env.GEMINI_FLASH_MODEL = 'model-a';
process.env.GEMINI_FALLBACK_MODELS = 'model-b';

let callsByModel: Record<string, number> = {};
let modelAFailure: () => Error = () => new Error('unset');

const screenJson = JSON.stringify({
  is_gameplay: true, game_detected: 'sf6', p1_character: 'ryu', p2_character: 'ken',
  confidence: 'high', rejection_reason: null,
});
const flashJson = JSON.stringify({
  p1_character: 'ryu', p2_character: 'ken',
  timeline: [1, 2, 3, 4, 5].map(i => ({ timestamp: `00:0${i}`, move_used: 'Hadoken', event_type: 'zoning', description: `e${i}` })),
});

jest.mock('@google/generative-ai', () => ({
  GoogleGenerativeAI: jest.fn().mockImplementation(() => ({
    getGenerativeModel: jest.fn().mockImplementation(({ model }: { model: string }) => ({
      generateContent: jest.fn().mockImplementation((req: any) => {
        callsByModel[model] = (callsByModel[model] || 0) + 1;
        if (model === 'model-a') return Promise.reject(modelAFailure());
        const promptText = JSON.stringify(req.contents);
        const text = promptText.includes('video classifier') ? screenJson : flashJson;
        return Promise.resolve({ response: { candidates: [{ content: { parts: [{ text }] } }] } });
      }),
    })),
  })),
}));

import { createAnalysisGraph } from '../../pipelines/analysisGraph';

function httpError(status: number, message: string): Error {
  return Object.assign(new Error(message), { status });
}

async function run() {
  const graph = createAnalysisGraph({
    generateEmbedding: async () => [],
    apiKey: 'test-key',
    modelName: 'model-a',
  });
  return graph.invoke({
    request: { youtube_url: 'https://www.youtube.com/watch?v=abc', game_id: 'sf6' } as any,
    videoUri: null,
  });
}

describe('analysisGraph model fallback', () => {
  let timeoutSpy: jest.SpyInstance;

  beforeEach(() => {
    callsByModel = {};
    // Skip the real 2s/6s waits between overload retries.
    timeoutSpy = jest.spyOn(global, 'setTimeout').mockImplementation(((fn: any) => { fn(); return 0 as any; }) as any);
  });
  afterEach(() => timeoutSpy.mockRestore());

  it('retries an overloaded model, then completes on the fallback model', async () => {
    modelAFailure = () => httpError(503, '[503 Service Unavailable] This model is currently experiencing high demand.');

    const result = await run();

    expect(result.stage).toBe('done');
    expect(result.analysis?.timeline).toHaveLength(5);
    // screen + flash each try model-a three times (1 + 2 retries) before moving on
    expect(callsByModel['model-a']).toBe(6);
    expect(callsByModel['model-b']).toBe(2);
  });

  it('moves to the fallback model immediately when the key is denied on a model', async () => {
    modelAFailure = () => httpError(403, '[403 Forbidden] PERMISSION_DENIED The caller does not have permission');

    const result = await run();

    expect(result.stage).toBe('done');
    expect(callsByModel['model-a']).toBe(2); // one attempt each for screen and flash, no retries
    expect(callsByModel['model-b']).toBe(2);
  });
});
