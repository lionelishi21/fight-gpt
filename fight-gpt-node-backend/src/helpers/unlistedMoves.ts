/**
 * The analysis prompt tells the model to answer "unlisted_move" when it can't match a move
 * to the character's move list. That placeholder is for the pipeline, not for people:
 * recover the real name where the model's own words point at one, otherwise show a plain
 * label, and keep the token out of any text a user reads.
 */

export const UNIDENTIFIED_MOVE = 'Unidentified move';

const UNLISTED_EXACT = /^unlisted[_\s-]*moves?$/i;
const UNLISTED_ANYWHERE = /\bunlisted[_\s-]*moves?\b/gi;

export function isUnlisted(move?: string | null): boolean {
  return !!move && UNLISTED_EXACT.test(move.trim());
}

/** Replace the placeholder inside any strings nested in `value` (coaching text, notes, ...). */
export function scrubUnlisted<T>(value: T): T {
  if (typeof value === 'string') return value.replace(UNLISTED_ANYWHERE, 'an unidentified move') as unknown as T;
  if (Array.isArray(value)) return value.map(v => scrubUnlisted(v)) as unknown as T;
  if (value && typeof value === 'object') {
    const out: Record<string, unknown> = {};
    for (const [k, v] of Object.entries(value as Record<string, unknown>)) out[k] = scrubUnlisted(v);
    return out as T;
  }
  return value;
}

function titleCase(text: string): string {
  return text.trim().replace(/\s+/g, ' ').replace(/^./, c => c.toUpperCase());
}

/**
 * Fixes every placeholder event in place and returns how many it touched.
 * `movesFor` gives the canonical move names of the character who performed the event.
 *  1. If the model's own description/guess contains a listed move name, use that name.
 *  2. Otherwise use the model's plain-language guess, marked as unlisted.
 *  3. Otherwise label it as an unidentified move.
 */
export function resolveUnlistedEvents(events: any[] | undefined, movesFor: (event: any) => string[]): number {
  let touched = 0;
  for (const event of events || []) {
    if (!isUnlisted(event?.move_used)) continue;
    touched++;

    const guess = typeof event.move_guess === 'string' ? event.move_guess.trim() : '';
    const evidence = `${guess} ${event.description || ''}`.toLowerCase();

    // Longest names first so "Standing Heavy Kick" wins over a shorter name inside it.
    const listed = movesFor(event)
      .filter(name => name.length >= 5)
      .sort((a, b) => b.length - a.length)
      .find(name => evidence.includes(name.toLowerCase()));

    if (listed) {
      event.move_used = listed;
      event.move_listed = true;
      if (event.move_confidence === 'high') event.move_confidence = 'medium';
    } else if (guess && !isUnlisted(guess)) {
      event.move_used = titleCase(guess);
      event.move_listed = false;
    } else {
      event.move_used = UNIDENTIFIED_MOVE;
      event.move_listed = false;
    }
    if (typeof event.description === 'string') event.description = scrubUnlisted(event.description);
  }
  return touched;
}
