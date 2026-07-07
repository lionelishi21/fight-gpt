import mongoose from 'mongoose';
import dotenv from 'dotenv';
dotenv.config();

async function check() {
  await mongoose.connect(process.env.MONGODB_URI as string);
  const db = mongoose.connection.db;
  if (!db) { console.log('No db'); process.exit(1); }
  const analyses = await db.collection('analyses').find().sort({ _id: -1 }).limit(10).toArray();
  for (const a of analyses) {
    console.log('ID:', a.analysis_id, '| Title:', a.game_title, '| P1:', a.p1_name, '| Created:', a.created_at);
  }
  process.exit(0);
}
check();
