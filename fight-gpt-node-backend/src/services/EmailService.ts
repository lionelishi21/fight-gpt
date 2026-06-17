import { Resend } from 'resend';
import { AppConfig } from '../config/app';
import { Logger } from '../helpers/logger';
import {
    buildWelcomeEmail,           WelcomeData,
    buildAnalysisCompleteEmail,  AnalysisCompleteData,
    buildUpgradePromptEmail,     UpgradePromptData,
    buildWeeklyBriefEmail,       WeeklyBriefData,
    buildPaymentFailedEmail,     PaymentFailedData,
    buildPasswordResetEmail,
    buildAdminInviteEmail,
    buildNotificationEmail,
    buildRivalAlertEmail,
    buildReferralInviteEmail,
    buildDripDay1Email,
    buildDripDay3Email,
    buildDripDay7Email,
} from './EmailTemplates';

// Re-export data interfaces so callers can import from one place
export type {
    WelcomeData,
    AnalysisCompleteData,
    UpgradePromptData,
    WeeklyBriefData,
    PaymentFailedData,
};

export class EmailService {
    private resend: Resend | null = null;

    // Per-role from addresses (matching template designs)
    private readonly FROM = {
        intel:    'MetaPunish <intel@metapunish.com>',
        analysis: 'MetaPunish <analysis@metapunish.com>',
        billing:  'MetaPunish <billing@metapunish.com>',
        meta:     'MetaPunish <meta@metapunish.com>',
    };

    constructor() {
        if (AppConfig.RESEND_API_KEY) {
            this.resend = new Resend(AppConfig.RESEND_API_KEY);
            Logger.info('[EmailService] Ready — Resend initialised');
        } else {
            Logger.warn('[EmailService] RESEND_API_KEY not set — emails will be logged only.');
        }
    }

    // ── Core send (private) ────────────────────────────────────────────────
    private async send(
        from: string,
        to: string | string[],
        subject: string,
        html: string,
        attempt = 1,
    ): Promise<boolean> {
        const recipients = Array.isArray(to) ? to : [to];

        if (!this.resend) {
            Logger.info(`[EmailService] Simulation — to: ${recipients.join(', ')} | subject: ${subject}`);
            return true;
        }

        try {
            const { error } = await this.resend.emails.send({ from, to: recipients, subject, html });
            if (error) {
                throw new Error(
                    typeof error === 'object' && 'message' in error
                        ? (error as any).message
                        : String(error),
                );
            }
            Logger.info(`[EmailService] Sent "${subject}" → ${recipients.join(', ')}`);
            return true;
        } catch (err) {
            const max = 3;
            if (attempt < max) {
                const delay = 1000 * Math.pow(2, attempt - 1);
                Logger.warn(`[EmailService] Attempt ${attempt}/${max} failed — retrying in ${delay}ms`);
                await new Promise(r => setTimeout(r, delay));
                return this.send(from, to, subject, html, attempt + 1);
            }
            Logger.error(`[EmailService] All ${max} attempts failed for "${subject}":`, err);
            return false;
        }
    }

    // ── 01 · Welcome / First Punch-in ─────────────────────────────────────
    async sendWelcomeEmail(to: string, name: string): Promise<boolean> {
        return this.send(
            this.FROM.intel,
            to,
            `Welcome to the fight, ${name}.`,
            buildWelcomeEmail({ name }),
        );
    }

    // ── 02 · Analysis Complete ─────────────────────────────────────────────
    async sendAnalysisCompleteEmail(to: string, data: AnalysisCompleteData): Promise<boolean> {
        return this.send(
            this.FROM.analysis,
            to,
            `Your ${data.characterA} vs ${data.characterB} match has been broken down`,
            buildAnalysisCompleteEmail(data),
        );
    }

    // ── 03 · Upgrade Prompt (free tier limit hit) ──────────────────────────
    async sendUpgradePromptEmail(to: string, data: UpgradePromptData): Promise<boolean> {
        return this.send(
            this.FROM.billing,
            to,
            `You're out of free punishes — go PRO`,
            buildUpgradePromptEmail(data),
        );
    }

    // ── 04 · Weekly Meta Brief ─────────────────────────────────────────────
    async sendWeeklyBriefEmail(to: string | string[], data: WeeklyBriefData): Promise<boolean> {
        return this.send(
            this.FROM.meta,
            to,
            `The ${data.gameId.toUpperCase()} meta shifted this week · Week ${data.week}`,
            buildWeeklyBriefEmail(data),
        );
    }

    // ── 05 · Payment Failed / Dunning ─────────────────────────────────────
    async sendPaymentFailedEmail(to: string, data: PaymentFailedData): Promise<boolean> {
        return this.send(
            this.FROM.billing,
            to,
            `Your ${data.planName} access expires in 48h — update payment`,
            buildPaymentFailedEmail(data),
        );
    }

    // ── Admin Invite ───────────────────────────────────────────────────────
    async sendAdminInviteEmail(
        to: string,
        adminName: string,
        inviteUrl: string,
        promoCode?: string,
    ): Promise<boolean> {
        return this.send(
            this.FROM.intel,
            to,
            `[METAPUNISH] Priority Operator Access Invited`,
            buildAdminInviteEmail(adminName, inviteUrl, promoCode),
        );
    }

    // ── Generic Notification ───────────────────────────────────────────────
    async sendNotificationEmail(
        to: string,
        title: string,
        description: string,
        link?: string,
    ): Promise<boolean> {
        return this.send(
            this.FROM.intel,
            to,
            `[METAPUNISH] ${title}`,
            buildNotificationEmail(title, description, link),
        );
    }

    // ── Rival Watch Alert ──────────────────────────────────────────────────
    async sendRivalWatchAlert(
        to: string,
        playerName: string,
        rivalName: string,
        gameName: string,
        link: string,
    ): Promise<boolean> {
        return this.send(
            this.FROM.intel,
            to,
            `⚠️ RIVAL DETECTED: ${rivalName}`,
            buildRivalAlertEmail(playerName, rivalName, gameName, link),
        );
    }

    // ── Referral Invite ────────────────────────────────────────────────────
    async sendReferralInviteEmail(
        to: string,
        senderName: string,
        inviteUrl: string,
    ): Promise<boolean> {
        return this.send(
            this.FROM.intel,
            to,
            `${senderName} invited you to the MetaPunish Dojo`,
            buildReferralInviteEmail(senderName, inviteUrl),
        );
    }

    // ── Onboarding Drip ────────────────────────────────────────────────────
    async sendDripEmail(to: string, name: string, day: 1 | 3 | 7): Promise<boolean> {
        const builders: Record<number, () => string> = {
            1: () => buildDripDay1Email(name),
            3: () => buildDripDay3Email(name),
            7: () => buildDripDay7Email(name),
        };
        const subjects: Record<number, string> = {
            1: `${name}, your first analysis is one paste away`,
            3: `The meta shifted this week — here's what changed`,
            7: `One week in — unlock your training plan`,
        };
        return this.send(
            this.FROM.intel,
            to,
            subjects[day],
            builders[day](),
        );
    }
    // ── Password Reset ─────────────────────────────────────────────────────
    async sendPasswordResetEmail(to: string, name: string, resetUrl: string): Promise<boolean> {
        return this.send(
            this.FROM.intel,
            to,
            'Reset your MetaPunish access code',
            buildPasswordResetEmail({ name, resetUrl }),
        );
    }
}

export const emailService = new EmailService();
