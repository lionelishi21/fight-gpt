/**
 * UUID helper
 * Follows Single Responsibility Principle - handles UUID generation and validation
 */
export declare class UuidHelper {
    /**
     * Generate a new UUID v4
     */
    static generate(): string;
    /**
     * Validate UUID format
     */
    static validate(uuid: string): boolean;
}
//# sourceMappingURL=uuidHelper.d.ts.map