import mongoose from 'mongoose';
import dotenv from 'dotenv';
dotenv.config();

async function check() {
  await mongoose.connect(process.env.MONGODB_URI as string);
  const db = mongoose.connection.db;
  if (!db) process.exit(1);

  const analyses = await db.collection('analyses').find().sort({ _id: -1 }).limit(5).toArray();
  for (const a of analyses) {
    console.log('ID:', a.analysis_id, '| Title:', a.game_title, '| P1:', a.p1_name, '| P2:', a.p2_name);
  }

  const scenarios = await db.collection('scenarios').find({ analysis_id: { $in: [
    '6689945f-ee23-4dc6-b636-299c224f1744', 
    'f2bb2b81-fa2d-4267-a805-64f1a635a55d',
    '34da6ebf-4a17-41f7-9d64-e5fe9995fe36'
  ] } }).toArray();
  
  if (scenarios.length > 0) {
    console.log('Found scenarios from deleted analyses. Deleting...');
    await db.collection('scenarios').deleteMany({ analysis_id: { $in: [
      '6689945f-ee23-4dc6-b636-299c224f1744', 
      'f2bb2b81-fa2d-4267-a805-64f1a635a55d'
    ] } });
  }

  // Find scenarios that have exactly 3 events
  const fakeScenarios = await db.collection('scenarios').find({ 'timeline': { $size: 3 } }).toArray();
  for (const s of fakeScenarios) {
    console.log('Fake Scenario ID:', s.scenario_id, '| Timeline length:', s.timeline?.length);
    await db.collection('scenarios').deleteOne({ _id: s._id });
    await db.collection('analyses').deleteMany({ analysis_id: s.analysis_id });
  }

  process.exit(0);
}
check();
