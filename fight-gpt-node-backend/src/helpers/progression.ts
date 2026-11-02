/** A new level every 500 XP. */
export const XP_PER_LEVEL = 500;

/** Rank ladder: each rank starts at a level. Keep sorted by minLevel. */
export const RANKS = [
    { name: 'Rookie', minLevel: 1 },
    { name: 'Fighter', minLevel: 3 },
    { name: 'Challenger', minLevel: 6 },
    { name: 'Veteran', minLevel: 10 },
    { name: 'Master', minLevel: 15 },
] as const;

/** XP granted for each activity. Missions carry their own reward; this is the fallback. */
export const XP_REWARDS = {
    mission: 100,
    analysis: 50,
    referral: 100,
} as const;

export type XpSource = keyof typeof XP_REWARDS;

export const levelForXp = (xp: number) => Math.floor(Math.max(0, xp) / XP_PER_LEVEL) + 1;

/** Total XP at which the next level starts. */
export const nextLevelXp = (xp: number) => levelForXp(xp) * XP_PER_LEVEL;

export function rankForLevel(level: number): string {
    let rank: string = RANKS[0].name;
    for (const r of RANKS) if (level >= r.minLevel) rank = r.name;
    return rank;
}

/** The next rank up and the level it starts at, or null at the top. */
export function nextRank(level: number): { name: string; level: number } | null {
    const next = RANKS.find((r) => r.minLevel > level);
    return next ? { name: next.name, level: next.minLevel } : null;
}

/** Everything the app shows about progression, derived from total XP. */
export function progressionFor(xp: number) {
    const level = levelForXp(xp);
    return {
        xp,
        level,
        rank: rankForLevel(level),
        nextRank: nextRank(level),
        levelXp: xp % XP_PER_LEVEL,
        xpPerLevel: XP_PER_LEVEL,
        nextLevelXp: nextLevelXp(xp),
    };
}
