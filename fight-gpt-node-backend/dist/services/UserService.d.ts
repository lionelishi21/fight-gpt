import { IUser, ISlot } from '../models/User';
import { BaseService } from './BaseService';
import { ApiResponse } from '../types';
export interface IUserService {
    updateSlot(userId: string, index: number, slotData: Partial<ISlot>): Promise<ApiResponse<IUser>>;
    switchActiveSlot(userId: string, index: number): Promise<ApiResponse<IUser>>;
    getUserProfile(userId: string): Promise<ApiResponse<IUser>>;
    registerPushToken(userId: string, token: string): Promise<ApiResponse<IUser>>;
}
export declare class UserService extends BaseService implements IUserService {
    constructor();
    updateSlot(userId: string, index: number, slotData: Partial<ISlot>): Promise<ApiResponse<IUser>>;
    switchActiveSlot(userId: string, index: number): Promise<ApiResponse<IUser>>;
    getUserProfile(userId: string): Promise<ApiResponse<IUser>>;
    registerPushToken(userId: string, token: string): Promise<ApiResponse<IUser>>;
}
export default UserService;
//# sourceMappingURL=UserService.d.ts.map