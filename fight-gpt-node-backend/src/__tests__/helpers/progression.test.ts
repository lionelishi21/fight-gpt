import { levelForXp, rankForLevel, nextRank, progressionFor, XP_PER_LEVEL } from '../../helpers/progression';

describe('progression', () => {
    it('levels up every 500 XP', () => {
        expect(levelForXp(0)).toBe(1);
        expect(levelForXp(XP_PER_LEVEL - 1)).toBe(1);
        expect(levelForXp(XP_PER_LEVEL)).toBe(2);
        expect(levelForXp(-50)).toBe(1);
    });

    it('maps levels onto the rank ladder at its boundaries', () => {
        expect(rankForLevel(1)).toBe('Rookie');
        expect(rankForLevel(2)).toBe('Rookie');
        expect(rankForLevel(3)).toBe('Fighter');
        expect(rankForLevel(6)).toBe('Challenger');
        expect(rankForLevel(10)).toBe('Veteran');
        expect(rankForLevel(15)).toBe('Master');
        expect(rankForLevel(40)).toBe('Master');
    });

    it('names the next rank, and none at the top', () => {
        expect(nextRank(1)).toEqual({ name: 'Fighter', level: 3 });
        expect(nextRank(9)).toEqual({ name: 'Veteran', level: 10 });
        expect(nextRank(15)).toBeNull();
    });

    it('derives everything the app shows from total XP', () => {
        expect(progressionFor(1200)).toEqual({
            xp: 1200, level: 3, rank: 'Fighter', nextRank: { name: 'Challenger', level: 6 },
            levelXp: 200, xpPerLevel: 500, nextLevelXp: 1500,
        });
    });
});
