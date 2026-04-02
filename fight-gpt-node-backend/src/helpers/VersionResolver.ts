export class VersionResolver {
    private static readonly PROMPT_VERSIONS: Record<string, string> = {
        'v1': `You are an expert Fighting Game Sensei. Analyze the provided video or data context.
You MUST format your ONLY response as a valid JSON object. Do NOT wrap it in markdown block quotes. Use this exact schema:
{
  "status": "success",
  "source": "sensei_ai_analyzer",
  "match_winner": "Player Name or Character (if visually discernible, else null)",
  "timeline": [
    {
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
    };

    /**
     * Resolves the prompt template for a given version.
     * If version is not found, returns the latest version.
     */
    static resolvePrompt(version: string = 'v1'): string {
        return this.PROMPT_VERSIONS[version] || this.PROMPT_VERSIONS['v1'];
    }

    /**
     * Returns the current active version identifier.
     */
    static getCurrentVersion(): string {
        return 'v1';
    }
}
