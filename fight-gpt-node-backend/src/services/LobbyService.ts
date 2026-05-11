import Lobby, { ILobby } from '../models/Lobby';
import LobbyMessage, { ILobbyMessage } from '../models/LobbyMessage';
import User from '../models/User';
import { Logger } from '../helpers/logger';

export class LobbyService {
    /**
     * Get all available lobbies or filter by game
     */
    public async getLobbies(gameId?: string): Promise<ILobby[]> {
        const query = gameId ? { game_id: gameId } : {};
        return Lobby.find(query).sort({ active_users: -1 });
    }

    /**
     * Get or create a lobby for a specific game
     */
    public async ensureLobby(gameId: string, name: string): Promise<ILobby> {
        let lobby = await Lobby.findOne({ game_id: gameId });
        if (!lobby) {
            lobby = await Lobby.create({
                game_id: gameId,
                name: name,
                description: `Tactical comms for ${name} operators.`,
            });
            Logger.info(`LOBBY_SERVICE: Created new lobby for ${gameId}`);
        }
        return lobby;
    }

    /**
     * Get chat history for a lobby
     */
    public async getHistory(lobbyId: string, limit: number = 50): Promise<any[]> {
        const messages = await LobbyMessage.find({ lobby_id: lobbyId })
            .sort({ createdAt: -1 })
            .limit(limit)
            .populate('user_id', 'name avatar tier');
        
        return messages.reverse(); // Return in chronological order
    }

    /**
     * Save a new message
     */
    public async saveMessage(data: {
        lobbyId: string;
        userId: string;
        content: string;
        intelLink?: any;
    }): Promise<any> {
        const message = await LobbyMessage.create({
            lobby_id: data.lobbyId,
            user_id: data.userId,
            content: data.content,
            intel_link: data.intelLink,
        });

        // Populate user info for broadcast
        const populated = await LobbyMessage.findById(message._id).populate('user_id', 'name avatar tier');
        return populated;
    }

    /**
     * Update active user count
     */
    public async updateActiveCount(lobbyId: string, increment: number): Promise<void> {
        await Lobby.findByIdAndUpdate(lobbyId, { $inc: { active_users: increment } });
    }
}
