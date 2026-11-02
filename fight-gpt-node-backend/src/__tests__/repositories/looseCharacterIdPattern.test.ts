import { looseCharacterIdPattern } from '../../repositories/CharacterEncyclopediaRepository';

describe('looseCharacterIdPattern', () => {
    it.each([
        ['chunli', 'chun-li'],
        ['chun-li', 'chunli'],
        ['e._honda', 'e_honda'],
        ['ehonda', 'e._honda'],
        ['C Viper', 'c_viper'],
    ])('matches %s against stored %s', (requested, stored) => {
        expect(looseCharacterIdPattern(requested)!.test(stored)).toBe(true);
    });

    it('does not match a different character', () => {
        expect(looseCharacterIdPattern('ken')!.test('kenji')).toBe(false);
        expect(looseCharacterIdPattern('ryu')!.test('ryuji')).toBe(false);
    });

    it('returns null for an id with no letters or digits', () => {
        expect(looseCharacterIdPattern('--')).toBeNull();
    });
});
