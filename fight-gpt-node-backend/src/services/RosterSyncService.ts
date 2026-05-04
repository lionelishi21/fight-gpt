import { Character } from '../models/Character';
import { CharacterEncyclopedia } from '../models/CharacterEncyclopedia';
import { ScraperService } from './ScraperService';
import { Logger } from '../helpers/logger';
import { Move } from '../types/characterEncyclopedia';

export class RosterSyncService {
    constructor(private readonly scraperService: ScraperService) {}

    /**
     * Sync the roster for a game:
     * 1. Fetches latest characters from ScraperService
     * 2. Updates Character collection (adds missing, updates status)
     * 3. Optionally syncs frame data for all released characters
     */
    async syncRoster(gameId: string, fullSync: boolean = true): Promise<{ added: number; updated: number; frameDataSynced: number; errors: string[] }> {
        const result = { added: 0, updated: 0, frameDataSynced: 0, errors: [] as string[] };
        
        try {
            Logger.info(`[RosterSync] Starting ${fullSync ? 'FULL' : 'LIGHT'} sync for ${gameId}...`);
            
            // 1. Fetch roster from wiki
            const roster = await this.scraperService.scrapeRoster(gameId);
            Logger.info(`[RosterSync] Wiki found ${roster.length} characters for ${gameId}`);

            for (const wikiChar of roster) {
                try {
                    const slug = wikiChar.name.toLowerCase().replace(/\s+/g, '_').replace(/\./g, '');
                    const existing = await Character.findOne({ game_id: gameId, name: wikiChar.name });

                    if (!existing) {
                        // Add new character
                        await Character.create({
                            game_id: gameId,
                            name: wikiChar.name,
                            version: 'latest',
                            is_current: true,
                            archetype: 'Unknown',
                            difficulty: 2,
                            status: wikiChar.status,
                            aliases: [slug],
                            stats: { walk_speed: 0, dash_frames: 0, jump_speed: 0, air_dash: false, backdash_frames: 0, throw_range: 0 },
                            moves: [],
                        });

                        await CharacterEncyclopedia.create({
                            game_id: gameId,
                            character_id: slug,
                            character_name: wikiChar.name,
                            patch_version: 'latest',
                            is_current_patch: true,
                            moveset: { normals: [], specials: [], ex_moves: [], supers: [] },
                        });

                        result.added++;
                        Logger.info(`[RosterSync] Added new character: ${wikiChar.name}`);
                    } else if (existing.status !== wikiChar.status) {
                        // Update status (e.g. coming_soon -> released)
                        await Character.updateOne({ _id: existing._id }, { status: wikiChar.status });
                        result.updated++;
                        Logger.info(`[RosterSync] Updated status for ${wikiChar.name}: ${wikiChar.status}`);
                    }
                } catch (err) {
                    result.errors.push(`Failed to sync character ${wikiChar.name}: ${err instanceof Error ? err.message : err}`);
                }
            }

            // 2. Sync Frame Data only if requested
            if (fullSync) {
                Logger.info(`[RosterSync] Syncing frame data for released characters...`);
                const releasedCharacters = await Character.find({ game_id: gameId, status: 'released', is_current: true });

                for (const char of releasedCharacters) {
                    try {
                        await this.syncCharacterFrameData(char.game_id, char.name);
                        result.frameDataSynced++;
                    } catch (err) {
                        result.errors.push(`Failed to sync frame data for ${char.name}: ${err instanceof Error ? err.message : err}`);
                    }
                }
            }

        } catch (error) {
            Logger.error(`[RosterSync] Fatal sync error:`, error);
            result.errors.push(error instanceof Error ? error.message : String(error));
        }

        return result;
    }

    /**
     * Scrape and update frame data for a single character
     */
    private async syncCharacterFrameData(gameId: string, charName: string): Promise<void> {
        Logger.info(`[RosterSync] Scraping frame data for ${charName}...`);
        const scrapedData = await this.scraperService.scrapeCharacter(charName, gameId);
        
        if (!scrapedData || scrapedData.length === 0) {
            Logger.warn(`[RosterSync] No frame data found for ${charName}`);
            return;
        }

        const normals: Move[] = [];
        const specials: Move[] = [];
        const ex_moves: Move[] = [];
        const supers: Move[] = [];

        for (const section of scrapedData) {
            for (const moveData of section.moves) {
                const moveName = moveData['Move'] || moveData['Name'] || 'Unknown Move';
                const nameLines = moveName.split('\n');
                const inputNotation = nameLines[0]?.trim() || 'N/A';
                const fullMoveName = nameLines.length > 1 ? nameLines.slice(1).join(' ').trim() : moveName;

                const move: Move = {
                    name: fullMoveName || inputNotation,
                    input: inputNotation,
                    how_to_perform: fullMoveName || inputNotation,
                    category: 'special',
                    properties: [],
                    frame_data: {
                        startup: parseInt(moveData['Startup']) || 0,
                        active: parseInt(moveData['Active']) || 0,
                        recovery: parseInt(moveData['Recovery']) || 0,
                        on_block: parseInt(moveData['On Block']) || 0,
                        on_hit: parseInt(moveData['On Hit']) || 0,
                        damage: parseInt(moveData['Damage']) || 0,
                    }
                };

                // SF6 Categorization Heuristics
                if (moveName.match(/\b(super|super art|critical art)\b/i) || moveData['Damage']?.toString().includes('SA')) {
                    move.category = 'super';
                    supers.push(move);
                } else if (moveData['Cost'] || moveName.match(/\b(od|ex)\b/i)) {
                    move.category = 'ex';
                    ex_moves.push(move);
                } else if (inputNotation.match(/^[1-9]?[LMH][PK]$/i) || inputNotation.match(/^(cr|st|j)\./i) || moveName.match(/\b(punch|kick)\b/i)) {
                    move.category = 'normal';
                    normals.push(move);
                } else {
                    specials.push(move);
                }
            }
        }

        const charId = charName.toLowerCase().replace(/\s+/g, '_').replace(/\./g, '');
        await CharacterEncyclopedia.updateOne(
            { game_id: gameId, character_id: charId },
            {
                $set: {
                    moveset: { normals, specials, ex_moves, supers },
                    last_updated: new Date()
                }
            }
        );
    }
}
