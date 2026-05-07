"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.RosterSyncService = void 0;
const Character_1 = require("../models/Character");
const CharacterEncyclopedia_1 = require("../models/CharacterEncyclopedia");
const logger_1 = require("../helpers/logger");
class RosterSyncService {
    scraperService;
    constructor(scraperService) {
        this.scraperService = scraperService;
    }
    /**
     * Sync the roster for a game:
     * 1. Fetches latest characters from ScraperService
     * 2. Updates Character collection (adds missing, updates status)
     * 3. Optionally syncs frame data for all released characters
     */
    async syncRoster(gameId, fullSync = true) {
        const result = { added: 0, updated: 0, frameDataSynced: 0, errors: [] };
        try {
            logger_1.Logger.info(`[RosterSync] Starting ${fullSync ? 'FULL' : 'LIGHT'} sync for ${gameId}...`);
            // 1. Fetch roster from wiki
            const roster = await this.scraperService.scrapeRoster(gameId);
            logger_1.Logger.info(`[RosterSync] Wiki found ${roster.length} characters for ${gameId}`);
            for (const wikiChar of roster) {
                try {
                    const slug = wikiChar.name.toLowerCase().replace(/\s+/g, '_').replace(/\./g, '');
                    const existing = await Character_1.Character.findOne({ game_id: gameId, name: wikiChar.name });
                    if (!existing) {
                        // Add new character
                        await Character_1.Character.create({
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
                        await CharacterEncyclopedia_1.CharacterEncyclopedia.create({
                            game_id: gameId,
                            character_id: slug,
                            character_name: wikiChar.name,
                            patch_version: 'latest',
                            is_current_patch: true,
                            moveset: { normals: [], specials: [], ex_moves: [], supers: [] },
                        });
                        result.added++;
                        logger_1.Logger.info(`[RosterSync] Added new character: ${wikiChar.name}`);
                    }
                    else if (existing.status !== wikiChar.status) {
                        // Update status (e.g. coming_soon -> released)
                        await Character_1.Character.updateOne({ _id: existing._id }, { status: wikiChar.status });
                        result.updated++;
                        logger_1.Logger.info(`[RosterSync] Updated status for ${wikiChar.name}: ${wikiChar.status}`);
                    }
                }
                catch (err) {
                    result.errors.push(`Failed to sync character ${wikiChar.name}: ${err instanceof Error ? err.message : err}`);
                }
            }
            // 2. Sync Frame Data only if requested
            if (fullSync) {
                logger_1.Logger.info(`[RosterSync] Syncing frame data for released characters...`);
                const releasedCharacters = await Character_1.Character.find({ game_id: gameId, status: 'released', is_current: true });
                for (const char of releasedCharacters) {
                    try {
                        await this.syncCharacterFrameData(char.game_id, char.name);
                        result.frameDataSynced++;
                    }
                    catch (err) {
                        result.errors.push(`Failed to sync frame data for ${char.name}: ${err instanceof Error ? err.message : err}`);
                    }
                }
            }
        }
        catch (error) {
            logger_1.Logger.error(`[RosterSync] Fatal sync error:`, error);
            result.errors.push(error instanceof Error ? error.message : String(error));
        }
        return result;
    }
    /**
     * Scrape and update frame data for a single character
     */
    async syncCharacterFrameData(gameId, charName) {
        logger_1.Logger.info(`[RosterSync] Scraping frame data for ${charName}...`);
        const scrapedData = await this.scraperService.scrapeCharacter(charName, gameId);
        if (!scrapedData || scrapedData.length === 0) {
            logger_1.Logger.warn(`[RosterSync] No frame data found for ${charName}`);
            return;
        }
        const normals = [];
        const specials = [];
        const ex_moves = [];
        const supers = [];
        for (const section of scrapedData) {
            for (const moveData of section.moves) {
                const moveName = moveData['Move'] || moveData['Name'] || 'Unknown Move';
                const nameLines = moveName.split('\n');
                const inputNotation = nameLines[0]?.trim() || 'N/A';
                const fullMoveName = nameLines.length > 1 ? nameLines.slice(1).join(' ').trim() : moveName;
                const move = {
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
                }
                else if (moveData['Cost'] || moveName.match(/\b(od|ex)\b/i)) {
                    move.category = 'ex';
                    ex_moves.push(move);
                }
                else if (inputNotation.match(/^[1-9]?[LMH][PK]$/i) || inputNotation.match(/^(cr|st|j)\./i) || moveName.match(/\b(punch|kick)\b/i)) {
                    move.category = 'normal';
                    normals.push(move);
                }
                else {
                    specials.push(move);
                }
            }
        }
        const charId = charName.toLowerCase().replace(/\s+/g, '_').replace(/\./g, '');
        await CharacterEncyclopedia_1.CharacterEncyclopedia.updateOne({ game_id: gameId, character_id: charId }, {
            $set: {
                moveset: { normals, specials, ex_moves, supers },
                last_updated: new Date()
            }
        });
    }
}
exports.RosterSyncService = RosterSyncService;
//# sourceMappingURL=RosterSyncService.js.map