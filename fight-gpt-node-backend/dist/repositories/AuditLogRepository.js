"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.AuditLogRepository = void 0;
const BaseRepository_1 = require("./BaseRepository");
const AuditLog_1 = require("../models/AuditLog");
class AuditLogRepository extends BaseRepository_1.BaseRepository {
    constructor() {
        super(AuditLog_1.AuditLog);
    }
    async createAuditLog(data) {
        return this.create(data);
    }
    async findRecentLogs(limit = 100) {
        return this.findMany({}, { sort: { created_at: -1 }, limit });
    }
}
exports.AuditLogRepository = AuditLogRepository;
//# sourceMappingURL=AuditLogRepository.js.map