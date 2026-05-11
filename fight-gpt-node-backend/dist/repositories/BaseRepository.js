"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.BaseRepository = void 0;
/**
 * Base repository class implementing common repository operations
 * Follows Single Responsibility Principle (SRP) - each repository handles one entity type
 * Follows Dependency Inversion Principle (DIP) - depends on Model abstraction
 */
class BaseRepository {
    model;
    constructor(model) {
        this.model = model;
    }
    /**
     * Find document by ID
     */
    async findById(id) {
        try {
            return await this.model.findById(id).exec();
        }
        catch (error) {
            throw this.handleError(error, 'findById');
        }
    }
    /**
     * Find one document matching filter
     */
    async findOne(filter) {
        try {
            return await this.model.findOne(filter).exec();
        }
        catch (error) {
            throw this.handleError(error, 'findOne');
        }
    }
    /**
     * Find many documents matching filter
     */
    async findMany(filter, options) {
        try {
            const query = this.model.find(filter);
            if (options?.sort) {
                query.sort(options.sort);
            }
            if (options?.limit) {
                query.limit(options.limit);
            }
            return await query.exec();
        }
        catch (error) {
            throw this.handleError(error, 'findMany');
        }
    }
    /**
     * Create a new document
     */
    async create(data) {
        try {
            const document = new this.model(data);
            const saved = await document.save();
            return saved;
        }
        catch (error) {
            throw this.handleError(error, 'create');
        }
    }
    /**
     * Update document by ID
     */
    async update(id, data) {
        try {
            return await this.model.findByIdAndUpdate(id, data, { new: true }).exec();
        }
        catch (error) {
            throw this.handleError(error, 'update');
        }
    }
    /**
     * Delete document by ID
     */
    async delete(id) {
        try {
            const result = await this.model.findByIdAndDelete(id).exec();
            return result !== null;
        }
        catch (error) {
            throw this.handleError(error, 'delete');
        }
    }
    /**
     * Check if document exists
     */
    async exists(filter) {
        try {
            const count = await this.model.countDocuments(filter).exec();
            return count > 0;
        }
        catch (error) {
            throw this.handleError(error, 'exists');
        }
    }
    /**
     * Count documents matching filter
     */
    async count(filter) {
        try {
            return await this.model.countDocuments(filter).exec();
        }
        catch (error) {
            throw this.handleError(error, 'count');
        }
    }
    /**
     * Handle errors consistently
     */
    handleError(error, operation) {
        if (error instanceof Error) {
            return new Error(`Repository ${operation} failed: ${error.message}`);
        }
        return new Error(`Repository ${operation} failed: Unknown error`);
    }
}
exports.BaseRepository = BaseRepository;
//# sourceMappingURL=BaseRepository.js.map