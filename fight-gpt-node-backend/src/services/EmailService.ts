import { Resend } from 'resend';

const resend = new Resend(process.env.RESEND_API_KEY || 're_placeholder');

const FROM_EMAIL = process.env.EMAIL_FROM || 'MetaPunish <noreply@metapunish.com>';
const APP_URL = process.env.APP_URL || 'https://metapunish.com';

export class EmailService {
    async sendWelcomeEmail(to: string, name: string): Promise<void> {
        if (!process.env.RESEND_API_KEY) {
            console.warn('[EmailService] RESEND_API_KEY not set — skipping welcome email');
            return;
        }

        try {
            await resend.emails.send({
                from: FROM_EMAIL,
                to,
                subject: 'Welcome to MetaPunish — Your Meta Intel Awaits',
                html: this.buildWelcomeHtml(name),
            });
        } catch (error) {
            // Non-fatal — log but don't throw so registration still succeeds
            console.error('[EmailService] Failed to send welcome email:', error);
        }
    }

    private buildWelcomeHtml(name: string): string {
        return `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Welcome to MetaPunish</title>
</head>
<body style="margin:0;padding:0;background-color:#050505;font-family:'Helvetica Neue',Arial,sans-serif;color:#ffffff;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background-color:#050505;padding:40px 20px;">
    <tr>
      <td align="center">
        <table width="600" cellpadding="0" cellspacing="0" style="max-width:600px;width:100%;">

          <!-- Header -->
          <tr>
            <td style="padding-bottom:32px;text-align:left;">
              <span style="display:inline-block;background-color:#f43f5e;padding:6px 16px;transform:skewX(-10deg);font-size:11px;font-weight:700;letter-spacing:0.1em;text-transform:uppercase;color:#ffffff;">
                SYSTEM ACCESS
              </span>
            </td>
          </tr>

          <!-- Card -->
          <tr>
            <td style="background-color:#0a0a0a;border:1px solid rgba(255,255,255,0.1);border-top:2px solid #f43f5e;padding:40px;">

              <h1 style="margin:0 0 8px;font-size:32px;font-weight:800;text-transform:uppercase;font-style:italic;letter-spacing:-0.01em;line-height:1.1;color:#f43f5e;">
                ACCOUNT INITIALIZED
              </h1>
              <p style="margin:0 0 32px;font-size:13px;color:#94a3b8;text-transform:uppercase;letter-spacing:0.05em;">
                Welcome to the arena, ${name}
              </p>

              <p style="margin:0 0 24px;font-size:15px;color:#ffffff;line-height:1.6;">
                Your MetaPunish profile is live. You now have access to real-time meta intelligence, character theory, and AI-powered match analysis for the FGC.
              </p>

              <table cellpadding="0" cellspacing="0" style="margin-bottom:32px;width:100%;">
                <tr>
                  <td style="padding:12px 0;border-bottom:1px solid #1a1a1a;">
                    <span style="font-size:18px;margin-right:12px;">📈</span>
                    <span style="font-size:13px;font-weight:700;text-transform:uppercase;color:#06b6d4;">Meta Intelligence</span>
                    <span style="display:block;margin-left:36px;font-size:12px;color:#94a3b8;margin-top:2px;">Know what's strong before you queue</span>
                  </td>
                </tr>
                <tr>
                  <td style="padding:12px 0;border-bottom:1px solid #1a1a1a;">
                    <span style="font-size:18px;margin-right:12px;">⚔️</span>
                    <span style="font-size:13px;font-weight:700;text-transform:uppercase;color:#06b6d4;">Character Theory</span>
                    <span style="display:block;margin-left:36px;font-size:12px;color:#94a3b8;margin-top:2px;">Deep matchup breakdowns from tournament data</span>
                  </td>
                </tr>
                <tr>
                  <td style="padding:12px 0;">
                    <span style="font-size:18px;margin-right:12px;">🎮</span>
                    <span style="font-size:13px;font-weight:700;text-transform:uppercase;color:#06b6d4;">Match Analysis</span>
                    <span style="display:block;margin-left:36px;font-size:12px;color:#94a3b8;margin-top:2px;">AI coaching from your own footage</span>
                  </td>
                </tr>
              </table>

              <!-- CTA -->
              <table cellpadding="0" cellspacing="0">
                <tr>
                  <td>
                    <a href="${APP_URL}/onboarding" style="display:inline-block;background-color:#f43f5e;color:#ffffff;text-decoration:none;padding:14px 32px;font-size:13px;font-weight:700;text-transform:uppercase;letter-spacing:0.05em;clip-path:polygon(8% 0, 100% 0, 92% 100%, 0 100%);">
                      ENTER THE META →
                    </a>
                  </td>
                </tr>
              </table>

            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="padding-top:24px;text-align:left;">
              <p style="margin:0;font-size:10px;color:#444;text-transform:uppercase;letter-spacing:0.1em;">
                MetaPunish · The Bloomberg Terminal for Fighting Games · <a href="${APP_URL}" style="color:#444;">metapunish.com</a>
              </p>
              <p style="margin:4px 0 0;font-size:10px;color:#333;text-transform:uppercase;letter-spacing:0.1em;">
                You're receiving this because you created an account. You can <a href="${APP_URL}/unsubscribe" style="color:#333;">unsubscribe</a> at any time.
              </p>
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;
    }
}

export const emailService = new EmailService();
