import mongoose from 'mongoose';
import dotenv from 'dotenv';
dotenv.config();

async function clean() {
  await mongoose.connect(process.env.MONGODB_URI as string);
  const db = mongoose.connection.db;
  if (!db) process.exit(1);

  // Delete any analyses where p1_name is literally undefined (not just missing, but string "undefined" or null)
  const garbage = await db.collection('analyses').find({ $or: [{ p1_name: undefined }, { p1_name: "undefined" }, { p1_name: { $exists: false } }] }).toArray();
  
  let deletedCount = 0;
  for (const a of garbage) {
    console.log('Deleting garbage analysis:', a.analysis_id);
    await db.collection('analyses').deleteOne({ _id: a._id });
    await db.collection('scenarios').deleteMany({ analysis_id: a.analysis_id });
    try {
        await db.collection('vectors').deleteMany({ 'metadata.analysis_id': a.analysis_id });
    } catch(e) {}
    deletedCount++;
  }
  
  console.log('Total garbage deleted:', deletedCount);
  process.exit(0);
}
clean();
