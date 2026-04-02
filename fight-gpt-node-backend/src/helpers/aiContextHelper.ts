import { IGameMetadata, GameRule as CharacterGameRule } from '../types/gameMetadata';

/**
 * AI Context Helper
 * Formats game metadata and character rules for AI prompts
 */

/**
 * Formatted game metadata for AI prompt
 */
export interface FormattedGameMetadata {
  constantsText: string;
  globalMechanicsText: string;
  fullContextText: string;
}

/**
 * Formatted character game rules for AI prompt
 */
export interface FormattedCharacterRules {
  rulesText: string;
  hasRules: boolean;
}

/**
 * Format GameMetadata for AI prompts
 * Converts structured data into human-readable text for the AI model
 */
export function formatGameMetadataForAI(metadata: IGameMetadata | null): FormattedGameMetadata {
  if (!metadata) {
    return {
      constantsText: '',
      globalMechanicsText: '',
      fullContextText: '',
    };
  }

  // Format constants
  const constants: string[] = [];
  if (metadata.constants) {
    if (metadata.constants.team_size !== undefined) {
      constants.push(`Team Size: ${metadata.constants.team_size} (${metadata.constants.team_size > 1 ? 'Team-based' : '1v1'})`);
    }
    if (metadata.constants.has_air_dash !== undefined) {
      constants.push(`Air Dash: ${metadata.constants.has_air_dash ? 'Available' : 'Not available'}`);
    }
    if (metadata.constants.has_3d_movement !== undefined) {
      constants.push(`3D Movement: ${metadata.constants.has_3d_movement ? 'Available (Sidestep/Dodge)' : '2D only'}`);
    }
    if (metadata.constants.has_assists !== undefined) {
      constants.push(`Assists: ${metadata.constants.has_assists ? 'Available' : 'Not available'}`);
    }
    if (metadata.constants.has_dhc !== undefined) {
      constants.push(`DHC (Delayed Hyper Combo): ${metadata.constants.has_dhc ? 'Available' : 'Not available'}`);
    }
    if (metadata.constants.has_team_supers !== undefined) {
      constants.push(`Team Supers: ${metadata.constants.has_team_supers ? 'Available' : 'Not available'}`);
    }
    if (metadata.constants.max_meter !== undefined) {
      constants.push(`Max Meter: ${metadata.constants.max_meter}`);
    }
  }

  const constantsText = constants.length > 0 ? constants.join('\n- ') : 'No constants defined';

  // Format global mechanics
  const mechanics: string[] = [];
  if (metadata.global_mechanics && metadata.global_mechanics.length > 0) {
    for (const mechanic of metadata.global_mechanics) {
      let mechanicText = `- ${mechanic.key}: `;

      // Format value based on type
      if (typeof mechanic.value === 'object' && mechanic.value !== null) {
        mechanicText += JSON.stringify(mechanic.value);
      } else {
        mechanicText += String(mechanic.value);
      }

      if (mechanic.description) {
        mechanicText += ` (${mechanic.description})`;
      }

      mechanics.push(mechanicText);
    }
  } else {
    mechanics.push('No global mechanics defined');
  }

  const globalMechanicsText = mechanics.join('\n');

  // Combine into full context
  const fullContextText = `GAME CONTEXT:
${constantsText}

GLOBAL MECHANICS:
${globalMechanicsText}`;

  return {
    constantsText,
    globalMechanicsText,
    fullContextText,
  };
}

/**
 * Format character game rules for AI prompts
 * Converts character-specific rules into human-readable text
 */
export function formatCharacterGameRulesForAI(
  rules: CharacterGameRule[] | null | undefined,
  characterLabel: string = 'Character'
): FormattedCharacterRules {
  if (!rules || rules.length === 0) {
    return {
      rulesText: '',
      hasRules: false,
    };
  }

  const formattedRules: string[] = [];
  formattedRules.push(`${characterLabel.toUpperCase()} GAME RULES:`);

  for (const rule of rules) {
    let ruleText = `- ${rule.key}: `;

    // Format value based on type
    if (typeof rule.value === 'object' && rule.value !== null) {
      ruleText += JSON.stringify(rule.value);
    } else {
      ruleText += String(rule.value);
    }

    if (rule.ui_type) {
      ruleText += ` [Type: ${rule.ui_type}]`;
    }

    if (rule.description) {
      ruleText += ` (${rule.description})`;
    }

    formattedRules.push(ruleText);
  }

  return {
    rulesText: formattedRules.join('\n'),
    hasRules: true,
  };
}

/**
 * Format full game context for AI prompt
 * Combines game metadata and character rules into a single formatted string
 */
export function formatFullGameContextForAI(
  gameMetadata: IGameMetadata | null,
  p1Rules: CharacterGameRule[] | null | undefined,
  p2Rules: CharacterGameRule[] | null | undefined
): string {
  const parts: string[] = [];

  // Add game metadata
  if (gameMetadata) {
    const formattedMetadata = formatGameMetadataForAI(gameMetadata);
    if (formattedMetadata.fullContextText) {
      parts.push(formattedMetadata.fullContextText);
    }
  }

  // Add P1 character rules
  if (p1Rules && p1Rules.length > 0) {
    const p1Formatted = formatCharacterGameRulesForAI(p1Rules, 'Player 1');
    if (p1Formatted.hasRules) {
      parts.push(p1Formatted.rulesText);
    }
  }

  // Add P2 character rules
  if (p2Rules && p2Rules.length > 0) {
    const p2Formatted = formatCharacterGameRulesForAI(p2Rules, 'Player 2');
    if (p2Formatted.hasRules) {
      parts.push(p2Formatted.rulesText);
    }
  }

  // If no context available, return empty string
  if (parts.length === 0) {
    return '';
  }

  return `\n\n---\n${parts.join('\n\n')}\n---\n`;
}

/**
 * Format game constants as a simple key-value list for AI
 */
export function formatGameConstantsForAI(constants: Record<string, unknown> | undefined | null): string {
  if (!constants || Object.keys(constants).length === 0) {
    return '';
  }

  const formatted: string[] = [];

  for (const [key, value] of Object.entries(constants)) {
    if (value !== undefined && value !== null) {
      formatted.push(`${key}: ${String(value)}`);
    }
  }

  return formatted.join(', ');
}
