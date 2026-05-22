import { Request, Response } from 'express';
import { BaseController } from './BaseController';
import { Game } from '../models/Game';
import { Character } from '../models/Character';
import { TheoryDoc } from '../models/TheoryDocument';
import { Scenario } from '../models/Scenario';
import { CharacterEncyclopediaRepository } from '../repositories/CharacterEncyclopediaRepository';

const encRepo = new CharacterEncyclopediaRepository();

export class PublicApiController extends BaseController {

    /** GET /api/v1/games */
    listGames = async (_req: Request, res: Response): Promise<void> => {
        try {
            const games = await Game.find({ is_active: true })
                .select('game_id name publisher platforms latest_version')
                .lean();
            this.sendResponse(res, { success: true, data: games });
        } catch (err) {
            this.sendError(res, err instanceof Error ? err.message : 'Failed');
        }
    };

    /** GET /api/v1/characters/:gameId */
    listCharacters = async (req: Request, res: Response): Promise<void> => {
        try {
            const { gameId } = req.params;
            const chars = await Character.find({ game_id: gameId })
                .select('character_id name aliases game_id')
                .lean();
            this.sendResponse(res, { success: true, data: chars });
        } catch (err) {
            this.sendError(res, err instanceof Error ? err.message : 'Failed');
        }
    };

    /** GET /api/v1/frame-data/:gameId/:characterId */
    getFrameData = async (req: Request, res: Response): Promise<void> => {
        try {
            const { gameId, characterId } = req.params;
            const char = await Character.findOne({
                game_id: gameId,
                $or: [{ character_id: characterId }, { name: new RegExp(`^${characterId}$`, 'i') }],
            }).lean() as any;

            if (!char) { res.status(404).json({ success: false, error: 'Character not found' }); return; }

            const enc = await encRepo.findByGameIdAndCharacterId(gameId, char._id.toString());
            if (!enc) { res.status(404).json({ success: false, error: 'No frame data for this character' }); return; }

            this.sendResponse(res, {
                success: true,
                data: {
                    character_id: char.character_id,
                    name:         char.name,
                    game_id:      gameId,
                    patch_version: (enc as any).patch_version,
                    moveset:      (enc as any).moveset,
                    game_rules:   (enc as any).game_rules,
                },
            });
        } catch (err) {
            this.sendError(res, err instanceof Error ? err.message : 'Failed');
        }
    };

    /** GET /api/v1/theories/:gameId/:characterId */
    getTheory = async (req: Request, res: Response): Promise<void> => {
        try {
            const { gameId, characterId } = req.params;
            const theory = await TheoryDoc.findOne({
                game_id: gameId,
                $or: [{ character_id: characterId }, { character_name: new RegExp(`^${characterId}$`, 'i') }],
                status: 'approved',
                is_current_patch: true,
            }).sort({ generated_at: -1 }).lean();

            if (!theory) { res.status(404).json({ success: false, error: 'No theory found for this character' }); return; }

            this.sendResponse(res, {
                success: true,
                data: {
                    character_id:  (theory as any).character_id,
                    character_name:(theory as any).character_name,
                    game_id:       (theory as any).game_id,
                    patch_version: (theory as any).patch_version,
                    summary:       (theory as any).summary,
                    key_strengths: (theory as any).key_strengths,
                    key_weaknesses:(theory as any).key_weaknesses,
                    win_conditions:(theory as any).win_conditions,
                    counterplay:   (theory as any).counterplay,
                    source_scenario_count: (theory as any).source_scenario_count,
                    generated_at:  (theory as any).generated_at,
                },
            });
        } catch (err) {
            this.sendError(res, err instanceof Error ? err.message : 'Failed');
        }
    };

    /** GET /api/v1/scenarios/:gameId?character=cammy&limit=20 */
    getScenarios = async (req: Request, res: Response): Promise<void> => {
        try {
            const { gameId } = req.params;
            const { character, limit = '20' } = req.query;
            const filter: any = { game_id: gameId, is_gameplay: true };
            if (character) filter.characters_involved = { $in: [character] };

            const scenarios = await Scenario.find(filter)
                .select('description context event_type tags spacing characters_involved patch_version created_at')
                .sort({ created_at: -1 })
                .limit(Math.min(Number(limit), 100))
                .lean();

            this.sendResponse(res, { success: true, data: scenarios });
        } catch (err) {
            this.sendError(res, err instanceof Error ? err.message : 'Failed');
        }
    };

    /** GET /api/v1/tier-list/:gameId */
    getTierList = async (req: Request, res: Response): Promise<void> => {
        try {
            const { gameId } = req.params;
            // Aggregate scenario counts per character as a proxy for tier placement
            const pipeline = [
                { $match: { game_id: gameId, is_gameplay: true } },
                { $unwind: '$characters_involved' },
                { $group: { _id: '$characters_involved', appearances: { $sum: 1 } } },
                { $sort: { appearances: -1 as const } },
                { $limit: 50 },
                { $project: { character: '$_id', appearances: 1, _id: 0 } },
            ];
            const results = await Scenario.aggregate(pipeline);
            res.json({ success: true, data: results, note: 'Ranked by tournament appearance frequency' });
        } catch (err) {
            this.sendError(res, err instanceof Error ? err.message : 'Failed');
        }
    };
}

export const publicApiController = new PublicApiController();
