import mongoose from 'mongoose';
import dotenv from 'dotenv';
dotenv.config();

async function clean() {
  await mongoose.connect(process.env.MONGODB_URI as string);
  const db = mongoose.connection.db;
  if (!db) process.exit(1);

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const result = await db.collection('scenarios').deleteMany({ created_at: { $gte: today } });
  console.log('Deleted', result.deletedCount, 'scenarios from today.');

  const vectorResult = await db.collection('vectors').deleteMany({ created_at: { $gte: today } });
  console.log('Deleted', vectorResult.deletedCount, 'vectors from today.');

  process.exit(0);
}
clean();
