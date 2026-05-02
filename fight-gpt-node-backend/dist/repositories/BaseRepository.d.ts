import { Model, Document, FilterQuery, UpdateQuery } from 'mongoose';
/**
 * Base repository interface following Repository Pattern
 * Provides common CRUD operations following SOLID principles
 */
export interface IBaseRepository<T extends Document> {
    findById(id: string): Promise<T | null>;
    findOne(filter: FilterQuery<T>): Promise<T | null>;
    findMany(filter: FilterQuery<T>, options?: {
        sort?: Record<string, 1 | -1>;
        limit?: number;
    }): Promise<T[]>;
    create(data: Partial<T>): Promise<T>;
    update(id: string, data: UpdateQuery<T>): Promise<T | null>;
    delete(id: string): Promise<boolean>;
    exists(filter: FilterQuery<T>): Promise<boolean>;
    count(filter: FilterQuery<T>): Promise<number>;
}
/**
 * Base repository class implementing common repository operations
 * Follows Single Responsibility Principle (SRP) - each repository handles one entity type
 * Follows Dependency Inversion Principle (DIP) - depends on Model abstraction
 */
export declare abstract class BaseRepository<T extends Document> implements IBaseRepository<T> {
    protected model: Model<T>;
    constructor(model: Model<T>);
    /**
     * Find document by ID
     */
    findById(id: string): Promise<T | null>;
    /**
     * Find one document matching filter
     */
    findOne(filter: FilterQuery<T>): Promise<T | null>;
    /**
     * Find many documents matching filter
     */
    findMany(filter: FilterQuery<T>, options?: {
        sort?: Record<string, 1 | -1>;
        limit?: number;
    }): Promise<T[]>;
    /**
     * Create a new document
     */
    create(data: Partial<T>): Promise<T>;
    /**
     * Update document by ID
     */
    update(id: string, data: UpdateQuery<T>): Promise<T | null>;
    /**
     * Delete document by ID
     */
    delete(id: string): Promise<boolean>;
    /**
     * Check if document exists
     */
    exists(filter: FilterQuery<T>): Promise<boolean>;
    /**
     * Count documents matching filter
     */
    count(filter: FilterQuery<T>): Promise<number>;
    /**
     * Handle errors consistently
     */
    protected handleError(error: unknown, operation: string): Error;
}
//# sourceMappingURL=BaseRepository.d.ts.map