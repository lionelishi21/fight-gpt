import { Request, Response } from 'express';
import { BaseController } from './BaseController';
import { RivalRepository } from '../repositories/RivalRepository';
import { IRivalDocument } from '../models/Rival';

/** The app calls the tracked player `name`; the model stores it as `targetName`. */
const toClient = (r: IRivalDocument) => ({
    _id: r._id,
    name: r.targetName,
    gameId: r.gameId,
    notes: r.notes,
    metaDiscoveryOnly: r.metaDiscoveryOnly,
    lastSpottedAt: r.lastSpottedAt,
    createdAt: r.createdAt,
});

export class RivalController extends BaseController {
    private repo = new RivalRepository();

    /** GET /rivals */
    public getAll = async (req: Request, res: Response): Promise<void> => {
        try {
            const userId = (req as any).user.id;
            const rivals = await this.repo.getRivalsByUserId(userId);
            this.sendResponse(res, { success: true, data: rivals.map(toClient) });
        } catch (error) {
            this.sendError(res, error instanceof Error ? error.message : 'Failed to fetch rivals');
        }
    };

    /** POST /rivals { name, gameId, notes? } */
    public add = async (req: Request, res: Response): Promise<void> => {
        try {
            const userId = (req as any).user.id;
            const name = String(req.body?.name || '').trim();
            const gameId = String(req.body?.gameId || '').trim();
            if (!name || !gameId) {
                this.sendError(res, 'name and gameId are required', 400);
                return;
            }

            const rival = await this.repo.createRival({ userId, targetName: name, gameId, notes: req.body?.notes });
            this.sendResponse(res, { success: true, data: toClient(rival) }, 201);
        } catch (error: any) {
            if (error?.code === 11000) {
                this.sendError(res, 'You are already tracking this player', 409);
                return;
            }
            this.sendError(res, error instanceof Error ? error.message : 'Failed to add rival');
        }
    };

    /** DELETE /rivals/:id — only the owner's own rival */
    public remove = async (req: Request, res: Response): Promise<void> => {
        try {
            const userId = (req as any).user.id;
            const deleted = await this.repo.deleteForUser(req.params.id, userId);
            if (!deleted) {
                this.sendError(res, 'Rival not found', 404);
                return;
            }
            this.sendResponse(res, { success: true, data: { id: req.params.id } });
        } catch (error) {
            this.sendError(res, error instanceof Error ? error.message : 'Failed to delete rival');
        }
    };
}
