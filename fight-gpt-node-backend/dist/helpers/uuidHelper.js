"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.UuidHelper = void 0;
const uuid_1 = require("uuid");
/**
 * UUID helper
 * Follows Single Responsibility Principle - handles UUID generation and validation
 */
class UuidHelper {
    /**
     * Generate a new UUID v4
     */
    static generate() {
        return (0, uuid_1.v4)();
    }
    /**
     * Validate UUID format
     */
    static validate(uuid) {
        return (0, uuid_1.validate)(uuid);
    }
}
exports.UuidHelper = UuidHelper;
//# sourceMappingURL=uuidHelper.js.map