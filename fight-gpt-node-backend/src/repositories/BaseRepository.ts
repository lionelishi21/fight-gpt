import { Model, Document, FilterQuery, UpdateQuery } from 'mongoose';

/**
 * Base repository interface following Repository Pattern
 * Provides common CRUD operations following SOLID principles
 */
export interface IBaseRepository<T extends Document> {
  findById(id: string): Promise<T | null>;
  findOne(filter: FilterQuery<T>): Promise<T | null>;
  findMany(
    filter: FilterQuery<T>,
    options?: { sort?: Record<string, 1 | -1>; limit?: number }
  ): Promise<T[]>;
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
export abstract class BaseRepository<T extends Document> implements IBaseRepository<T> {
  protected model: Model<T>;

  constructor(model: Model<T>) {
    this.model = model;
  }

  /**
   * Find document by ID
   */
  async findById(id: string): Promise<T | null> {
    try {
      return await this.model.findById(id).exec();
    } catch (error) {
      throw this.handleError(error, 'findById');
    }
  }

  /**
   * Find one document matching filter
   */
  async findOne(filter: FilterQuery<T>): Promise<T | null> {
    try {
      return await this.model.findOne(filter).exec();
    } catch (error) {
      throw this.handleError(error, 'findOne');
    }
  }

  /**
   * Find many documents matching filter
   */
  async findMany(
    filter: FilterQuery<T>,
    options?: { sort?: Record<string, 1 | -1>; limit?: number }
  ): Promise<T[]> {
    try {
      const query = this.model.find(filter);
      if (options?.sort) {
        query.sort(options.sort);
      }
      if (options?.limit) {
        query.limit(options.limit);
      }
      return await query.exec();
    } catch (error) {
      throw this.handleError(error, 'findMany');
    }
  }

  /**
   * Create a new document
   */
  async create(data: Partial<T>): Promise<T> {
    try {
      const document = new this.model(data);
      return await document.save();
    } catch (error) {
      throw this.handleError(error, 'create');
    }
  }

  /**
   * Update document by ID
   */
  async update(id: string, data: UpdateQuery<T>): Promise<T | null> {
    try {
      return await this.model.findByIdAndUpdate(id, data, { new: true }).exec();
    } catch (error) {
      throw this.handleError(error, 'update');
    }
  }

  /**
   * Delete document by ID
   */
  async delete(id: string): Promise<boolean> {
    try {
      const result = await this.model.findByIdAndDelete(id).exec();
      return result !== null;
    } catch (error) {
      throw this.handleError(error, 'delete');
    }
  }

  /**
   * Check if document exists
   */
  async exists(filter: FilterQuery<T>): Promise<boolean> {
    try {
      const count = await this.model.countDocuments(filter).exec();
      return count > 0;
    } catch (error) {
      throw this.handleError(error, 'exists');
    }
  }

  /**
   * Count documents matching filter
   */
  async count(filter: FilterQuery<T>): Promise<number> {
    try {
      return await this.model.countDocuments(filter).exec();
    } catch (error) {
      throw this.handleError(error, 'count');
    }
  }

  /**
   * Handle errors consistently
   */
  protected handleError(error: unknown, operation: string): Error {
    if (error instanceof Error) {
      return new Error(`Repository ${operation} failed: ${error.message}`);
    }
    return new Error(`Repository ${operation} failed: Unknown error`);
  }
}

