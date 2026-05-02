export declare class EmailService {
    sendAdminInviteEmail(to: string, inviterName: string, inviteUrl: string, promoCode?: string): Promise<void>;
    sendReferralInviteEmail(to: string, inviterName: string, inviteUrl: string): Promise<void>;
    private buildAdminInviteHtml;
    private buildReferralInviteHtml;
    sendWelcomeEmail(to: string, name: string): Promise<void>;
    sendRivalWatchAlert(to: string, userName: string, rivalName: string, gameName: string, analysisUrl: string): Promise<void>;
    private buildWelcomeHtml;
    private buildRivalWatchHtml;
}
export declare const emailService: EmailService;
//# sourceMappingURL=EmailService.d.ts.map