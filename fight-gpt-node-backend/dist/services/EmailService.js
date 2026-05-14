"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.emailService = exports.EmailService = void 0;
const resend_1 = require("resend");
const app_1 = require("../config/app");
const logger_1 = require("../helpers/logger");
class EmailService {
    resend = null;
    fromEmail = 'MetaPunish <intelligence@fightingames.online>';
    constructor() {
        if (app_1.AppConfig.RESEND_API_KEY) {
            this.resend = new resend_1.Resend(app_1.AppConfig.RESEND_API_KEY);
        }
        else {
            logger_1.Logger.warn('[EmailService] RESEND_API_KEY not set. Emails will be logged but not sent.');
        }
    }
    async send(to, subject, html) {
        if (!this.resend) {
            logger_1.Logger.info(`[EmailService] Simulation: To: ${to}, Subject: ${subject}`);
            return true;
        }
        try {
            const { error } = await this.resend.emails.send({
                from: this.fromEmail,
                to,
                subject,
                html,
            });
            if (error) {
                logger_1.Logger.error('[EmailService] Resend error:', error);
                return false;
            }
            return true;
        }
        catch (err) {
            logger_1.Logger.error('[EmailService] Failed to send email:', err);
            return false;
        }
    }
    /**
     * Welcome email for new users after onboarding
     */
    async sendWelcomeEmail(to, name) {
        const subject = `Welcome to the Dojo, ${name}`;
        const html = `
            <div style="font-family: 'Space Grotesk', sans-serif; background-color: #000; color: #fff; padding: 40px;">
                <h1 style="color: #F43F5E; font-style: italic; text-transform: uppercase;">Uplink Established.</h1>
                <p>Welcome, <strong>${name}</strong>. You have been successfully onboarded into the MetaPunish Intelligence Network.</p>
                <p>Your tactical dashboard is now active. We are scouting tournaments and pro matches to provide you with the most accurate frame data and theory updates.</p>
                <div style="border: 1px solid #F43F5E; padding: 20px; margin: 20px 0;">
                    <h3 style="margin-top: 0;">Initial Protocols:</h3>
                    <ul>
                        <li>Daily Missions are assigned at 00:00 UTC.</li>
                        <li>Pro Scout reports refresh every 6 hours.</li>
                        <li>Character Theory updates daily at 02:00 UTC.</li>
                    </ul>
                </div>
                <a href="${app_1.AppConfig.APP_URL}/dashboard" style="background-color: #F43F5E; color: #fff; padding: 12px 24px; text-decoration: none; font-weight: bold; display: inline-block;">ENTER THE DOJO</a>
                <p style="margin-top: 40px; font-size: 10px; color: #666;">METAPUNISH INTELLIGENCE SUITE v4.0.0</p>
            </div>
        `;
        return this.send(to, subject, html);
    }
    /**
     * Generic notification email
     */
    async sendNotificationEmail(to, title, description, link) {
        const subject = `[METAPUNISH] ${title}`;
        const fullLink = link ? (link.startsWith('http') ? link : `${app_1.AppConfig.APP_URL}${link}`) : `${app_1.AppConfig.APP_URL}/dashboard`;
        const html = `
            <div style="font-family: sans-serif; background-color: #050505; color: #eee; padding: 30px; border-left: 4px solid #F43F5E;">
                <h2 style="color: #fff; margin-top: 0;">${title}</h2>
                <p style="font-size: 16px; line-height: 1.5;">${description}</p>
                <br />
                <a href="${fullLink}" style="color: #F43F5E; font-weight: bold; text-decoration: none;">VIEW INTEL &rarr;</a>
                <hr style="border: 0; border-top: 1px solid #222; margin: 30px 0;" />
                <p style="font-size: 10px; color: #555;">Sent from MetaPunish Dojo. You received this because you are an active operator.</p>
            </div>
        `;
        return this.send(to, subject, html);
    }
    /**
     * High priority Rival Watch alert
     */
    async sendRivalWatchAlert(to, name, rivalName, gameName, link) {
        const subject = `⚠️ RIVAL DETECTED: ${rivalName}`;
        const html = `
            <div style="font-family: sans-serif; background-color: #0a0002; color: #fff; padding: 30px; border: 2px solid #F43F5E;">
                <h1 style="color: #F43F5E;">THREAT DETECTED</h1>
                <p>Operator <strong>${name}</strong>, your rival <strong>${rivalName}</strong> has been spotted in ${gameName}.</p>
                <p>New match data has been analyzed and indexed in the vector database. Review their current strategies immediately.</p>
                <br />
                <a href="${link}" style="background-color: #F43F5E; color: #fff; padding: 15px 30px; text-decoration: none; font-weight: bold; display: inline-block;">ANALYZE RIVAL TECH</a>
            </div>
        `;
        return this.send(to, subject, html);
    }
    /**
     * Admin invite email
     */
    async sendAdminInviteEmail(to, adminName, inviteUrl, promoCode) {
        const subject = `[METAPUNISH] Priority Operator Access Invited`;
        const html = `
            <div style="font-family: sans-serif; background-color: #000; color: #fff; padding: 40px; border: 1px solid #F43F5E;">
                <h1 style="color: #F43F5E; text-transform: uppercase;">Operator Access Granted</h1>
                <p>Admin <strong>${adminName}</strong> has invited you to join the MetaPunish Intelligence Suite as an Operator.</p>
                <p>Access the tactical dashboard via the secure link below:</p>
                <div style="margin: 30px 0;">
                    <a href="${inviteUrl}" style="background-color: #F43F5E; color: #fff; padding: 15px 30px; text-decoration: none; font-weight: bold;">INITIALIZE UPLINK</a>
                </div>
                ${promoCode ? `<p style="font-size: 12px; color: #888;">Beta Access Code: <strong>${promoCode}</strong></p>` : ''}
                <p style="font-size: 10px; color: #555; margin-top: 40px;">This link expires in 48 hours.</p>
            </div>
        `;
        return this.send(to, subject, html);
    }
    /**
     * Referral invite email
     */
    async sendReferralInviteEmail(to, senderName, inviteUrl) {
        const subject = `${senderName} invited you to the Dojo`;
        const html = `
            <div style="font-family: sans-serif; background-color: #050505; color: #eee; padding: 30px; border: 1px solid #222;">
                <h2 style="color: #F43F5E; margin-top: 0;">JOIN THE INTELLIGENCE NETWORK</h2>
                <p><strong>${senderName}</strong> is using MetaPunish to dominate the competitive scene and wants you to join their crew.</p>
                <p>Get real-time frame data analysis, pro scout reports, and automated theory for your character.</p>
                <br />
                <a href="${inviteUrl}" style="color: #F43F5E; font-weight: bold; text-decoration: none;">ACCEPT INVITATION &rarr;</a>
            </div>
        `;
        return this.send(to, subject, html);
    }
}
exports.EmailService = EmailService;
exports.emailService = new EmailService();
//# sourceMappingURL=EmailService.js.map