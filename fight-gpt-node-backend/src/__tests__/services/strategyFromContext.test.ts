import { strategyFromContext } from '../../services/MetaService';

describe('strategyFromContext', () => {
    it('pulls the advice out of an analysis context blob', () => {
        const ctx = 'Game: sf6. Matchup: Ken vs Ryu. Situation: Whiffed DP. Advice: Block and punish with st.HP. Phase: neutral. Spacing: close.';
        expect(strategyFromContext(ctx)).toBe('Block and punish with st.HP');
    });

    it('handles advice as the last part', () => {
        expect(strategyFromContext('Game: sf6. Matchup: A vs B. Situation: X. Advice: Drive Rush after a blocked fireball.'))
            .toBe('Drive Rush after a blocked fireball');
    });

    it('drops blobs with no usable advice', () => {
        expect(strategyFromContext('Game: sf6. Matchup: A vs B. Situation: X. Advice: No advice.')).toBeNull();
        expect(strategyFromContext('Game: sf6. Matchup: A vs B.')).toBeNull();
        expect(strategyFromContext(undefined)).toBeNull();
    });

    it('keeps plain strategy text as it is', () => {
        expect(strategyFromContext('Perfect Parry optimization')).toBe('Perfect Parry optimization');
    });
});
