/**
 * Base service interface
 * Follows Interface Segregation Principle - defines common service contract
 */
export interface IBaseService {
  // Common service methods can be added here
}

/**
 * Base service class
 * Follows Single Responsibility Principle - provides base functionality
 * Follows Open/Closed Principle - can be extended without modification
 */
export abstract class BaseService implements IBaseService {
  protected handleError(error: unknown, operation: string): Error {
    if (error instanceof Error) {
      return new Error(`Service ${operation} failed: ${error.message}`);
    }
    return new Error(`Service ${operation} failed: Unknown error`);
  }
}

