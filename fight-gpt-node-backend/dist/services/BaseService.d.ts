/**
 * Base service interface
 * Follows Interface Segregation Principle - defines common service contract
 */
export interface IBaseService {
}
/**
 * Base service class
 * Follows Single Responsibility Principle - provides base functionality
 * Follows Open/Closed Principle - can be extended without modification
 */
export declare abstract class BaseService implements IBaseService {
    protected handleError(error: unknown, operation: string): Error;
}
//# sourceMappingURL=BaseService.d.ts.map