import { BaseRepository, IBaseRepository } from './BaseRepository';
import { OnboardingDocument, IOnboardingDocument } from '../models/OnboardingDocument';
import { DocumentType } from '../models/OnboardingDocument';

export interface IOnboardingDocumentRepository extends IBaseRepository<IOnboardingDocument> {
    findByArtistProfile(artistProfileId: string): Promise<IOnboardingDocument[]>;
    findByType(artistProfileId: string, documentType: DocumentType): Promise<IOnboardingDocument | null>;
    findAllByType(artistProfileId: string, documentType: DocumentType): Promise<IOnboardingDocument[]>;
    updateStatus(docId: string, status: IOnboardingDocument['status'], reviewedBy: string, rejectionReason?: string): Promise<IOnboardingDocument | null>;
    findPendingReview(limit?: number): Promise<IOnboardingDocument[]>;
}

export class OnboardingDocumentRepository
    extends BaseRepository<IOnboardingDocument>
    implements IOnboardingDocumentRepository
{
    constructor() {
        super(OnboardingDocument);
    }

    async findByArtistProfile(artistProfileId: string): Promise<IOnboardingDocument[]> {
        return this.model.find({ artistProfileId })
            .sort({ uploadedAt: -1 })
            .lean().exec() as any;
    }

    async findByType(artistProfileId: string, documentType: DocumentType): Promise<IOnboardingDocument | null> {
        return this.model.findOne({ artistProfileId, documentType, status: { $ne: 'rejected' } })
            .sort({ uploadedAt: -1 })
            .lean().exec() as any;
    }

    async findAllByType(artistProfileId: string, documentType: DocumentType): Promise<IOnboardingDocument[]> {
        return this.model.find({ artistProfileId, documentType })
            .sort({ uploadedAt: -1 })
            .lean().exec() as any;
    }

    async updateStatus(
        docId: string,
        status: IOnboardingDocument['status'],
        reviewedBy: string,
        rejectionReason?: string
    ): Promise<IOnboardingDocument | null> {
        const update: any = { status, reviewedBy, reviewedAt: new Date() };
        if (rejectionReason) update.rejectionReason = rejectionReason;
        return this.model.findByIdAndUpdate(docId, update, { new: true }).lean().exec() as any;
    }

    async findPendingReview(limit = 20): Promise<IOnboardingDocument[]> {
        return this.model.find({ status: 'under_review' })
            .sort({ uploadedAt: 1 })
            .limit(limit).lean().exec() as any;
    }
}
