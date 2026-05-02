import { ApiResponse } from '../types';
import { BaseService } from './BaseService';
export interface IAdminService {
    getSystemStats(): Promise<ApiResponse<any>>;
    getIngestionJobs(limit: number, status?: string, gameId?: string): Promise<ApiResponse<any[]>>;
    getAnalyses(limit: number, offset: number, gameId?: string, search?: string): Promise<ApiResponse<any[]>>;
    deleteAnalysis(analysisId: string): Promise<ApiResponse<boolean>>;
    retryJob(jobId: string): Promise<ApiResponse<boolean>>;
    triggerManualUrl(gameId: string, youtubeUrl: string): Promise<ApiResponse<any>>;
    seedUrls(gameId: string, youtubeUrls: string[]): Promise<ApiResponse<{
        queued: number;
        skipped: number;
    }>>;
    getCharacters(gameId?: string): Promise<ApiResponse<any[]>>;
    createCharacter(data: any): Promise<ApiResponse<any>>;
    updateCharacter(id: string, data: any): Promise<ApiResponse<any>>;
    deleteCharacter(id: string): Promise<ApiResponse<boolean>>;
}
export declare class AdminService extends BaseService implements IAdminService {
    getSystemStats(): Promise<ApiResponse<any>>;
    getIngestionJobs(limit?: number, status?: string, gameId?: string): Promise<ApiResponse<any[]>>;
    getAnalyses(limit?: number, offset?: number, gameId?: string, search?: string): Promise<ApiResponse<any[]>>;
    deleteAnalysis(analysisId: string): Promise<ApiResponse<boolean>>;
    retryJob(jobId: string): Promise<ApiResponse<boolean>>;
    triggerManualUrl(gameId: string, youtubeUrl: string): Promise<ApiResponse<any>>;
    seedUrls(gameId: string, youtubeUrls: string[]): Promise<ApiResponse<{
        queued: number;
        skipped: number;
    }>>;
    getCharacters(gameId?: string): Promise<ApiResponse<any[]>>;
    createCharacter(data: any): Promise<ApiResponse<any>>;
    updateCharacter(id: string, data: any): Promise<ApiResponse<any>>;
    deleteCharacter(id: string): Promise<ApiResponse<boolean>>;
}
//# sourceMappingURL=AdminService.d.ts.map