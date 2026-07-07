/**
 * Regression test for the grounding-timing bug: characters are only known after
 * screenNode runs, so encyclopedia movesets + character-filtered few-shot examples
 * must be (re-)fetched in groundNode, AFTER screen, not before the graph starts.
 */

let generateContentCalls: any[] = [];

jest.mock('@google/generative-ai', () => ({
  GoogleGenerativeAI: jest.fn().mockImplementation(() => ({
    getGenerativeModel: jest.fn().mockReturnValue({
      generateContent: jest.fn().mockImplementation((req: any) => {
        generateContentCalls.push(req);
        const callIndex = generateContentCalls.length;

        // Call 1 = screen, Call 2 = flash
        if (callIndex === 1) {
          return Promise.resolve({
            response: {
              candidates: [{ content: { parts: [{ text: JSON.stringify({
                is_gameplay: true,
                game_detected: 'sf6',
                p1_character: 'zangief',
                p2_character: 'akuma',
                confidence: 'high',
                rejection_reason: null,
              }) }] } }],
            },
          });
        }

        // Flash response — 5+ events so the graph ends here (no Pro escalation)
        return Promise.resolve({
          response: {
            candidates: [{ content: { parts: [{ text: JSON.stringify({
              p1_character: 'zangief',
              p2_character: 'akuma',
              timeline: [1, 2, 3, 4, 5].map((i) => ({
                timestamp: `00:0${i}`,
                move_used: 'Lariat',
                event_type: 'spacing_control',
                description: `event ${i}`,
              })),
            }) }] } }],
          },
        });
      }),
    }),
  })),
}));

import { createAnalysisGraph } from '../../pipelines/analysisGraph';

describe('analysisGraph groundNode', () => {
  beforeEach(() => {
    generateContentCalls = [];
  });

  it('injects encyclopedia moveset + few-shot examples into the flash prompt once characters are known post-screen', async () => {
    const characterEncyclopediaService: any = {
      getGameRules: jest.fn().mockResolvedValue({ success: true, data: [] }),
      getCurrentEncyclopediaByGameAndCharacter: jest.fn().mockImplementation((gameId: string, characterId: string) => {
        if (characterId === 'zangief') {
          return Promise.resolve({
            success: true,
            data: {
              character_id: 'zangief',
              moveset: { specials: [{ name: 'Lariat', command: '360', category: 'special' }] },
            },
          });
        }
        return Promise.resolve({ success: true, data: null });
      }),
    };

    const gameMetadataService: any = {
      getCurrentGameMetadataByGameId: jest.fn().mockResolvedValue({ success: true, data: { patch_version: '2.010' } }),
    };

    const vectorRepository: any = {
      findSimilarScenarios: jest.fn().mockResolvedValue([]),
    };

    const graph = createAnalysisGraph({
      vectorRepository,
      generateEmbedding: jest.fn().mockResolvedValue([0.1, 0.2, 0.3]),
      apiKey: 'dummy-key',
      modelName: 'gemini-2.5-pro',
      characterEncyclopediaService,
      gameMetadataService,
    });

    const result = await graph.invoke({
      request: { game_id: 'sf6', youtube_url: 'https://youtube.com/watch?v=fake' },
      videoUri: null,
    });

    // groundNode must have resolved characters from screenResult, not left them blank
    expect(result.resolvedCharacters).toEqual({ p1: 'zangief', p2: 'akuma' });

    // Encyclopedia lookup must have been called with the SCREEN-DETECTED characters,
    // proving it ran after screen, not from an empty pre-graph enrichment.
    expect(characterEncyclopediaService.getCurrentEncyclopediaByGameAndCharacter).toHaveBeenCalledWith('sf6', 'zangief');
    expect(characterEncyclopediaService.getCurrentEncyclopediaByGameAndCharacter).toHaveBeenCalledWith('sf6', 'akuma');

    // The flash call's prompt (2nd generateContent call) must contain the grounded moveset text.
    expect(generateContentCalls.length).toBeGreaterThanOrEqual(2);
    const flashPromptText = generateContentCalls[1].contents[0].parts.map((p: any) => p.text).join(' ');
    expect(flashPromptText).toContain('Lariat');

    // Phase 2: the hard move-name constraint (not just descriptive prose) must also be present.
    expect(flashPromptText).toContain('MOVE NAME CONSTRAINT');
    expect(flashPromptText).toContain('unlisted_move');
  });
});
