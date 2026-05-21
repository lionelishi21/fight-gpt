# 06 · Weekly Meta Brief Cron

**Priority:** 🟠 P1 — Retention  
**Status:** `todo`  
**Effort:** 3 hours  

---

## What It Is

Every Monday at 8 AM UTC, send a branded email to all Competitor+ users  
summarising the week's meta: tier movements, trending tech, VOD count.  
Email template 04 is already built (`sendWeeklyBriefEmail`).

---

## Implementation

### Cron Job (Backend worker.ts or separate cron)
```typescript
// Every Monday 08:00 UTC
cron.schedule('0 8 * * 1', async () => {
  const games = ['sf6', 'tekken8', 'ggst'];
  
  for (const gameId of games) {
    // Pull last 7 days of scenario data
    const scenarios = await Scenario.find({
      game_id: gameId,
      created_at: { $gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) }
    }).lean();
    
    if (scenarios.length < 10) continue; // Not enough data
    
    // Calculate tier movements from win rates
    const tierMovements = buildTierMovements(scenarios);
    
    // Get all Competitor+ users who play this game
    const users = await User.find({ 
      tier: { $in: ['COMPETITOR', 'PRO'] },
      'preferences.games': gameId,
    }).select('email').lean();
    
    const emails = users.map(u => u.email);
    
    await emailService.sendWeeklyBriefEmail(emails, {
      week:          getISOWeek(new Date()),
      gameId,
      vodCount:      scenarios.length,
      theoryCount:   await TheoryDoc.countDocuments({ game_id: gameId, created_at: { $gte: weekStart } }),
      metaShift:     calculateMetaShift(tierMovements),
      dateRange:     `${formatDate(weekStart)} – ${formatDate(new Date())}`,
      briefUrl:      `https://metapunish.com/dashboard/meta/${gameId}`,
      tierMovements,
      trendingTech:  extractTrendingTech(scenarios),
    });
    
    Logger.info(`[WeeklyBrief] Sent ${gameId} brief to ${emails.length} users`);
  }
});
```

---

## Expected Impact

- Competitor users who receive the brief have 2× lower monthly churn
- Each brief is a reminder that the platform is actively working for them
- "48hr patch turnaround" becomes tangible when they see it in their inbox every week
