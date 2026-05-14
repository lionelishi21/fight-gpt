export declare class EmailService {
    private resend;
    private fromEmail;
    constructor();
    private send;
    /**
     * Welcome email for new users after onboarding
     */
    sendWelcomeEmail(to: string, name: string): Promise<boolean>;
    /**
     * Generic notification email
     */
    sendNotificationEmail(to: string, title: string, description: string, link?: string): Promise<boolean>;
    /**
     * High priority Rival Watch alert
     */
    sendRivalWatchAlert(to: string, name: string, rivalName: string, gameName: string, link: string): Promise<boolean>;
    /**
     * Admin invite email
     */
    sendAdminInviteEmail(to: string, adminName: string, inviteUrl: string, promoCode?: string): Promise<boolean>;
    /**
     * Referral invite email
     */
    sendReferralInviteEmail(to: string, senderName: string, inviteUrl: string): Promise<boolean>;
}
export declare const emailService: EmailService;
//# sourceMappingURL=EmailService.d.ts.map