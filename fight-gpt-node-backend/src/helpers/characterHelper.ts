import { CharacterMove, CharacterStats, MoveTag } from '../types/character';

/**
 * Character helper class
 * Follows Single Responsibility Principle - provides utility functions for character operations
 */
export class CharacterHelper {
  /**
   * Validate move structure
   */
  public static validateMove(move: CharacterMove): boolean {
    if (!move.id || typeof move.id !== 'string') return false;
    if (!move.name || typeof move.name !== 'string') return false;
    if (typeof move.startup !== 'number') return false;
    if (typeof move.active !== 'number') return false;
    if (typeof move.recovery !== 'number') return false;
    if (typeof move.on_block !== 'number') return false;
    if (!Array.isArray(move.tags)) return false;

    return true;
  }

  /**
   * Validate stats structure
   */
  public static validateStats(stats: CharacterStats): boolean {
    if (!stats || typeof stats !== 'object') return false;
    return true;
  }

  /**
   * Get move by ID from moves array
   */
  public static getMoveById(moves: CharacterMove[], moveId: string): CharacterMove | undefined {
    return moves.find((move) => move.id === moveId);
  }

  /**
   * Filter moves by tags
   */
  public static filterMovesByTags(moves: CharacterMove[], tags: MoveTag[]): CharacterMove[] {
    return moves.filter((move) => tags.some((tag) => move.tags.includes(tag)));
  }

  /**
   * Get moves with specific property range
   */
  public static getMovesByRange(
    moves: CharacterMove[],
    property: keyof CharacterMove,
    min?: number,
    max?: number
  ): CharacterMove[] {
    return moves.filter((move) => {
      const value = move[property];
      if (typeof value !== 'number') return false;
      if (min !== undefined && value < min) return false;
      if (max !== undefined && value > max) return false;
      return true;
    });
  }

  /**
   * Calculate move total frames
   */
  public static getMoveTotalFrames(move: CharacterMove): number {
    return move.startup + move.active + move.recovery;
  }

  /**
   * Get safe moves (on_block >= 0)
   */
  public static getSafeMoves(moves: CharacterMove[]): CharacterMove[] {
    return moves.filter((move) => move.on_block >= 0);
  }

  /**
   * Get unsafe moves (on_block < 0)
   */
  public static getUnsafeMoves(moves: CharacterMove[]): CharacterMove[] {
    return moves.filter((move) => move.on_block < 0);
  }

  /**
   * Get punishable moves (on_block <= -5)
   */
  public static getPunishableMoves(moves: CharacterMove[]): CharacterMove[] {
    return moves.filter((move) => move.on_block <= -5);
  }

  /**
   * Sort moves by property
   */
  public static sortMovesBy(
    moves: CharacterMove[],
    property: keyof CharacterMove,
    order: 'asc' | 'desc' = 'asc'
  ): CharacterMove[] {
    const sorted = [...moves].sort((a, b) => {
      const aVal = a[property];
      const bVal = b[property];

      if (typeof aVal === 'number' && typeof bVal === 'number') {
        return order === 'asc' ? aVal - bVal : bVal - aVal;
      }

      if (typeof aVal === 'string' && typeof bVal === 'string') {
        return order === 'asc' ? aVal.localeCompare(bVal) : bVal.localeCompare(aVal);
      }

      return 0;
    });

    return sorted;
  }

  /**
   * Calculate average frame data
   */
  public static getAverageFrameData(moves: CharacterMove[]): {
    avgStartup: number;
    avgActive: number;
    avgRecovery: number;
    avgOnBlock: number;
  } {
    if (moves.length === 0) {
      return {
        avgStartup: 0,
        avgActive: 0,
        avgRecovery: 0,
        avgOnBlock: 0,
      };
    }

    const total = moves.reduce(
      (acc, move) => ({
        startup: acc.startup + move.startup,
        active: acc.active + move.active,
        recovery: acc.recovery + move.recovery,
        onBlock: acc.onBlock + move.on_block,
      }),
      { startup: 0, active: 0, recovery: 0, onBlock: 0 }
    );

    return {
      avgStartup: total.startup / moves.length,
      avgActive: total.active / moves.length,
      avgRecovery: total.recovery / moves.length,
      avgOnBlock: total.onBlock / moves.length,
    };
  }

  /**
   * Format character name for display
   */
  public static formatCharacterName(name: string): string {
    return name
      .split('_')
      .map((word) => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
      .join(' ');
  }

  /**
   * Generate character slug from name
   */
  public static generateSlug(name: string): string {
    return name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '');
  }
}

