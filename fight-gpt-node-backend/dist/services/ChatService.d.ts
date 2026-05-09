import { BaseService } from './BaseService';
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
    slots: Array<{
        gameId: string;
        characterId?: string;
    }>;
    rivals: Array<{
        name: string;
        gameId: string;
        characterId?: string;
    }>;
    games: Array<{
        name: string;
        game_id: string;
        aliases?: string[];
    }>;
    playerAnalyses?: Array<{
        playerName: string;
        gameId: string;
        analysisId: string;
        character: string;
    }>;
}
export interface SmartChatResponse extends ChatResponse {
    detectedEntities?: DetectedEntity[];
    requiresUpgrade?: boolean;
    requiresUrl?: {
        playerName: string;
        gameId?: string;
    };
}
/**
 * Chat Service implementation with Google Cloud Vertex AI
 * Specialized for fighting games only
 */
export declare class ChatService extends BaseService implements IChatService {
    private genAI;
    private model;
    private readonly systemPrompt;
    constructor();
    /**
     * Send a message to Vertex AI with gaming context
     */
    sendMessage(message: string, conversationHistory?: ChatMessage[]): Promise<ChatResponse>;
    /**
     * Context-aware message — resolves game/character/player entities before calling Gemini
     */
    sendContextualMessage(message: string, history: ChatMessage[], ctx: UserChatContext): Promise<SmartChatResponse>;
}
//# sourceMappingURL=ChatService.d.ts.map