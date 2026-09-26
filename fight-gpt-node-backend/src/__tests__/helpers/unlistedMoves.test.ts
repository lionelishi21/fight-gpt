import { isUnlisted, resolveUnlistedEvents, scrubUnlisted, UNIDENTIFIED_MOVE } from '../../helpers/unlistedMoves';

const MOVES = ['Standing Heavy Kick', 'Drive Impact', 'Hadoken', 'Kick'];
const movesFor = () => MOVES;

describe('isUnlisted', () => {
  it('matches the placeholder however it is written, and nothing else', () => {
    expect(['unlisted_move', 'Unlisted Move', ' unlisted-moves ', 'UNLISTED_MOVE'].every(isUnlisted)).toBe(true);
    expect(isUnlisted('Hadoken')).toBe(false);
    expect(isUnlisted('')).toBe(false);
    expect(isUnlisted(undefined)).toBe(false);
  });
});

describe('resolveUnlistedEvents', () => {
  it('recovers a listed name the model mentioned in its own description', () => {
    const events = [{ move_used: 'unlisted_move', move_confidence: 'high', description: 'Ryu lands a standing heavy kick from mid range' }];
    expect(resolveUnlistedEvents(events, movesFor)).toBe(1);
    expect(events[0]).toMatchObject({ move_used: 'Standing Heavy Kick', move_listed: true, move_confidence: 'medium' });
  });

  it('prefers the longest listed name inside the text', () => {
    const events = [{ move_used: 'unlisted_move', description: 'a standing heavy kick' }];
    resolveUnlistedEvents(events, movesFor);
    expect(events[0].move_used).toBe('Standing Heavy Kick'); // not the shorter "Kick"
  });

  it('uses the model\'s plain-language guess when no listed move fits, and flags it', () => {
    const events = [{ move_used: 'unlisted_move', move_guess: 'jumping spinning kick with a wind aura', description: '' }];
    resolveUnlistedEvents(events, movesFor);
    expect(events[0]).toMatchObject({ move_used: 'Jumping spinning kick with a wind aura', move_listed: false });
  });

  it('falls back to a plain label, never the raw placeholder', () => {
    const events = [{ move_used: 'unlisted_move', description: 'something happens' }];
    resolveUnlistedEvents(events, movesFor);
    expect(events[0]).toMatchObject({ move_used: UNIDENTIFIED_MOVE, move_listed: false });
  });

  it('removes the placeholder from the event description too', () => {
    const events = [{ move_used: 'unlisted_move', description: 'The unlisted_move connects for damage' }];
    resolveUnlistedEvents(events, movesFor);
    expect(events[0].description).toBe('The an unidentified move connects for damage');
  });

  it('leaves ordinary events alone and counts only what it changed', () => {
    const events = [{ move_used: 'Hadoken' }, { move_used: '' }, { move_used: 'unlisted_move' }];
    expect(resolveUnlistedEvents(events, movesFor)).toBe(1);
    expect(events[0].move_used).toBe('Hadoken');
    expect(events[1].move_used).toBe('');
  });

  it('asks for the moves of the character who performed each event', () => {
    const seen: string[] = [];
    resolveUnlistedEvents([{ move_used: 'unlisted_move', actor: 'p2' }], e => { seen.push(e.actor); return []; });
    expect(seen).toEqual(['p2']);
  });
});

describe('scrubUnlisted', () => {
  it('cleans strings nested in coaching output without touching other values', () => {
    const coaching = {
      top_3_tips: ['Watch out for their unlisted_move', 'Fine tip'],
      coaching_by_event: { 'evt-001': { description: 'You ate an unlisted move.', coach_advice: 'Block low.' } },
      n: 3, ok: true, none: null,
    };
    const cleaned = scrubUnlisted(coaching);
    expect(JSON.stringify(cleaned)).not.toMatch(/unlisted/i);
    expect(cleaned.top_3_tips[1]).toBe('Fine tip');
    expect(cleaned).toMatchObject({ n: 3, ok: true, none: null });
  });
});
