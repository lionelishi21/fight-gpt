"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.NotificationService = void 0;
const BaseService_1 = require("./BaseService");
const mongoose_1 = __importDefault(require("mongoose"));
class NotificationService extends BaseService_1.BaseService {
    notificationRepository;
    emailService;
    constructor(notificationRepository, emailService // Injected to avoid circular dep if needed
    ) {
        super();
        this.notificationRepository = notificationRepository;
        this.emailService = emailService;
    }
    /**
     * Generic notification method
     */
    async notify(userId, type, payload, severity = 'medium') {
        try {
            await this.notificationRepository.createNotification({
                userId: typeof userId === 'string' ? new mongoose_1.default.Types.ObjectId(userId) : userId,
                type,
                severity,
                payload,
                isRead: false
            });
            // Handle push notifications/emails if necessary in the future
            console.log(`[NotificationService] Notified user ${userId}: ${payload.title}`);
        }
        catch (error) {
            console.error('[NotificationService] Failed to create notification:', error);
        }
    }
    /**
     * Special helper for RIVAL_WATCH alerts
     */
    async rivalWatch(userId, data) {
        await this.notify(userId, 'RIVAL_WATCH', {
            gameId: data.gameId,
            title: `RIVAL SPOTTED: ${data.rivalName}`,
            description: `New match data detected for your rival ${data.rivalName} in ${data.gameName}.`,
            link: `/dashboard/matches/${data.analysisId}`,
            data: { analysisId: data.analysisId }
        }, 'high');
        // Trigger email alert if service is available
        if (this.emailService && typeof this.emailService.sendRivalWatchAlert === 'function') {
            try {
                const User = (await Promise.resolve().then(() => __importStar(require('../models/User')))).default;
                const user = await User.findById(userId).select('email name').lean();
                if (user && user.email) {
                    await this.emailService.sendRivalWatchAlert(user.email, user.name || 'Fighter', data.rivalName, data.gameName, `${process.env.APP_URL || 'https://metapunish.com'}/dashboard/matches/${data.analysisId}`);
                }
            }
            catch (e) {
                console.error('[NotificationService] Rival watch email failed:', e);
            }
        }
    }
    /**
     * Special helper for PRO_SCOUT alerts
     */
    async proScout(userId, data) {
        await this.notify(userId, 'PRO_SCOUT', {
            gameId: data.gameId,
            characterId: data.characterId,
            title: `PRO DATA: ${data.proName} Active`,
            description: `${data.proName} was spotted in a new match. Analyze their character tech now.`,
            link: `/dashboard/matches/${data.analysisId}`,
            data: { analysisId: data.analysisId }
        }, 'medium');
    }
    /**
     * Analysis complete notification
     */
    async analysisComplete(userId, analysisId, youtubeUrl) {
        await this.notify(userId, 'ANALYSIS_COMPLETE', {
            gameId: 'unknown', // Will be updated by caller if known
            title: 'Analysis Ready',
            description: `Your analysis for ${youtubeUrl} is complete and ready for review.`,
            link: `/dashboard/matches/${analysisId}`,
            data: { analysisId }
        }, 'low');
    }
    /**
     * Broadcase notification to all users
     */
    async broadcast(type, payload, severity = 'medium') {
        try {
            await this.notificationRepository.broadcastToAllUsers({
                type,
                severity,
                payload,
                isRead: false
            });
        }
        catch (error) {
            console.error('[NotificationService] Broadcast failed:', error);
        }
    }
    /**
     * System Alert notification (targets admins)
     */
    async systemAlert(title, description, data) {
        try {
            const User = (await Promise.resolve().then(() => __importStar(require('../models/User')))).default;
            const admins = await User.find({ role: 'admin' }).select('_id').lean();
            const payload = {
                gameId: 'system',
                title,
                description,
                data
            };
            for (const admin of admins) {
                await this.notify(admin._id.toString(), 'SYSTEM_ALERT', payload, 'high');
            }
            console.log(`[NotificationService] Dispatched SYSTEM_ALERT to ${admins.length} admins.`);
        }
        catch (error) {
            console.error('[NotificationService] Failed to dispatch SYSTEM_ALERT:', error);
        }
    }
    /**
     * Character theory notification
     */
    async characterTheory(data) {
        const payload = {
            gameId: data.gameId,
            characterId: data.characterId,
            title: data.title,
            description: data.description,
            link: `/dashboard/theory/${data.characterId}`
        };
        if (data.userId) {
            await this.notify(data.userId, 'CHARACTER_THEORY', payload);
        }
        else {
            await this.broadcast('CHARACTER_THEORY', payload);
        }
    }
    /**
     * Matchup theory notification
     */
    async matchupTheory(data) {
        const payload = {
            gameId: data.gameId,
            characterId: data.characterId,
            title: data.title,
            description: data.description,
            link: `/dashboard/theory/${data.characterId}/matchup/${data.opponentId}`,
            data: { opponentId: data.opponentId }
        };
        if (data.userId) {
            await this.notify(data.userId, 'MATCHUP_THEORY', payload);
        }
        else {
            await this.broadcast('MATCHUP_THEORY', payload);
        }
    }
    /**
     * Legacy/Generic push method used by worker
     */
    async sendPushToUser(userId, title, body, data) {
        await this.notify(userId, 'ANALYSIS_COMPLETE', {
            gameId: data?.gameId || 'unknown',
            title,
            description: body,
            data
        });
    }
}
exports.NotificationService = NotificationService;
//# sourceMappingURL=NotificationService.js.map