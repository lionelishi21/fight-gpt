import { VertexAI, GenerativeModel } from '@google-cloud/vertexai';
import { BaseService } from './BaseService';
import { AppConfig } from '../config/app';

/**
 * Chat Service interface
 */
export interface IChatService {
  sendMessage(message: string, conversationHistory?: ChatMessage[]): Promise<ChatResponse>;
}

/**
 * Chat message structure
 */
export interface ChatMessage {
  role: 'user' | 'assistant';
  content: string;
}

/**
 * Chat response structure
 */
export interface ChatResponse {
  message: string;
  success: boolean;
  error?: string;
}

export interface DetectedEntity {
  text: string;
  type: 'game' | 'character' | 'player';
  color: string;
  gameId?: string;
}

export interface UserChatContext {
  planType: 'free' | 'premium';
  slots: Array<{ gameId: string; characterId?: string }>;
  rivals: Array<{ name: string; gameId: string; characterId?: string }>;
  games: Array<{ name: string; game_id: string; aliases?: string[] }>;
  playerAnalyses?: Array<{ playerName: string; gameId: string; analysisId: string; character: string }>;
}

export interface SmartChatResponse extends ChatResponse {
  detectedEntities?: DetectedEntity[];
  requiresUpgrade?: boolean;
  requiresUrl?: { playerName: string; gameId?: string };
}

/**
 * Chat Service implementation with Google Cloud Vertex AI
 * Specialized for fighting games only
 */
export class ChatService extends BaseService implements IChatService {
  private vertexAI: VertexAI;
  private model: GenerativeModel;
  private readonly systemPrompt: string;

  constructor() {
    super();

    if (!AppConfig.GOOGLE_CLOUD_PROJECT) {
      throw new Error('GOOGLE_CLOUD_PROJECT environment variable is required for Vertex AI');
    }

    this.vertexAI = new VertexAI({
      project: AppConfig.GOOGLE_CLOUD_PROJECT,
      location: AppConfig.GOOGLE_CLOUD_LOCATION || 'us-central1',
    });

    // Primary model from env — falls back through the list on 503/overload
    const modelName = AppConfig.GEMINI_MODEL || 'gemini-2.5-flash';
    this.model = this.vertexAI.getGenerativeModel({ model: modelName });

    // Custom system prompt specialized for fighting games
    this.systemPrompt = `You are Fight GPT, an expert AI assistant specialized exclusively in fighting games. Your knowledge includes:

**IMPORTANT FORMATTING INSTRUCTIONS:**
When describing a move, combo, or special technique, include move data in JSON format within a code block like this:

\`\`\`json
{
  "move": {
    "name": "Hadouken",
    "how_to_perform": "Quarter-circle forward + Punch",
    "category": "Special",
    "input": "2 3 6 P",
    "frame_data": {
      "startup": 13,
      "on_block": -5,
      "damage": 60
    }
  }
}
\`\`\`

Input notation: Use numbers 1-9 for directions (Numpad notation), P for Punch, K for Kick, S for Special/Drive.
Example inputs:
- Quarter circle forward: "2 3 6 P"
- Dragon punch: "6 2 3 P"
- Half circle back: "4 2 1 K"

Your knowledge includes:

**Core Expertise:**
- Fighting game mechanics (Street Fighter, Tekken, Mortal Kombat, Guilty Gear, BlazBlue, etc.)
- Character movesets, frame data, and special abilities
- Combo execution, cancel windows, and optimal routes
- Neutral game, footsies, spacing, and positioning
- Offensive strategies (pressure, mix-ups, frame traps)
- Defensive techniques (blocking, anti-airing, reversals)
- Matchup knowledge and character strengths/weaknesses
- Game-specific mechanics (Drive System, EX moves, Supers, etc.)
- Patch notes, balance changes, and tier lists
- Tournament play and competitive strategies
- Patch notes and balance updates

**Rules:**
1. ONLY answer questions about fighting games, characters, mechanics, strategies, and related topics
2. If asked about non-gaming topics, politely redirect to fighting game questions
3. Provide accurate, detailed, and actionable advice
4. Use fighting game terminology correctly (frame data, links, cancels, oki, etc.)
5. Reference specific games and characters when relevant
6. Be concise but thorough in explanations
7. Format technical information clearly (use bullet points, frame data in parentheses)
8. Always maintain a helpful, encouraging tone

**Your Role:**
Help players improve their skills, understand game mechanics, learn characters, optimize combos, and strategize for matches.`;
  }

  /**
   * Send a message to Vertex AI with gaming context
   */
  async sendMessage(message: string, conversationHistory: ChatMessage[] = []): Promise<ChatResponse> {
    try {
      // Validate that message is about gaming
      if (!this.isGamingQuestion(message)) {
        return {
          success: false,
          message: '',
          error: 'Please ask a question about fighting games only. I can help with characters, combos, frame data, strategies, matchups, and more!',
        };
      }

      // Build conversation history for context
      const historyItems = [
        {
          role: 'user',
          parts: [{ text: this.systemPrompt }],
        },
        {
          role: 'model',
          parts: [{ text: 'Got it! I\'m Fight GPT, your fighting game expert. Ask me anything about fighting games - characters, combos, frame data, strategies, matchups, and more!' }],
        },
      ];

      // Add conversation history (keep last 10 messages for context)
      conversationHistory.slice(-10).forEach(msg => {
        historyItems.push({
          role: msg.role === 'user' ? 'user' : 'model',
          parts: [{ text: msg.content }],
        });
      });

      const generationConfig = {
        temperature: 0.7,
        topK: 40,
        topP: 0.95,
        maxOutputTokens: 2048,
      };

      // Try primary model, fall back on 503/overload
      const FALLBACK_MODELS = ['gemini-2.0-flash', 'gemini-1.5-flash'];
      let lastError: Error | null = null;

      const modelsToTry = [this.model, ...FALLBACK_MODELS.map(m => this.vertexAI.getGenerativeModel({ model: m }))];

      for (const modelInstance of modelsToTry) {
        try {
          const chat = modelInstance.startChat({ history: historyItems as any, generationConfig });
          const result = await chat.sendMessage(message);
          const text = result.response.candidates?.[0]?.content?.parts?.[0]?.text || '';
          return { success: true, message: text };
        } catch (e: any) {
          lastError = e;
          // Only retry on 503 overload — other errors bubble up immediately
          const isRetryable = e?.message?.includes('503') || e?.message?.includes('overload') || e?.message?.includes('high demand') || e?.message?.includes('429');
          if (!isRetryable) break;
        }
      }

      const errorMessage = lastError?.message || 'Unknown error occurred';
      console.error('[ChatService] All models failed:', errorMessage);
      return { success: false, message: '', error: `Failed to get response from Vertex AI: ${errorMessage}` };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
      console.error('[ChatService] Error sending message:', errorMessage);
      return { success: false, message: '', error: `Failed to get response: ${errorMessage}` };
    }
  }

  /**
   * Context-aware message — resolves game/character/player entities before calling Gemini
   */
  async sendContextualMessage(
    message: string,
    history: ChatMessage[],
    ctx: UserChatContext,
  ): Promise<SmartChatResponse> {
    const lowerMsg = message.toLowerCase();
    const detectedEntities: DetectedEntity[] = [];

    // Detect game names
    for (const game of ctx.games) {
      const names = [game.name, ...(game.aliases || [])];
      for (const alias of names) {
        if (alias && lowerMsg.includes(alias.toLowerCase())) {
          detectedEntities.push({ text: alias, type: 'game', color: '#06b6d4', gameId: game.game_id });
          break;
        }
      }
    }

    // Detect user's slot characters
    for (const slot of ctx.slots) {
      if (slot.characterId && lowerMsg.includes(slot.characterId.toLowerCase())) {
        detectedEntities.push({ text: slot.characterId, type: 'character', color: '#fbbf24', gameId: slot.gameId });
      }
    }

    // Detect rival/player names — check if any rival name appears in the message
    const mentionedRival = ctx.rivals.find(r => lowerMsg.includes(r.name.toLowerCase()));
    if (mentionedRival) {
      detectedEntities.push({ text: mentionedRival.name, type: 'player', color: '#f43f5e', gameId: mentionedRival.gameId });

      // Gate: player scouting is premium only
      if (ctx.planType !== 'premium') {
        return {
          success: true,
          message: `Player scouting is a **Pro feature**. To get AI analysis of ${mentionedRival.name}'s playstyle and matchup tips against them, upgrade to Pro.`,
          detectedEntities,
          requiresUpgrade: true,
        };
      }

      // Premium: check if we have their footage analyzed
      const analysis = ctx.playerAnalyses?.find(
        a => a.playerName.toLowerCase() === mentionedRival.name.toLowerCase()
      );
      if (!analysis) {
        return {
          success: true,
          message: `I found **${mentionedRival.name}** in your rivals list but I haven't analyzed their footage yet. Paste a YouTube URL of their gameplay and I'll analyze it to give you a full breakdown.`,
          detectedEntities,
          requiresUrl: { playerName: mentionedRival.name, gameId: mentionedRival.gameId },
        };
      }

      // Have analysis — inject into context
      const playerContext = `\n\n[PLAYER INTEL — ${mentionedRival.name}]\nCharacter: ${analysis.character}\nGame: ${analysis.gameId}\nAnalysis ID: ${analysis.analysisId}\nUse this data to answer questions about how to counter this player specifically.`;
      return this.sendMessage(message + playerContext, history);
    }

    // No player — build a context prefix about what game/character to focus on
    let contextPrefix = '';
    const userGame = ctx.slots[0]?.gameId;
    const userChar = ctx.slots[0]?.characterId;
    if (userGame || userChar) {
      contextPrefix = `[USER CONTEXT] The player mains ${userChar || 'unknown character'} in ${userGame || 'unknown game'}. Tailor advice to their character and game when relevant.\n\n`;
    }

    // Add game disambiguation instruction when game detected but potentially ambiguous SF versions
    const sfDetected = detectedEntities.some(e => e.gameId?.includes('sf') || e.text.toLowerCase().includes('street fighter'));
    if (sfDetected) {
      contextPrefix += `[GAME NOTE] Street Fighter has multiple versions (SF6, SF5/SFV, SF3, SF2). If the version is unclear from context, ask the user to clarify which one they mean before answering.\n\n`;
    }

    const enrichedMessage = contextPrefix ? contextPrefix + message : message;
    const response = await this.sendMessage(enrichedMessage, history);
    return { ...response, detectedEntities };
  }

  /**
   * Validate if question is about gaming
   */
  private isGamingQuestion(text: string): boolean {
    const lowerText = text.toLowerCase();
    const gamingKeywords = [
      'game', 'gaming', 'character', 'combo', 'move', 'frame', 'fighting',
      'street fighter', 'tekken', 'mortal kombat', 'guilty gear', 'blazblue',
      'strategy', 'tactics', 'matchup', 'neutral', 'oki', 'meaty', 'link',
      'cancel', 'special', 'super', 'ex', 'drive', 'meter', 'block', 'hit',
      'counter', 'punish', 'whiff', 'tech', 'throw', 'grab', 'cross', 'mix',
      'overhead', 'low', 'mid', 'anti-air', 'reversal', 'dp', 'fireball',
      'dragon punch', 'shoryuken', 'hadoken', 'quarter circle', 'motion',
      'input', 'execution', 'reset', 'corner', 'pressure', 'footsies',
      'zoning', 'rushdown', 'grappler', 'turtle', 'tier', 'patch', 'balance',
      'nerf', 'buff', 'tournament', 'competitive', 'esports', 'ranked', 'casual',
      'ryu', 'ken', 'chun-li', 'zangief', 'cammy', 'guile', 'dhalsim', 'blanka',
      'juri', 'luke', 'jamie', 'kimberly', 'manon', 'marisa', 'lily', 'jp',
      'dee jay', 'rashid', 'aki', 'ed', 'akuma'
    ];

    return gamingKeywords.some(keyword => lowerText.includes(keyword));
  }
}
