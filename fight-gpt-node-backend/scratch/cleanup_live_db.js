const mongoose = require('mongoose');

async function cleanup() {
    try {
        const uri = "mongodb+srv://lionelishmael_db_user:uRBhj6kDHWm2c21j@cluster0.rjgiyva.mongodb.net/fightgpt_database?retryWrites=true&w=majority";
        console.log('Connecting to LIVE DB for cleanup...');
        await mongoose.connect(uri);
        console.log('Connected to LIVE DB');

        const NotificationSchema = new mongoose.Schema({}, { strict: false });
        const Notification = mongoose.model('Notification', NotificationSchema);

        const result = await Notification.deleteMany({ 
            $or: [
                { 'payload.title': { $regex: /undefined/i } },
                { 'payload.characterId': 'undefined' },
                { 'payload.data.characterName': 'undefined' }
            ]
        });

        console.log(`✅ Successfully deleted ${result.deletedCount} malformed notifications from the live database.`);

        await mongoose.disconnect();
    } catch (e) {
        console.error('❌ Cleanup failed:', e);
    }
}

cleanup();
