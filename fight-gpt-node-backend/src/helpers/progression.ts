/** A new level every 500 XP. */
export const XP_PER_LEVEL = 500;

export const levelForXp = (xp: number) => Math.floor(Math.max(0, xp) / XP_PER_LEVEL) + 1;

/** Total XP at which the next level starts. */
export const nextLevelXp = (xp: number) => levelForXp(xp) * XP_PER_LEVEL;
