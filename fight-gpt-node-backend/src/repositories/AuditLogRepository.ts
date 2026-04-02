import { BaseRepository } from './BaseRepository';
import { AuditLog, IAuditLog } from '../models/AuditLog';

/**
 * Audit log repository interface
 */
export interface IAuditLogRepository {
  createAuditLog(data: {
    request_id: string;
    endpoint: string;
    method: string;
    ip_address?: string;
    user_agent?: string;
    request_body?: Record<string, unknown>;
    response_status?: number;
    response_time_ms?: number;
    error_message?: string;
  }): Promise<IAuditLog>;
  findRecentLogs(limit: number): Promise<IAuditLog[]>;
}

/**
 * Audit log repository implementation
 */
export class AuditLogRepository extends BaseRepository<IAuditLog> implements IAuditLogRepository {
  constructor() {
    super(AuditLog);
  }

  /**
   * Create audit log entry
   */
  async createAuditLog(data: {
    request_id: string;
    endpoint: string;
    method: string;
    ip_address?: string;
    user_agent?: string;
    request_body?: Record<string, unknown>;
    response_status?: number;
    response_time_ms?: number;
    error_message?: string;
  }): Promise<IAuditLog> {
    return this.create(data as Partial<IAuditLog>);
  }

  /**
   * Find recent audit logs
   */
  async findRecentLogs(limit: number = 100): Promise<IAuditLog[]> {
    return this.findMany({}, { sort: { created_at: -1 }, limit });
  }
}

