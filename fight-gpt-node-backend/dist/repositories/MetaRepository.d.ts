import { BaseRepository } from './BaseRepository';
import { IMetaReportDocument } from '../models/MetaReport';
export interface IMetaRepository {
    createReport(data: Partial<IMetaReportDocument>): Promise<IMetaReportDocument>;
    getLatestReport(gameId: string, period?: string): Promise<IMetaReportDocument | null>;
    getReportById(reportId: string): Promise<IMetaReportDocument | null>;
    getReportHistory(gameId: string, limit?: number): Promise<IMetaReportDocument[]>;
    updateReport(reportId: string, data: Partial<IMetaReportDocument>): Promise<IMetaReportDocument | null>;
}
export declare class MetaRepository extends BaseRepository<IMetaReportDocument> implements IMetaRepository {
    constructor();
    createReport(data: Partial<IMetaReportDocument>): Promise<IMetaReportDocument>;
    getLatestReport(gameId: string, period?: string): Promise<IMetaReportDocument | null>;
    getReportById(reportId: string): Promise<IMetaReportDocument | null>;
    getReportHistory(gameId: string, limit?: number): Promise<IMetaReportDocument[]>;
    updateReport(reportId: string, data: Partial<IMetaReportDocument>): Promise<IMetaReportDocument | null>;
}
//# sourceMappingURL=MetaRepository.d.ts.map