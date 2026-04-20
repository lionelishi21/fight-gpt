import { BaseRepository } from './BaseRepository';
import { AuditLog, IAuditLog } from '../models/AuditLog';

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

export class AuditLogRepository extends BaseRepository<IAuditLog> implements IAuditLogRepository {
  constructor() {
    super(AuditLog);
  }

  async createAuditLog(data: AuditLogData): Promise<IAuditLog> {
    return this.create(data as Partial<IAuditLog>);
  }

  async findRecentLogs(limit: number = 100): Promise<IAuditLog[]> {
    return this.findMany({}, { sort: { created_at: -1 }, limit });
  }
}
