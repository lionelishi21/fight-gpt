import { GoogleGenerativeAI } from '@google/generative-ai';
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

/**
 * Chat Service implementation with Gemini AI
 * Specialized for fighting games only
 * Follows Single Responsibility Principle - handles chat communication with Gemini
 */
export class ChatService extends BaseService implements IChatService {
  private genAI: GoogleGenerativeAI;
  private model: any;
  private readonly systemPrompt: string;

  constructor() {
    super();

    if (!AppConfig.GEMINI_API_KEY) {
      throw new Error('GEMINI_API_KEY or GOOGLE_API_KEY environment variable is required');
    }

    this.genAI = new GoogleGenerativeAI(AppConfig.GEMINI_API_KEY);
    // Use gemini-pro as default if gemini-1.5-flash is not available
    // Valid models: gemini-pro, gemini-1.5-pro, gemini-1.5-flash-latest
    // Valid models: gemini-pro, gemini-1.5-pro, gemini-1.5-flash-latest
    const modelName = AppConfig.GEMINI_MODEL || 'gemini-pro';
    this.model = this.genAI.getGenerativeModel({ model: modelName });

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
   * Send a message to Gemini AI with gaming context
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
          role: 'user' as const,
          parts: [{ text: this.systemPrompt }],
        },
        {
          role: 'model' as const,
          parts: [{ text: 'Got it! I\'m Fight GPT, your fighting game expert. Ask me anything about fighting games - characters, combos, frame data, strategies, matchups, and more!' }],
        },
      ];

      // Add conversation history (keep last 10 messages for context)
      conversationHistory.slice(-10).forEach(msg => {
        historyItems.push({
          role: msg.role === 'user' ? 'user' as const : 'model' as const,
          parts: [{ text: msg.content }],
        });
      });

      const chat = this.model.startChat({
        history: historyItems,
        generationConfig: {
          temperature: 0.7,
          topK: 40,
          topP: 0.95,
          maxOutputTokens: 2048,
        },
      });

      // Send the message
      const result = await chat.sendMessage(message);
      const response = await result.response;
      const text = response.text();

      return {
        success: true,
        message: text,
      };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
      console.error('[ChatService] Error sending message:', errorMessage);

      return {
        success: false,
        message: '',
        error: `Failed to get response: ${errorMessage}`,
      };
    }
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
