import { Request, Response } from 'express';
import { BaseController } from './BaseController';
import { Organization } from '../models/Organization';
import User from '../models/User';
import { Analysis } from '../models/Analysis';
import { TheoryDoc } from '../models/TheoryDocument';
import { Scenario } from '../models/Scenario';

export class OrgController extends BaseController {

    /** POST /org — create an org (admin only for now) */
    createOrg = async (req: Request, res: Response): Promise<void> => {
        try {
            const admin = (req as any).user;
            const { name, game_ids, seats = 5 } = req.body;
            if (!name) { res.status(400).json({ success: false, error: 'name required' }); return; }

            const slug = name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
            const org  = await Organization.create({ name, slug, game_ids: game_ids || [], seats, adminId: admin._id, members: [admin._id] });
            this.sendResponse(res, { success: true, data: org }, 201);
        } catch (err: any) {
            if (err.code === 11000) { res.status(409).json({ success: false, error: 'Org slug already exists' }); return; }
            this.sendError(res, err instanceof Error ? err.message : 'Failed');
        }
    };

    /** GET /org/mine — get the org the current user belongs to */
    getMyOrg = async (req: Request, res: Response): Promise<void> => {
        try {
            const userId = String((req as any).user._id);
            const org    = await Organization.findOne({ members: userId, isActive: true }).lean();
            if (!org) { res.status(404).json({ success: false, error: 'Not in any org' }); return; }
            this.sendResponse(res, { success: true, data: org });
        } catch (err) {
            this.sendError(res, err instanceof Error ? err.message : 'Failed');
        }
    };

    /** POST /org/invite — add a member by email */
    inviteMember = async (req: Request, res: Response): Promise<void> => {
        try {
            const adminId = String((req as any).user._id);
            const org = await Organization.findOne({ adminId, isActive: true });
            if (!org) { res.status(403).json({ success: false, error: 'You are not an org admin' }); return; }

            if (org.members.length >= org.seats) {
                res.status(400).json({ success: false, error: `Seat limit (${org.seats}) reached` }); return;
            }

            const { email } = req.body;
            const user = await User.findOne({ email }).lean() as any;
            if (!user) { res.status(404).json({ success: false, error: 'User not found' }); return; }

            const uid = String(user._id);
            if (!org.members.includes(uid)) {
                org.members.push(uid);
                await org.save();
            }
            this.sendResponse(res, { success: true, message: `${email} added to org` });
        } catch (err) {
            this.sendError(res, err instanceof Error ? err.message : 'Failed');
        }
    };

    /**
     * GET /org/scout?player=Kazuya_God&game=tekken8
     * Aggregates all analyses and scenarios featuring a player/character
     * and returns a structured scouting report.
     */
    getScoutingReport = async (req: Request, res: Response): Promise<void> => {
        try {
            const { player, game, character } = req.query as Record<string, string>;
            if (!game) { res.status(400).json({ success: false, error: 'game query param required' }); return; }

            const filter: any = { game_id: game };
            const charFilter: any = { game_id: game };

            if (player) {
                filter.$or = [
                    { 'analysis.p1_name': { $regex: player, $options: 'i' } },
                    { 'analysis.p2_name': { $regex: player, $options: 'i' } },
                ];
            }
            if (character) {
                filter.$or = filter.$or || [];
                filter.$or.push(
                    { 'analysis.p1_character': { $regex: character, $options: 'i' } },
                    { 'analysis.p2_character': { $regex: character, $options: 'i' } },
                );
                charFilter.characters_involved = { $in: [character.toLowerCase()] };
            }

            const [analyses, scenarios, theory] = await Promise.all([
                Analysis.find(filter)
                    .select('analysis_id analysis game_id created_at youtube_url')
                    .sort({ created_at: -1 })
                    .limit(20)
                    .lean(),
                character
                    ? Scenario.find(charFilter)
                        .select('description event_type tags spacing patch_version created_at')
                        .sort({ created_at: -1 })
                        .limit(30)
                        .lean()
                    : Promise.resolve([]),
                character
                    ? TheoryDoc.findOne({
                        game_id: game,
                        $or: [
                            { character_id: character.toLowerCase() },
                            { character_name: { $regex: character, $options: 'i' } },
                        ],
                        status: 'approved',
                    }).lean()
                    : Promise.resolve(null),
            ]);

            // Aggregate common event types from scenarios as "tendencies"
            const eventCounts: Record<string, number> = {};
            for (const s of scenarios as any[]) {
                const t = s.event_type || 'unknown';
                eventCounts[t] = (eventCounts[t] || 0) + 1;
            }
            const tendencies = Object.entries(eventCounts)
                .sort((a, b) => b[1] - a[1])
                .slice(0, 8)
                .map(([event, count]) => ({ event, count }));

            this.sendResponse(res, {
                success: true,
                data: {
                    query:      { player, game, character },
                    matchCount: analyses.length,
                    analyses:   analyses.map((a: any) => ({
                        analysis_id:  a.analysis_id,
                        p1:           a.analysis?.p1_character,
                        p2:           a.analysis?.p2_character,
                        winner:       a.analysis?.match_winner,
                        event_count:  a.analysis?.timeline?.length ?? 0,
                        youtube_url:  a.youtube_url,
                        analyzed_at:  a.created_at,
                    })),
                    tendencies,
                    theory: theory ? {
                        summary:       (theory as any).summary,
                        key_strengths: (theory as any).key_strengths,
                        key_weaknesses:(theory as any).key_weaknesses,
                        win_conditions:(theory as any).win_conditions,
                        counterplay:   (theory as any).counterplay,
                    } : null,
                },
            });
        } catch (err) {
            this.sendError(res, err instanceof Error ? err.message : 'Failed');
        }
    };
}

export const orgController = new OrgController();
