/**
 * Game helper class
 * Follows Single Responsibility Principle - provides utility functions for game operations
 */
export class GameHelper {
  /**
   * Normalize game_id to lowercase with underscores
   * Example: "Street Fighter 6" -> "street_fighter_6"
   */
  public static normalizeGameId(name: string): string {
    return name
      .toLowerCase()
      .replace(/[^a-z0-9\s]/g, '') // Remove special characters
      .trim()
      .replace(/\s+/g, '_') // Replace spaces with underscores
      .replace(/_+/g, '_') // Replace multiple underscores with single
      .replace(/^_|_$/g, ''); // Remove leading/trailing underscores
  }

  /**
   * Validate game_id format
   */
  public static validateGameId(gameId: string): boolean {
    const gameIdRegex = /^[a-z0-9_]+$/;
    return gameIdRegex.test(gameId);
  }

  /**
   * Format game name for display
   */
  public static formatGameName(name: string): string {
    return name
      .split(/[_\s]+/)
      .map((word) => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
      .join(' ');
  }

  /**
   * Generate game slug from name
   */
  public static generateSlug(name: string): string {
    return name
      .toLowerCase()
      .replace(/[^a-z0-9\s]/g, '')
      .trim()
      .replace(/\s+/g, '-')
      .replace(/-+/g, '-')
      .replace(/^-|-$/g, '');
  }

  /**
   * Check if game is active/supported
   */
  public static isGameActive(isActive: boolean): boolean {
    return isActive === true;
  }

  /**
   * Format platform array for display
   */
  public static formatPlatforms(platforms: string[]): string {
    if (!platforms || platforms.length === 0) {
      return 'N/A';
    }
    return platforms.join(', ');
  }

  /**
   * Get platform abbreviations
   */
  public static getPlatformAbbreviations(platforms: string[]): string[] {
    const abbreviations: Record<string, string> = {
      'PlayStation 5': 'PS5',
      'PlayStation 4': 'PS4',
      'Xbox Series X': 'XSX',
      'Xbox Series S': 'XSS',
      'Xbox One': 'XB1',
      'PC': 'PC',
      'Nintendo Switch': 'NS',
      'Steam Deck': 'SD',
    };

    return platforms.map(
      (platform) => abbreviations[platform] || platform.toUpperCase()
    );
  }
}


