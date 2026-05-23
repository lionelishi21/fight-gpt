import { AppConfig } from '../config/app';

const APP = () => AppConfig.APP_URL || 'https://metapunish.com';

// ─── Shared design tokens ───────────────────────────────────────────────────
const C = {
  bg:      '#000000',
  surface: '#0a0a0a',
  border:  '#F43F5E',
  accent:  '#F43F5E',
  cyan:    '#06b6d4',
  green:   '#22c55e',
  yellow:  '#fbbf24',
  muted:   '#888888',
  text:    '#ffffff',
  sub:     '#cccccc',
  mono:    `'Courier New', Courier, monospace`,
};

// ─── Base wrapper ────────────────────────────────────────────────────────────
function base(
  fromLabel: string,
  subjectLine: string,
  preheader: string,
  body: string,
): string {
  const year = new Date().getFullYear();
  const dashUrl = `${APP()}/dashboard`;
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>MetaPunish</title>
  <style>
    body { margin:0; padding:0; background:${C.bg}; -webkit-text-size-adjust:100%; }
    a { color:${C.accent}; text-decoration:none; }
    a:hover { text-decoration:underline; }
    @media (max-width:600px) {
      .wrapper { width:100% !important; }
      .hero-text { font-size:28px !important; }
    }
  </style>
</head>
<body style="margin:0;padding:0;background:${C.bg};">
  <!-- Preheader -->
  <span style="display:none;font-size:1px;color:${C.bg};max-height:0;overflow:hidden;">${preheader}</span>

  <table width="100%" cellpadding="0" cellspacing="0" border="0" style="background:${C.bg};padding:24px 0;">
    <tr><td align="center">
      <table class="wrapper" width="600" cellpadding="0" cellspacing="0" border="0"
             style="width:600px;background:${C.bg};border:1px solid #1a1a1a;">

        <!-- TOP ACCENT LINE -->
        <tr><td height="3" style="background:${C.accent};font-size:0;line-height:0;">&nbsp;</td></tr>

        <!-- HEADER -->
        <tr>
          <td style="padding:20px 28px 16px;border-bottom:1px solid #1a1a1a;background:${C.surface};">
            <table width="100%" cellpadding="0" cellspacing="0">
              <tr>
                <td style="font-family:${C.mono};font-size:18px;font-weight:bold;letter-spacing:0.15em;color:${C.text};">
                  META<span style="color:${C.accent};">PUNISH</span>
                </td>
                <td align="right" style="font-family:${C.mono};font-size:9px;color:${C.muted};letter-spacing:0.2em;text-transform:uppercase;">
                  ${fromLabel}
                </td>
              </tr>
            </table>
          </td>
        </tr>

        <!-- SUBJECT BADGE -->
        <tr>
          <td style="padding:10px 28px;background:${C.surface};border-bottom:1px solid #1a1a1a;">
            <span style="font-family:${C.mono};font-size:9px;color:${C.accent};letter-spacing:0.25em;text-transform:uppercase;">
              ${subjectLine}
            </span>
          </td>
        </tr>

        <!-- BODY -->
        ${body}

        <!-- FOOTER -->
        <tr>
          <td style="padding:24px 28px;border-top:1px solid #1a1a1a;background:${C.surface};">
            <table width="100%" cellpadding="0" cellspacing="0">
              <tr>
                <td style="font-family:${C.mono};font-size:9px;color:${C.muted};letter-spacing:0.1em;">
                  The Bloomberg Terminal for fighting games.<br />
                  <span style="color:#444;">metapunish.com &nbsp;·&nbsp; fightingames.online</span>
                </td>
                <td align="right" style="font-family:${C.mono};font-size:9px;color:#444;">
                  <a href="${dashUrl}" style="color:#555;">Dashboard</a>
                  &nbsp;·&nbsp;
                  <a href="${APP()}/settings" style="color:#555;">Settings</a>
                  &nbsp;·&nbsp;
                  <a href="${APP()}/unsubscribe" style="color:#555;">Unsubscribe</a>
                </td>
              </tr>
              <tr>
                <td colspan="2" style="padding-top:12px;font-family:${C.mono};font-size:8px;color:#333;letter-spacing:0.1em;">
                  © ${year} METAPUNISH INTELLIGENCE
                </td>
              </tr>
            </table>
          </td>
        </tr>

      </table>
    </td></tr>
  </table>
</body>
</html>`;
}

// ─── Helper: section panel ───────────────────────────────────────────────────
function panel(label: string, content: string, accentColor = C.accent): string {
  return `
    <tr>
      <td style="padding:0 28px 20px;">
        <table width="100%" cellpadding="0" cellspacing="0" style="border:1px solid #1a1a1a;">
          <tr>
            <td style="padding:10px 16px;background:#0d0d0d;border-bottom:1px solid #1a1a1a;">
              <span style="font-family:${C.mono};font-size:9px;color:${accentColor};letter-spacing:0.25em;text-transform:uppercase;">
                ► ${label}
              </span>
            </td>
          </tr>
          <tr>
            <td style="padding:16px;">${content}</td>
          </tr>
        </table>
      </td>
    </tr>`;
}

// ─── Helper: CTA button ──────────────────────────────────────────────────────
function btn(label: string, url: string, bg = C.accent): string {
  return `<a href="${url}"
    style="display:inline-block;background:${bg};color:#fff;font-family:${C.mono};
           font-size:11px;font-weight:bold;letter-spacing:0.2em;text-transform:uppercase;
           padding:14px 32px;text-decoration:none;">
    ${label} →
  </a>`;
}

// ─── Helper: stat cell ───────────────────────────────────────────────────────
function stat(value: string, label: string, color = C.accent): string {
  return `<td align="center" style="padding:12px 16px;border:1px solid #1a1a1a;">
    <div style="font-family:${C.mono};font-size:20px;font-weight:bold;font-style:italic;color:${color};">${value}</div>
    <div style="font-family:${C.mono};font-size:8px;color:${C.muted};letter-spacing:0.15em;text-transform:uppercase;margin-top:4px;">${label}</div>
  </td>`;
}

// ════════════════════════════════════════════════════════════════════════════
// 01 — WELCOME / FIRST PUNCH-IN
// ════════════════════════════════════════════════════════════════════════════
export interface WelcomeData {
  name: string;
}

export function buildWelcomeEmail({ name }: WelcomeData): string {
  const url = APP();
  const body = `
    <!-- HERO -->
    <tr>
      <td style="padding:40px 28px 32px;background:#050505;border-bottom:1px solid #1a1a1a;">
        <div style="font-family:${C.mono};font-size:10px;color:${C.accent};letter-spacing:0.3em;text-transform:uppercase;margin-bottom:16px;">
          ● ROSTER ACCEPTED &nbsp;·&nbsp; TRAINING UNLOCKED
        </div>
        <div class="hero-text" style="font-family:${C.mono};font-size:40px;font-weight:bold;line-height:1;color:${C.text};letter-spacing:-0.02em;text-transform:uppercase;margin-bottom:20px;">
          WELCOME TO<br/>THE FIGHT,<br/><span style="color:${C.accent};">${name.toUpperCase()}.</span>
        </div>
        <p style="font-family:${C.mono};font-size:13px;color:${C.sub};line-height:1.6;max-width:460px;margin:0 0 28px;">
          You're in. Meta tier lists, AI character theory, and frame-by-frame match analysis are now in your loadout.
        </p>
        ${btn('ENTER TRAINING', `${url}/dashboard`)}
      </td>
    </tr>

    <!-- SPACER -->
    <tr><td height="24" style="font-size:0;">&nbsp;</td></tr>

    ${panel('YOUR FIRST 3 STEPS', `
      <table width="100%" cellpadding="0" cellspacing="0">
        ${['PICK YOUR MAIN — Choose your character. We unlock theory for them on the free tier.',
           'CHECK THE META — See tier lists and trending picks from this week\'s tournament data.',
           'ANALYZE A MATCH — Paste a YouTube replay. Get frame-by-frame AI coaching.']
          .map((s, i) => `
            <tr>
              <td width="28" valign="top" style="font-family:${C.mono};font-size:9px;color:${C.accent};padding:6px 0;">0${i+1}</td>
              <td style="font-family:${C.mono};font-size:12px;color:${C.sub};padding:6px 0;border-bottom:1px solid #111;">
                <strong style="color:${C.text};">${s.split('—')[0].trim()}</strong>
                <span style="color:${C.muted};">—${s.split('—')[1]}</span>
              </td>
            </tr>`).join('')}
      </table>
    `)}

    <!-- SPACER -->
    <tr><td height="8">&nbsp;</td></tr>
  `;

  return base(
    'intel@metapunish.com',
    'WELCOME · 01',
    `You're in, ${name}. Your training kit is live.`,
    body,
  );
}

// ════════════════════════════════════════════════════════════════════════════
// 02 — ANALYSIS COMPLETE
// ════════════════════════════════════════════════════════════════════════════
export interface AnalysisInsight {
  type: 'PUNISH' | 'NEUTRAL' | 'MATCHUP' | 'DEFENSE' | 'OFFENSE';
  round?: string;
  title: string;
  detail: string;
}

export interface AnalysisCompleteData {
  name: string;
  characterA: string;
  characterB: string;
  result: 'WIN' | 'LOSS' | 'DRAW';
  score?: string;          // e.g. "2-1"
  executionPct?: number;
  defensePct?: number;
  punishesLanded?: string; // e.g. "4/7"
  grade?: string;
  insights: AnalysisInsight[];
  analysisUrl: string;
}

export function buildAnalysisCompleteEmail(data: AnalysisCompleteData): string {
  const resultColor = data.result === 'WIN' ? C.green : data.result === 'LOSS' ? C.accent : C.yellow;

  const insightRows = data.insights.slice(0, 3).map(ins => `
    <tr>
      <td style="padding:14px 0;border-bottom:1px solid #111;">
        <div style="margin-bottom:6px;">
          <span style="font-family:${C.mono};font-size:9px;font-weight:bold;color:${C.accent};
                       letter-spacing:0.2em;text-transform:uppercase;background:#1a0005;
                       padding:2px 8px;border:1px solid #F43F5E30;">
            ${ins.type}
          </span>
          ${ins.round ? `<span style="font-family:${C.mono};font-size:9px;color:${C.muted};margin-left:8px;">${ins.round}</span>` : ''}
        </div>
        <div style="font-family:${C.mono};font-size:12px;font-weight:bold;color:${C.text};margin-bottom:4px;">${ins.title}</div>
        <div style="font-family:${C.mono};font-size:11px;color:${C.sub};line-height:1.5;">${ins.detail}</div>
      </td>
    </tr>`).join('');

  const body = `
    <!-- HERO -->
    <tr>
      <td style="padding:40px 28px 32px;background:#050505;border-bottom:1px solid #1a1a1a;">
        <div style="font-family:${C.mono};font-size:10px;color:${C.cyan};letter-spacing:0.3em;text-transform:uppercase;margin-bottom:16px;">
          ● ANALYSIS COMPLETE &nbsp;·&nbsp; ${data.characterA.toUpperCase()} vs ${data.characterB.toUpperCase()}
        </div>
        <div class="hero-text" style="font-family:${C.mono};font-size:36px;font-weight:bold;line-height:1;color:${C.text};text-transform:uppercase;margin-bottom:20px;">
          YOUR MATCH<br/>HAS BEEN<br/><span style="color:${C.cyan};">BROKEN DOWN.</span>
        </div>
        <p style="font-family:${C.mono};font-size:12px;color:${C.sub};margin:0 0 28px;">
          ${data.insights.length} insight${data.insights.length !== 1 ? 's' : ''} identified. Full breakdown below.
        </p>
      </td>
    </tr>

    <!-- MATCH RESULT -->
    <tr>
      <td style="padding:20px 28px 0;">
        <table width="100%" cellpadding="0" cellspacing="0" style="border:1px solid #1a1a1a;">
          <tr>
            <td style="padding:10px 16px;background:#0d0d0d;border-bottom:1px solid #1a1a1a;">
              <span style="font-family:${C.mono};font-size:9px;color:${C.muted};letter-spacing:0.2em;text-transform:uppercase;">
                ► MATCH RESULT
              </span>
              <span style="font-family:${C.mono};font-size:9px;font-weight:bold;color:${resultColor};
                           letter-spacing:0.15em;margin-left:12px;">
                ● ${data.result}${data.score ? ` ${data.score}` : ''}
              </span>
            </td>
          </tr>
          <tr>
            <td style="padding:0;">
              <table width="100%" cellpadding="0" cellspacing="0">
                <tr>
                  ${data.executionPct !== undefined  ? stat(`${data.executionPct}%`, 'Execution',  C.cyan)   : ''}
                  ${data.defensePct !== undefined    ? stat(`${data.defensePct}%`,  'Defense',    C.yellow)  : ''}
                  ${data.punishesLanded              ? stat(data.punishesLanded,    'Punishes',   C.accent)  : ''}
                  ${data.grade                       ? stat(data.grade,             'Grade',      C.green)   : ''}
                </tr>
              </table>
            </td>
          </tr>
        </table>
      </td>
    </tr>

    <tr><td height="20">&nbsp;</td></tr>

    ${panel('TOP INSIGHTS', `
      <table width="100%" cellpadding="0" cellspacing="0">
        ${insightRows}
      </table>
    `, C.cyan)}

    <!-- CTA -->
    <tr>
      <td style="padding:8px 28px 32px;text-align:center;">
        ${btn('OPEN FULL BREAKDOWN', data.analysisUrl, C.cyan)}
      </td>
    </tr>
  `;

  return base(
    'analysis@metapunish.com',
    `ANALYSIS COMPLETE · ${data.characterA.toUpperCase()} vs ${data.characterB.toUpperCase()}`,
    `${data.insights.length} insights from your ${data.characterA} vs ${data.characterB} match.`,
    body,
  );
}

// ════════════════════════════════════════════════════════════════════════════
// 03 — UPGRADE TO PRO (free tier limit reached)
// ════════════════════════════════════════════════════════════════════════════
export interface UpgradePromptData {
  name: string;
  analysesUsed: number;
  analysisLimit: number;
  daysActive: number;
  upgradeUrl: string;
}

export function buildUpgradePromptEmail(data: UpgradePromptData): string {
  const plans = [
    {
      name: 'COMPETITOR',
      price: '$25',
      period: '/MO',
      color: C.cyan,
      features: ['20 ANALYSES / MO', 'FULL META INTEL', 'CHARACTER THEORY', 'TIER LIST HISTORY'],
    },
    {
      name: 'PRO',
      price: '$75',
      period: '/MO',
      color: C.accent,
      recommended: true,
      features: ['∞ ANALYSES', 'FULL ROSTER', 'AI COACH · PERSONAL', 'PRIORITY QUEUE'],
    },
  ];

  const planCards = plans.map(p => `
    <td width="50%" style="padding:0 6px;" valign="top">
      <table width="100%" cellpadding="0" cellspacing="0"
             style="border:${p.recommended ? `2px solid ${p.color}` : '1px solid #1a1a1a'};background:${p.recommended ? '#0d0005' : '#0a0a0a'};">
        ${p.recommended ? `<tr><td style="background:${p.color};padding:4px;text-align:center;">
          <span style="font-family:${C.mono};font-size:8px;font-weight:bold;color:#fff;letter-spacing:0.2em;">RECOMMENDED</span>
        </td></tr>` : ''}
        <tr>
          <td style="padding:16px;">
            <div style="font-family:${C.mono};font-size:9px;color:${p.color};letter-spacing:0.2em;text-transform:uppercase;margin-bottom:8px;">
              TIER · ${p.name}
            </div>
            <div style="font-family:${C.mono};font-size:28px;font-weight:bold;font-style:italic;color:${p.color};line-height:1;">
              ${p.price}<span style="font-size:12px;color:${C.muted};">${p.period}</span>
            </div>
            <table width="100%" cellpadding="0" cellspacing="0" style="margin-top:12px;">
              ${p.features.map(f => `
                <tr>
                  <td style="font-family:${C.mono};font-size:10px;color:${C.sub};padding:3px 0;border-bottom:1px solid #111;">
                    ◆ ${f}
                  </td>
                </tr>`).join('')}
            </table>
            <div style="margin-top:14px;">
              <a href="${data.upgradeUrl}" style="display:block;text-align:center;background:${p.recommended ? p.color : 'transparent'};
                 border:1px solid ${p.color};color:${p.recommended ? '#fff' : p.color};
                 font-family:${C.mono};font-size:10px;font-weight:bold;letter-spacing:0.15em;
                 text-transform:uppercase;padding:10px;text-decoration:none;">
                SELECT ${p.name}
              </a>
            </div>
          </td>
        </tr>
      </table>
    </td>`).join('');

  const body = `
    <!-- HERO -->
    <tr>
      <td style="padding:40px 28px 32px;background:#050505;border-bottom:1px solid #1a1a1a;">
        <div style="font-family:${C.mono};font-size:10px;color:${C.accent};letter-spacing:0.3em;text-transform:uppercase;margin-bottom:16px;">
          ◆ UPGRADE PROMPT &nbsp;·&nbsp; LIMIT REACHED · ${data.analysesUsed}/${data.analysisLimit} ANALYSES USED
        </div>
        <div class="hero-text" style="font-family:${C.mono};font-size:36px;font-weight:bold;line-height:1;color:${C.text};text-transform:uppercase;margin-bottom:20px;">
          YOU'RE OUT OF<br/><span style="color:${C.accent};">FREE PUNISHES.</span>
        </div>
        <p style="font-family:${C.mono};font-size:13px;color:${C.sub};line-height:1.6;max-width:460px;margin:0;">
          You burned through the free tier in <strong style="color:${C.text};">${data.daysActive} days</strong>.
          That tells us you're serious. Go PRO and unlock unlimited analyses, the full character roster, and the Combo Lab.
        </p>
      </td>
    </tr>

    <tr><td height="24">&nbsp;</td></tr>

    <!-- PLAN CARDS -->
    <tr>
      <td style="padding:0 28px 24px;">
        <table width="100%" cellpadding="0" cellspacing="0">
          <tr>${planCards}</tr>
        </table>
      </td>
    </tr>

    ${panel('WHAT OPERATORS SAY', `
      <table width="100%" cellpadding="0" cellspacing="0">
        <tr>
          <td style="padding:10px 0;border-left:3px solid ${C.accent};padding-left:16px;">
            <div style="font-family:${C.mono};font-size:12px;color:${C.sub};line-height:1.5;font-style:italic;">
              "Found my matchup leak in 8 minutes. Climbed 4 ranks in a week."
            </div>
            <div style="font-family:${C.mono};font-size:9px;color:${C.muted};margin-top:6px;letter-spacing:0.1em;text-transform:uppercase;">
              WUKONG_22 · CAMMY · MASTER RANK
            </div>
          </td>
        </tr>
      </table>
    `)}

    <tr><td height="8">&nbsp;</td></tr>
  `;

  return base(
    'billing@metapunish.com',
    'UPGRADE PROMPT · FREE TIER LIMIT',
    `${data.analysesUsed}/${data.analysisLimit} analyses used in ${data.daysActive} days. Go PRO.`,
    body,
  );
}

// ════════════════════════════════════════════════════════════════════════════
// 04 — WEEKLY META BRIEF
// ════════════════════════════════════════════════════════════════════════════
export interface TierMovement { character: string; change: number; winRate: number; }
export interface TrendingTech { character: string; tech: string; adoption: string; adoptionDelta: string; }

export interface WeeklyBriefData {
  week: number | string;
  year?: number;
  gameId: string;
  vodCount: number;
  theoryCount: number;
  metaShift: string;        // e.g. "+0.4"
  dateRange: string;        // e.g. "May 13 – May 19"
  briefUrl: string;
  tierMovements: TierMovement[];
  trendingTech: TrendingTech[];
}

export function buildWeeklyBriefEmail(data: WeeklyBriefData): string {
  const year = data.year ?? new Date().getFullYear();

  const tierRows = data.tierMovements.map(t => {
    const up = t.change >= 0;
    return `
      <tr style="border-bottom:1px solid #111;">
        <td style="font-family:${C.mono};font-size:11px;color:${C.text};padding:8px 0;font-weight:bold;">${t.character.toUpperCase()}</td>
        <td style="font-family:${C.mono};font-size:11px;color:${up ? C.green : C.accent};padding:8px 12px;font-weight:bold;">
          ${up ? '▲' : '▼'} ${Math.abs(t.change).toFixed(1)}
        </td>
        <td align="right" style="font-family:${C.mono};font-size:11px;color:${C.muted};padding:8px 0;">${t.winRate.toFixed(1)}%</td>
      </tr>`;
  }).join('');

  const techRows = data.trendingTech.map(t => {
    const up = t.adoptionDelta.startsWith('+');
    return `
      <tr>
        <td style="padding:12px 0;border-bottom:1px solid #111;">
          <div style="font-family:${C.mono};font-size:11px;color:${C.accent};font-weight:bold;margin-bottom:4px;">
            ${t.character.toUpperCase()} · ${t.tech}
          </div>
          <div style="font-family:${C.mono};font-size:10px;color:${C.sub};line-height:1.5;margin-bottom:6px;">
            Trending this week across tournament sets.
          </div>
          <span style="font-family:${C.mono};font-size:9px;color:${C.muted};letter-spacing:0.1em;text-transform:uppercase;">
            ● ADOPTION ${t.adoption} &nbsp;·&nbsp;
            <span style="color:${up ? C.green : C.accent};">${t.adoptionDelta} THIS WEEK</span>
          </span>
        </td>
      </tr>`;
  }).join('');

  const body = `
    <!-- HERO -->
    <tr>
      <td style="padding:40px 28px 32px;background:#050505;border-bottom:1px solid #1a1a1a;">
        <div style="font-family:${C.mono};font-size:10px;color:${C.accent};letter-spacing:0.3em;text-transform:uppercase;margin-bottom:16px;">
          ► WEEK ${data.week} · ${year} &nbsp;·&nbsp; WEEKLY META BRIEF · ${data.gameId.toUpperCase()}
        </div>
        <div class="hero-text" style="font-family:${C.mono};font-size:36px;font-weight:bold;line-height:1;color:${C.text};text-transform:uppercase;margin-bottom:20px;">
          THE META<br/><span style="color:${C.accent};">SHIFTED</span><br/>THIS WEEK.
        </div>
        <p style="font-family:${C.mono};font-size:12px;color:${C.sub};line-height:1.6;margin:0 0 24px;">
          Synthesized from <strong style="color:${C.text};">${data.vodCount.toLocaleString()}</strong> tournament VODs + ranked sets, ${data.dateRange}.
        </p>
      </td>
    </tr>

    <!-- STATS STRIP -->
    <tr>
      <td style="padding:0 28px 20px;background:#050505;border-bottom:1px solid #1a1a1a;">
        <table width="100%" cellpadding="0" cellspacing="0">
          <tr>
            ${stat(data.vodCount.toLocaleString(), 'VODs Analyzed', C.cyan)}
            ${stat(`+${data.metaShift}`, 'Meta Shift', C.accent)}
            ${stat(String(data.theoryCount), 'New Theories', C.green)}
          </tr>
        </table>
      </td>
    </tr>

    <tr><td height="20">&nbsp;</td></tr>

    ${panel('TIER MOVEMENT', `
      <table width="100%" cellpadding="0" cellspacing="0">
        ${tierRows}
      </table>
    `)}

    ${data.trendingTech.length > 0 ? panel('TRENDING TECH', `
      <table width="100%" cellpadding="0" cellspacing="0">
        ${techRows}
      </table>
    `, C.cyan) : ''}

    <!-- CTA -->
    <tr>
      <td style="padding:8px 28px 32px;text-align:center;">
        ${btn('READ THE FULL BRIEF', data.briefUrl)}
      </td>
    </tr>
  `;

  return base(
    'meta@metapunish.com',
    `WEEK ${data.week} · META BRIEF · ${data.gameId.toUpperCase()}`,
    `The ${data.gameId.toUpperCase()} meta shifted this week. ${data.vodCount.toLocaleString()} VODs analyzed.`,
    body,
  );
}

// ════════════════════════════════════════════════════════════════════════════
// 05 — PAYMENT FAILED (DUNNING)
// ════════════════════════════════════════════════════════════════════════════
export interface PaymentFailedData {
  name: string;
  planName: string;
  amount: string;          // e.g. "$49.00 USD"
  cardLast4: string;
  failReason: string;      // e.g. "insufficient_funds"
  failedAt: string;        // ISO string
  nextRetry: string;       // ISO string
  accessExpires: string;   // ISO string
  updateUrl: string;
  cancelUrl: string;
}

export function buildPaymentFailedEmail(data: PaymentFailedData): string {
  const fmt = (iso: string) => {
    try { return new Date(iso).toLocaleString('en-US', { dateStyle: 'medium', timeStyle: 'short', timeZone: 'UTC' }) + ' UTC'; }
    catch { return iso; }
  };

  const rows: [string, string][] = [
    ['PLAN',       `${data.planName.toUpperCase()} · ${data.amount}`],
    ['CARD',       `•••• •••• •••• ${data.cardLast4}`],
    ['REASON',     data.failReason],
    ['FAILED AT',  fmt(data.failedAt)],
    ['NEXT TRY',   fmt(data.nextRetry)],
    ['ACCESS LOST', fmt(data.accessExpires)],
  ];

  const lostItems = ['∞ ANALYSES → 3/MO', 'FULL ROSTER → MAIN ONLY', 'PRIORITY QUEUE → STANDARD'];

  const body = `
    <!-- HERO -->
    <tr>
      <td style="padding:40px 28px 32px;background:#0d0000;border-bottom:1px solid #3a0000;">
        <div style="font-family:${C.mono};font-size:10px;color:${C.accent};letter-spacing:0.3em;text-transform:uppercase;margin-bottom:16px;">
          ⚠ ACTION REQUIRED &nbsp;·&nbsp; PAYMENT DECLINED · TIER AT RISK
        </div>
        <div class="hero-text" style="font-family:${C.mono};font-size:36px;font-weight:bold;line-height:1;color:${C.text};text-transform:uppercase;margin-bottom:20px;">
          YOUR PRO ACCESS<br/><span style="color:${C.accent};">EXPIRES IN 48H.</span>
        </div>
        <p style="font-family:${C.mono};font-size:13px;color:${C.sub};line-height:1.6;max-width:460px;margin:0 0 28px;">
          We couldn't charge your card on file. Update payment in the next 48 hours to keep unlimited analyses, the full roster, and Combo Lab unlocked.
        </p>
        ${btn('UPDATE PAYMENT', data.updateUrl)}
      </td>
    </tr>

    <tr><td height="20">&nbsp;</td></tr>

    ${panel('TRANSACTION · FAILED', `
      <table width="100%" cellpadding="0" cellspacing="0">
        ${rows.map(([k, v]) => `
          <tr style="border-bottom:1px solid #111;">
            <td style="font-family:${C.mono};font-size:9px;color:${C.muted};letter-spacing:0.15em;text-transform:uppercase;padding:8px 0;width:120px;">${k}</td>
            <td style="font-family:${C.mono};font-size:11px;color:${C.text};padding:8px 0;">${v}</td>
          </tr>`).join('')}
      </table>
    `, C.accent)}

    ${panel('WHAT YOU LOSE IF YOU MISS THIS', `
      <table width="100%" cellpadding="0" cellspacing="0">
        ${lostItems.map(item => `
          <tr>
            <td style="font-family:${C.mono};font-size:11px;color:${C.sub};padding:6px 0;border-bottom:1px solid #111;">
              <span style="color:${C.accent};">✕</span> &nbsp;${item}
            </td>
          </tr>`).join('')}
      </table>
    `, C.accent)}

    <!-- CTAs -->
    <tr>
      <td style="padding:8px 28px 12px;text-align:center;">
        ${btn('UPDATE PAYMENT NOW', data.updateUrl)}
      </td>
    </tr>
    <tr>
      <td style="padding:0 28px 32px;text-align:center;">
        <a href="${data.cancelUrl}" style="font-family:${C.mono};font-size:10px;color:${C.muted};text-decoration:none;letter-spacing:0.1em;">
          Cancel subscription instead →
        </a>
      </td>
    </tr>
  `;

  return base(
    'billing@metapunish.com',
    '⚠ ACTION REQUIRED · PAYMENT FAILED',
    `Your ${data.planName} access expires in 48h. Update payment now.`,
    body,
  );
}

// ════════════════════════════════════════════════════════════════════════════
// ADMIN INVITE (existing — redesigned to match template standard)
// ════════════════════════════════════════════════════════════════════════════
export function buildAdminInviteEmail(
  adminName: string,
  inviteUrl: string,
  promoCode?: string,
): string {
  const body = `
    <tr>
      <td style="padding:40px 28px 32px;background:#050505;border-bottom:1px solid #1a1a1a;">
        <div style="font-family:${C.mono};font-size:10px;color:${C.accent};letter-spacing:0.3em;text-transform:uppercase;margin-bottom:16px;">
          ● PRIORITY OPERATOR ACCESS GRANTED
        </div>
        <div class="hero-text" style="font-family:${C.mono};font-size:36px;font-weight:bold;line-height:1;color:${C.text};text-transform:uppercase;margin-bottom:20px;">
          YOU'VE BEEN<br/><span style="color:${C.accent};">INVITED.</span>
        </div>
        <p style="font-family:${C.mono};font-size:13px;color:${C.sub};line-height:1.6;max-width:460px;margin:0 0 28px;">
          <strong style="color:${C.text};">${adminName}</strong> has granted you Operator access to the MetaPunish Intelligence Suite.
          Use the secure link below to initialize your uplink.
        </p>
        ${btn('INITIALIZE UPLINK', inviteUrl)}
        ${promoCode ? `
          <div style="margin-top:16px;font-family:${C.mono};font-size:10px;color:${C.muted};">
            Beta Access Code: <strong style="color:${C.text};">${promoCode}</strong>
          </div>` : ''}
        <div style="margin-top:12px;font-family:${C.mono};font-size:9px;color:#444;">
          This link expires in 48 hours.
        </div>
      </td>
    </tr>
    <tr><td height="24">&nbsp;</td></tr>
  `;

  return base(
    'intel@metapunish.com',
    'PRIORITY ACCESS · OPERATOR INVITE',
    `${adminName} has invited you to MetaPunish. Initialize your uplink.`,
    body,
  );
}

// ════════════════════════════════════════════════════════════════════════════
// GENERIC NOTIFICATION (existing — redesigned)
// ════════════════════════════════════════════════════════════════════════════
export function buildNotificationEmail(
  title: string,
  description: string,
  link?: string,
): string {
  const url = link ? (link.startsWith('http') ? link : `${APP()}${link}`) : `${APP()}/dashboard`;
  const body = `
    <tr>
      <td style="padding:40px 28px 32px;background:#050505;border-bottom:1px solid #1a1a1a;">
        <div style="font-family:${C.mono};font-size:10px;color:${C.cyan};letter-spacing:0.3em;text-transform:uppercase;margin-bottom:16px;">
          ● INTEL NOTIFICATION
        </div>
        <div class="hero-text" style="font-family:${C.mono};font-size:30px;font-weight:bold;line-height:1.1;color:${C.text};text-transform:uppercase;margin-bottom:20px;">
          ${title.toUpperCase()}
        </div>
        <p style="font-family:${C.mono};font-size:13px;color:${C.sub};line-height:1.6;max-width:460px;margin:0 0 28px;">
          ${description}
        </p>
        ${btn('VIEW INTEL', url, C.cyan)}
      </td>
    </tr>
    <tr><td height="24">&nbsp;</td></tr>
  `;
  return base('intel@metapunish.com', 'INTEL UPDATE', description.slice(0, 80), body);
}

// ════════════════════════════════════════════════════════════════════════════
// RIVAL WATCH ALERT (existing — redesigned)
// ════════════════════════════════════════════════════════════════════════════
export function buildRivalAlertEmail(
  playerName: string,
  rivalName: string,
  gameName: string,
  link: string,
): string {
  const body = `
    <tr>
      <td style="padding:40px 28px 32px;background:#0d0000;border-bottom:1px solid #3a0000;">
        <div style="font-family:${C.mono};font-size:10px;color:${C.accent};letter-spacing:0.3em;text-transform:uppercase;margin-bottom:16px;">
          ⚠ RIVAL WATCH ALERT · THREAT DETECTED
        </div>
        <div class="hero-text" style="font-family:${C.mono};font-size:36px;font-weight:bold;line-height:1;color:${C.text};text-transform:uppercase;margin-bottom:20px;">
          RIVAL<br/><span style="color:${C.accent};">${rivalName.toUpperCase()}</span><br/>SPOTTED.
        </div>
        <p style="font-family:${C.mono};font-size:13px;color:${C.sub};line-height:1.6;max-width:460px;margin:0 0 28px;">
          Operator <strong style="color:${C.text};">${playerName}</strong>, your rival has been active in
          <strong style="color:${C.text};">${gameName}</strong>.
          New match data has been indexed. Review their tech now.
        </p>
        ${btn('ANALYZE RIVAL TECH', link)}
      </td>
    </tr>
    <tr><td height="24">&nbsp;</td></tr>
  `;
  return base('intel@metapunish.com', '⚠ RIVAL WATCH · THREAT DETECTED', `${rivalName} spotted in ${gameName}. New data indexed.`, body);
}

// ════════════════════════════════════════════════════════════════════════════
// REFERRAL INVITE (existing — redesigned)
// ════════════════════════════════════════════════════════════════════════════
export function buildReferralInviteEmail(senderName: string, inviteUrl: string): string {
  const body = `
    <tr>
      <td style="padding:40px 28px 32px;background:#050505;border-bottom:1px solid #1a1a1a;">
        <div style="font-family:${C.mono};font-size:10px;color:${C.green};letter-spacing:0.3em;text-transform:uppercase;margin-bottom:16px;">
          ● OPERATOR REFERRAL · CREW INVITATION
        </div>
        <div class="hero-text" style="font-family:${C.mono};font-size:36px;font-weight:bold;line-height:1;color:${C.text};text-transform:uppercase;margin-bottom:20px;">
          JOIN THE<br/><span style="color:${C.green};">INTELLIGENCE</span><br/>NETWORK.
        </div>
        <p style="font-family:${C.mono};font-size:13px;color:${C.sub};line-height:1.6;max-width:460px;margin:0 0 28px;">
          <strong style="color:${C.text};">${senderName}</strong> is using MetaPunish to dominate the competitive scene and wants you in their crew.
          Get real-time frame data, pro scout reports, and AI theory for your character — free to start.
        </p>
        ${btn('ACCEPT INVITATION', inviteUrl, C.green)}
      </td>
    </tr>
    <tr><td height="24">&nbsp;</td></tr>
  `;
  return base('intel@metapunish.com', 'CREW INVITATION · JOIN THE NETWORK', `${senderName} invited you to MetaPunish.`, body);
}

// ════════════════════════════════════════════════════════════════════════════
// DRIP — DAY 1: First Analysis Waiting
// ════════════════════════════════════════════════════════════════════════════
export function buildDripDay1Email(name: string): string {
  const dashUrl = `${APP()}/dashboard/matches`;
  const body = `
    <tr>
      <td style="padding:40px 28px 32px;background:#050505;border-bottom:1px solid #1a1a1a;">
        <div style="font-family:${C.mono};font-size:10px;color:${C.cyan};letter-spacing:0.3em;text-transform:uppercase;margin-bottom:16px;">
          ● DAY 1 &nbsp;·&nbsp; FIRST MISSION BRIEFING
        </div>
        <div class="hero-text" style="font-family:${C.mono};font-size:36px;font-weight:bold;line-height:1;color:${C.text};text-transform:uppercase;margin-bottom:20px;">
          YOUR FIRST<br/><span style="color:${C.cyan};">ANALYSIS</span><br/>IS WAITING.
        </div>
        <p style="font-family:${C.mono};font-size:13px;color:${C.sub};line-height:1.6;max-width:460px;margin:0 0 28px;">
          Hey ${name} — most players sign up and never run their first analysis. Don't be that player.<br/><br/>
          Paste any YouTube match URL and get frame-by-frame AI coaching in under 2 minutes. It's free to start.
        </p>
        ${btn('ANALYZE A MATCH NOW', dashUrl, C.cyan)}
      </td>
    </tr>
    <tr><td height="24">&nbsp;</td></tr>
    ${panel('WHAT THE AI DETECTS', `
      <table width="100%" cellpadding="0" cellspacing="0">
        ${[
          ['Punish Windows', 'Every unsafe move your opponent throws — and whether you punished it.'],
          ['Whiff Punishes', 'Neutral reads and footsie opportunities you might have missed.'],
          ['Damage Breakdown', 'Combo routes taken vs. optimal — see what damage you left on the table.'],
        ].map(([title, desc]) => `
          <tr>
            <td style="padding:8px 0;border-bottom:1px solid #111;">
              <div style="font-family:${C.mono};font-size:11px;font-weight:bold;color:${C.text};">${title}</div>
              <div style="font-family:${C.mono};font-size:11px;color:${C.muted};margin-top:2px;">${desc}</div>
            </td>
          </tr>`).join('')}
      </table>
    `, C.cyan)}
    <tr><td height="8">&nbsp;</td></tr>
  `;
  return base('MetaPunish Coach', 'DAY 1 · YOUR FIRST ANALYSIS IS WAITING', `${name}, your first AI match breakdown is one paste away.`, body);
}

// ════════════════════════════════════════════════════════════════════════════
// DRIP — DAY 3: Meta Brief Teaser
// ════════════════════════════════════════════════════════════════════════════
export function buildDripDay3Email(name: string): string {
  const metaUrl = `${APP()}/dashboard/meta`;
  const body = `
    <tr>
      <td style="padding:40px 28px 32px;background:#050505;border-bottom:1px solid #1a1a1a;">
        <div style="font-family:${C.mono};font-size:10px;color:${C.yellow};letter-spacing:0.3em;text-transform:uppercase;margin-bottom:16px;">
          ● DAY 3 &nbsp;·&nbsp; META INTELLIGENCE UPDATE
        </div>
        <div class="hero-text" style="font-family:${C.mono};font-size:36px;font-weight:bold;line-height:1;color:${C.text};text-transform:uppercase;margin-bottom:20px;">
          THE META<br/><span style="color:${C.yellow};">SHIFTED</span><br/>THIS WEEK.
        </div>
        <p style="font-family:${C.mono};font-size:13px;color:${C.sub};line-height:1.6;max-width:460px;margin:0 0 28px;">
          ${name} — our AI ingested tournament footage from the last 7 days and the tier list moved.<br/><br/>
          Top players are adapting their gameplan. Here's what we're tracking in the meta right now.
        </p>
        ${btn('VIEW META INTELLIGENCE', metaUrl, C.yellow)}
      </td>
    </tr>
    <tr><td height="24">&nbsp;</td></tr>
    ${panel('WHAT METAPUNISH TRACKS', `
      <table width="100%" cellpadding="0" cellspacing="0">
        <tr><td>
          <table width="100%" cellpadding="0" cellspacing="0">
            ${stat('S→A', 'Tier Shifts', C.yellow)}${stat('12+', 'VODs Ingested', C.accent)}${stat('Live', 'Meta Feed', C.green)}
          </table>
        </td></tr>
        <tr><td height="16">&nbsp;</td></tr>
        <tr><td style="font-family:${C.mono};font-size:11px;color:${C.muted};line-height:1.7;">
          Character win rates from tournament data · Post-patch adjustments · Dominant strategies
          · Matchup shifts · Frame data corrections after balance patches.
        </td></tr>
      </table>
    `, C.yellow)}
    <tr><td height="8">&nbsp;</td></tr>
  `;
  return base('MetaPunish Intel', 'DAY 3 · META INTELLIGENCE BRIEF', `${name}, the meta shifted. See what changed.`, body);
}

// ════════════════════════════════════════════════════════════════════════════
// DRIP — DAY 7: Training Plan + Upgrade Push
// ════════════════════════════════════════════════════════════════════════════
export function buildDripDay7Email(name: string): string {
  const upgradeUrl = `${APP()}/#pricing`;
  const dashUrl   = `${APP()}/dashboard`;
  const body = `
    <tr>
      <td style="padding:40px 28px 32px;background:#050505;border-bottom:1px solid #1a1a1a;">
        <div style="font-family:${C.mono};font-size:10px;color:${C.accent};letter-spacing:0.3em;text-transform:uppercase;margin-bottom:16px;">
          ● DAY 7 &nbsp;·&nbsp; WEEKLY TRAINING PLAN UNLOCKED
        </div>
        <div class="hero-text" style="font-family:${C.mono};font-size:36px;font-weight:bold;line-height:1;color:${C.text};text-transform:uppercase;margin-bottom:20px;">
          ONE WEEK IN.<br/><span style="color:${C.accent};">ARE YOU</span><br/>IMPROVING?
        </div>
        <p style="font-family:${C.mono};font-size:13px;color:${C.sub};line-height:1.6;max-width:460px;margin:0 0 28px;">
          ${name} — the players improving fastest on MetaPunish are running at least 3 analyses per week and checking daily missions.<br/><br/>
          Upgrade to <strong style="color:${C.text};">Competitor ($25/mo)</strong> and unlock your personalized training plan — AI missions built from your match data.
        </p>
        ${btn('UNLOCK TRAINING PLAN', upgradeUrl)}
      </td>
    </tr>
    <tr><td height="24">&nbsp;</td></tr>
    ${panel('COMPETITOR PLAN — WHAT YOU UNLOCK', `
      <table width="100%" cellpadding="0" cellspacing="0">
        ${[
          'Unlimited VOD analysis',
          'AI Coach + daily missions',
          'Full character theory library (all games)',
          'Post-patch meta brief emails every week',
          'Community dojo lobby access',
          'Rival watch alerts',
        ].map((f, i) => `
          <tr>
            <td width="20" valign="top" style="font-family:${C.mono};font-size:9px;color:${C.accent};padding:5px 0;">0${i+1}</td>
            <td style="font-family:${C.mono};font-size:12px;color:${C.sub};padding:5px 0;border-bottom:1px solid #111;">${f}</td>
          </tr>`).join('')}
      </table>
    `)}
    <tr><td height="16">&nbsp;</td></tr>
    <tr>
      <td style="padding:0 28px 24px;text-align:center;">
        <a href="${dashUrl}" style="font-family:${C.mono};font-size:10px;color:${C.muted};text-decoration:none;letter-spacing:0.15em;">
          Stay on free tier →
        </a>
      </td>
    </tr>
  `;
  return base('MetaPunish Coach', 'DAY 7 · YOUR TRAINING PLAN IS READY', `${name}, unlock your personalized improvement plan.`, body);
}
