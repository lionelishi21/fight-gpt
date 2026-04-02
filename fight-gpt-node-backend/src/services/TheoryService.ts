import { GoogleGenerativeAI } from '@google/generative-ai';
import { BaseService } from './BaseService';
import { ITheoryRepository } from '../repositories/TheoryRepository';
import { IVectorRepository } from '../repositories/VectorRepository';
import { ITheoryDocument } from '../models/TheoryDocument';
import { ApiResponse } from '../types';
import { UuidHelper } from '../helpers/uuidHelper';

const CONFIDENCE_THRESHOLDS = { low: 5, medium: 20, high: 50 };

export interface ITheoryService {
    generateCharacterTheory(gameId: string, characterId: string): Promise<ApiResponse<ITheoryDocument>>;
    generateMatchupTheory(gameId: string, charA: string, charB: string): Promise<ApiResponse<ITheoryDocument>>;
    getCharacterTheory(gameId: string, characterId: string): Promise<ApiResponse<ITheoryDocument>>;
    getMatchupTheory(gameId: string, charA: string, charB: string): Promise<ApiResponse<ITheoryDocument>>;
    getAllCharacterTheories(gameId: string): Promise<ApiResponse<ITheoryDocument[]>>;
}

export class TheoryService extends BaseService implements ITheoryService {
    private genAI: GoogleGenerativeAI;

    constructor(
        private readonly theoryRepository: ITheoryRepository,
        private readonly vectorRepository: IVectorRepository,
        private readonly geminiApiKey: string,
    ) {
        super();
        this.genAI = new GoogleGenerativeAI(geminiApiKey);
    }

    /**
     * Generate or refresh character theory from vector DB scenarios
     */
    async generateCharacterTheory(gameId: string, characterId: string): Promise<ApiResponse<ITheoryDocument>> {
        try {
            // Pull all scenarios involving this character
            const scenarios = await this.getScenariosForCharacter(gameId, characterId);
            const confidence = this.calcConfidence(scenarios.length);

            const { title, summary, fullTheory, strengths, weaknesses, winConditions, counterplay } =
                await this.synthesiseCharacterTheory(gameId, characterId, scenarios);

            const saved = await this.theoryRepository.upsertCharacterTheory({
                theory_id: UuidHelper.generate(),
                game_id: gameId,
                type: 'character',
                character_id: characterId,
                character_name: characterId,
                title,
                summary,
                full_theory: fullTheory,
                key_strengths: strengths,
                key_weaknesses: weaknesses,
                win_conditions: winConditions,
                counterplay,
                source_scenario_count: scenarios.length,
                confidence,
                generated_at: new Date(),
            });

            return { success: true, data: saved as unknown as ITheoryDocument };
        } catch (error) {
            throw this.handleError(error, 'generateCharacterTheory');
        }
    }

    /**
     * Generate or refresh matchup theory from vector DB scenarios
     */
    async generateMatchupTheory(gameId: string, charA: string, charB: string): Promise<ApiResponse<ITheoryDocument>> {
        try {
            const scenarios = await this.getScenariosForMatchup(gameId, charA, charB);
            const confidence = this.calcConfidence(scenarios.length);

            const { title, summary, fullTheory, strengths, weaknesses, winConditions, counterplay } =
                await this.synthesiseMatchupTheory(gameId, charA, charB, scenarios);

            const saved = await this.theoryRepository.upsertMatchupTheory({
                theory_id: UuidHelper.generate(),
                game_id: gameId,
                type: 'matchup',
                character_a: charA,
                character_b: charB,
                title,
                summary,
                full_theory: fullTheory,
                key_strengths: strengths,
                key_weaknesses: weaknesses,
                win_conditions: winConditions,
                counterplay,
                source_scenario_count: scenarios.length,
                confidence,
                generated_at: new Date(),
            });

            return { success: true, data: saved as unknown as ITheoryDocument };
        } catch (error) {
            throw this.handleError(error, 'generateMatchupTheory');
        }
    }

    async getCharacterTheory(gameId: string, characterId: string): Promise<ApiResponse<ITheoryDocument>> {
        try {
            const theory = await this.theoryRepository.getCharacterTheory(gameId, characterId);
            if (!theory) {
                return { success: false, error: `No theory found for ${characterId}. Trigger generation first.` };
            }
            return { success: true, data: theory as unknown as ITheoryDocument };
        } catch (error) {
            throw this.handleError(error, 'getCharacterTheory');
        }
    }

    async getMatchupTheory(gameId: string, charA: string, charB: string): Promise<ApiResponse<ITheoryDocument>> {
        try {
            const theory = await this.theoryRepository.getMatchupTheory(gameId, charA, charB);
            if (!theory) {
                return { success: false, error: `No matchup theory for ${charA} vs ${charB}. Trigger generation first.` };
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
        scenarios: any[]
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

        const prompt = `You are a professional fighting game theorist. Based on ${scenarios.length} real match scenarios for ${characterId} in ${gameId}, generate a comprehensive character theory.

Scenarios:
${scenarioText}

Return ONLY valid JSON in this exact format:
{
  "title": "Character theory title (e.g. 'Akuma: S-Tier Pressure Machine')",
  "summary": "1-2 sentence TL;DR of the character's current meta standing",
  "full_theory": "3-4 paragraph detailed theory covering neutral, offense, defense, and win conditions",
  "key_strengths": ["strength1", "strength2", "strength3"],
  "key_weaknesses": ["weakness1", "weakness2"],
  "win_conditions": ["win_condition1", "win_condition2", "win_condition3"],
  "counterplay": ["counterplay_tip1", "counterplay_tip2", "counterplay_tip3"]
}`;

        try {
            const result = await model.generateContent(prompt);
            const text = result.response.text().replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
            const parsed = JSON.parse(text);
            return {
                title: parsed.title || `${characterId} Theory`,
                summary: parsed.summary || '',
                fullTheory: parsed.full_theory || '',
                strengths: parsed.key_strengths || [],
                weaknesses: parsed.key_weaknesses || [],
                winConditions: parsed.win_conditions || [],
                counterplay: parsed.counterplay || [],
            };
        } catch {
            return {
                title: `${characterId} Theory (${gameId})`,
                summary: `Theory generated from ${scenarios.length} scenarios.`,
                fullTheory: `Analysis based on ${scenarios.length} recorded match scenarios for ${characterId} in ${gameId}.`,
                strengths: [],
                weaknesses: [],
                winConditions: [],
                counterplay: [],
            };
        }
    }

    private async synthesiseMatchupTheory(
        gameId: string,
        charA: string,
        charB: string,
        scenarios: any[]
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

        const prompt = `You are a professional fighting game matchup analyst. Based on ${scenarios.length} real match scenarios for ${charA} vs ${charB} in ${gameId}, write the definitive matchup theory.

Scenarios:
${scenarioText}

Return ONLY valid JSON:
{
  "title": "Matchup title (e.g. 'Akuma vs Ryu: Pressure vs Fundamentals')",
  "summary": "1-2 sentence verdict on who wins and why",
  "full_theory": "3-4 paragraph theory: neutral, key exchanges, corner situations, meter management, and overall advantage",
  "key_strengths": ["advantage for ${charA}1", "advantage2"],
  "key_weaknesses": ["disadvantage for ${charA}1", "disadvantage2"],
  "win_conditions": ["${charA} wins by...", "key setup1", "key setup2"],
  "counterplay": ["${charB} should...", "tip2", "tip3"]
}`;

        try {
            const result = await model.generateContent(prompt);
            const text = result.response.text().replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
            const parsed = JSON.parse(text);
            return {
                title: parsed.title || `${charA} vs ${charB}`,
                summary: parsed.summary || '',
                fullTheory: parsed.full_theory || '',
                strengths: parsed.key_strengths || [],
                weaknesses: parsed.key_weaknesses || [],
                winConditions: parsed.win_conditions || [],
                counterplay: parsed.counterplay || [],
            };
        } catch {
            return {
                title: `${charA} vs ${charB} (${gameId})`,
                summary: `Matchup theory from ${scenarios.length} scenarios.`,
                fullTheory: `Analysis based on ${scenarios.length} recorded ${charA} vs ${charB} scenarios in ${gameId}.`,
                strengths: [],
                weaknesses: [],
                winConditions: [],
                counterplay: [],
            };
        }
    }
}
