import mongoose, { Document, Schema } from 'mongoose';

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
 * Audit log schema definition
 */
const AuditLogSchema: Schema = new Schema(
  {
    request_id: {
      type: String,
      required: true,
      index: true,
    },
    endpoint: {
      type: String,
      required: true,
      index: true,
    },
    method: {
      type: String,
      required: true,
    },
    ip_address: {
      type: String,
      index: true,
    },
    user_agent: {
      type: String,
    },
    request_body: {
      type: Schema.Types.Mixed,
    },
    response_status: {
      type: Number,
      index: true,
    },
    response_time_ms: {
      type: Number,
    },
    error_message: {
      type: String,
    },
  },
  {
    timestamps: {
      createdAt: 'created_at',
      updatedAt: false,
    },
  }
);

// Index for querying recent logs
AuditLogSchema.index({ created_at: -1 });

/**
 * Audit log model
 */
export const AuditLog = mongoose.model<IAuditLog>('AuditLog', AuditLogSchema);

