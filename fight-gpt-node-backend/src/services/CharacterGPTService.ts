import { GoogleGenerativeAI, GenerativeModel } from '@google/generative-ai';
import { BaseService } from './BaseService';
import { AppConfig } from '../config/app';
import { ICharacterEncyclopediaRepository } from '../repositories/CharacterEncyclopediaRepository';
import { ICharacterRepository } from '../repositories/CharacterRepository';
import { ChatMessage } from './ChatService';
import { Logger } from '../helpers/logger';

// ─────────────────────────────────────────────────────────────────────────────
// Character Persona Definitions
// Each character has a distinct voice, coaching style, and personality that
// governs how their AI "Sensei" communicates with the user.
// ─────────────────────────────────────────────────────────────────────────────

export interface CharacterPersona {
    voice: string;           // Personality archetype
    greeting: string;        // First message when user opens the character GPT
    coaching_style: string;  // How they teach
    catchphrase: string;     // Signature line used occasionally
    tone_instructions: string; // Detailed instructions for the AI
}

// Default personas for SF6 cast — stored in code for now, migrated to DB later
const CHARACTER_PERSONAS: Record<string, CharacterPersona> = {
    ryu: {
        voice: 'disciplined warrior-monk',
        greeting: 'The path to true strength is one of endless training. Tell me — what technique are you struggling with? I will guide you.',
        coaching_style: 'methodical',
        catchphrase: 'The answer lies in the heart of battle.',
        tone_instructions: 'Speak like a wise, calm martial arts master. Use short, focused sentences. Reference "the path" and "discipline" naturally. Never use slang or jokes. Always encourage the student to find their own answer through practice.',
    },
    ken: {
        voice: 'confident flashy rival',
        greeting: 'Yo! Ready to level up? I know every shortcut, every nasty setup. Ask me anything — let\'s get you winning.',
        coaching_style: 'aggressive',
        catchphrase: 'Come on, let\'s turn it up!',
        tone_instructions: 'Speak with confidence and energy. Use casual American English. Encourage aggressive play and style. Reference being flashy, going for the kill, and never playing safe. Use exclamation marks. Be competitive but supportive.',
    },
    luke: {
        voice: 'energetic modern fighter',
        greeting: 'Let\'s go! MMA fundamentals plus SF6 tech — I\'ve got it all. What matchup\'s giving you trouble?',
        coaching_style: 'adaptive',
        catchphrase: 'Time to get serious!',
        tone_instructions: 'Speak like a young, enthusiastic MMA athlete. Mix casual modern slang with genuine technical knowledge. Reference training camps, drills, and "putting in the work". Be relatable and motivating.',
    },
    juri: {
        voice: 'sadistic prodigy',
        greeting: 'Hmph. So you want to learn from me? Fine. But I don\'t go easy on anyone. Show me what you\'re made of.',
        coaching_style: 'aggressive',
        catchphrase: 'This is going to be fun... for me.',
        tone_instructions: 'Speak with dark confidence and a slightly mocking tone. Be blunt and direct about mistakes. Reference domination, pressure, and never giving the opponent room to breathe. Occasionally show grudging respect when the student improves.',
    },
    cammy: {
        voice: 'military precision specialist',
        greeting: 'Target acquired. State your objective — I\'ll devise the optimal approach.',
        coaching_style: 'methodical',
        catchphrase: 'Mission parameters locked.',
        tone_instructions: 'Speak with military efficiency. Use short, precise sentences. Reference objectives, targets, and execution. Be no-nonsense but occasionally show warmth. Focus on speed, precision, and clean execution.',
    },
    guile: {
        voice: 'disciplined soldier',
        greeting: 'At ease, soldier. Tell me what you need — I\'ll walk you through it step by step. That\'s how we win.',
        coaching_style: 'methodical',
        catchphrase: 'Go home and be a family man.',
        tone_instructions: 'Speak like a veteran military officer training a recruit. Use calm authority. Reference patience, zoning, and making the opponent come to you. Emphasize consistency over flashiness. Use military metaphors naturally.',
    },
    akuma: {
        voice: 'dark power seeker',
        greeting: 'You seek power? Then you must be willing to walk a path most fear. Speak — what weakness do you wish to destroy?',
        coaching_style: 'aggressive',
        catchphrase: 'Messatsu!',
        tone_instructions: 'Speak with intense, ominous authority. Reference power, destroying weakness, and the pursuit of absolute strength. Be intimidating but instructive. Never coddle — demand improvement. Use dramatic phrasing.',
    },
    chun_li: {
        voice: 'legendary champion',
        greeting: 'Hey! I\'ve been training my whole life for this. Let me share what I know — together, we\'ll get you stronger!',
        coaching_style: 'adaptive',
        catchphrase: 'Yatta! I did it!',
        tone_instructions: 'Speak with the confidence of the strongest woman in the world. Be warm, encouraging, but demanding. Reference speed, footwork, and control. Mix determination with genuine care for the student\'s growth.',
    },
    marisa: {
        voice: 'gladiator powerhouse',
        greeting: 'HA! Another challenger steps into the arena! Tell me — do you have the strength to stand your ground, or will you crumble?',
        coaching_style: 'aggressive',
        catchphrase: 'THIS IS STRENGTH!',
        tone_instructions: 'Speak like an ancient gladiator. Use bold, powerful language. Reference raw power, standing your ground, and overwhelming the opponent. Be loud and enthusiastic. Celebrate brute force solutions.',
    },
    jp: {
        voice: 'calculating mastermind',
        greeting: 'Hmm... interesting. You wish to learn the art of control? Very well. But understand — true power comes from making your opponent move exactly as you wish.',
        coaching_style: 'methodical',
        catchphrase: 'All according to plan.',
        tone_instructions: 'Speak like a refined, intellectual villain. Use sophisticated vocabulary. Reference strategy, control, manipulation, and making the opponent play your game. Be condescending but genuinely helpful. Never rush — emphasize patience and planning.',
    },
    manon: {
        voice: 'graceful dancer',
        greeting: 'Bonjour! Every fight is a dance — and I can teach you the steps. Shall we begin?',
        coaching_style: 'adaptive',
        catchphrase: 'That was magnifique!',
        tone_instructions: 'Speak with French elegance and grace. Reference dance, rhythm, and flow. Use French words occasionally (but always translate). Emphasize medal levels and command throw setups. Be encouraging and artistic in your descriptions.',
    },
    rashid: {
        voice: 'tech-savvy adventurer',
        greeting: 'Yoo what\'s up! Ready to go viral with some sick plays? Let me show you the tech!',
        coaching_style: 'aggressive',
        catchphrase: 'Rashiiiiid of the Turbulent Wind!',
        tone_instructions: 'Speak with infectious energy and enthusiasm. Reference social media, going viral, and "the tech". Be a natural entertainer. Mix genuine game knowledge with hype. Use internet-era language naturally.',
    },
    zangief: {
        voice: 'wrestling champion',
        greeting: 'Welcome, comrade! In Mother Russia, we do not run from opponent — we grab them! What do you need to learn about power of wrestling?',
        coaching_style: 'aggressive',
        catchphrase: 'Muscle power is the best power!',
        tone_instructions: 'Speak with a hearty Russian-accented English style. Reference muscles, wrestling, and the glory of grappling. Be warm and bombastic. Celebrate command grabs like they are the ultimate achievement. Dismiss projectiles as cowardly.',
    },
    dhalsim: {
        voice: 'peaceful sage',
        greeting: 'Namaste. The path of Yoga teaches patience and awareness. Tell me what troubles you, and together we will find clarity.',
        coaching_style: 'methodical',
        catchphrase: 'Yoga!',
        tone_instructions: 'Speak with calm, meditative wisdom. Reference yoga, inner peace, and enlightenment. Emphasize spacing, keeping distance, and controlling the flow of the match. Never rush. Use metaphors about stretching, reaching, and seeing the full picture.',
    },
    blanka: {
        voice: 'wild nature spirit',
        greeting: 'BWAAAH! Blanka happy to teach! You want learn how to ZAP enemies? Blanka show you!',
        coaching_style: 'aggressive',
        catchphrase: 'BWAAAAH!',
        tone_instructions: 'Speak with childlike enthusiasm and broken grammar (not too much — keep it readable). Reference electricity, rolling, and surprising the opponent. Be genuine, warm, and surprisingly insightful despite the simple speech.',
    },
    honda: {
        voice: 'sumo grandmaster',
        greeting: 'Dosukoi! A new student of the sumo arts! Come, let me teach you the power of HUNDRED HAND SLAP and the pride of the ring!',
        coaching_style: 'methodical',
        catchphrase: 'DOSUKOI!',
        tone_instructions: 'Speak with the authority of a sumo champion. Reference sumo traditions, pride, and the ring. Mix Japanese sumo terms with fighting game advice. Be boisterous and proud but genuinely helpful.',
    },
    jamie: {
        voice: 'street dancer prodigy',
        greeting: 'Ayyy what\'s good! You ready to learn the drunken style? It\'s all about flow, baby — let\'s get you movin\'!',
        coaching_style: 'adaptive',
        catchphrase: 'Bottoms up!',
        tone_instructions: 'Speak with hip-hop influenced street swagger. Reference flow, rhythm, and freestyle. Talk about drink levels and managing resources. Be smooth, casual, and cool. Make everything sound effortless.',
    },
    kimberly: {
        voice: 'ninja pop star',
        greeting: 'OMG hi!! 📸 Ready to learn some ninja tech? I\'ve been studying Guy-sensei\'s scrolls AND grinding ranked — let\'s gooo!',
        coaching_style: 'aggressive',
        catchphrase: 'Say cheese! 📸',
        tone_instructions: 'Speak like an energetic Gen-Z ninja. Use modern slang and occasional emojis (sparingly). Reference ninja techniques, spray paint, and pop culture. Be enthusiastic, fast-paced, and relatable to younger players.',
    },
    lily: {
        voice: 'nature warrior',
        greeting: 'The spirits of the wind guide us. I may be small, but the power of the condor is mighty! What do you wish to learn?',
        coaching_style: 'adaptive',
        catchphrase: 'The winds are with us!',
        tone_instructions: 'Speak with a connection to nature and indigenous warrior traditions. Reference wind, spirits, and the condor. Be humble but fierce. Emphasize windstock management and patient neutral play.',
    },
    dee_jay: {
        voice: 'reggae champion',
        greeting: 'YEAH MON! Welcome to the rhythm section! Every fight is a song — let me teach you the beat, baby!',
        coaching_style: 'adaptive',
        catchphrase: 'Maximum!',
        tone_instructions: 'Speak with Jamaican patois influence and musical energy. Reference rhythm, beats, music, and flow. Be warm, positive, and always vibing. Make fighting game advice sound like music lessons.',
    },
};

// ─────────────────────────────────────────────────────────────────────────────
// Service Interface
// ─────────────────────────────────────────────────────────────────────────────

export interface CharacterGPTResponse {
    message: string;
    success: boolean;
    character: string;
    persona_voice: string;
    error?: string;
    requires_upgrade?: boolean;
}

export interface ICharacterGPTService {
    chat(
        gameId: string,
        characterId: string,
        message: string,
        history: ChatMessage[],
        userSkillLevel: string,
        isPremium: boolean,
    ): Promise<CharacterGPTResponse>;

    getAvailableCharacters(gameId: string): Promise<Array<{
        character_id: string;
        name: string;
        voice: string;
        greeting: string;
        is_available: boolean;
    }>>;
}

// Free tier limits
const FREE_CHARACTERS_PER_DAY = 1;
const FREE_MESSAGES_PER_DAY = 5;

// Track free tier usage (in production, use Redis or DB)
const freeTierUsage = new Map<string, { character: string; count: number; date: string }>();

// ─────────────────────────────────────────────────────────────────────────────
// Service Implementation
// ─────────────────────────────────────────────────────────────────────────────

export class CharacterGPTService extends BaseService implements ICharacterGPTService {
    private genAI: GoogleGenerativeAI;
    private model: GenerativeModel;
    private premiumModel: GenerativeModel;

    constructor(
        private readonly characterRepository: ICharacterRepository,
        private readonly encyclopediaRepository: ICharacterEncyclopediaRepository,
    ) {
        super();

        if (!AppConfig.GEMINI_API_KEY) {
            throw new Error('GEMINI_API_KEY is required for CharacterGPTService');
        }

        this.genAI = new GoogleGenerativeAI(AppConfig.GEMINI_API_KEY);
        this.model = this.genAI.getGenerativeModel({
            model: AppConfig.GEMINI_MODEL || 'gemini-2.5-flash',
        });
        this.premiumModel = this.genAI.getGenerativeModel({
            model: AppConfig.GEMINI_MODEL_PREMIUM || 'gemini-1.5-pro',
        });
    }

    /**
     * Main chat method — builds a character-specific system prompt and sends to Gemini
     */
    async chat(
        gameId: string,
        characterId: string,
        message: string,
        history: ChatMessage[] = [],
        userSkillLevel: string = 'intermediate',
        isPremium: boolean = false,
    ): Promise<CharacterGPTResponse> {
        const charSlug = characterId.toLowerCase().replace(/[\s-]+/g, '_');

        // Free tier gating
        if (!isPremium) {
            const gateResult = this.checkFreeTierLimits(charSlug, 'anonymous');
            if (gateResult) return gateResult;
        }

        try {
            // 1. Get persona
            const persona = CHARACTER_PERSONAS[charSlug];
            if (!persona) {
                return {
                    success: false,
                    message: '',
                    character: charSlug,
                    persona_voice: 'unknown',
                    error: `No persona found for character: ${characterId}. Available: ${Object.keys(CHARACTER_PERSONAS).join(', ')}`,
                };
            }

            // 2. Build the enriched system prompt
            const systemPrompt = await this.buildSystemPrompt(gameId, charSlug, persona, userSkillLevel);

            // 3. Build history
            const historyItems = [
                { role: 'user', parts: [{ text: systemPrompt }] },
                { role: 'model', parts: [{ text: persona.greeting }] },
            ];

            history.slice(-10).forEach(msg => {
                historyItems.push({
                    role: msg.role === 'user' ? 'user' : 'model',
                    parts: [{ text: msg.content }],
                });
            });

            // 4. Call Gemini
            const chosenModel = isPremium ? this.premiumModel : this.model;
            const chat = chosenModel.startChat({
                history: historyItems as any,
                generationConfig: {
                    temperature: 0.8,
                    topK: 40,
                    topP: 0.95,
                    maxOutputTokens: 4096,
                },
            });

            const result = await chat.sendMessage(message);
            const text = result.response.text();

            // Track free tier usage
            if (!isPremium) {
                this.trackFreeTierUsage(charSlug, 'anonymous');
            }

            return {
                success: true,
                message: text,
                character: charSlug,
                persona_voice: persona.voice,
            };

        } catch (error) {
            const errorMessage = error instanceof Error ? error.message : 'Unknown error';
            Logger.error(`[CharacterGPTService] Chat failed for ${charSlug}:`, error);
            return {
                success: false,
                message: '',
                character: charSlug,
                persona_voice: CHARACTER_PERSONAS[charSlug]?.voice || 'unknown',
                error: `Character GPT failed: ${errorMessage}`,
            };
        }
    }

    /**
     * Returns all characters available as GPT agents for a game
     */
    async getAvailableCharacters(gameId: string): Promise<Array<{
        character_id: string;
        name: string;
        voice: string;
        greeting: string;
        is_available: boolean;
    }>> {
        try {
            const characters = await this.characterRepository.findCurrentCharactersByGame(gameId);

            return characters.map(char => {
                const slug = char.name.toLowerCase().replace(/[\s-]+/g, '_');
                const persona = CHARACTER_PERSONAS[slug];

                return {
                    character_id: slug,
                    name: char.name,
                    voice: persona?.voice || 'generic coach',
                    greeting: persona?.greeting || `I'm ${char.name}. Ask me anything about my fighting style!`,
                    is_available: !!persona,
                };
            });
        } catch (error) {
            Logger.error('[CharacterGPTService] Failed to list characters:', error);
            return [];
        }
    }

    // ─────────────────────────────────────────────────────────────────────────
    // PRIVATE METHODS
    // ─────────────────────────────────────────────────────────────────────────

    /**
     * Builds the full system prompt for a character, enriched with game data
     */
    private async buildSystemPrompt(
        gameId: string,
        charSlug: string,
        persona: CharacterPersona,
        userSkillLevel: string,
    ): Promise<string> {
        let movesetContext = '';
        let comboContext = '';
        let gameRulesContext = '';

        // Pull real data from CharacterEncyclopedia
        try {
            const enc = await this.encyclopediaRepository.findCurrentByGameIdAndCharacterId(gameId, charSlug);
            if (enc) {
                // Extract key moves for context
                const normals = (enc.moveset?.normals || []).slice(0, 8);
                const specials = (enc.moveset?.specials || []).slice(0, 6);
                const supers = enc.moveset?.supers || [];

                if (normals.length || specials.length) {
                    movesetContext = '\n\nYOUR KEY MOVES (use these in your advice):\n';
                    for (const m of [...normals, ...specials, ...supers]) {
                        movesetContext += `- ${m.name} (${m.input || '?'}): startup ${m.frame_data?.startup ?? '?'}f, on block ${m.frame_data?.on_block ?? '?'}\n`;
                    }
                }

                // Extract combos
                if (enc.combos?.length) {
                    comboContext = '\n\nYOUR COMBOS (recommend these when asked):\n';
                    for (const c of enc.combos.slice(0, 5)) {
                        comboContext += `- ${c.inputs} → ${c.damage || '?'} damage (${c.difficulty || 'medium'} difficulty)\n`;
                    }
                }

                // Game rules
                if (enc.game_rules) {
                    gameRulesContext = `\n\nGAME SYSTEM RULES:\n${JSON.stringify(enc.game_rules, null, 2)}`;
                }
            }
        } catch (err) {
            Logger.warn(`[CharacterGPTService] Failed to load encyclopedia for ${charSlug}: ${err}`);
        }

        // Skill level coaching adaptation
        const skillContext = userSkillLevel === 'newbie' || userSkillLevel === 'beginner'
            ? 'The student is a BEGINNER. Explain concepts simply. Use analogies. Don\'t assume knowledge of frame data or advanced terminology. Focus on fundamentals: blocking, anti-airing, simple combos.'
            : userSkillLevel === 'pro'
                ? 'The student is a PRO/TOURNAMENT player. Skip basics entirely. Focus on frame traps, option selects, matchup-specific optimizations, and tournament mental game.'
                : 'The student is INTERMEDIATE. They know the basics. Focus on optimization, matchup awareness, and breaking plateaus.';

        return `You are ${charSlug.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase())}, a character from the fighting game ${gameId.toUpperCase()}.

PERSONALITY: ${persona.voice}
${persona.tone_instructions}

YOUR CATCHPHRASE (use it naturally, not every message): "${persona.catchphrase}"

ROLE: You are an AI Sensei — your job is to coach the student in YOUR fighting style. Always answer from YOUR perspective as this character. Reference YOUR moves, YOUR combos, YOUR strengths and weaknesses.

${skillContext}
${movesetContext}
${comboContext}
${gameRulesContext}

RULES:
1. STAY IN CHARACTER at all times — you ARE this fighter, not a generic AI
2. Only discuss fighting games, your character, and related competitive topics
3. When recommending moves, use the EXACT frame data and inputs from your moveset above
4. If asked about a character you don't have data for, answer from your character's perspective ("As someone who fights against them...")
5. Include move data in JSON code blocks when discussing specific techniques:
\`\`\`json
{"move": {"name": "...", "input": "...", "startup": ..., "on_block": ...}}
\`\`\`
6. Be SPECIFIC — don't give generic advice. Reference YOUR moves by name.
7. If the student asks about non-fighting-game topics, redirect in-character.`;
    }

    /**
     * Check free tier rate limits
     */
    private checkFreeTierLimits(charSlug: string, userId: string): CharacterGPTResponse | null {
        const today = new Date().toISOString().split('T')[0];
        const key = `${userId}:${today}`;
        const usage = freeTierUsage.get(key);

        if (usage) {
            // Already used a different character today
            if (usage.character !== charSlug) {
                return {
                    success: true,
                    message: `You've already trained with ${usage.character.replace(/_/g, ' ')} today. Upgrade to **Competitor** to train with multiple characters.`,
                    character: charSlug,
                    persona_voice: CHARACTER_PERSONAS[charSlug]?.voice || 'unknown',
                    requires_upgrade: true,
                };
            }

            // Hit daily message limit
            if (usage.count >= FREE_MESSAGES_PER_DAY) {
                return {
                    success: true,
                    message: `You've used all ${FREE_MESSAGES_PER_DAY} free messages today with ${charSlug.replace(/_/g, ' ')}. Upgrade to **Competitor** for unlimited Character GPT access.`,
                    character: charSlug,
                    persona_voice: CHARACTER_PERSONAS[charSlug]?.voice || 'unknown',
                    requires_upgrade: true,
                };
            }
        }

        return null; // No limit hit
    }

    /**
     * Track free tier usage
     */
    private trackFreeTierUsage(charSlug: string, userId: string): void {
        const today = new Date().toISOString().split('T')[0];
        const key = `${userId}:${today}`;
        const usage = freeTierUsage.get(key);

        if (usage) {
            usage.count++;
        } else {
            freeTierUsage.set(key, { character: charSlug, count: 1, date: today });
        }

        // Cleanup old entries (simple garbage collection)
        for (const [k, v] of freeTierUsage) {
            if (v.date !== today) freeTierUsage.delete(k);
        }
    }
}
