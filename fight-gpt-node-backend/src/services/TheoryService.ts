import { GoogleGenerativeAI } from '@google/generative-ai';
import { BaseService } from './BaseService';
import { ITheoryRepository } from '../repositories/TheoryRepository';
import { IVectorRepository } from '../repositories/VectorRepository';
import { ITheoryDocument } from '../models/TheoryDocument';
import { ApiResponse } from '../types';
import { UuidHelper } from '../helpers/uuidHelper';
import { NotificationService } from './NotificationService';
import { Game } from '../models/Game';

export type SkillLevel = 'Rookie' | 'Intermediate' | 'Pro';

const CONFIDENCE_THRESHOLDS = { low: 5, medium: 20, high: 50 };

export interface ITheoryService {
    generateCharacterTheory(gameId: string, characterId: string, targetSkillLevel?: SkillLevel, correctionFeedback?: string): Promise<ApiResponse<ITheoryDocument>>;
    generateMatchupTheory(gameId: string, charA: string, charB: string, targetSkillLevel?: SkillLevel, correctionFeedback?: string): Promise<ApiResponse<ITheoryDocument>>;
    getCharacterTheory(gameId: string, characterId: string, targetSkillLevel?: SkillLevel): Promise<ApiResponse<ITheoryDocument>>;
    getMatchupTheory(gameId: string, charA: string, charB: string, targetSkillLevel?: SkillLevel): Promise<ApiResponse<ITheoryDocument>>;
    getAllCharacterTheories(gameId: string): Promise<ApiResponse<ITheoryDocument[]>>;
    getTheoryById(id: string): Promise<ApiResponse<ITheoryDocument>>;
}

export class TheoryService extends BaseService implements ITheoryService {
    private genAI: GoogleGenerativeAI;

    constructor(
        private readonly theoryRepository: ITheoryRepository,
        private readonly vectorRepository: IVectorRepository,
        private readonly geminiApiKey: string,
        private readonly notificationService?: NotificationService,
    ) {
        super();
        this.genAI = new GoogleGenerativeAI(geminiApiKey);
    }

    /**
     * Generate or refresh character theory from vector DB scenarios
     */
    async generateCharacterTheory(
        gameId: string,
        characterId: string,
        targetSkillLevel: SkillLevel = 'Intermediate',
        correctionFeedback?: string
    ): Promise<ApiResponse<ITheoryDocument>> {
        const charId = characterId ? characterId.toLowerCase().trim().replace(/\s+/g, '_') : '';
        if (!charId || charId === 'undefined') {
            return { success: false, error: 'Valid character ID required for theory generation.' };
        }
        try {
            const [scenarios, patchVersion] = await Promise.all([
                this.getScenariosForCharacter(gameId, charId),
                this.getCurrentPatchVersion(gameId),
            ]);
            const confidence = this.calcConfidence(scenarios.length);

            const { title, summary, fullTheory, strengths, weaknesses, winConditions, counterplay, vortexGraph } =
                await this.synthesiseCharacterTheory(gameId, charId, scenarios, targetSkillLevel, correctionFeedback);

            const saved = await this.theoryRepository.upsertCharacterTheory({
                theory_id: UuidHelper.generate(),
                game_id: gameId,
                type: 'character',
                target_skill_level: targetSkillLevel,
                character_id: charId,
                character_name: charId ? charId.split('_').map(s => s.charAt(0).toUpperCase() + s.slice(1)).join(' ') : 'Unknown character',
                title: title || `${charId.toUpperCase()} Meta Analysis`,
                summary: summary || 'No summary available.',
                full_theory: fullTheory || 'Theory synthesis yielded no long-form intelligence.',
                key_strengths: strengths || [],
                key_weaknesses: weaknesses || [],
                win_conditions: winConditions || [],
                counterplay: counterplay || [],
                vortex_graph: vortexGraph || { nodes: [], edges: [] },
                source_scenario_count: scenarios.length,
                confidence: confidence || 'low',
                patch_version: patchVersion || 'LIVE',
                is_current_patch: true,
                generated_at: new Date(),
                youtube_url: scenarios[0]?.match_references?.[0] || scenarios[0]?.youtube_url,
                status: 'approved',
            });

            // Fire notification to all users who might care
            this.notificationService?.characterTheory({
                gameId,
                characterId: charId,
                title: `New character theory for ${charId}`,
                description: `[${targetSkillLevel}] ${summary}`,
            }).catch(() => {});

            return { success: true, data: saved as unknown as ITheoryDocument };
        } catch (error) {
            throw this.handleError(error, 'generateCharacterTheory');
        }
    }

    /**
     * Generate or refresh matchup theory from vector DB scenarios
     */
    async generateMatchupTheory(
        gameId: string,
        charA: string,
        charB: string,
        targetSkillLevel: SkillLevel = 'Intermediate',
        correctionFeedback?: string
    ): Promise<ApiResponse<ITheoryDocument>> {
        const a = charA.toLowerCase().trim().replace(/\s+/g, '_');
        const b = charB.toLowerCase().trim().replace(/\s+/g, '_');
        try {
            const [scenarios, patchVersion] = await Promise.all([
                this.getScenariosForMatchup(gameId, a, b),
                this.getCurrentPatchVersion(gameId),
            ]);
            const confidence = this.calcConfidence(scenarios.length);

            const { title, summary, fullTheory, strengths, weaknesses, winConditions, counterplay } =
                await this.synthesiseMatchupTheory(gameId, a, b, scenarios, targetSkillLevel, correctionFeedback);

            const saved = await this.theoryRepository.upsertMatchupTheory({
                theory_id: UuidHelper.generate(),
                game_id: gameId,
                type: 'matchup',
                target_skill_level: targetSkillLevel,
                character_a: a,
                character_b: b,
                title: title || `${a.toUpperCase()} vs ${b.toUpperCase()} Analysis`,
                summary: summary || 'No summary available.',
                full_theory: fullTheory || 'Matchup synthesis yielded no intelligence.',
                key_strengths: strengths || [],
                key_weaknesses: weaknesses || [],
                win_conditions: winConditions || [],
                counterplay: counterplay || [],
                source_scenario_count: scenarios.length,
                confidence: confidence || 'low',
                patch_version: patchVersion || 'LIVE',
                is_current_patch: true,
                generated_at: new Date(),
                youtube_url: scenarios[0]?.match_references?.[0] || scenarios[0]?.youtube_url,
                status: 'approved',
            });

            this.notificationService?.matchupTheory({
                gameId,
                characterId: a,
                opponentId: b,
                title: `New matchup theory: ${a} vs ${b}`,
                description: `[${targetSkillLevel}] ${summary}`,
            }).catch(() => {});

            return { success: true, data: saved as unknown as ITheoryDocument };
        } catch (error) {
            throw this.handleError(error, 'generateMatchupTheory');
        }
    }

    async getCharacterTheory(gameId: string, characterId: string, targetSkillLevel?: SkillLevel): Promise<ApiResponse<ITheoryDocument>> {
        const charId = characterId.toLowerCase().trim().replace(/\s+/g, '_');
        try {
            const theory = await this.theoryRepository.getCharacterTheory(gameId, charId, targetSkillLevel);
            if (!theory) {
                return { success: false, error: `No theory found for ${charId}${targetSkillLevel ? ` at ${targetSkillLevel} level` : ''}. Trigger generation first.` };
            }
            return { success: true, data: theory as unknown as ITheoryDocument };
        } catch (error) {
            throw this.handleError(error, 'getCharacterTheory');
        }
    }

    async getMatchupTheory(gameId: string, charA: string, charB: string, targetSkillLevel?: SkillLevel): Promise<ApiResponse<ITheoryDocument>> {
        const a = charA.toLowerCase().trim().replace(/\s+/g, '_');
        const b = charB.toLowerCase().trim().replace(/\s+/g, '_');
        try {
            const theory = await this.theoryRepository.getMatchupTheory(gameId, a, b, targetSkillLevel);
            if (!theory) {
                return { success: false, error: `No matchup theory for ${a} vs ${b}${targetSkillLevel ? ` at ${targetSkillLevel} level` : ''}. Trigger generation first.` };
            }
            return { success: true, data: theory as unknown as ITheoryDocument };
        } catch (error) {
            throw this.handleError(error, 'getMatchupTheory');
        }
    }

    async getAllCharacterTheories(gameId: string): Promise<ApiResponse<ITheoryDocument[]>> {
        try {
            const theories = await this.theoryRepository.getAllCharacterTheories(gameId);
            return { success: true, data: theories as unknown as ITheoryDocument[] };
        } catch (error) {
            throw this.handleError(error, 'getAllCharacterTheories');
        }
    }

    async getTheoryById(id: string): Promise<ApiResponse<ITheoryDocument>> {
        try {
            const theory = await this.theoryRepository.getTheoryById(id);
            if (!theory) return { success: false, error: 'Theory not found' };
            return { success: true, data: theory as unknown as ITheoryDocument };
        } catch (error) {
            throw this.handleError(error, 'getTheoryById');
        }
    }

    private async getCurrentPatchVersion(gameId: string): Promise<string> {
        const game = await Game.findOne({ game_id: gameId }).lean().exec();
        return (game as any)?.latest_version || 'LIVE';
    }

    // --- Private helpers ---

    private async getScenariosForCharacter(gameId: string, characterId: string): Promise<any[]> {
        return (this.vectorRepository as any).model
            .find({ game_id: gameId, characters_involved: characterId }, { embedding: 0 })
            .lean()
            .exec();
    }

    private async getScenariosForMatchup(gameId: string, charA: string, charB: string): Promise<any[]> {
        return (this.vectorRepository as any).model
            .find({
                game_id: gameId,
                characters_involved: { $all: [charA, charB] },
            }, { embedding: 0 })
            .lean()
            .exec();
    }

    private calcConfidence(count: number): 'low' | 'medium' | 'high' {
        if (count >= CONFIDENCE_THRESHOLDS.high) return 'high';
        if (count >= CONFIDENCE_THRESHOLDS.medium) return 'medium';
        return 'low';
    }

    private async synthesiseCharacterTheory(
        gameId: string,
        characterId: string,
        scenarios: any[],
        skillLevel: string = 'Intermediate',
        correctionFeedback?: string
    ) {
        const scenarioText = scenarios.length > 0
            ? scenarios.slice(0, 30).map((s, i) =>
                `[${i + 1}] ${s.description} — ${s.context}`
            ).join('\n')
            : 'No match data yet.';

        const model = this.genAI.getGenerativeModel({
            model: 'gemini-1.5-flash',
            generationConfig: { responseMimeType: 'application/json' },
        });

        const hasScenarios = scenarios.length > 0;

        const prompt = `You are MetaPunish — the world's most advanced competitive fighting game intelligence system. Your analysis goes beyond what any wiki, frame data site, or community guide covers. You synthesise competitive psychology, decision theory, and high-level match patterns into exclusive intel that cannot be found on Dustloop, SuperCombo, or any other platform.

Generate a ${skillLevel}-level character theory for ${characterId} in ${gameId}.

${hasScenarios ? `You have ${scenarios.length} real high-level match scenarios to draw from:\n${scenarioText}` : `No match data is loaded yet — generate theory purely from your expert knowledge of ${characterId}'s design, frame data, and competitive history. This theory will be updated as match data is ingested.`}

${correctionFeedback ? `COMMUNITY CORRECTION (apply this):\n${correctionFeedback}\n` : ''}

Skill level guidance:
- Rookie: core game plan, which 2-3 buttons win neutral, what to do on knockdown, biggest beginner traps to avoid
- Intermediate: frame trap sequences, oki decision trees, meter usage priorities, anti-airs, punish routes
- Pro: micro-spacing, conditioning cycles (how to set up habits then break them), resource management under pressure, psychological patterns at the highest level — the "why" behind each decision, not just the "what"

CRITICAL REQUIREMENT: Your full_theory must contain insights NOT found on any standard platform. This means:
- Psychological conditioning: how to train the opponent to make a mistake, then exploit it
- Adaptation theory: how the character's gameplan should evolve between rounds based on what the opponent showed
- Vortex design: what the character's repeating pressure loop looks like and how to maintain it
- Anti-autopilot: habits that feel right but actually lose at high level and why
- The opponent's perspective: what it FEELS like to play against this character so you understand what they're trying to escape

Return ONLY valid JSON:
{
  "title": "<Specific, competitive title — e.g. 'Luke: The Aggression Tax and How to Collect It'>",
  "summary": "<2 sentences: current meta standing + the one thing that separates good from great ${characterId} players>",
  "full_theory": "<5-6 paragraphs: (1) neutral philosophy, (2) offense and pressure design, (3) defense and escape, (4) resource management, (5) psychological conditioning and adaptation, (6) the win condition loop. Each paragraph must contain at least one insight not on any public wiki.>",
  "key_strengths": ["<specific strength with context — not just 'good damage'>"],
  "key_weaknesses": ["<specific weakness with context — not just 'slow startup'>"],
  "win_conditions": ["<concrete, situation-specific win condition>"],
  "counterplay": ["<how the OPPONENT should approach this character — from their perspective>"],
  "vortex_graph": {
    "nodes": [
      { "id": "n1", "label": "<Situation name>", "description": "<What to do here and why>", "type": "neutral|pressure|finisher|reset" }
    ],
    "edges": [
      { "source": "n1", "target": "n2", "label": "<The action or read that connects these states>" }
    ]
  }
}`;

        try {
            const result = await model.generateContent(prompt);
            const text = result.response.text().replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
            const parsed = JSON.parse(text);
            return {
                title: parsed.title || `${characterId} Strategy: ${skillLevel}`,
                summary: parsed.summary || `Foundational ${characterId} concepts for ${skillLevel} players.`,
                fullTheory: parsed.full_theory || `Detailed analysis of ${characterId} based on ${scenarios.length} matches.`,
                strengths: parsed.key_strengths || ['High versatility', 'Strong normals'],
                weaknesses: parsed.key_weaknesses || ['Linear pressure'],
                winConditions: parsed.win_conditions || ['Control the corner', 'Land a heavy punish'],
                counterplay: parsed.counterplay || ['Respect their wake-up options'],
                vortexGraph: parsed.vortex_graph || { nodes: [], edges: [] }
            };
        } catch {
            return {
                title: `${characterId} Theory (${gameId})`,
                summary: `Theory generated from ${scenarios.length} scenarios.`,
                fullTheory: `Analysis based on ${scenarios.length} recorded match scenarios for ${characterId} in ${gameId}.`,
                strengths: ['Adaptive playstyle'],
                weaknesses: ['Requires match knowledge'],
                winConditions: ['Efficient meter usage'],
                counterplay: ['Maintain spacing'],
            };
        }
    }

    private async synthesiseMatchupTheory(
        gameId: string,
        charA: string,
        charB: string,
        scenarios: any[],
        skillLevel: string = 'Intermediate',
        correctionFeedback?: string
    ) {
        const scenarioText = scenarios.length > 0
            ? scenarios.slice(0, 30).map((s, i) =>
                `[${i + 1}] ${s.description} — ${s.context}`
            ).join('\n')
            : 'No matchup data yet.';

        const model = this.genAI.getGenerativeModel({
            model: 'gemini-1.5-flash',
            generationConfig: { responseMimeType: 'application/json' },
        });

        const hasScenarios = scenarios.length > 0;

        const prompt = `You are MetaPunish — the world's most advanced competitive fighting game intelligence system. You produce matchup analysis that goes beyond anything on Dustloop, SuperCombo, or YouTube breakdown videos. Your reports synthesise competitive psychology, frame-level decision theory, and high-level match patterns.

Write a ${skillLevel}-level matchup theory for ${charA} vs ${charB} in ${gameId}.

${hasScenarios ? `${scenarios.length} real high-level match scenarios:\n${scenarioText}` : `No match data loaded yet — generate theory from expert knowledge of both characters' design, frame data, and competitive history. This theory will be refined as match data is ingested.`}

${correctionFeedback ? `COMMUNITY CORRECTION (apply this):\n${correctionFeedback}\n` : ''}

Skill level guidance:
- Rookie: the single most important thing to understand about this matchup, biggest punishes, what to avoid
- Intermediate: spacing rules, which situations favor each character, meter usage, anti-air exchanges, common intermediate mistakes
- Pro: frame-perfect exchanges, conditioning cycles (how ${charA} can train ${charB}'s habits and vice versa), drive/resource management, round-by-round adaptation, psychological momentum shifts

CRITICAL REQUIREMENT: This analysis must contain insights NOT on any public platform:
- The key range that defines the entire matchup and why
- What each character is trying to achieve vs what the other is trying to deny
- The "tax" — the specific situation that, if one player keeps avoiding, they will lose long-term
- Adaptation between rounds: what information to extract and how to use it
- The mental game: what it FEELS like from each side, and how that perception creates exploitable patterns

Return ONLY valid JSON:
{
  "title": "<Specific, insightful title — not just character names>",
  "summary": "<2 sentences: verdict on the matchup ratio and the one pivotal factor that determines who wins>",
  "full_theory": "<5-6 paragraphs: (1) the defining range and neutral objective, (2) ${charA}'s offensive tools and how ${charB} defends, (3) ${charB}'s offensive tools and how ${charA} defends, (4) corner dynamics and resource management, (5) conditioning and psychological adaptation between rounds, (6) the deciding factor at the highest level>",
  "key_strengths": ["<${charA} advantage with specific context>"],
  "key_weaknesses": ["<${charA} disadvantage with specific context>"],
  "win_conditions": ["<How ${charA} wins — specific scenario, not generic>"],
  "counterplay": ["<How ${charB} should approach this — from their perspective>"]
}`;

        try {
            const result = await model.generateContent(prompt);
            const text = result.response.text().replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
            const parsed = JSON.parse(text);
            return {
                title: parsed.title || `${charA} vs ${charB}: ${skillLevel} Guide`,
                summary: parsed.summary || `Strategic matchup breakdown for ${charA} and ${charB} at the ${skillLevel} level.`,
                fullTheory: parsed.full_theory || `Comprehensive analysis of the ${charA} vs ${charB} dynamic based on match footage.`,
                strengths: parsed.key_strengths || ['Effective zone control'],
                weaknesses: parsed.key_weaknesses || ['Vulnerable to specific pressure'],
                winConditions: parsed.win_conditions || ['Maintain mid-range dominance', 'Capitalize on drive gauge'],
                counterplay: parsed.counterplay || ['Wait for an opening during their transition'],
            };
        } catch {
            return {
                title: `${charA} vs ${charB} (${gameId})`,
                summary: `Matchup theory from ${scenarios.length} scenarios.`,
                fullTheory: `Analysis based on ${scenarios.length} recorded ${charA} vs ${charB} scenarios in ${gameId}.`,
                strengths: ['Standard advantage'],
                weaknesses: ['Generic disadvantage'],
                winConditions: ['Focus on fundamentals'],
                counterplay: ['Stay patient'],
            };
        }
    }
}
