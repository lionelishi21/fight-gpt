import { BaseRepository, IBaseRepository } from './BaseRepository';
import { IOnboardingDocument } from '../models/OnboardingDocument';
import { DocumentType } from '../models/OnboardingDocument';
export interface IOnboardingDocumentRepository extends IBaseRepository<IOnboardingDocument> {
    findByArtistProfile(artistProfileId: string): Promise<IOnboardingDocument[]>;
    findByType(artistProfileId: string, documentType: DocumentType): Promise<IOnboardingDocument | null>;
    findAllByType(artistProfileId: string, documentType: DocumentType): Promise<IOnboardingDocument[]>;
    updateStatus(docId: string, status: IOnboardingDocument['status'], reviewedBy: string, rejectionReason?: string): Promise<IOnboardingDocument | null>;
    findPendingReview(limit?: number): Promise<IOnboardingDocument[]>;
}
export declare class OnboardingDocumentRepository extends BaseRepository<IOnboardingDocument> implements IOnboardingDocumentRepository {
    constructor();
    findByArtistProfile(artistProfileId: string): Promise<IOnboardingDocument[]>;
    findByType(artistProfileId: string, documentType: DocumentType): Promise<IOnboardingDocument | null>;
    findAllByType(artistProfileId: string, documentType: DocumentType): Promise<IOnboardingDocument[]>;
    updateStatus(docId: string, status: IOnboardingDocument['status'], reviewedBy: string, rejectionReason?: string): Promise<IOnboardingDocument | null>;
    findPendingReview(limit?: number): Promise<IOnboardingDocument[]>;
}
//# sourceMappingURL=OnboardingDocumentRepository.d.ts.map