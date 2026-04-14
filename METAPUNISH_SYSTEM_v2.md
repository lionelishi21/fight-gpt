MetaPunish: The Bloomberg Terminal for Fighting Games

Version: 2.0 (Intelligence & Multi-Game Focus)

Status: Active Development

Core Vision: A proactive intelligence platform that automates the "grind" for competitive players by continuously ingesting pro footage and surfacing meta shifts, new tech, and AI coaching before the user ever touches a button.



II. Multi-Game "Combat Slot" System (Premium Logic)

To support multi-game grinders and pro players, we move away from a single "Main" to a Slot-based architecture.
1. Slot Logic

    Free Tier: 1 Active Slot (1 Game + 1 Main).

    Competitor/Pro Tier: 5–10 Active Slots (Multi-game + Pockets).

2. Data Model (Schema Update)
TypeScript

{
  username: string,
  tier: "FREE" | "COMPETITOR" | "PRO",
  activeSlotIndex: number,
  slots: [
    { 
      gameId: "sf6", 
      characterId: "akuma", 
      rank: "Master",
      notificationsEnabled: true 
    }
  ]
}

III. Automated Meta Discovery Engine

The system's core value is the Automated Daily Ingest.

    Ingestion Service: Periodically scrapes pro-level YouTube VODs (Tampa Never Sleeps, Top 8s, High-Level Ranked).

    Vector Fingerprinting: Every combo/interaction is converted into a vector string.

    Similarity Check: If a sequence has high damage/efficiency but low similarity to the CharacterEncyclopedia, it is flagged as NEW_TECH_DISCOVERED.

    Proactive Delivery: The user receives a notification with a direct YouTube link at the exact timestamp (?t=X) where the tech occurred.

IV. Updated User Flow & Navigation
1. Onboarding Refactor

    Step 1: Game Selection (SF6, T8, GGST).

    Step 2: Character Selection (Main).

    Step 3: Proficiency Level (Newbie, Intermediate, Pro/Former Pro).

2. Information Architecture (The Sidebar)

    OVERVIEW: (Formerly SESSIONS) The high-level "Bloomberg" ticker and skill matrix.

    META INTEL: Character Theory, Tier Lists, and "State of the Meta" briefings.

    FIGHT GPT: (Merged with /chat) The AI Sensei HUD + Discovery Feed.

    THE DOJO: Roster, Moves, and Combo Lab.

    MATCH REVIEW: User-uploaded replay analysis.

    TOURNAMENTS: Pro player scouting and leaderboard tracking.

V. Alert & Notification Manifest

These alerts are generated automatically by the MetaIngestion service.
Alert ID	Category	Trigger	Payload
TECH_DISCOVERY	High	New combo sequence detected with >85% novelty score.	Clip Link + Input String
META_SHIFT	High	Character win rate shifts >5% post-patch.	Data Visualization
RIVAL_WATCH	Med	New tech found for a character you have <40% WR against.	Counter-play drill
PRO_SCOUT	Med	A Top 50 player switches mains or discovers a new setup.	Player VOD + Analysis
VI. Design System & HUD Styling

MetaPunish follows a High-Contrast Tactical HUD aesthetic.

    Primary (P1/Attack): #f43f5e (Pink)

    Secondary (P2/Defense): #06b6d4 (Cyan)

    Accent (Alerts/Patch): #fbbf24 (Yellow)

    Typography: font-display (Syne/Black Italic) for headlines; font-mono for data/inputs.

    Global Classes:

        .hud-border: Notched corners with dual-color accents.

        .animate-scanline: CRT flicker effect for data cards.

        .skew-x-tag: -6deg skew for tags; +6deg for text correction.

VII. Product Roadmap
Phase 1: The Modern Titans (0-6 Months)

    Games: Street Fighter 6, Tekken 8, Guilty Gear Strive, MK1.

    Focus: Perfecting the automated ingestion pipeline and the "Bloomberg" Dashboard UI.

Phase 2: The Grinders (6-12 Months)

    Games: DBFZ, Uni2, Granblue Fantasy Versus Rising, Killer Instinct.

    Focus: Community-specific discovery alerts and "Pocket Character" slot management.

Phase 3: The Legacy Vault (12 Months+)

    Games: 3rd Strike, Melee, USFIV, Marvel vs Capcom 2.

    Focus: "Evergreen" meta theory for legacy pros and deep-dive frame data archives.

VIII. Implementation Directives (For Claude Code)

    Refactor Sidebar: Change "SESSIONS" to "OVERVIEW" and ensure branding is "METAPUNISH".

    Consolidate Chat: Move /chat logic into /dashboard/fight-gpt.

    Live Ticker: Implement a horizontal Framer Motion ticker on the Dashboard displaying live meta events.

    Premium Nudges: Add "Slot Lock" overlays to the Dojo for non-premium users attempting to track multiple games.

    Timestamp Logic: Ensure all "Tech Discovery" alerts include a timestamp field for 1-click video review.