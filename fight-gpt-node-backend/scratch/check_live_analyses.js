const mongoose = require('mongoose');

async function checkRecentAnalyses() {
    try {
        const uri = "mongodb+srv://lionelishmael_db_user:uRBhj6kDHWm2c21j@cluster0.rjgiyva.mongodb.net/fightgpt_database?retryWrites=true&w=majority";
        await mongoose.connect(uri);

        const AnalysisSchema = new mongoose.Schema({}, { strict: false });
        const Analysis = mongoose.model('Analysis', AnalysisSchema);

        const recent = await Analysis.find().sort({ created_at: -1 }).limit(5);

        console.log(`Recent Analyses:`);
        recent.forEach(a => {
            console.log(`- ID: ${a.analysis_id || a._id}, Game: ${a.game_id}, P1: ${a.p1_name}, P2: ${a.p2_name}, Date: ${a.created_at}`);
        });

        await mongoose.disconnect();
    } catch (e) {
        console.error(e);
    }
}

checkRecentAnalyses();
