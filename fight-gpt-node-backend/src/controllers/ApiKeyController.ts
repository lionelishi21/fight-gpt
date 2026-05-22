import { Request, Response } from 'express';
import { BaseController } from './BaseController';
import { ApiKey, generateApiKey } from '../models/ApiKey';

export class ApiKeyController extends BaseController {

    /** POST /api-keys — create a key (Pro or Org tier only) */
    createKey = async (req: Request, res: Response): Promise<void> => {
        try {
            const user: any = (req as any).user;
            const tier = (user.tier || 'FREE').toUpperCase();

            if (!['PRO', 'ORG'].includes(tier) && user.role !== 'admin') {
                res.status(403).json({
                    success: false,
                    error: 'API access requires Pro ($75/mo) or Org ($2,000/mo) tier.',
                });
                return;
            }

            const { name } = req.body;
            if (!name?.trim()) {
                res.status(400).json({ success: false, error: 'name is required' });
                return;
            }

            // Limit keys per user
            const existing = await ApiKey.countDocuments({ userId: user._id, isActive: true });
            if (existing >= 5) {
                res.status(400).json({ success: false, error: 'Maximum 5 active API keys per account.' });
                return;
            }

            const { raw, hash, prefix } = generateApiKey();
            const keyTier = (tier === 'ORG' || user.role === 'admin') ? 'org' : 'pro';

            await ApiKey.create({
                keyHash:  hash,
                prefix,
                userId:   user._id,
                name:     name.trim(),
                tier:     keyTier,
            });

            // Return the raw key ONCE — never stored in plaintext
            this.sendResponse(res, {
                success: true,
                data: {
                    key:       raw,
                    prefix,
                    name:      name.trim(),
                    tier:      keyTier,
                    rateLimit: `${keyTier === 'org' ? 1000 : 100} req/hour`,
                    warning:   'Save this key now — it will never be shown again.',
                },
            }, 201);
        } catch (err) {
            this.sendError(res, err instanceof Error ? err.message : 'Failed to create key');
        }
    };

    /** GET /api-keys — list current user's keys (prefix only, never the full key) */
    listKeys = async (req: Request, res: Response): Promise<void> => {
        try {
            const userId = (req as any).user._id;
            const keys = await ApiKey.find({ userId, isActive: true })
                .select('prefix name tier requestsThisHour lastUsedAt createdAt')
                .sort({ createdAt: -1 })
                .lean();
            this.sendResponse(res, { success: true, data: keys });
        } catch (err) {
            this.sendError(res, err instanceof Error ? err.message : 'Failed');
        }
    };

    /** DELETE /api-keys/:prefix — revoke a key */
    revokeKey = async (req: Request, res: Response): Promise<void> => {
        try {
            const userId = (req as any).user._id;
            const key = await ApiKey.findOneAndUpdate(
                { prefix: req.params.prefix, userId },
                { isActive: false },
                { new: true }
            );
            if (!key) { res.status(404).json({ success: false, error: 'Key not found' }); return; }
            this.sendResponse(res, { success: true, message: 'Key revoked.' });
        } catch (err) {
            this.sendError(res, err instanceof Error ? err.message : 'Failed');
        }
    };
}

export const apiKeyController = new ApiKeyController();
