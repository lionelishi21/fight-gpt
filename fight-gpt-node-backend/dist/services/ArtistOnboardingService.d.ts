import { BaseService } from './BaseService';
import { IArtistProfileRepository } from '../repositories/ArtistProfileRepository';
import { IOnboardingDocumentRepository } from '../repositories/OnboardingDocumentRepository';
import { ISplitSheetRepository } from '../repositories/SplitSheetRepository';
import { ITrackSubmissionRepository } from '../repositories/TrackSubmissionRepository';
import { IAdminArtistReviewRepository } from '../repositories/AdminArtistReviewRepository';
import { IArtistProfile } from '../models/ArtistProfile';
import { DocumentType } from '../models/OnboardingDocument';
export interface IArtistOnboardingService {
    getOrCreateProfile(userId: string): Promise<IArtistProfile>;
    saveStep(userId: string, step: number, data: Record<string, any>): Promise<IArtistProfile>;
    submitForReview(userId: string): Promise<IArtistProfile>;
    getProfile(userId: string): Promise<IArtistProfile | null>;
    getDocuments(userId: string): Promise<any[]>;
    saveDocument(userId: string, artistProfileId: string, documentType: DocumentType, file: {
        originalname: string;
        mimetype: string;
        size: number;
        buffer: Buffer;
        storageKey: string;
        publicUrl?: string;
    }): Promise<any>;
    getTracks(userId: string): Promise<any[]>;
    submitTrack(userId: string, trackData: Record<string, any>): Promise<any>;
    saveSplitSheet(userId: string, splitData: Record<string, any>): Promise<any>;
}
export declare class ArtistOnboardingService extends BaseService implements IArtistOnboardingService {
    private readonly artistProfileRepo;
    private readonly documentRepo;
    private readonly splitSheetRepo;
    private readonly trackRepo;
    private readonly reviewRepo;
    constructor(artistProfileRepo: IArtistProfileRepository, documentRepo: IOnboardingDocumentRepository, splitSheetRepo: ISplitSheetRepository, trackRepo: ITrackSubmissionRepository, reviewRepo: IAdminArtistReviewRepository);
    getOrCreateProfile(userId: string): Promise<IArtistProfile>;
    getProfile(userId: string): Promise<IArtistProfile | null>;
    saveStep(userId: string, step: number, data: Record<string, any>): Promise<IArtistProfile>;
    submitForReview(userId: string): Promise<IArtistProfile>;
    private validateForSubmission;
    getDocuments(userId: string): Promise<any[]>;
    saveDocument(userId: string, artistProfileId: string, documentType: DocumentType, file: {
        originalname: string;
        mimetype: string;
        size: number;
        buffer: Buffer;
        storageKey: string;
        publicUrl?: string;
    }): Promise<any>;
    getTracks(userId: string): Promise<any[]>;
    submitTrack(userId: string, trackData: Record<string, any>): Promise<any>;
    saveSplitSheet(userId: string, splitData: Record<string, any>): Promise<any>;
}
//# sourceMappingURL=ArtistOnboardingService.d.ts.map