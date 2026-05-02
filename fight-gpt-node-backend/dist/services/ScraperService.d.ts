import { ICharacterEncyclopediaService } from './CharacterEncyclopediaService';
export declare class ScraperService {
    private characterService;
    private browser;
    private readonly baseUrl;
    constructor(characterService: ICharacterEncyclopediaService);
    initialize(): Promise<void>;
    close(): Promise<void>;
    scrapeRoster(gameId: string): Promise<{
        name: string;
        status: 'released' | 'coming_soon';
    }[]>;
    scrapeCharacter(characterName: string): Promise<any>;
    scrapeCombos(characterName: string): Promise<any[]>;
    scrapeYouTube(query: string): Promise<any[]>;
    private sanitize;
}
//# sourceMappingURL=ScraperService.d.ts.map