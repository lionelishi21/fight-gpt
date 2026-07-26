import { Logger } from '../helpers/logger';
import { IGameRepository } from '../repositories/GameRepository';
import { ICharacterRepository } from '../repositories/CharacterRepository';
import { CreateCharacterRequest } from '../types/character';
import { UuidHelper } from '../helpers/uuidHelper';
import axios from 'axios';

export class RosterSyncService {
    constructor(
        private readonly gameRepository: IGameRepository,
        private readonly characterRepository: ICharacterRepository
    ) {}

    /**
     * Sync the roster for a game by fetching characters from Start.gg API.
     */
    async syncRoster(gameId: string, fullSync: boolean = true): Promise<{ added: number; updated: number; frameDataSynced: number; errors: string[] }> {
        const result = { added: 0, updated: 0, frameDataSynced: 0, errors: [] as string[] };
        
        try {
            const apiKey = process.env.STARTGG_API_KEY;
            if (!apiKey) {
                const msg = 'STARTGG_API_KEY is not set in environment variables.';
                Logger.error(`[RosterSync] ${msg}`);
                result.errors.push(msg);
                return result;
            }

            const game = await this.gameRepository.findByGameId(gameId);
            if (!game) {
                result.errors.push(`Game ${gameId} not found in database.`);
                return result;
            }

            if (!game.startgg_id) {
                result.errors.push(`Game ${gameId} does not have a startgg_id configured.`);
                return result;
            }

            Logger.info(`[RosterSync] Fetching characters for ${gameId} (start.gg ID: ${game.startgg_id})...`);

            const query = `
                query VideogameCharacters($id: ID!) {
                    videogame(id: $id) {
                        characters {
                            id
                            name
                        }
                    }
                }
            `;

            const response = await axios.post(
                'https://api.start.gg/gql/alpha',
                {
                    query,
                    variables: { id: game.startgg_id.toString() }
                },
                {
                    headers: {
                        'Authorization': `Bearer ${apiKey}`,
                        'Content-Type': 'application/json'
                    }
                }
            );

            if (response.data.errors) {
                const msg = `Start.gg API error: ${JSON.stringify(response.data.errors)}`;
                Logger.error(`[RosterSync] ${msg}`);
                result.errors.push(msg);
                return result;
            }

            const startGgCharacters = response.data.data?.videogame?.characters || [];
            if (startGgCharacters.length === 0) {
                result.errors.push(`No characters found for start.gg ID ${game.startgg_id}.`);
                return result;
            }

            const existingChars = await this.characterRepository.findByGameId(gameId);
            const existingNames = new Set(existingChars.map(c => c.name.toLowerCase().trim()));

            // Find missing characters
            const version = game.latest_version || '1.0.0';

            for (const c of startGgCharacters) {
                const charName = c.name;
                const normalized = charName.toLowerCase().trim();

                if (!existingNames.has(normalized)) {
                    // It's a new character! Insert them.
                    const createReq: CreateCharacterRequest = {
                        game_id: gameId,
                        name: charName,
                        version,
                        is_current: true,
                        archetype: 'Unknown',
                        difficulty: 3,
                        description: `Character imported from Start.gg`,
                        stats: { health: 10000 },
                        moves: []
                    };
                    
                    await this.characterRepository.createCharacter(createReq);
                    result.added++;
                    Logger.info(`[RosterSync] Added new character: ${charName}`);
                }
            }

            Logger.info(`[RosterSync] Sync complete for ${gameId}. Added: ${result.added}`);
            
            // Update game's supported_characters_count
            const currentCharacters = await this.characterRepository.findCurrentCharactersByGame(gameId);
            await this.gameRepository.refreshCharacterCount(gameId, currentCharacters.length).catch(() => {});

        } catch (error: any) {
            Logger.error(`[RosterSync] Failed to sync roster for ${gameId}`, error);
            result.errors.push(error.message);
        }

        return result;
    }
}
