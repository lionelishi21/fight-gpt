import dotenv from 'dotenv';
import mongoose from 'mongoose';
import path from 'path';

dotenv.config({ path: path.join(__dirname, '../../.env') });

async function clearCache() {
    const uri = process.env.MONGODB_URI;
    if (!uri) throw new Error('No URI');
    
    await mongoose.connect(uri);
    console.log('Connected to DB');
    
    // Clear Analysis collection
    const result = await mongoose.connection.collection('analyses').deleteMany({ video_source: 'youtube' });
    console.log(`Deleted ${result.deletedCount} cached analyses.`);
    
    await mongoose.disconnect();
}

clearCache().catch(console.error);
