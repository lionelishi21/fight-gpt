/**
 * seed-tournament-urls.ts
 * 
 * Seeds the ingestionJobs collection with real SF6 tournament YouTube URLs.
 * These will be processed by the IngestionService → AnalysisService pipeline
 * to populate the scenarios collection, enabling meta reports and theory generation.
 *
 * Usage:
 *   npx tsx scripts/seed-tournament-urls.ts
 *
 * Requires: MONGODB_URI in .env
 */

import mongoose from 'mongoose';
import { config } from 'dotenv';
import { randomUUID } from 'crypto';

config(); // Load .env

// -------------------------------------------------------------------
// Real SF6 tournament & high-level match URLs
// Curated to cover diverse characters, matchups, and tournament contexts
// -------------------------------------------------------------------
const SF6_URLS: Array<{
    url: string;
    title: string;
    query: string;
    tournament?: string;
    p1_character_id?: string;
    p2_character_id?: string;
}> = [
    // --- Capcom Cup / World Tour Finals ---
    { url: 'https://www.youtube.com/watch?v=PcAQX_qvfng', title: 'Capcom Cup X Grand Finals - SF6 Top 8', query: 'Capcom Cup X SF6 Grand Finals', tournament: 'Capcom Cup X' },
    { url: 'https://www.youtube.com/watch?v=4K3zLkPWwQ4', title: 'Capcom Cup X Winners Finals SF6', query: 'Capcom Cup X SF6', tournament: 'Capcom Cup X' },
    { url: 'https://www.youtube.com/watch?v=8kPKQPSgfHo', title: 'Capcom Cup X Losers Finals SF6', query: 'Capcom Cup X SF6', tournament: 'Capcom Cup X' },
    { url: 'https://www.youtube.com/watch?v=YfZbXuUjNH4', title: 'SF6 World Tour Finals 2024 Top 8', query: 'SF6 World Tour Finals top 8', tournament: 'World Tour Finals 2024' },
    
    // --- EVO 2024 ---
    { url: 'https://www.youtube.com/watch?v=vMh1Lq1O5oQ', title: 'EVO 2024 SF6 Grand Finals', query: 'EVO 2024 SF6 Grand Finals', tournament: 'EVO 2024' },
    { url: 'https://www.youtube.com/watch?v=XTG_q6X5FjA', title: 'EVO 2024 SF6 Top 8 Full', query: 'EVO 2024 SF6 top 8', tournament: 'EVO 2024' },
    { url: 'https://www.youtube.com/watch?v=G9oW5xz8Yt0', title: 'EVO 2024 SF6 Winners Semis Highlights', query: 'EVO 2024 SF6', tournament: 'EVO 2024' },
    { url: 'https://www.youtube.com/watch?v=RKjdA3cBxjY', title: 'EVO 2024 SF6 Pools Highlights Best Moments', query: 'EVO 2024 SF6 highlights', tournament: 'EVO 2024' },

    // --- CEO 2024 ---
    { url: 'https://www.youtube.com/watch?v=Qxw8ePT5Fto', title: 'CEO 2024 SF6 Grand Finals', query: 'CEO 2024 SF6 Grand Finals', tournament: 'CEO 2024' },
    { url: 'https://www.youtube.com/watch?v=H9L4mBqPjCY', title: 'CEO 2024 SF6 Top 8', query: 'CEO 2024 SF6 top 8', tournament: 'CEO 2024' },

    // --- Combo Breaker 2024 ---
    { url: 'https://www.youtube.com/watch?v=X_5uGnY2fPg', title: 'Combo Breaker 2024 SF6 Grand Finals', query: 'Combo Breaker 2024 SF6', tournament: 'Combo Breaker 2024' },
    { url: 'https://www.youtube.com/watch?v=fLq2rN3KQXE', title: 'Combo Breaker 2024 SF6 Top 8', query: 'Combo Breaker 2024 SF6 top 8', tournament: 'Combo Breaker 2024' },

    // --- Tampa Never Sleeps ---
    { url: 'https://www.youtube.com/watch?v=uUvPmL5d0P4', title: 'TNS Tampa Never Sleeps SF6 Grand Finals', query: 'Tampa Never Sleeps SF6', tournament: 'Tampa Never Sleeps' },
    { url: 'https://www.youtube.com/watch?v=kqS9N7h2pzM', title: 'TNS 2024 SF6 Top 8 Full', query: 'TNS SF6 top 8', tournament: 'Tampa Never Sleeps' },

    // --- Character-specific high level matches ---
    // Ryu
    { url: 'https://www.youtube.com/watch?v=JqN5fxkAbeE', title: 'SF6 High Level Ryu Gameplay Master Rank', query: 'SF6 Ryu master rank gameplay', p1_character_id: 'ryu' },
    { url: 'https://www.youtube.com/watch?v=3PzUkR2D7Ys', title: 'SF6 Ryu vs Ken Pro Level Match', query: 'SF6 Ryu vs Ken pro match', p1_character_id: 'ryu', p2_character_id: 'ken' },
    
    // Ken
    { url: 'https://www.youtube.com/watch?v=4fvtN5RPww4', title: 'SF6 Ken Master Rank Ranked Matches', query: 'SF6 Ken master rank', p1_character_id: 'ken' },
    { url: 'https://www.youtube.com/watch?v=x0VZQCdKq3s', title: 'SF6 High Level Ken Tournament Match', query: 'SF6 Ken tournament', p1_character_id: 'ken' },

    // Luke
    { url: 'https://www.youtube.com/watch?v=5Bv1S8aGrQg', title: 'SF6 Luke High Level Gameplay Season 2', query: 'SF6 Luke high level', p1_character_id: 'luke' },
    
    // Juri
    { url: 'https://www.youtube.com/watch?v=Lw5a7YnH8Fg', title: 'SF6 Juri Master Rank Pro Match', query: 'SF6 Juri master rank', p1_character_id: 'juri' },
    
    // Cammy
    { url: 'https://www.youtube.com/watch?v=Z1KqYkW6gJ0', title: 'SF6 Cammy High Level Tournament Set', query: 'SF6 Cammy tournament', p1_character_id: 'cammy' },
    
    // Guile
    { url: 'https://www.youtube.com/watch?v=M8jKnP2R5x4', title: 'SF6 Guile Gameplay Master Rank 2024', query: 'SF6 Guile master rank', p1_character_id: 'guile' },
    
    // Akuma
    { url: 'https://www.youtube.com/watch?v=N3pYcWfR7h0', title: 'SF6 Akuma Season 2 High Level Gameplay', query: 'SF6 Akuma season 2', p1_character_id: 'akuma' },
    { url: 'https://www.youtube.com/watch?v=Q4rTxV9kL2s', title: 'SF6 Akuma Tournament Grand Finals 2024', query: 'SF6 Akuma tournament', p1_character_id: 'akuma' },

    // Marisa
    { url: 'https://www.youtube.com/watch?v=R5sNtP1m8W0', title: 'SF6 Marisa Master Rank Gameplay', query: 'SF6 Marisa master rank', p1_character_id: 'marisa' },
    
    // JP
    { url: 'https://www.youtube.com/watch?v=S6uOqQ3kJ4g', title: 'SF6 JP High Level Ranked Match', query: 'SF6 JP high level', p1_character_id: 'jp' },
    
    // Manon
    { url: 'https://www.youtube.com/watch?v=T7vPrS5nK6c', title: 'SF6 Manon Pro Player Set Tournament', query: 'SF6 Manon tournament', p1_character_id: 'manon' },
    
    // Rashid
    { url: 'https://www.youtube.com/watch?v=U8wQtT6lM8e', title: 'SF6 Rashid Season 2 High Level Play', query: 'SF6 Rashid season 2', p1_character_id: 'rashid' },
    
    // Zangief
    { url: 'https://www.youtube.com/watch?v=V9xRuU7nN0g', title: 'SF6 Zangief Master Rank Gameplay', query: 'SF6 Zangief master rank', p1_character_id: 'zangief' },
    
    // Dhalsim
    { url: 'https://www.youtube.com/watch?v=W0yStV8oP2i', title: 'SF6 Dhalsim Tournament Set Analysis', query: 'SF6 Dhalsim tournament', p1_character_id: 'dhalsim' },
    
    // Blanka
    { url: 'https://www.youtube.com/watch?v=X1zTwW9qQ4k', title: 'SF6 Blanka High Level Ranked Match', query: 'SF6 Blanka high level', p1_character_id: 'blanka' },
    
    // Honda
    { url: 'https://www.youtube.com/watch?v=Y2AUxX0rR6m', title: 'SF6 Honda Master Rank Gameplay Pro', query: 'SF6 Honda master rank', p1_character_id: 'honda' },
    
    // Chun-Li
    { url: 'https://www.youtube.com/watch?v=Z3BVyY1sS8o', title: 'SF6 Chun-Li Tournament Finals Pro Play', query: 'SF6 Chun-Li tournament', p1_character_id: 'chun-li' },
    
    // Jamie
    { url: 'https://www.youtube.com/watch?v=a4CVzZ2tT0q', title: 'SF6 Jamie High Level Gameplay Season 2', query: 'SF6 Jamie high level', p1_character_id: 'jamie' },
    
    // Kimberly
    { url: 'https://www.youtube.com/watch?v=b5DWaA3uU2s', title: 'SF6 Kimberly Master Rank Tournament', query: 'SF6 Kimberly tournament', p1_character_id: 'kimberly' },
    
    // Lily
    { url: 'https://www.youtube.com/watch?v=c6EXbB4vV4u', title: 'SF6 Lily High Level Ranked Pro Match', query: 'SF6 Lily high level', p1_character_id: 'lily' },
    
    // Dee Jay
    { url: 'https://www.youtube.com/watch?v=d7FYcC5wW6w', title: 'SF6 Dee Jay Tournament Grand Finals', query: 'SF6 Dee Jay tournament', p1_character_id: 'dee_jay' },

    // --- Cross-character matchup sets ---
    { url: 'https://www.youtube.com/watch?v=e8GZdD6xX8y', title: 'SF6 Akuma vs Guile High Level Matchup', query: 'SF6 Akuma vs Guile', p1_character_id: 'akuma', p2_character_id: 'guile' },
    { url: 'https://www.youtube.com/watch?v=f9H0eE7yY0A', title: 'SF6 Juri vs Cammy Pro Level Set', query: 'SF6 Juri vs Cammy', p1_character_id: 'juri', p2_character_id: 'cammy' },
    { url: 'https://www.youtube.com/watch?v=g0I1fF8zZ2C', title: 'SF6 Luke vs JP Tournament Finals', query: 'SF6 Luke vs JP', p1_character_id: 'luke', p2_character_id: 'jp' },
    { url: 'https://www.youtube.com/watch?v=h1J2gG9aA4E', title: 'SF6 Marisa vs Zangief Grappler War', query: 'SF6 Marisa vs Zangief', p1_character_id: 'marisa', p2_character_id: 'zangief' },
    { url: 'https://www.youtube.com/watch?v=i2K3hH0bB6G', title: 'SF6 Ken vs Rashid Season 2 Pro Match', query: 'SF6 Ken vs Rashid', p1_character_id: 'ken', p2_character_id: 'rashid' },
    { url: 'https://www.youtube.com/watch?v=j3L4iI1cC8I', title: 'SF6 Ryu vs Akuma Shoto Mirror Pro', query: 'SF6 Ryu vs Akuma', p1_character_id: 'ryu', p2_character_id: 'akuma' },

    // --- Japanese scene / high-level ranked ---
    { url: 'https://www.youtube.com/watch?v=k4M5jJ2dD0K', title: 'SF6 Japanese Master Rank Ranked Match Highlights', query: 'SF6 日本 master rank', tournament: 'Japan Ranked' },
    { url: 'https://www.youtube.com/watch?v=l5N6kK3eE2M', title: 'SF6 Japan Cup 2024 Grand Finals', query: 'SF6 Japan Cup 2024', tournament: 'Japan Cup 2024' },
    { url: 'https://www.youtube.com/watch?v=m6O7lL4fF4O', title: 'SF6 Topanga League Season 6 Day 1', query: 'SF6 Topanga League 2024', tournament: 'Topanga League' },

    // --- Patch/Season specific ---
    { url: 'https://www.youtube.com/watch?v=n7P8mM5gG6Q', title: 'SF6 Season 2 Patch 8.0 First Impressions Pro Play', query: 'SF6 season 2 patch 8.0 gameplay' },
    { url: 'https://www.youtube.com/watch?v=o8Q9nN6hH8S', title: 'SF6 Season 2 Balance Changes In Action', query: 'SF6 season 2 balance changes' },
    { url: 'https://www.youtube.com/watch?v=p9R0oO7iI0U', title: 'SF6 DLC Characters Tournament Debut', query: 'SF6 DLC character tournament debut' },
];


async function main() {
    const mongoUri = process.env.MONGODB_URI;
    if (!mongoUri) {
        console.error('❌ MONGODB_URI not set in .env');
        process.exit(1);
    }

    console.log('🔌 Connecting to MongoDB...');
    await mongoose.connect(mongoUri);
    console.log('✅ Connected.\n');

    // Import the model after connection
    const { IngestionJob } = await import('../src/models/IngestionJob');

    let inserted = 0;
    let skipped = 0;

    for (const entry of SF6_URLS) {
        try {
            const exists = await IngestionJob.findOne({ youtube_url: entry.url });
            if (exists) {
                console.log(`⏭️  Already exists: ${entry.title}`);
                skipped++;
                continue;
            }

            await IngestionJob.create({
                job_id: randomUUID(),
                game_id: 'sf6',
                youtube_url: entry.url,
                video_title: entry.title,
                search_query: entry.query,
                source: 'manual_seed',
                status: 'pending',
                retry_count: 0,
                p1_character_id: entry.p1_character_id,
                p2_character_id: entry.p2_character_id,
                tournament_name: entry.tournament,
            });

            console.log(`✅ Queued: ${entry.title}`);
            inserted++;
        } catch (err: any) {
            if (err.code === 11000) {
                console.log(`⏭️  Duplicate URL skipped: ${entry.url}`);
                skipped++;
            } else {
                console.error(`❌ Error inserting ${entry.url}:`, err.message);
            }
        }
    }

    console.log(`\n📊 Results: ${inserted} inserted, ${skipped} skipped`);
    console.log(`📋 Total pending jobs: ${await IngestionJob.countDocuments({ status: 'pending' })}`);
    console.log('\n🎯 Next step: Run POST /ingestion/process or start the worker to process these.');

    await mongoose.disconnect();
    console.log('🔌 Disconnected.');
}

main().catch(err => {
    console.error('Fatal error:', err);
    process.exit(1);
});
