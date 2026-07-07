import { IVectorRepository } from '../repositories/VectorRepository';

export interface BuildFewShotExamplesOptions {
  vectorRepository: IVectorRepository;
  generateEmbedding: (text: string) => Promise<number[]>;
  gameId: string;
  characters?: string[];
  currentPatchVersion?: string | null;
  queryText: string;
  limit?: number;
  topN?: number;
  /** Optional player-tendency embedding, averaged into the query vector so retrieval favors this player's own patterns. */
  tendencyVector?: number[];
}

/**
 * Embeds `queryText`, retrieves similar scenarios (optionally filtered by character matchup),
 * and ranks them so current-patch / cross-patch-valid examples are preferred over stale
 * frame-data scenarios from old patches. Single canonical implementation — do not duplicate.
 */
export async function buildFewShotExamples(opts: BuildFewShotExamplesOptions): Promise<string | null> {
  const { vectorRepository, generateEmbedding, gameId, characters = [], currentPatchVersion, queryText, limit = 6, topN = 3, tendencyVector } = opts;

  if (!vectorRepository || !gameId) return null;

  const queryEmbedding = await generateEmbedding(queryText);
  if (!queryEmbedding || queryEmbedding.length === 0) return null;

  // Blend in the player's tendency vector (if available) so retrieval favors examples
  // matching how this specific player tends to play, not just the generic situation.
  const searchVector = tendencyVector && tendencyVector.length === queryEmbedding.length
    ? queryEmbedding.map((v, i) => (v + tendencyVector[i]) / 2)
    : queryEmbedding;

  const similar = await vectorRepository.findSimilarScenarios(searchVector, gameId, limit, characters);
  if (!similar || similar.length === 0) return null;

  // Prefer current-patch or cross-patch-valid scenarios as examples.
  // Old-patch-specific scenarios (frame data that changed) are still shown
  // but ranked lower so the AI understands what's foundational vs patch-specific.
  const ranked = similar.sort((a: any, b: any) => {
    const aScore = (a.patch_version === currentPatchVersion ? 2 : 0) + (a.cross_patch_valid ? 1 : 0);
    const bScore = (b.patch_version === currentPatchVersion ? 2 : 0) + (b.cross_patch_valid ? 1 : 0);
    return bScore - aScore;
  }).slice(0, topN);

  const examples = ranked
    .filter((s: any) => s.description)
    .map((s: any, i: number) => {
      const patchNote = s.cross_patch_valid
        ? '  [CROSS-PATCH VALID — mechanic applies regardless of patch]'
        : s.patch_version
          ? `  [From patch ${s.patch_version} — verify if move data still applies]`
          : '';
      return [
        `EXAMPLE ${i + 1}:`,
        s.characters_involved?.length ? `  Characters: ${s.characters_involved.join(' vs ')}` : '',
        s.tags?.length ? `  Event type: ${s.tags[0]}` : '',
        s.spacing ? `  Spacing: ${s.spacing}` : '',
        s.frame_advantage ? `  Frame state: ${s.frame_advantage}` : '',
        patchNote,
        `  Verified event: ${s.description}`,
        s.context ? `  Full context: ${s.context}` : '',
      ].filter(Boolean).join('\n');
    });

  if (examples.length === 0) return null;

  return `\n\n═══ VERIFIED REFERENCE EXAMPLES FROM SIMILAR MATCHES ═══
The following events were correctly classified by human coaches. Use them as ground truth for outcome and spacing classification in this match:

${examples.join('\n\n')}

═══ END EXAMPLES ═══\n`;
}
