import { Logger } from '../helpers/logger';
import { emailService } from './EmailService';
import User from '../models/User';

const DRIP_WINDOWS_MS = {
    1: 24  * 60 * 60 * 1000,
    3: 72  * 60 * 60 * 1000,
    7: 168 * 60 * 60 * 1000,
} as const;

export class DripService {
    private intervalId: NodeJS.Timeout | null = null;

    async run(): Promise<void> {
        Logger.info('[DripService] Running drip pass…');
        try {
            await this.processDay(1);
            await this.processDay(3);
            await this.processDay(7);
        } catch (err) {
            Logger.error('[DripService] Drip pass failed:', err);
        }
    }

    private async processDay(day: 1 | 3 | 7): Promise<void> {
        const windowMs  = DRIP_WINDOWS_MS[day];
        const threshold = new Date(Date.now() - windowMs);

        // Find users who signed up past the window but haven't received this drip yet
        const users = await User.find({
            drip_sent: { $lt: day },
            createdAt: { $lte: threshold },
            email: { $exists: true, $ne: '' },
        }).select('email name drip_sent').lean();

        if (users.length === 0) return;

        Logger.info(`[DripService] Day ${day}: ${users.length} user(s) to email`);

        for (const user of users) {
            try {
                const ok = await emailService.sendDripEmail(
                    (user as any).email,
                    (user as any).name || 'Fighter',
                    day,
                );
                if (ok) {
                    await User.updateOne(
                        { _id: (user as any)._id, drip_sent: { $lt: day } },
                        { $set: { drip_sent: day } },
                    );
                }
            } catch (err) {
                Logger.error(`[DripService] Failed for user ${(user as any)._id}:`, err);
            }
        }
    }

    startScheduler(intervalHours = 4): void {
        Logger.info(`[DripService] Scheduler started — every ${intervalHours}h`);
        // Run immediately on boot, then on the interval
        this.run().catch(() => {});
        this.intervalId = setInterval(() => this.run(), intervalHours * 60 * 60 * 1000);
    }

    stopScheduler(): void {
        if (this.intervalId) {
            clearInterval(this.intervalId);
            this.intervalId = null;
        }
    }
}

export const dripService = new DripService();
