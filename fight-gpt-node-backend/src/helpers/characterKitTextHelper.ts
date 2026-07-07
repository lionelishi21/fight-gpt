import { Moveset, Move } from '../types/characterEncyclopedia';

/**
 * Builds a deterministic "kit fingerprint" text description from a character's
 * archetype + move properties/categories only — NOT match footage, NOT flavor text.
 * Used to embed BOTH real (encyclopedia-backed) characters and draft/unreleased kits
 * into the same structural vector space so they can be compared by similarity.
 */
export function formatCharacterKitForEmbedding(
  archetype: string | undefined,
  moveset: Partial<Moveset> | undefined,
): string {
  const parts: string[] = [];

  parts.push(`Archetype: ${archetype || 'unknown'}.`);

  if (!moveset) return parts.join(' ');

  const allMoves: Move[] = [
    ...(moveset.normals || []),
    ...(moveset.specials || []),
    ...(moveset.ex_moves || []),
    ...(moveset.supers || []),
    ...(moveset.throws || []),
  ];

  const specialCount = (moveset.specials?.length || 0) + (moveset.ex_moves?.length || 0);
  const superCount = moveset.supers?.length || 0;
  const throwCount = moveset.throws?.length || 0;

  parts.push(`Has ${specialCount} special moves, ${superCount} super(s), ${throwCount} dedicated throw/command-grab move(s).`);

  // Aggregate categorical move properties — this is the real structural signal.
  const propertyCounts: Record<string, number> = {};
  for (const move of allMoves) {
    for (const prop of move.properties || []) {
      const key = prop.toLowerCase();
      propertyCounts[key] = (propertyCounts[key] || 0) + 1;
    }
  }

  const propertyEntries = Object.entries(propertyCounts).sort((a, b) => b[1] - a[1]);
  if (propertyEntries.length > 0) {
    const summary = propertyEntries.map(([prop, count]) => `${prop} (${count})`).join(', ');
    parts.push(`Move properties present: ${summary}.`);
  }

  // Explicit presence flags for the properties that most define playstyle archetype.
  const hasProperty = (needle: string) =>
    allMoves.some(m => m.properties?.some(p => p.toLowerCase().includes(needle)));

  if (hasProperty('projectile')) parts.push('Has a projectile/zoning tool.');
  else parts.push('No projectile.');

  if (hasProperty('armor')) parts.push('Has armor on at least one move.');
  if (hasProperty('overhead')) parts.push('Has an overhead.');
  if (hasProperty('command grab') || hasProperty('command_grab')) parts.push('Has a command grab.');
  if (hasProperty('invuln')) parts.push('Has an invulnerable reversal option.');

  return parts.join(' ');
}
