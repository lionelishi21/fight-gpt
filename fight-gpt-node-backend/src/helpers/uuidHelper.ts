import { v4 as uuidv4, validate as uuidValidate } from 'uuid';

/**
 * UUID helper
 * Follows Single Responsibility Principle - handles UUID generation and validation
 */
export class UuidHelper {
  /**
   * Generate a new UUID v4
   */
  public static generate(): string {
    return uuidv4();
  }

  /**
   * Validate UUID format
   */
  public static validate(uuid: string): boolean {
    return uuidValidate(uuid);
  }
}

