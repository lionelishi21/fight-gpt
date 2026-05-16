// Playwright removed — all scraping replaced by Gemini-powered GameScanService.
// Stubbed so RosterSyncService compiles without changes.
import { ICharacterEncyclopediaService } from './CharacterEncyclopediaService';

export class ScraperService {
    constructor(_characterService: ICharacterEncyclopediaService) {}

    async initialize(): Promise<void> {}

    async close(): Promise<void> {}

    async scrapeRoster(_gameId: string): Promise<{ name: string; status: 'released' | 'coming_soon' }[]> {
        return [];
    }

    async scrapeCharacter(_characterName: string, _gameId?: string): Promise<any[]> {
        return [];
    }

    async scrapeCombos(_characterName: string): Promise<any[]> {
        return [];
    }

    async scrapeYouTube(_query: string): Promise<any[]> {
        return [];
    }
}
