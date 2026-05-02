"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.BaseService = void 0;
/**
 * Base service class
 * Follows Single Responsibility Principle - provides base functionality
 * Follows Open/Closed Principle - can be extended without modification
 */
class BaseService {
    handleError(error, operation) {
        if (error instanceof Error) {
            return new Error(`Service ${operation} failed: ${error.message}`);
        }
        return new Error(`Service ${operation} failed: Unknown error`);
    }
}
exports.BaseService = BaseService;
//# sourceMappingURL=BaseService.js.map