import User, { IUser, ISlot } from '../models/User';
import { BaseService } from './BaseService';
import { ApiResponse } from '../types';

export interface IUserService {
    updateSlot(userId: string, index: number, slotData: Partial<ISlot>): Promise<ApiResponse<IUser>>;
    switchActiveSlot(userId: string, index: number): Promise<ApiResponse<IUser>>;
    getUserProfile(userId: string): Promise<ApiResponse<IUser>>;
    registerPushToken(userId: string, token: string): Promise<ApiResponse<IUser>>;
}

export class UserService extends BaseService implements IUserService {
    constructor() {
        super();
    }

    public async updateSlot(userId: string, index: number, slotData: Partial<ISlot>): Promise<ApiResponse<IUser>> {
        try {
            const user = await User.findById(userId);
            if (!user) return { success: false, error: 'User not found' };

            // Ensure the slots array exists and is large enough
            if (!user.slots) user.slots = [];
            
            // Limit to 3 slots for Competitor, 1 for Free (This is a business rule we can enforce)
            const maxSlots = user.tier === 'PRO' ? 5 : (user.tier === 'COMPETITOR' ? 3 : 1);
            if (index >= maxSlots) {
                return { success: false, error: `Upgrade to unlock more combat slots (Max: ${maxSlots})` };
            }

            // Update or initialize the slot
            if (user.slots[index]) {
                user.slots[index] = { ...user.slots[index], ...slotData };
            } else {
                // Fill gaps if any
                for (let i = user.slots.length; i < index; i++) {
                    user.slots[i] = { gameId: 'unknown', notificationsEnabled: false };
                }
                user.slots[index] = { 
                    gameId: slotData.gameId || 'unknown', 
                    characterId: slotData.characterId,
                    notificationsEnabled: slotData.notificationsEnabled ?? true,
                    proficiencyLevel: slotData.proficiencyLevel || 'newbie'
                };
            }

            // Mark modified for Mongoose if it's an array element change
            user.markModified('slots');
            await user.save();

            return { success: true, data: user };
        } catch (error) {
            return { success: false, error: error instanceof Error ? error.message : 'Failed to update slot' };
        }
    }

    public async switchActiveSlot(userId: string, index: number): Promise<ApiResponse<IUser>> {
        try {
            const user = await User.findById(userId);
            if (!user) return { success: false, error: 'User not found' };

            if (index < 0 || index >= user.slots.length) {
                return { success: false, error: 'Invalid slot index' };
            }

            user.activeSlotIndex = index;
            await user.save();

            return { success: true, data: user };
        } catch (error) {
            return { success: false, error: error instanceof Error ? error.message : 'Failed to switch active slot' };
        }
    }

    public async getUserProfile(userId: string): Promise<ApiResponse<IUser>> {
        try {
            const user = await User.findById(userId).select('-password');
            if (!user) return { success: false, error: 'User not found' };
            
            // Defensive check for slots (especially for legacy users)
            if (!user.slots) {
                user.slots = [];
            }
            
            return { success: true, data: user };
        } catch (error) {
            return { success: false, error: error instanceof Error ? error.message : 'Failed to fetch profile' };
        }
    }

    public async registerPushToken(userId: string, token: string): Promise<ApiResponse<IUser>> {
        try {
            const user = await User.findById(userId);
            if (!user) return { success: false, error: 'User not found' };

            // Initialize if missing (defensive)
            if (!user.pushTokens) user.pushTokens = [];

            // Only add if it doesn't already exist to prevent duplicates
            if (!user.pushTokens.includes(token)) {
                user.pushTokens.push(token);
                await user.save();
            }

            return { success: true, data: user };
        } catch (error) {
            return { success: false, error: error instanceof Error ? error.message : 'Failed to register push token' };
        }
    }
}

export default UserService;
