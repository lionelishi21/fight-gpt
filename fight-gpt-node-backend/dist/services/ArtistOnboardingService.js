"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.ArtistOnboardingService = void 0;
const BaseService_1 = require("./BaseService");
const crypto_1 = __importDefault(require("crypto"));
class ArtistOnboardingService extends BaseService_1.BaseService {
    artistProfileRepo;
    documentRepo;
    splitSheetRepo;
    trackRepo;
    reviewRepo;
    constructor(artistProfileRepo, documentRepo, splitSheetRepo, trackRepo, reviewRepo) {
        super();
        this.artistProfileRepo = artistProfileRepo;
        this.documentRepo = documentRepo;
        this.splitSheetRepo = splitSheetRepo;
        this.trackRepo = trackRepo;
        this.reviewRepo = reviewRepo;
    }
    async getOrCreateProfile(userId) {
        const existing = await this.artistProfileRepo.findByUserId(userId);
        if (existing)
            return existing;
        return this.artistProfileRepo.create({
            userId: userId,
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
        });
    }
    async getProfile(userId) {
        return this.artistProfileRepo.findByUserId(userId);
    }
    async saveStep(userId, step, data) {
        const profile = await this.getOrCreateProfile(userId);
        const profileId = profile._id.toString();
        const allowedByStep = {
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
        const filtered = {};
        for (const key of allowed) {
            if (key in data)
                filtered[key] = data[key];
        }
        if (step === 4) {
            if (filtered.agreedToTOS === true)
                filtered.tosAgreedAt = new Date();
            if (filtered.agreedToDistributionAgreement === true)
                filtered.distributionAgreementSignedAt = new Date();
            if (filtered.agreedToContentPolicy === true)
                filtered.contentPolicyAgreedAt = new Date();
        }
        const updated = await this.artistProfileRepo.advanceStep(profileId, step);
        await this.artistProfileRepo.update(profileId, filtered);
        return (await this.artistProfileRepo.findByUserId(userId));
    }
    async submitForReview(userId) {
        const profile = await this.artistProfileRepo.findByUserId(userId);
        if (!profile)
            throw new Error('Artist profile not found');
        if (profile.onboardingStatus !== 'draft')
            throw new Error('Profile is not in draft status');
        const errors = this.validateForSubmission(profile);
        if (errors.length > 0)
            throw new Error(`Cannot submit: ${errors.join(', ')}`);
        const profileId = profile._id.toString();
        await this.artistProfileRepo.update(profileId, {
            onboardingStatus: 'pending_review',
            submittedAt: new Date(),
        });
        await this.reviewRepo.create({
            artistProfileId: profileId,
            reviewType: 'initial_approval',
            status: 'queued',
            priority: 'normal',
        });
        return (await this.artistProfileRepo.findByUserId(userId));
    }
    validateForSubmission(profile) {
        const errors = [];
        if (!profile.stageName)
            errors.push('Stage name is required');
        if (!profile.legalName)
            errors.push('Legal name is required');
        if (!profile.country)
            errors.push('Country is required');
        if (!profile.artistType)
            errors.push('Artist type is required');
        if (!profile.agreedToTOS)
            errors.push('Terms of service must be accepted');
        if (!profile.agreedToDistributionAgreement)
            errors.push('Distribution agreement must be accepted');
        if (!profile.agreedToContentPolicy)
            errors.push('Content policy must be accepted');
        if (profile.payoutMethod === 'not_configured')
            errors.push('Payout method must be configured');
        return errors;
    }
    async getDocuments(userId) {
        const profile = await this.artistProfileRepo.findByUserId(userId);
        if (!profile)
            return [];
        return this.documentRepo.findByArtistProfile(profile._id.toString());
    }
    async saveDocument(userId, artistProfileId, documentType, file) {
        const checksum = crypto_1.default.createHash('sha256').update(file.buffer).digest('hex');
        return this.documentRepo.create({
            artistProfileId: artistProfileId,
            userId: userId,
            documentType,
            originalFilename: file.originalname,
            storageKey: file.storageKey,
            publicUrl: file.publicUrl,
            mimeType: file.mimetype,
            fileSizeBytes: file.size,
            uploadedAt: new Date(),
            status: 'uploaded',
            checksum,
        });
    }
    async getTracks(userId) {
        const profile = await this.artistProfileRepo.findByUserId(userId);
        if (!profile)
            return [];
        if (profile.onboardingStatus !== 'approved') {
            throw new Error('Artist profile must be approved before uploading tracks');
        }
        return this.trackRepo.findByArtistProfile(profile._id.toString());
    }
    async submitTrack(userId, trackData) {
        const profile = await this.artistProfileRepo.findByUserId(userId);
        if (!profile)
            throw new Error('Artist profile not found');
        if (profile.onboardingStatus !== 'approved') {
            throw new Error('Artist profile must be approved before uploading tracks');
        }
        const artistProfileId = profile._id.toString();
        return this.trackRepo.create({
            artistProfileId: artistProfileId,
            ...trackData,
            status: 'submitted',
            submittedAt: new Date(),
        });
    }
    async saveSplitSheet(userId, splitData) {
        const profile = await this.artistProfileRepo.findByUserId(userId);
        if (!profile)
            throw new Error('Artist profile not found');
        const artistProfileId = profile._id.toString();
        const { parties = [] } = splitData;
        const totalMaster = parties.reduce((sum, p) => sum + (p.masterSplit || 0), 0);
        const totalPublishing = parties.reduce((sum, p) => sum + (p.publishingSplit || 0), 0);
        return this.splitSheetRepo.create({
            artistProfileId: artistProfileId,
            ...splitData,
            parties,
            totalMasterSplit: totalMaster,
            totalPublishingSplit: totalPublishing,
            status: 'draft',
        });
    }
}
exports.ArtistOnboardingService = ArtistOnboardingService;
//# sourceMappingURL=ArtistOnboardingService.js.map