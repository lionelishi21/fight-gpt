"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.MissionDetailService = void 0;
const Mission_1 = __importDefault(require("../models/Mission"));
const User_1 = __importDefault(require("../models/User"));
class MissionDetailService {
    encyclopediaRepository;
    analysisRepository;
    constructor(encyclopediaRepository, analysisRepository) {
        this.encyclopediaRepository = encyclopediaRepository;
        this.analysisRepository = analysisRepository;
    }
    /**
     * Get detailed training content for a mission
     */
    async getMissionDetails(missionId, userId) {
        const mission = await Mission_1.default.findById(missionId);
        if (!mission)
            throw new Error('Mission not found');
        const user = await User_1.default.findById(userId);
        if (!user)
            throw new Error('User saved data not found');
        // Identify active game and character from user slots or preferences
        const activeSlot = user.slots[user.activeSlotIndex] || {};
        const gameId = activeSlot.gameId || user.preferences?.favoriteGames?.[0] || 'sf6';
        const playerChar = activeSlot.characterId || user.preferences?.mainCharacter || 'ryu';
        const details = {
            missionId: mission._id?.toString(),
            title: mission.title,
            description: mission.description,
            type: mission.type,
            gameId,
            targetCharacter: playerChar,
            trainingTips: [],
        };
        const titleLower = mission.title.toLowerCase();
        // 1. Logic for "Anti-Air Master"
        if (titleLower.includes('anti-air') || titleLower.includes('air master')) {
            await this.populateAntiAirDetails(details, gameId, playerChar);
        }
        // 2. Logic for "Perfect Parry Practice"
        else if (titleLower.includes('parry') || titleLower.includes('perfect parry')) {
            await this.populateParryDetails(details, gameId);
        }
        // 3. Logic for "Drive Rush Combos"
        else if (titleLower.includes('drive rush') || titleLower.includes('combo')) {
            await this.populateComboDetails(details, gameId, playerChar);
        }
        // Fallback or Matchup specific
        else {
            details.trainingTips.push('Focus on fundamental spacing and reactive defense.');
        }
        return details;
    }
    async populateAntiAirDetails(details, gameId, playerChar) {
        // ... existing logic ...
        // [Existing code omitted for brevity but I'll provide the full block in the tool call]
        const encyclopedia = await this.encyclopediaRepository.findCurrentByGameIdAndCharacterId(gameId, playerChar);
        if (encyclopedia) {
            const moves = [
                ...encyclopedia.moveset.normals,
                ...encyclopedia.moveset.specials
            ].filter(m => m.properties?.some(p => p.toLowerCase().includes('anti-air') || p.toLowerCase().includes('aa')) ||
                m.name.toLowerCase().includes('uppercut') ||
                m.name.toLowerCase().includes('rising') ||
                m.input.includes('623') ||
                m.input.includes('22'));
            details.recommendedMoves = moves.map(m => ({
                name: m.name,
                input: m.input,
                startup: m.frame_data.startup,
                properties: m.properties
            }));
            details.trainingTips.push(`Use ${moves[0]?.name || 'Crouching Heavy Punch'} to catch jump-ins early.`);
            details.trainingTips.push('React to the opponent leaving the ground, not when they are already above you.');
        }
        details.frameData = [
            { character: 'Ken', move: 'Heavy Kick (Jump)', startup: 9, property: 'High' },
            { character: 'Juri', move: 'Medium Kick (Jump)', startup: 7, property: 'Cross-up' },
            { character: 'Luke', move: 'Heavy Punch (Jump)', startup: 10, property: 'Heavy' }
        ];
        // Find AI-captured video references for Anti-Air
        details.videoReferences = await this.findVideoReferences(gameId, 'anti-air');
    }
    async findVideoReferences(gameId, eventType) {
        // Search recent analyses for this game that contain the event in timeline
        const recent = await this.analysisRepository.getRecentAnalyses(20, undefined, gameId);
        const refs = [];
        for (const analysis of recent) {
            const timeline = analysis.analysis?.timeline || [];
            const match = timeline.find((t) => t.event_type.toLowerCase().includes(eventType) || t.description.toLowerCase().includes(eventType));
            if (match && analysis.youtube_url) {
                const videoId = analysis.youtube_url.split('v=')[1]?.split('&')[0];
                if (videoId) {
                    refs.push({
                        title: `Pro Match Application: ${analysis.p1_name} vs ${analysis.p2_name}`,
                        youtube_id: videoId,
                        timestamp: match.timestamp,
                        description: match.description
                    });
                }
            }
            if (refs.length >= 3)
                break;
        }
        return refs;
    }
    async populateParryDetails(details, gameId) {
        details.trainingTips.push('Perfect Parry requires a 2-frame window upon impact.');
        details.trainingTips.push('Look for multi-hit moves where the first hit is predictable.');
        // List moves with predictable timing
        details.frameData = [
            { character: 'Marisa', move: 'Gladius (Charged)', timing: 'Slow/Heavy', advantage: '+4 on PP' },
            { character: 'Cammy', move: 'Spiral Arrow', timing: 'Fast/Linear', advantage: '+Full Punish' },
            { character: 'Guile', move: 'Sonic Boom', timing: 'Projectile', advantage: 'Close Gap' }
        ];
        // Find AI-captured video references for Parry
        details.videoReferences = await this.findVideoReferences(gameId, 'parry');
    }
    async populateComboDetails(details, gameId, playerChar) {
        const encyclopedia = await this.encyclopediaRepository.findCurrentByGameIdAndCharacterId(gameId, playerChar);
        if (encyclopedia && encyclopedia.combos) {
            details.combos = encyclopedia.combos.map(c => ({
                inputs: c.inputs,
                damage: c.damage,
                difficulty: c.difficulty,
                drive_gauge: c.drive_gauge
            }));
            details.trainingTips.push('Practice the Drive Rush cancel immediately after the normal hit.');
            details.trainingTips.push('Beginners should focus on 2-3 hit hit-confirms before going for long routes.');
        }
        // Find AI-captured video references for Combos
        details.videoReferences = await this.findVideoReferences(gameId, 'combo');
    }
}
exports.MissionDetailService = MissionDetailService;
//# sourceMappingURL=MissionDetailService.js.map