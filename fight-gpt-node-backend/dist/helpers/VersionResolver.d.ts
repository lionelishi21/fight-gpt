import { TeamComposition } from '../types/index';
export declare class VersionResolver {
    private static readonly PROMPT_VERSIONS;
    /**
     * Resolves the prompt template for a given version.
     * If version is not found, returns the latest version.
     */
    static resolvePrompt(version?: string): string;
    /**
     * Resolves the correct prompt based on match format.
     * For team games, injects the user's selected team composition into the prompt header.
     */
    static resolvePromptForFormat(matchFormat?: '1v1' | 'team_3v3' | 'team_2v2' | 'team_tag', p1Team?: TeamComposition, p2Team?: TeamComposition): string;
    /**
     * Returns the current active version identifier.
     */
    static getCurrentVersion(): string;
}
//# sourceMappingURL=VersionResolver.d.ts.map