import mongoose from 'mongoose';
import dotenv from 'dotenv';
dotenv.config();

async function clean() {
  await mongoose.connect(process.env.MONGODB_URI as string);
  const db = mongoose.connection.db;
  if (!db) process.exit(1);

  // Find analyses from today
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const analyses = await db.collection('analyses').find({ created_at: { $gte: today } }).toArray();
  
  if (analyses.length === 0) {
    console.log('No fake analyses found today.');
    process.exit(0);
  }

  for (const a of analyses) {
    console.log('Deleting Analysis ID:', a.analysis_id, 'P1:', a.p1_name, 'P2:', a.p2_name);
    await db.collection('analyses').deleteOne({ _id: a._id });
    
    // Delete corresponding scenarios
    const scenarioResult = await db.collection('scenarios').deleteMany({ analysis_id: a.analysis_id });
    console.log('  Deleted', scenarioResult.deletedCount, 'scenarios.');

    // Note: Vectors are tied to scenario_id in many systems, we might need to delete vectors too if they have analysis_id
    // Wait, the vector repo uses Mongoose Vector model
    try {
      const vectorResult = await db.collection('vectors').deleteMany({ 'metadata.analysis_id': a.analysis_id });
      console.log('  Deleted', vectorResult.deletedCount, 'vectors.');
    } catch(e) {}
  }

  console.log('Done.');
  process.exit(0);
}
clean();
