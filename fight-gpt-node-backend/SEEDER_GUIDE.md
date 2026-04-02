# Seeder Guide

Complete guide for running database seeders.

## Street Fighter 6 Seeder

The Street Fighter 6 seeder populates your database with:
- Street Fighter 6 game entry
- All 18 base roster characters with their moves and stats

### Prerequisites

1. **Environment Variables**: Make sure your `.env` file has the MongoDB connection string:
   ```env
   MONGODB_URI=mongodb+srv://app_user:<db_password>@cluster0.f7ssjug.mongodb.net/?appName=Cluster0
   ```

2. **Dependencies**: Ensure all dependencies are installed:
   ```bash
   npm install
   ```

### Running the Seeder

#### Option 1: Using npm script (Recommended)

```bash
npm run seed:sf6
```

This uses `tsx` to run the TypeScript file directly.

#### Option 2: Using tsx directly

```bash
npx tsx src/seeders/seedSF6.ts
```

#### Option 3: Compile and run

```bash
npm run build
node dist/seeders/seedSF6.js
```

### What Gets Seeded

#### Game: Street Fighter 6
- **game_id**: `sf6`
- **name**: Street Fighter 6
- **publisher**: Capcom
- **developer**: Capcom
- **release_date**: June 2, 2023
- **platforms**: PS5, Xbox Series X, PC, PS4
- **version**: 1.05
- **is_active**: true

#### Characters (18 total)

1. **Ryu** - Balanced shoto character
2. **Luke** - Aggressive rushdown
3. **Jamie** - Drunken boxing, drinks unlock moves
4. **Chun-Li** - Fast mobility, strong normals
5. **Guile** - Zoning character, charge inputs
6. **Ken** - Rushdown variant of Ryu
7. **Kimberly** - Bushinryu ninja, high mobility
8. **Juri** - Feng Shui Engine stores charges
9. **Dhalsim** - Long-range zoning, unique movement
10. **Blanka** - Wild beast character, electric attacks
11. **E. Honda** - Grappler with command grabs
12. **Zangief** - Grappler, command grabs are primary tool
13. **Cammy** - Fast rushdown, strong mixups
14. **Dee Jay** - Charge character, rhythmic playstyle
15. **Manon** - Grappler, gains medals from throws
16. **Marisa** - Heavy hitter, armor moves
17. **Lily** - Charge character, uses wind stocks
18. **JP** - Zoner with psychological warfare tools

Each character includes:
- Basic stats (walk speed, dash frames, jump speed, etc.)
- Key moves (normals, specials, supers)
- Frame data (startup, active, recovery, on_block, on_hit)
- Move tags (projectile, special, anti_air, low, overhead, etc.)
- Version: 1.05
- is_current: true

### Safety Features

The seeder is **idempotent**, meaning:
- ✅ Running it multiple times won't create duplicates
- ✅ If Street Fighter 6 game already exists, it skips creation
- ✅ If a character already exists, it skips that character
- ✅ Automatically updates the game's `supported_characters_count`

### Expected Output

When running successfully, you should see:

```
Starting Street Fighter 6 seeder...
Database connected
✅ Created game: Street Fighter 6 (sf6)
✅ Created character: Ryu (sf6)
✅ Created character: Luke (sf6)
✅ Created character: Jamie (sf6)
... (more characters)
✅ Seeder completed successfully!
   Game: Street Fighter 6 (sf6)
   Characters created: 18
   Characters skipped: 0
   Total characters: 18
   Game character count updated: 18
Database disconnected
Seeder finished
```

### Troubleshooting

#### Error: MONGODB_URI not set
**Solution**: Make sure your `.env` file exists and contains:
```env
MONGODB_URI=mongodb+srv://app_user:<db_password>@cluster0.f7ssjug.mongodb.net/?appName=Cluster0
```

#### Error: Cannot connect to database
**Solutions**:
- Check your MongoDB connection string
- Verify network connectivity
- Check if the database name is correct
- Ensure your IP is whitelisted in MongoDB Atlas (if using cloud)

#### Characters not created
**Solutions**:
- Check if characters already exist (seeder skips duplicates)
- Check database logs for errors
- Verify character data structure matches the model
- Check MongoDB connection logs

#### TypeScript compilation errors
**Solutions**:
- Run `npm install` to ensure all dependencies are installed
- Check TypeScript version: `npx tsc --version`
- Run `npm run type-check` to see specific errors

### Verifying the Seeder

After running the seeder, you can verify the data:

1. **Check the game**:
   ```bash
   curl http://localhost:3000/api/games/game-id/sf6
   ```

2. **Check all characters**:
   ```bash
   curl http://localhost:3000/api/characters/game/sf6
   ```

3. **Check active games (for onboarding)**:
   ```bash
   curl http://localhost:3000/api/games/active
   ```

### Customizing the Seeder

To add more moves or update frame data:

1. Edit `src/seeders/seedSF6.ts`
2. Update the `SF6_CHARACTERS` array
3. Add more moves to each character's `moves` array
4. Run the seeder again (it will skip existing characters)

### Notes

- This is a **simplified seeder** with basic move data
- Move data can be expanded later with more detailed frame data
- Each character has their most important moves included
- Frame data is approximate and may need adjustment based on actual game data
- Characters are marked as `is_current: true` for version 1.05
- The seeder uses the same database connection as the main application

