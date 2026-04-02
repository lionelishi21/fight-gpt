import { BaseRepository } from './BaseRepository';
import { IMetaReportDocument, MetaReport } from '../models/MetaReport';

export interface IMetaRepository {
    createReport(data: Partial<IMetaReportDocument>): Promise<IMetaReportDocument>;
    getLatestReport(gameId: string, period?: string): Promise<IMetaReportDocument | null>;
    getReportById(reportId: string): Promise<IMetaReportDocument | null>;
    getReportHistory(gameId: string, limit?: number): Promise<IMetaReportDocument[]>;
    updateReport(reportId: string, data: Partial<IMetaReportDocument>): Promise<IMetaReportDocument | null>;
}

export class MetaRepository extends BaseRepository<IMetaReportDocument> implements IMetaRepository {
    constructor() {
        super(MetaReport);
    }

    async createReport(data: Partial<IMetaReportDocument>): Promise<IMetaReportDocument> {
        return this.model.create(data);
    }

    async getLatestReport(gameId: string, period?: string): Promise<IMetaReportDocument | null> {
        const filter: Record<string, unknown> = { game_id: gameId, status: 'ready' };
        if (period) filter.period = period;
        return this.model
            .findOne(filter)
            .sort({ generated_at: -1 })
            .exec();
    }

    async getReportById(reportId: string): Promise<IMetaReportDocument | null> {
        return this.model.findOne({ report_id: reportId }).exec();
    }

    async getReportHistory(gameId: string, limit: number = 10): Promise<IMetaReportDocument[]> {
        return this.model
            .find({ game_id: gameId, status: 'ready' })
            .sort({ generated_at: -1 })
            .limit(limit)
            .exec();
    }

    async updateReport(reportId: string, data: Partial<IMetaReportDocument>): Promise<IMetaReportDocument | null> {
        return this.model
            .findOneAndUpdate({ report_id: reportId }, { $set: data }, { new: true })
            .exec();
    }
}
