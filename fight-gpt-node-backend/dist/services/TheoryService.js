"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.TheoryService = void 0;
const generative_ai_1 = require("@google/generative-ai");
const BaseService_1 = require("./BaseService");
const uuidHelper_1 = require("../helpers/uuidHelper");
const Game_1 = require("../models/Game");
const CONFIDENCE_THRESHOLDS = { low: 5, medium: 20, high: 50 };
class TheoryService extends BaseService_1.BaseService {
    theoryRepository;
    vectorRepository;
    geminiApiKey;
    notificationService;
    genAI;
    constructor(theoryRepository, vectorRepository, geminiApiKey, notificationService) {
        super();
        this.theoryRepository = theoryRepository;
        this.vectorRepository = vectorRepository;
        this.geminiApiKey = geminiApiKey;
        this.notificationService = notificationService;
        this.genAI = new generative_ai_1.GoogleGenerativeAI(geminiApiKey);
    }
    /**
     * Generate or refresh character theory from vector DB scenarios
     */
    async generateCharacterTheory(gameId, characterId, targetSkillLevel = 'Intermediate', correctionFeedback) {
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
            const { title, summary, fullTheory, strengths, weaknesses, winConditions, counterplay, vortexGraph } = await this.synthesiseCharacterTheory(gameId, charId, scenarios, targetSkillLevel, correctionFeedback);
            const saved = await this.theoryRepository.upsertCharacterTheory({
                theory_id: uuidHelper_1.UuidHelper.generate(),
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
            });
            // Fire notification to all users who might care
            this.notificationService?.characterTheory({
                gameId,
                characterName: charId,
                theoryId: saved.theory_id ?? saved._id?.toString() ?? '',
                headline: `[${targetSkillLevel}] ${summary}`,
            }).catch(() => { });
            return { success: true, data: saved };
        }
        catch (error) {
            throw this.handleError(error, 'generateCharacterTheory');
        }
    }
    /**
     * Generate or refresh matchup theory from vector DB scenarios
     */
    async generateMatchupTheory(gameId, charA, charB, targetSkillLevel = 'Intermediate', correctionFeedback) {
        const a = charA.toLowerCase().trim().replace(/\s+/g, '_');
        const b = charB.toLowerCase().trim().replace(/\s+/g, '_');
        try {
            const [scenarios, patchVersion] = await Promise.all([
                this.getScenariosForMatchup(gameId, a, b),
                this.getCurrentPatchVersion(gameId),
            ]);
            const confidence = this.calcConfidence(scenarios.length);
            const { title, summary, fullTheory, strengths, weaknesses, winConditions, counterplay } = await this.synthesiseMatchupTheory(gameId, a, b, scenarios, targetSkillLevel, correctionFeedback);
            const saved = await this.theoryRepository.upsertMatchupTheory({
                theory_id: uuidHelper_1.UuidHelper.generate(),
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
            });
            this.notificationService?.matchupTheory({
                gameId,
                charA: a,
                charB: b,
                theoryId: saved.theory_id ?? saved._id?.toString() ?? '',
                headline: `[${targetSkillLevel}] ${summary}`,
            }).catch(() => { });
            return { success: true, data: saved };
        }
        catch (error) {
            throw this.handleError(error, 'generateMatchupTheory');
        }
    }
    async getCharacterTheory(gameId, characterId, targetSkillLevel) {
        const charId = characterId.toLowerCase().trim().replace(/\s+/g, '_');
        try {
            const theory = await this.theoryRepository.getCharacterTheory(gameId, charId, targetSkillLevel);
            if (!theory) {
                return { success: false, error: `No theory found for ${charId}${targetSkillLevel ? ` at ${targetSkillLevel} level` : ''}. Trigger generation first.` };
            }
            return { success: true, data: theory };
        }
        catch (error) {
            throw this.handleError(error, 'getCharacterTheory');
        }
    }
    async getMatchupTheory(gameId, charA, charB, targetSkillLevel) {
        const a = charA.toLowerCase().trim().replace(/\s+/g, '_');
        const b = charB.toLowerCase().trim().replace(/\s+/g, '_');
        try {
            const theory = await this.theoryRepository.getMatchupTheory(gameId, a, b, targetSkillLevel);
            if (!theory) {
                return { success: false, error: `No matchup theory for ${a} vs ${b}${targetSkillLevel ? ` at ${targetSkillLevel} level` : ''}. Trigger generation first.` };
            }
            return { success: true, data: theory };
        }
        catch (error) {
            throw this.handleError(error, 'getMatchupTheory');
        }
    }
    async getAllCharacterTheories(gameId) {
        try {
            const theories = await this.theoryRepository.getAllCharacterTheories(gameId);
            return { success: true, data: theories };
        }
        catch (error) {
            throw this.handleError(error, 'getAllCharacterTheories');
        }
    }
    async getCurrentPatchVersion(gameId) {
        const game = await Game_1.Game.findOne({ game_id: gameId }).lean().exec();
        return game?.latest_version || 'LIVE';
    }
    // --- Private helpers ---
    async getScenariosForCharacter(gameId, characterId) {
        return this.vectorRepository.model
            .find({ game_id: gameId, characters_involved: characterId }, { embedding: 0 })
            .lean()
            .exec();
    }
    async getScenariosForMatchup(gameId, charA, charB) {
        return this.vectorRepository.model
            .find({
            game_id: gameId,
            characters_involved: { $all: [charA, charB] },
        }, { embedding: 0 })
            .lean()
            .exec();
    }
    calcConfidence(count) {
        if (count >= CONFIDENCE_THRESHOLDS.high)
            return 'high';
        if (count >= CONFIDENCE_THRESHOLDS.medium)
            return 'medium';
        return 'low';
    }
    async synthesiseCharacterTheory(gameId, characterId, scenarios, skillLevel = 'Intermediate', correctionFeedback) {
        const scenarioText = scenarios.length > 0
            ? scenarios.slice(0, 30).map((s, i) => `[${i + 1}] ${s.description} — ${s.context}`).join('\n')
            : 'No match data yet.';
        const model = this.genAI.getGenerativeModel({
            model: 'gemini-1.5-flash',
            generationConfig: { responseMimeType: 'application/json' },
        });
        const prompt = `You are a professional fighting game theorist. Based on ${scenarios.length} real match scenarios for ${characterId} in ${gameId}, generate a comprehensive character theory tailored for a ${skillLevel} level player.
        
        If Rookie: Focus on basic game plan, easy punishes, and what buttons to press in neutral.
        If Intermediate: Focus on frame traps, simple oki, and common matchup mistakes.
        If Pro: Focus on micro-spacing, resource management at high level, and psychological mind games (yomi).

Scenarios:
${scenarioText}

${correctionFeedback ? `CRITICAL COMMUNITY FEEDBACK (PLEASE CORRECT):
${correctionFeedback}` : ''}

Return ONLY valid JSON in this exact format:
{
  "title": "Character theory title (e.g. 'Akuma: S-Tier Pressure Machine')",
  "summary": "1-2 sentence TL;DR of the character's current meta standing",
  "full_theory": "3-4 paragraph detailed theory covering neutral, offense, defense, and win conditions",
  "key_strengths": ["strength1", "strength2", "strength3"],
  "key_weaknesses": ["weakness1", "weakness2"],
  "win_conditions": ["win_condition1", "win_condition2", "win_condition3"],
  "counterplay": ["counterplay_tip1", "counterplay_tip2", "counterplay_tip3"],
  "vortex_graph": {
    "nodes": [
      { "id": "n1", "label": "Situation Name", "description": "Short strategic tip", "type": "neutral|pressure|finisher|reset" }
    ],
    "edges": [
      { "source": "n1", "target": "n2", "label": "action/condition" }
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
        }
        catch {
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
    async synthesiseMatchupTheory(gameId, charA, charB, scenarios, skillLevel = 'Intermediate', correctionFeedback) {
        const scenarioText = scenarios.length > 0
            ? scenarios.slice(0, 30).map((s, i) => `[${i + 1}] ${s.description} — ${s.context}`).join('\n')
            : 'No matchup data yet.';
        const model = this.genAI.getGenerativeModel({
            model: 'gemini-1.5-flash',
            generationConfig: { responseMimeType: 'application/json' },
        });
        const prompt = `You are a professional fighting game matchup analyst. Based on ${scenarios.length} real match scenarios for ${charA} vs ${charB} in ${gameId}, write the definitive matchup theory tailored for a ${skillLevel} level player.
        
        If Rookie: Focus on basic punishes, which moves to respect, and the simple objective.
        If Intermediate: Focus on frame traps, spacing, and common habit-breaking tips.
        If Pro: Focus on high-level conditioning, resource management (meter/drive), and micro-situation optimization.

Scenarios:
${scenarioText}

${correctionFeedback ? `CRITICAL COMMUNITY FEEDBACK (PLEASE CORRECT):
${correctionFeedback}` : ''}

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
                title: parsed.title || `${charA} vs ${charB}: ${skillLevel} Guide`,
                summary: parsed.summary || `Strategic matchup breakdown for ${charA} and ${charB} at the ${skillLevel} level.`,
                fullTheory: parsed.full_theory || `Comprehensive analysis of the ${charA} vs ${charB} dynamic based on match footage.`,
                strengths: parsed.key_strengths || ['Effective zone control'],
                weaknesses: parsed.key_weaknesses || ['Vulnerable to specific pressure'],
                winConditions: parsed.win_conditions || ['Maintain mid-range dominance', 'Capitalize on drive gauge'],
                counterplay: parsed.counterplay || ['Wait for an opening during their transition'],
            };
        }
        catch {
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
exports.TheoryService = TheoryService;
//# sourceMappingURL=TheoryService.js.map