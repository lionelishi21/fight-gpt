import { chromium, Browser, Page } from 'playwright';
import { ICharacterEncyclopediaService } from './CharacterEncyclopediaService';

export class ScraperService {
    private browser: Browser | null = null;
    private readonly baseUrlSF6: string = "https://wiki.supercombo.gg/w/Street_Fighter_6";
    private readonly baseUrlT8: string = "https://wiki.supercombo.gg/w/Tekken_8";

    constructor(private characterService: ICharacterEncyclopediaService) { }

    async initialize() {
        this.browser = await chromium.launch({ headless: true });
    }

    async close() {
        if (this.browser) {
            await this.browser.close();
            this.browser = null;
        }
    }

    async scrapeRoster(gameId: string): Promise<{ name: string; status: 'released' | 'coming_soon' }[]> {
        const url = gameId === 'sf6' ? this.baseUrlSF6 : this.baseUrlT8;
        
        if (!this.browser) await this.initialize();
        const context = await this.browser!.newContext({
            userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/119.0.0.0 Safari/537.36'
        });
        const page = await context.newPage();

        try {
            console.log(`Scraping roster for ${gameId} at ${url}`);
            await page.goto(url, { waitUntil: 'networkidle', timeout: 60000 });

            // Wait for characters table or section
            await page.waitForTimeout(5000);

            const roster = await page.evaluate(() => {
                const characters: { name: string; status: 'released' | 'coming_soon' }[] = [];
                // Look for character links in the roster section
                // SuperCombo SF6 main page usually has character portraits linked
                // We'll target the main character gallery or tables
                
                const charLinks = document.querySelectorAll('.character-portrait a, .gallerybox a, table.wikitable a, .sf6-roster a, a.mw-redirect');
                
                charLinks.forEach(link => {
                    const name = link.textContent?.trim() || link.getAttribute('title')?.trim();
                    if (!name || name.length < 2 || name.toLowerCase().includes('edit') || name.toLowerCase().includes('file:')) return;

                    // Exclude general wiki links
                    const ignoreList = ['Street Fighter 6', 'System Mechanics', 'Controls', 'Frame Data', 'Strategy'];
                    if (ignoreList.includes(name)) return;

                    // Check if it's explicitly marked as upcoming (in an "Upcoming" section or text)
                    let status: 'released' | 'coming_soon' = 'released';
                    const parentElement = link.closest('.upcoming, .unreleased, div[id*="Upcoming"], h2:has(span[id*="Upcoming"]) ~ div');
                    
                    // Or if there's a "Coming Soon" or "DLC" text near it without frame data
                    if (parentElement || link.parentElement?.textContent?.toLowerCase().includes('upcoming') || link.parentElement?.textContent?.toLowerCase().includes('coming soon')) {
                        status = 'coming_soon';
                    }

                    // Add unique characters only
                    if (!characters.some(c => c.name === name)) {
                        characters.push({ name, status });
                    }
                });

                return characters;
            });

            console.log(`Found ${roster.length} characters on roster page`);
            return roster;

        } catch (error: any) {
            console.error(`Error scraping roster for ${gameId}:`, error.message, error.stack);
            throw error;
        } finally {
            await page.close();
            await context.close();
        }
    }

    async scrapeCharacter(characterName: string, gameId: string = 'sf6'): Promise<any> {
        if (!this.browser) await this.initialize();
        const context = await this.browser!.newContext({
            userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/119.0.0.0 Safari/537.36'
        });
        const page = await context.newPage();
        const baseUrl = gameId === 'sf6' ? this.baseUrlSF6 : this.baseUrlT8;
        const slug = characterName.replace(/ /g, "_");
        const url = gameId === 'sf6' ? `${baseUrl}/${slug}` : `${baseUrl}/${slug.replace(/ /g, "_")}`; // Tekken 8 might need specific slug logic

        try {
            console.log(`Scraping ${characterName} at ${url}`);
            // Use networkidle and add a manual wait for the challenge to pass
            await page.goto(url, { waitUntil: 'networkidle', timeout: 60000 });

            // Wait up to 10 seconds for the challenge/redirect to complete
            console.log(`Waiting for ${characterName} challenge to pass...`);
            await page.waitForTimeout(5000);

            const content = await page.content();
            console.log(`Page content length for ${characterName}: ${content.length}`);
            if (content.length < 5000) {
                console.log(`Page content for ${characterName}:\n${content}`);
            }

            let frameData: any[] = [];

            // Select all movedata containers
            const containers = await page.$$('.movedata-container');
            console.log(`Found ${containers.length} movedata containers for ${characterName}`);

            if (containers.length > 0) {
                const moves = await page.evaluate(() => {
                    const extractedMoves: any[] = [];
                    const moveContainers = document.querySelectorAll('.movedata-container');

                    moveContainers.forEach(container => {
                        const moveData: any = {};

                        const nameEl = container.querySelector('big') || container.querySelector('.movedata-flex-framedata-name-item:last-child');
                        if (nameEl) {
                            moveData['Name'] = nameEl.textContent?.trim() || 'Unknown';
                        }

                        const inputEl = container.querySelector('.movedata-flex-framedata-name-item:first-child');
                        if (inputEl) {
                            moveData['Input'] = inputEl.textContent?.trim() || '';
                        }

                        const headers = container.querySelectorAll('.wikitable th');
                        const values = container.querySelectorAll('.wikitable td');

                        headers.forEach((header, index) => {
                            if (index < values.length) {
                                const key = header.textContent?.trim() || '';
                                const val = values[index].textContent?.trim() || '';
                                if (key) {
                                    moveData[key] = val;
                                }
                            }
                        });

                        extractedMoves.push(moveData);
                    });

                    return extractedMoves;
                });

                frameData.push({ section: "Frame Data", moves });
            }

            if (containers.length === 0) {
                // Return fallback data if available, otherwise empty array
                const tables = await page.$$('table.wikitable');
                console.log(`Fallback: Found ${tables.length} wikitables for ${characterName}`);

                for (const table of tables) {
                    const rows = await table.$$('tr');
                    if (rows.length === 0) continue;

                    // Try to find a preceding heading for the move name or section
                    // This is tricky without a container, so we might just group them generically
                    // or try to find the nearest preceding h3/h4

                    const headerCells = await rows[0].$$('th');
                    const headers: string[] = [];
                    for (const cell of headerCells) {
                        const text = await cell.innerText();
                        headers.push(this.sanitize(text));
                    }

                    const moves: any[] = [];
                    for (let i = 1; i < rows.length; i++) {
                        const cells = await rows[i].$$('td');
                        if (cells.length < 2) continue;

                        // Try to identify the move name from the first column if "Move" or "Name" is in headers
                        // otherwise default to first column
                        let moveName = 'Unknown';
                        const nameIndex = headers.findIndex(h => h.includes('Move') || h.includes('Name') || h.includes('Input'));

                        if (nameIndex !== -1 && nameIndex < cells.length) {
                            moveName = await cells[nameIndex].innerText();
                        } else if (cells.length > 0) {
                            moveName = await cells[0].innerText();
                        }

                        moveName = this.sanitize(moveName);

                        const move: any = { Name: moveName };
                        for (let j = 0; j < headers.length; j++) {
                            if (j < cells.length) {
                                const text = await cells[j].innerText();
                                move[headers[j]] = this.sanitize(text);
                            }
                        }
                        moves.push(move);
                    }
                    if (moves.length > 0) {
                        frameData.push({ section: "Frame Data (Table)", moves });
                    }
                }
            }

            // If we still have no data, try to extract specific tables based on headers
            if (frameData.length === 0 && containers.length === 0) {
                console.log(`Still no data for ${characterName}, checking for specific tables...`);
                // Further fallback logic could go here if needed
            }

            return frameData;

        } catch (error: any) {
            console.error(`Error scraping ${characterName}:`, error.message, error.stack);
            throw error;
        } finally {
            await page.close();
        }
    }

    async scrapeCombos(characterName: string): Promise<any[]> {
        if (!this.browser) await this.initialize();
        const context = await this.browser!.newContext({
            userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/119.0.0.0 Safari/537.36'
        });
        const page = await context.newPage();
        const slug = characterName.replace(/ /g, "_");
        const url = `${this.baseUrlSF6}/${slug}/Combos`;

        try {
            console.log(`Scraping combos for ${characterName} at ${url}`);
            await page.goto(url, { waitUntil: 'networkidle', timeout: 60000 });
            await page.waitForTimeout(5000);

            const combos = await page.evaluate(() => {
                const results: any[] = [];
                const tables = document.querySelectorAll('table.wikitable');

                tables.forEach(table => {
                    const rows = table.querySelectorAll('tr');
                    if (rows.length === 0) return;

                    // Identify columns dynamically
                    const headerCells = rows[0].querySelectorAll('th');
                    const headers: string[] = Array.from(headerCells).map(h => (h as HTMLElement).innerText.trim().toLowerCase());

                    const inputIdx = headers.findIndex(h => h.includes('input') || h.includes('combo'));
                    const damageIdx = headers.findIndex(h => h.includes('damage'));
                    const difficultyIdx = headers.findIndex(h => h.includes('difficulty'));
                    const notesIdx = headers.findIndex(h => h.includes('notes') || h.includes('description') || h.includes('comment'));

                    // Fallbacks if headers aren't found (using likely positions)
                    const safeInputIdx = inputIdx !== -1 ? inputIdx : 0;
                    const safeDamageIdx = damageIdx !== -1 ? damageIdx : 2;
                    // difficulty and notes are optional

                    // Skip header row
                    for (let i = 1; i < rows.length; i++) {
                        const cols = rows[i].querySelectorAll('td');
                        if (cols.length <= Math.max(safeInputIdx, safeDamageIdx)) continue;

                        const inputStr = (cols[safeInputIdx] as HTMLElement).innerText.trim();
                        const damageStr = (cols[safeDamageIdx] as HTMLElement).innerText.trim();

                        let difficultyStr = 'Beginner';
                        if (difficultyIdx !== -1 && difficultyIdx < cols.length) {
                            difficultyStr = (cols[difficultyIdx] as HTMLElement).innerText.trim();
                        } else if (cols.length >= 6) { // Legacy fallback
                            difficultyStr = (cols[5] as HTMLElement).innerText.trim();
                        }

                        let notesStr = '';
                        if (notesIdx !== -1 && notesIdx < cols.length) {
                            notesStr = (cols[notesIdx] as HTMLElement).innerText.trim();
                        } else if (cols.length >= 7) { // Legacy fallback
                            notesStr = (cols[6] as HTMLElement).innerText.trim();
                        }

                        // Parse inputs (split by spaces or specific separators)
                        // This regex splits by >, ~, or common separators, keeping them if needed or just using the parts
                        const inputs = inputStr.split(/[>~,]\s*|\s+/).filter(Boolean);
                        // Clean damage string (remove commas, handle 'x2' etc if simple parsing fails)
                        const damage = parseInt(damageStr.replace(/,/g, '').split(' ')[0]) || 0;

                        // Map difficulty
                        let difficulty: 'Beginner' | 'Intermediate' | 'Advanced' = 'Beginner';
                        if (difficultyStr.toLowerCase().includes('hard') || difficultyStr.toLowerCase().includes('advanced')) {
                            difficulty = 'Advanced';
                        } else if (difficultyStr.toLowerCase().includes('intermediate') || difficultyStr.toLowerCase().includes('medium')) {
                            difficulty = 'Intermediate';
                        }

                        if (inputs.length > 0) { // Allow 0 damage if it's a utility combo/setup
                            results.push({
                                inputs,
                                damage,
                                difficulty,
                                description: notesStr,
                                tags: ['Scraped']
                            });
                        }
                    }
                });
                return results;
            });

            console.log(`Found ${combos.length} combos for ${characterName}`);
            return combos;
        } catch (error: any) {
            console.error(`Error scraping combos for ${characterName}:`, error.message);
            return [];
        } finally {
            await page.close();
            await context.close();
        }
    }

    async scrapeYouTube(query: string): Promise<any[]> {
        if (!this.browser) await this.initialize();
        const context = await this.browser!.newContext({
            userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/119.0.0.0 Safari/537.36'
        });
        const page = await context.newPage();
        const url = `https://www.youtube.com/results?search_query=${encodeURIComponent(query)}`;

        try {
            console.log(`Searching YouTube for: ${query}`);
            await page.goto(url, { waitUntil: 'networkidle', timeout: 60000 });

            // Extract video IDs and titles
            const videos = await page.evaluate(() => {
                const results: any[] = [];
                const items = document.querySelectorAll('ytd-video-renderer, #contents ytd-video-renderer');

                for (let i = 0; i < items.length && results.length < 3; i++) {
                    const item = items[i];
                    const titleEl = item.querySelector('#video-title');
                    const linkEl = item.querySelector('a#video-title, a#thumbnail');

                    if (titleEl && linkEl) {
                        const title = (titleEl as HTMLElement).innerText.trim();
                        const href = (linkEl as HTMLAnchorElement).href;
                        const match = href.match(/[?&]v=([^&]+)/);

                        if (match && match[1]) {
                            results.push({
                                title,
                                youtube_id: match[1],
                                thumbnail: `https://img.youtube.com/vi/${match[1]}/mqdefault.jpg`
                            });
                        }
                    }
                }
                return results;
            });

            return videos;
        } catch (error) {
            console.error(`Error searching YouTube for ${query}:`, error);
            return [];
        } finally {
            await page.close();
            await context.close();
        }
    }

    private sanitize(text: string): string {
        return text.replace(/\n/g, ' ').trim();
    }
}
