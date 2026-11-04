import { canReadCharacterTheory, isOwnCharacter, theoryPushAudience } from '../../helpers/theoryAccess';

const free = (gameId: string, characterId: string) => ({ tier: 'FREE', slots: [{ gameId, characterId }] });

describe('canReadCharacterTheory', () => {
    it('lets Pro, legacy Competitor and admins read any character', () => {
        expect(canReadCharacterTheory({ tier: 'PRO' }, 'sf6', 'jamie')).toBe(true);
        expect(canReadCharacterTheory({ tier: 'competitor' }, 'sf6', 'jamie')).toBe(true);
        expect(canReadCharacterTheory({ role: 'admin', tier: 'FREE' }, 'sf6', 'jamie')).toBe(true);
    });

    it("lets a free account read only its own slot's character", () => {
        expect(canReadCharacterTheory(free('sf6', 'Luke'), 'sf6', 'luke')).toBe(true);
        expect(canReadCharacterTheory(free('sf6', 'Luke'), 'sf6', 'jamie')).toBe(false);
        expect(canReadCharacterTheory(free('tekken8', 'jamie'), 'sf6', 'jamie')).toBe(false);
        expect(canReadCharacterTheory({ tier: 'FREE' }, 'sf6', 'jamie')).toBe(false);
    });

    it('ignores punctuation and a game prefix in stored ids', () => {
        expect(isOwnCharacter(free('sf6', 'E. Honda'), 'sf6', 'e._honda')).toBe(true);
        expect(isOwnCharacter(free('SF6', 'sf6_chun-li'), 'sf6', 'chun_li')).toBe(true);
        expect(isOwnCharacter(free('sf6', ''), 'sf6', 'ryu')).toBe(false);
    });

    it('resolves slots that hold a Character _id', () => {
        const id = '64b7f0c2a1b2c3d4e5f60718';
        expect(canReadCharacterTheory(free('sf6', id), 'sf6', 'luke', { [id]: 'Luke' })).toBe(true);
        expect(canReadCharacterTheory(free('sf6', id), 'sf6', 'jamie', { [id]: 'Luke' })).toBe(false);
    });
});

describe('theoryPushAudience', () => {
    it('targets players of the game who are paid or main that character', () => {
        const q: any = theoryPushAudience('sf6', 'jamie');
        expect(q['slots.gameId'].test('SF6')).toBe(true);
        expect(q.$or).toHaveLength(3);
        expect(q.$or[2].slots.$elemMatch.characterId.$in[0].test('Jamie')).toBe(true);
        expect((theoryPushAudience('sf6', 'jamie', ['abc']) as any).$or[2].slots.$elemMatch.characterId.$in).toContain('abc');
    });
});
