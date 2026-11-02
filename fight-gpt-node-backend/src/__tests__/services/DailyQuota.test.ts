import { periodKey } from '../../services/DailyQuota';

describe('periodKey', () => {
    it('uses the UTC date for daily limits', () => {
        expect(periodKey('day', new Date('2026-11-02T23:30:00Z'))).toBe('2026-11-02');
    });

    it('uses the ISO week for weekly limits', () => {
        expect(periodKey('week', new Date('2026-11-02T12:00:00Z'))).toBe('2026-W45'); // Monday
        expect(periodKey('week', new Date('2026-11-08T12:00:00Z'))).toBe('2026-W45'); // Sunday, same week
        expect(periodKey('week', new Date('2026-11-09T00:00:00Z'))).toBe('2026-W46');
    });

    it('handles weeks that cross a year boundary', () => {
        expect(periodKey('week', new Date('2027-01-01T12:00:00Z'))).toBe('2026-W53'); // Friday of 2026's last week
        expect(periodKey('week', new Date('2025-12-29T12:00:00Z'))).toBe('2026-W01'); // Monday of 2026's first week
    });
});
