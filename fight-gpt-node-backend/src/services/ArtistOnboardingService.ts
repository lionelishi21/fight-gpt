import { BaseService } from './BaseService';
import { IArtistProfileRepository } from '../repositories/ArtistProfileRepository';
import { IOnboardingDocumentRepository } from '../repositories/OnboardingDocumentRepository';
import { ISplitSheetRepository } from '../repositories/SplitSheetRepository';
import { ITrackSubmissionRepository } from '../repositories/TrackSubmissionRepository';
import { IAdminArtistReviewRepository } from '../repositories/AdminArtistReviewRepository';
import { IArtistProfile } from '../models/ArtistProfile';
import { DocumentType } from '../models/OnboardingDocument';
import crypto from 'crypto';

export interface IArtistOnboardingService {
    getOrCreateProfile(userId: string): Promise<IArtistProfile>;
    saveStep(userId: string, step: number, data: Record<string, any>): Promise<IArtistProfile>;
    submitForReview(userId: string): Promise<IArtistProfile>;
    getProfile(userId: string): Promise<IArtistProfile | null>;
    getDocuments(userId: string): Promise<any[]>;
    saveDocument(
        userId: string,
        artistProfileId: string,
        documentType: DocumentType,
        file: { originalname: string; mimetype: string; size: number; buffer: Buffer; storageKey: string; publicUrl?: string }
    ): Promise<any>;
    getTracks(userId: string): Promise<any[]>;
    submitTrack(userId: string, trackData: Record<string, any>): Promise<any>;
    saveSplitSheet(userId: string, splitData: Record<string, any>): Promise<any>;
}

export class ArtistOnboardingService extends BaseService implements IArtistOnboardingService {
    constructor(
        private readonly artistProfileRepo: IArtistProfileRepository,
        private readonly documentRepo: IOnboardingDocumentRepository,
        private readonly splitSheetRepo: ISplitSheetRepository,
        private readonly trackRepo: ITrackSubmissionRepository,
        private readonly reviewRepo: IAdminArtistReviewRepository
    ) {
        super();
    }

    async getOrCreateProfile(userId: string): Promise<IArtistProfile> {
        const existing = await this.artistProfileRepo.findByUserId(userId);
        if (existing) return existing;
        return this.artistProfileRepo.create({
            userId: userId as any,
            onboardingStatus: 'draft',
            onboardingStep: 1,
            stageName: '',
            legalName: '',
            country: '',
            artistType: 'solo_artist',
            genres: [],
            hasPublisher: false,
            agreedToTOS: false,
            agreedToDistributionAgreement: false,
            agreedToContentPolicy: false,
            kycStatus: 'not_started',
            payoutMethod: 'not_configured',
            flaggedForReview: false,
        } as any);
    }

    async getProfile(userId: string): Promise<IArtistProfile | null> {
        return this.artistProfileRepo.findByUserId(userId);
    }

    async saveStep(userId: string, step: number, data: Record<string, any>): Promise<IArtistProfile> {
        const profile = await this.getOrCreateProfile(userId);
        const profileId = (profile as any)._id.toString();

        const allowedByStep: Record<number, string[]> = {
            1: ['artistType', 'stageName', 'legalName', 'country', 'dateOfBirth', 'entityType'],
            2: ['bio', 'genres', 'subGenres', 'profileImageUrl', 'bannerImageUrl', 'socialLinks'],
            3: ['isni', 'ipiCaeNumber', 'proAffiliation', 'proMembershipNumber', 'hasPublisher', 'publisherName', 'publisherIPI'],
            4: ['masterOwnership', 'publishingOwnership', 'distributionType', 'distributionTerritories',
                'hasExistingDistribution', 'existingDistributors', 'contentRating',
                'agreedToTOS', 'tosVersion', 'tosAgreedIp',
                'agreedToDistributionAgreement', 'agreedToContentPolicy'],
            5: ['taxCountry', 'taxFormType', 'taxIdLast4', 'usPerson', 'vatNumber'],
            6: ['kycDocumentType', 'kycDocumentCountry'],
            7: ['payoutMethod', 'payoutCurrency', 'payoutThreshold', 'payoutSchedule',
                'bankAccount', 'paypalEmail', 'jemdexAccountId', 'jemdexRegion'],
            8: ['defaultSplits'],
        };

        const allowed = allowedByStep[step] || [];
        const filtered: Record<string, any> = {};
        for (const key of allowed) {
            if (key in data) filtered[key] = data[key];
        }

        if (step === 4) {
            if (filtered.agreedToTOS === true) filtered.tosAgreedAt = new Date();
            if (filtered.agreedToDistributionAgreement === true) filtered.distributionAgreementSignedAt = new Date();
            if (filtered.agreedToContentPolicy === true) filtered.contentPolicyAgreedAt = new Date();
        }

        const updated = await this.artistProfileRepo.advanceStep(profileId, step);
        await this.artistProfileRepo.update(profileId, filtered);

        return (await this.artistProfileRepo.findByUserId(userId))!;
    }

    async submitForReview(userId: string): Promise<IArtistProfile> {
        const profile = await this.artistProfileRepo.findByUserId(userId);
        if (!profile) throw new Error('Artist profile not found');
        if (profile.onboardingStatus !== 'draft') throw new Error('Profile is not in draft status');

        const errors = this.validateForSubmission(profile);
        if (errors.length > 0) throw new Error(`Cannot submit: ${errors.join(', ')}`);

        const profileId = (profile as any)._id.toString();
        await this.artistProfileRepo.update(profileId, {
            onboardingStatus: 'pending_review',
            submittedAt: new Date(),
        });

        await this.reviewRepo.create({
            artistProfileId: profileId as any,
            reviewType: 'initial_approval',
            status: 'queued',
            priority: 'normal',
        } as any);

        return (await this.artistProfileRepo.findByUserId(userId))!;
    }

    private validateForSubmission(profile: IArtistProfile): string[] {
        const errors: string[] = [];
        if (!profile.stageName) errors.push('Stage name is required');
        if (!profile.legalName) errors.push('Legal name is required');
        if (!profile.country) errors.push('Country is required');
        if (!profile.artistType) errors.push('Artist type is required');
        if (!profile.agreedToTOS) errors.push('Terms of service must be accepted');
        if (!profile.agreedToDistributionAgreement) errors.push('Distribution agreement must be accepted');
        if (!profile.agreedToContentPolicy) errors.push('Content policy must be accepted');
        if (profile.payoutMethod === 'not_configured') errors.push('Payout method must be configured');
        return errors;
    }

    async getDocuments(userId: string): Promise<any[]> {
        const profile = await this.artistProfileRepo.findByUserId(userId);
        if (!profile) return [];
        return this.documentRepo.findByArtistProfile((profile as any)._id.toString());
    }

    async saveDocument(
        userId: string,
        artistProfileId: string,
        documentType: DocumentType,
        file: { originalname: string; mimetype: string; size: number; buffer: Buffer; storageKey: string; publicUrl?: string }
    ): Promise<any> {
        const checksum = crypto.createHash('sha256').update(file.buffer).digest('hex');
        return this.documentRepo.create({
            artistProfileId: artistProfileId as any,
            userId: userId as any,
            documentType,
            originalFilename: file.originalname,
            storageKey: file.storageKey,
            publicUrl: file.publicUrl,
            mimeType: file.mimetype,
            fileSizeBytes: file.size,
            uploadedAt: new Date(),
            status: 'uploaded',
            checksum,
        } as any);
    }

    async getTracks(userId: string): Promise<any[]> {
        const profile = await this.artistProfileRepo.findByUserId(userId);
        if (!profile) return [];

        if (profile.onboardingStatus !== 'approved') {
            throw new Error('Artist profile must be approved before uploading tracks');
        }

        return this.trackRepo.findByArtistProfile((profile as any)._id.toString());
    }

    async submitTrack(userId: string, trackData: Record<string, any>): Promise<any> {
        const profile = await this.artistProfileRepo.findByUserId(userId);
        if (!profile) throw new Error('Artist profile not found');
        if (profile.onboardingStatus !== 'approved') {
            throw new Error('Artist profile must be approved before uploading tracks');
        }

        const artistProfileId = (profile as any)._id.toString();
        return this.trackRepo.create({
            artistProfileId: artistProfileId as any,
            ...trackData,
            status: 'submitted',
            submittedAt: new Date(),
        } as any);
    }

    async saveSplitSheet(userId: string, splitData: Record<string, any>): Promise<any> {
        const profile = await this.artistProfileRepo.findByUserId(userId);
        if (!profile) throw new Error('Artist profile not found');

        const artistProfileId = (profile as any)._id.toString();
        const { parties = [] } = splitData;

        const totalMaster = parties.reduce((sum: number, p: any) => sum + (p.masterSplit || 0), 0);
        const totalPublishing = parties.reduce((sum: number, p: any) => sum + (p.publishingSplit || 0), 0);

        return this.splitSheetRepo.create({
            artistProfileId: artistProfileId as any,
            ...splitData,
            parties,
            totalMasterSplit: totalMaster,
            totalPublishingSplit: totalPublishing,
            status: 'draft',
        } as any);
    }
}
