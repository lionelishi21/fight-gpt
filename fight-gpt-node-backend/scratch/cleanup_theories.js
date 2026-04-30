const mongoose = require('mongoose');

async function cleanupTheories() {
    try {
        const uri = "mongodb+srv://lionelishmael_db_user:uRBhj6kDHWm2c21j@cluster0.rjgiyva.mongodb.net/fightgpt_database?retryWrites=true&w=majority";
        await mongoose.connect(uri);

        const TheorySchema = new mongoose.Schema({}, { strict: false });
        const Theory = mongoose.model('Theory', TheorySchema);

        const result = await Theory.deleteMany({
            $or: [
                { character_id: 'undefined' },
                { character_id: null },
                { character_name: 'undefined' }
            ]
        });

        console.log(`✅ Deleted ${result.deletedCount} malformed theories from the live database.`);

        await mongoose.disconnect();
    } catch (e) {
        console.error(e);
    }
}

cleanupTheories();
