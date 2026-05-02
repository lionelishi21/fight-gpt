import { BaseRepository } from './BaseRepository';
import { IAuditLog } from '../models/AuditLog';
export interface AuditLogData {
    request_id: string;
    endpoint: string;
    method: string;
    ip_address?: string;
    user_agent?: string;
    request_body?: any;
    response_status?: number;
    response_time_ms?: number;
    error_message?: string;
}
export interface IAuditLogRepository {
    createAuditLog(data: AuditLogData): Promise<IAuditLog>;
    findRecentLogs(limit: number): Promise<IAuditLog[]>;
}
export declare class AuditLogRepository extends BaseRepository<IAuditLog> implements IAuditLogRepository {
    constructor();
    createAuditLog(data: AuditLogData): Promise<IAuditLog>;
    findRecentLogs(limit?: number): Promise<IAuditLog[]>;
}
//# sourceMappingURL=AuditLogRepository.d.ts.map