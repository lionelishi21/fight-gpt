# 14 · App Store Submission

**Priority:** 🟢 P4 — Mobile Distribution  
**Status:** `todo`  
**Effort:** 1 day setup + Apple review (1–3 days)  

---

## App Store (iOS)

### Requirements
- [ ] Apple Developer account ($99/year) — `com.metapunish.app`
- [ ] App icon 1024×1024 — ✅ done (`assets/icon/icon-1024-rounded.png`)
- [ ] Screenshots for 6.7" iPhone (required), 5.5" (optional), iPad (optional)
- [ ] Privacy policy URL — `https://metapunish.com/privacy`
- [ ] App description (4000 chars max)
- [ ] Keywords (100 chars max)
- [ ] Age rating: 4+ (no violent content in the app itself)

### EAS Submit Command
```bash
eas submit --platform ios
```

### App Store Description (Draft)
```
MetaPunish — The Bloomberg Terminal for Fighting Games.

Real-time frame data, AI-powered match analysis, and post-patch meta 
briefs from continuously ingested tournament footage. 

• Frame data for SF6, Tekken 8, GG Strive, MK1
• AI analysis of your YouTube match replays
• Character tier lists updated from tournament VODs
• Daily training missions with XP and streaks
• Weekly meta briefs every Monday

Used by 1,200+ competitive FGC players.
```

### Keywords
```
fighting games, SF6, Tekken 8, frame data, meta, tier list, 
Street Fighter, combo, punish, FGC, esports, coaching
```

---

## Google Play (Android)

### Requirements
- [ ] Google Play developer account ($25 one-time)
- [ ] `google-services.json` — ✅ done
- [ ] Feature graphic 1024×500
- [ ] Screenshots for phone (required), tablet (optional)
- [ ] Content rating questionnaire

### EAS Submit Command
```bash
eas submit --platform android
```

---

## Pre-Submission Checklist
- [ ] All screens functional on iOS 16+ and Android 12+
- [ ] No placeholder content visible
- [ ] Login/signup works with real credentials
- [ ] Analysis flow works end-to-end
- [ ] Privacy policy live at metapunish.com/privacy
- [ ] Terms of service live at metapunish.com/terms
