import mongoose, { Document } from 'mongoose';
/**
 * Audit log document interface
 */
export interface IAuditLog extends Document {
    request_id: string;
    endpoint: string;
    method: string;
    ip_address?: string;
    user_agent?: string;
    request_body?: Record<string, unknown>;
    response_status?: number;
    response_time_ms?: number;
    error_message?: string;
    created_at: Date;
}
/**
 * Audit log model
 */
export declare const AuditLog: mongoose.Model<IAuditLog, {}, {}, {}, mongoose.Document<unknown, {}, IAuditLog, {}, {}> & IAuditLog & Required<{
    _id: mongoose.Types.ObjectId;
}> & {
    __v: number;
}, any>;
//# sourceMappingURL=AuditLog.d.ts.map