import { looseCharacterIdPattern } from '../repositories/CharacterEncyclopediaRepository';

/**
 * Who can read character theory.
 *
 * Pro (and legacy Competitor) and admins read every theory. Free accounts read the theory for the
 * character in their slot (their main), the "1 character" in the free plan. Generating theory and
 * matchup theory stay Pro-only.
 */

type AccountLike = {
    role?: string | null;
    tier?: string | null;
    slots?: Array<{ gameId?: string | null; characterId?: string | null }> | null;
};

/** Ids are stored inconsistently ("e._honda", "E Honda", "sf6_e_honda"), so compare letters and digits only. */
const key = (s?: string | null) => (s || '').toLowerCase().replace(/[^a-z0-9]/g, '');

export function isPremiumAccount(user: AccountLike): boolean {
    const tier = (user.tier || '').toUpperCase();
    return user.role === 'admin' || tier === 'PRO' || tier === 'COMPETITOR';
}

/** Onboarding stores the Character document's _id in the slot, not the name. */
export const isObjectIdLike = (s?: string | null) => !!s && /^[a-f0-9]{24}$/i.test(s);

/**
 * True when a free account's slot is this character in this game.
 * `namesById` maps Character _ids found in slots to their names.
 */
export function isOwnCharacter(
    user: AccountLike,
    gameId: string,
    characterId: string,
    namesById: Record<string, string> = {}
): boolean {
    const game = key(gameId);
    const char = key(characterId);
    if (!game || !char) return false;
    return (user.slots || []).some((slot) => {
        if (key(slot.gameId) !== game || !slot.characterId) return false;
        const slotChar = key(namesById[slot.characterId] ?? slot.characterId);
        return slotChar === char || slotChar === game + char;
    });
}

export function canReadCharacterTheory(
    user: AccountLike,
    gameId: string,
    characterId: string,
    namesById: Record<string, string> = {}
): boolean {
    return isPremiumAccount(user) || isOwnCharacter(user, gameId, characterId, namesById);
}

/**
 * Users who should get the "theory updated" push: they play this game, and they can open the
 * theory (paid, or it's their own character). Pushing it to free users only led to a locked screen.
 */
export function theoryPushAudience(gameId: string, characterId: string, characterDocIds: string[] = []): Record<string, unknown> {
    const game = looseCharacterIdPattern(gameId);
    const char = { $in: [looseCharacterIdPattern(characterId), ...characterDocIds] };
    return {
        'slots.gameId': game,
        $or: [
            { role: 'admin' },
            { tier: { $in: ['PRO', 'COMPETITOR', 'pro', 'competitor'] } },
            { slots: { $elemMatch: { gameId: game, characterId: char } } },
        ],
    };
}
