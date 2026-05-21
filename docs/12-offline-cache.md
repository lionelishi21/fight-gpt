# 12 · Offline Frame Data Cache (Mobile)

**Priority:** 🟢 P4 — Mobile Experience  
**Status:** `todo`  
**Effort:** 3 hours  

---

## Why It Matters

Players at arcades and tournaments have bad wifi. They need frame data NOW —  
not after a 10-second load. Caching the encyclopedia data on-device costs  
nothing and makes the app feel instant.

---

## Implementation

```typescript
// lib/cache.ts
import AsyncStorage from '@react-native-async-storage/async-storage';

const CACHE_TTL = 24 * 60 * 60 * 1000; // 24 hours

export async function getCached<T>(key: string): Promise<T | null> {
  const raw = await AsyncStorage.getItem(key);
  if (!raw) return null;
  const { data, timestamp } = JSON.parse(raw);
  if (Date.now() - timestamp > CACHE_TTL) return null;
  return data as T;
}

export async function setCache(key: string, data: any) {
  await AsyncStorage.setItem(key, JSON.stringify({ data, timestamp: Date.now() }));
}
```

### Cache on First Load
```typescript
// When loading character encyclopedia
const cacheKey = `encyclopedia:${gameId}:${characterId}`;
const cached = await getCached(cacheKey);
if (cached) return cached;

const fresh = await encyclopediaApi.getByCharacter(gameId, characterId);
await setCache(cacheKey, fresh);
return fresh;
```

### What to Cache
| Data | TTL |
|---|---|
| Character encyclopedia (frame data) | 24 hours |
| Tier list | 24 hours |
| User's own analyses | 30 minutes |
| Theory docs | 6 hours |

---

## User Experience

- First visit: fetch from API and cache
- Subsequent visits: instant load from AsyncStorage
- Background refresh when online: update cache silently
- Offline indicator: subtle banner "Using cached data from 2h ago"
