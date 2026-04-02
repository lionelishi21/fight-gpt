# Seeder Testing Guide

This document describes how to test the seeders for the Fight GPT backend.

## Prerequisites

1. **MongoDB Connection**: Ensure your `.env` file has the correct `MONGODB_URI`:
   ```env
   MONGODB_URI=mongodb+srv://app_user:<db_password>@cluster0.f7ssjug.mongodb.net/?appName=Cluster0
   ```

2. **Database Name**: The database name should be `fight_gpt` (configured in `src/config/database.ts`)

3. **Node.js Dependencies**: Ensure all dependencies are installed:
   ```bash
   npm install
   ```

## Testing Order

Seeders should be run in the following order:

1. **Game Seeder** (`seed:sf6`) - Creates the game and characters
2. **Game Metadata Seeder** (`seed:game-metadata`) - Creates game metadata
3. **Character Encyclopedia Seeder** (`seed:character-encyclopedia`) - Converts characters to encyclopedia format

## Step-by-Step Testing

### Step 1: Test Game Seeder

```bash
npm run seed:sf6
```

**Expected Output:**
- ✅ Created game: Street Fighter 6 (sf6)
- ✅ Created character: Ryu (sf6)
- ✅ Created character: Luke (sf6)
- ... (18 characters total)
- ✅ Seeder completed successfully!

**Verify in MongoDB:**
```javascript
// Connect to MongoDB and check
use fight_gpt;
db.games.findOne({ game_id: "sf6" });
db.characters.find({ game_id: "sf6" }).count(); // Should be 18
```

### Step 2: Test Game Metadata Seeder

```bash
npm run seed:game-metadata
```

**Expected Output:**
- ✅ Created game metadata: Street Fighter 6 (sf6)
- ✅ Created game metadata: Tekken 8 (tekken8)
- ✅ Created game metadata: Ultimate Marvel vs Capcom 3 (umvc3)
- ✅ Game Metadata seeder completed successfully!

**Verify in MongoDB:**
```javascript
db.gamemetadatas.find().forEach(printjson);
// Should show 3 game metadata entries with global_mechanics and constants
```

### Step 3: Test Character Encyclopedia Seeder

```bash
npm run seed:character-encyclopedia
```

**Expected Output:**
- Found 18 SF6 characters to convert
- ✅ Created Character Encyclopedia: Ryu (ryu)
  - Normals: X
  - Specials: Y
  - EX Moves: Z
  - Supers: W
  - Game Rules: 2 (or 3 for characters with specific rules)
- ... (for each character)
- ✅ Character Encyclopedia seeder completed!

**Verify in MongoDB:**
```javascript
// Check encyclopedia entries
db.characterencyclopedias.find({ game_id: "sf6" }).count(); // Should be 18

// Check a specific character
db.characterencyclopedias.findOne({ 
  game_id: "sf6", 
  character_id: "ryu" 
});

// Verify structure
const ryu = db.characterencyclopedias.findOne({ 
  game_id: "sf6", 
  character_id: "ryu" 
});
print("Normals: " + ryu.moveset.normals.length);
print("Specials: " + ryu.moveset.specials.length);
print("EX Moves: " + ryu.moveset.ex_moves.length);
print("Supers: " + ryu.moveset.supers.length);
print("Game Rules: " + ryu.game_rules.length);
```

## Testing Idempotency

All seeders are designed to be idempotent (safe to run multiple times).

### Test Game Seeder Idempotency

```bash
npm run seed:sf6
npm run seed:sf6  # Run again
```

**Expected:** Second run should show "already exists" messages and skip creation.

### Test Game Metadata Seeder Idempotency

```bash
npm run seed:game-metadata
npm run seed:game-metadata  # Run again
```

**Expected:** Second run should show "already exists and is current" messages.

### Test Character Encyclopedia Seeder Idempotency

```bash
npm run seed:character-encyclopedia
npm run seed:character-encyclopedia  # Run again
```

**Expected:** Second run should show "already exists and is current" messages.

## Testing Update Logic

### Test Game Metadata Update

1. Manually update a game metadata in MongoDB to set `is_current: false` or change `patch_version`
2. Run the seeder again:
   ```bash
   npm run seed:game-metadata
   ```
3. **Expected:** Should update the existing entry instead of creating a new one.

### Test Character Encyclopedia Update

1. Manually update a character encyclopedia in MongoDB to set `is_current_patch: false` or change `patch_version`
2. Run the seeder again:
   ```bash
   npm run seed:character-encyclopedia
   ```
3. **Expected:** Should update the existing entry instead of creating a new one.

## Validation Checks

### Character Encyclopedia Structure Validation

Run this MongoDB query to validate the structure:

```javascript
db.characterencyclopedias.find({ game_id: "sf6" }).forEach(function(doc) {
  // Check required fields
  assert(doc.game_id, "Missing game_id");
  assert(doc.character_id, "Missing character_id");
  assert(doc.patch_version, "Missing patch_version");
  assert(doc.moveset, "Missing moveset");
  assert(doc.game_rules, "Missing game_rules");
  
  // Check moveset structure
  assert(doc.moveset.normals, "Missing normals array");
  assert(doc.moveset.specials, "Missing specials array");
  assert(doc.moveset.ex_moves, "Missing ex_moves array");
  assert(doc.moveset.supers, "Missing supers array");
  
  // Check move structure
  doc.moveset.specials.forEach(function(move) {
    assert(move.name, "Move missing name");
    assert(move.input, "Move missing input");
    assert(move.how_to_perform, "Move missing how_to_perform");
    assert(move.category, "Move missing category");
    assert(move.frame_data, "Move missing frame_data");
    assert(move.frame_data.startup !== undefined, "Move missing startup");
    assert(move.frame_data.active !== undefined, "Move missing active");
    assert(move.frame_data.recovery !== undefined, "Move missing recovery");
    assert(move.frame_data.on_block !== undefined, "Move missing on_block");
  });
  
  // Check game_rules structure
  doc.game_rules.forEach(function(rule) {
    assert(rule.key, "Rule missing key");
    assert(rule.value !== undefined, "Rule missing value");
    assert(rule.ui_type, "Rule missing ui_type");
  });
  
  print("✅ " + doc.character_id + " structure is valid");
});
```

### Game Metadata Structure Validation

```javascript
db.gamemetadatas.find().forEach(function(doc) {
  assert(doc.game_id, "Missing game_id");
  assert(doc.constants, "Missing constants");
  assert(doc.global_mechanics, "Missing global_mechanics");
  assert(doc.constants.team_size !== undefined, "Missing team_size");
  assert(doc.global_mechanics.length > 0, "No global mechanics");
  
  doc.global_mechanics.forEach(function(mechanic) {
    assert(mechanic.key, "Mechanic missing key");
    assert(mechanic.value !== undefined, "Mechanic missing value");
    assert(mechanic.ui_type, "Mechanic missing ui_type");
  });
  
  print("✅ " + doc.game_id + " structure is valid");
});
```

## Common Issues and Solutions

### Issue: "No SF6 characters found"

**Solution:** Run `npm run seed:sf6` first to create the character data.

### Issue: "MONGODB_URI not set"

**Solution:** Ensure your `.env` file exists and contains the `MONGODB_URI` variable.

### Issue: "Cannot connect to database"

**Solution:** 
- Check your MongoDB connection string
- Verify network connectivity
- Check if the database name is correct in `src/config/database.ts`

### Issue: "Character conversion failed"

**Solution:**
- Check the character data structure in the database
- Verify that characters have the `moves` array
- Check the seeder logs for specific error messages

### Issue: "Move input notation not found"

**Solution:** This is expected for some moves. The seeder uses fallback logic, but you may want to add more mappings to `generateInputNotation()` function.

## Performance Testing

### Test with Large Dataset

If you have many characters, test the seeder performance:

```bash
time npm run seed:character-encyclopedia
```

**Expected:** Should complete in a reasonable time (< 30 seconds for 18 characters).

## Integration Testing

After running all seeders, test the API endpoints:

```bash
# Start the server
npm run dev

# Test Game Metadata API
curl http://localhost:3000/api/games/sf6/metadata/current

# Test Character Encyclopedia API
curl http://localhost:3000/api/games/sf6/characters/ryu/encyclopedia/current

# Test Game Rules API
curl http://localhost:3000/api/games/sf6/characters/ryu/encyclopedia/rules
```

## Next Steps

After successful testing:
1. ✅ Verify all data is correctly structured
2. ✅ Test API endpoints with the seeded data
3. ✅ Verify AI service can fetch game metadata and character rules
4. ✅ Test analysis requests with game context
