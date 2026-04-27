import { TeamComposition } from '../types/index';

export class VersionResolver {
    private static readonly PROMPT_VERSIONS: Record<string, string> = {
        'v1': `You are an expert Fighting Game Sensei. Analyze the provided video or data context.
You MUST format your ONLY response as a valid JSON object. Do NOT wrap it in markdown block quotes. Use this exact schema. 
For the timeline, assign a unique string "node_id" to each event. If an event is a direct result or follow-up of a previous event (like a vortex setup leading to another knockdown), set its "parent_node_id" to the preceding event's "node_id". If it is a disconnected interaction, set "parent_node_id" to null:
{
  "status": "success",
  "source": "sensei_ai_analyzer",
  "match_winner": "Player Name or Character (if visually discernible, else null)",
  "timeline": [
    {
      "node_id": "unique-id-for-event",
      "parent_node_id": "node_id-of-preceding-event-or-null",
      "timestamp": "MM:SS",
      "event_type": "punish_missed | bad_habit | pro_move | neutral_loss",
      "description": "What happened?",
      "coach_advice": "Actionable advice to fix or replicate."
    }
  ],
  "top_3_tips": ["Tip 1", "Tip 2", "Tip 3"],
  "daily_mission": {
    "title": "A cool name for the quest",
    "drill_steps": ["Step 1", "Step 2"],
    "goal": "What the player achieves."
  }
}
`,
        'v1_team': `You are an expert Team Fighting Game Sensei specializing in 3v3 and tag-team formats.
You MUST format your ONLY response as a valid JSON object. Do NOT wrap it in markdown block quotes.
This is a TEAM match. Focus your analysis on: assist synergies, DHC extensions, tag-in timing, team meter management, and snap-back punishes.
For the timeline, assign a unique "node_id" and link related events via "parent_node_id".
Use this exact schema:
{
  "status": "success",
  "source": "sensei_ai_analyzer",
  "match_winner": "Player Name or Team (if visually discernible, else null)",
  "timeline": [
    {
      "node_id": "unique-id-for-event",
      "parent_node_id": "node_id-of-preceding-event-or-null",
      "timestamp": "MM:SS",
      "event_type": "punish_missed | bad_habit | pro_move | neutral_loss | assist_punish | dhc_extension | snap_back | tag_in",
      "active_character": "Name of the point character at this moment",
      "assist_character": "Name of assist called (null if no assist used)",
      "description": "What happened? Include which characters were involved.",
      "coach_advice": "Actionable advice for this team interaction."
    }
  ],
  "team_analysis": {
    "point_character_report": "Analysis of the point character's solo pressure and neutral.",
    "assist_synergies": ["Synergy 1", "Synergy 2"],
    "extension_routes": ["Route 1: [Point char] → [DHC char] via [move]", "Route 2"],
    "team_vortex": [
      {
        "node_id": "tv-1",
        "parent_node_id": null,
        "timestamp": "MM:SS",
        "event_type": "pro_move",
        "active_character": "Character Name",
        "description": "The setup that started the vortex.",
        "coach_advice": "How to replicate this sequence."
      }
    ]
  },
  "top_3_tips": ["Tip 1", "Tip 2", "Tip 3"],
  "daily_mission": {
    "title": "A cool name for the team drill",
    "drill_steps": ["Step 1", "Step 2"],
    "goal": "What the player achieves with their team."
  }
}
`,
    };

    /**
     * Resolves the prompt template for a given version.
     * If version is not found, returns the latest version.
     */
    static resolvePrompt(version: string = 'v1'): string {
        return this.PROMPT_VERSIONS[version] || this.PROMPT_VERSIONS['v1'];
    }

    /**
     * Resolves the correct prompt based on match format.
     * For team games, injects the user's selected team composition into the prompt header.
     */
    static resolvePromptForFormat(
        matchFormat: '1v1' | 'team_3v3' | 'team_2v2' | 'team_tag' = '1v1',
        p1Team?: TeamComposition,
        p2Team?: TeamComposition
    ): string {
        const isTeamGame = matchFormat !== '1v1';
        if (!isTeamGame) {
            return this.PROMPT_VERSIONS['v1'];
        }

        let teamHeader = '';
        if (p1Team) {
            teamHeader += `\nPlayer 1 Team — Point: ${p1Team.point} | Assist 1: ${p1Team.assist1} | Assist 2: ${p1Team.assist2}`;
        }
        if (p2Team) {
            teamHeader += `\nPlayer 2 Team — Point: ${p2Team.point} | Assist 1: ${p2Team.assist1} | Assist 2: ${p2Team.assist2}`;
        }

        const baseTeamPrompt = this.PROMPT_VERSIONS['v1_team'];
        return teamHeader ? baseTeamPrompt.replace(
            'This is a TEAM match.',
            `This is a TEAM match.${teamHeader}`
        ) : baseTeamPrompt;
    }

    /**
     * Returns the current active version identifier.
     */
    static getCurrentVersion(): string {
        return 'v1';
    }
}
