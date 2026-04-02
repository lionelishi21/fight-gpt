# Seeders

Database seeders for populating initial data.

## Street Fighter 6 Seeder

The `seedSF6.ts` seeder creates:
- Street Fighter 6 game entry
- All 18 base roster characters with their moves and stats

### Usage

#### Option 1: Using ts-node directly

```bash
npx ts-node src/seeders/seedSF6.ts
```

#### Option 2: Using npm script (if added to package.json)

```bash
npm run seed:sf6
```

### Environment Variables

Make sure you have the following environment variables set in your `.env` file:

```env
MONGODB_URI=mongodb+srv://app_user:<db_password>@cluster0.f7ssjug.mongodb.net/?appName=Cluster0
```

### What Gets Seeded

1. **Game**: Street Fighter 6
   - game_id: `sf6`
   - Name: Street Fighter 6
   - Publisher: Capcom
   - Developer: Capcom
   - Release date: June 2, 2023
   - Platforms: PS5, Xbox Series X, PC, PS4
   - Version: 1.05
   - is_active: true

2. **Characters** (18 total):
   - Ryu
   - Luke
   - Jamie
   - Chun-Li
   - Guile
   - Ken
   - Kimberly
   - Juri
   - Dhalsim
   - Blanka
   - E. Honda
   - Zangief
   - Cammy
   - Dee Jay
   - Manon
   - Marisa
   - Lily
   - JP

Each character includes:
- Basic stats (walk speed, dash frames, jump speed, etc.)
- Key moves (normals, specials, supers)
- Frame data (startup, active, recovery, on_block, on_hit)
- Move tags (projectile, special, anti_air, etc.)
- Version: 1.05
- is_current: true

### Safety Features

- **Idempotent**: Running the seeder multiple times won't create duplicates
- **Game Check**: If Street Fighter 6 game already exists, it skips creation
- **Character Check**: If a character already exists, it skips that character
- **Character Count**: Automatically updates the game's `supported_characters_count`

### Notes

- This is a **simplified seeder** with basic move data
- Move data can be expanded later with more detailed frame data
- Each character has their most important moves included
- Frame data is approximate and may need adjustment based on actual game data
- Characters are marked as `is_current: true` for version 1.05

### Expanding the Seeder

To add more moves or update frame data:

1. Edit `src/seeders/seedSF6.ts`
2. Update the `SF6_CHARACTERS` array
3. Add more moves to each character's `moves` array
4. Run the seeder again (it will skip existing characters)

### Troubleshooting

**Error: MONGODB_URI not set**
- Make sure your `.env` file has the `MONGODB_URI` variable set

**Error: Cannot connect to database**
- Check your MongoDB connection string
- Verify network connectivity
- Check if the database name is correct

**Characters not created**
- Check if characters already exist (seeder skips duplicates)
- Check database logs for errors
- Verify character data structure matches the model

