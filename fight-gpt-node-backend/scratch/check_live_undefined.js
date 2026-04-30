const mongoose = require('mongoose');

async function check() {
    try {
        const uri = "mongodb+srv://lionelishmael_db_user:uRBhj6kDHWm2c21j@cluster0.rjgiyva.mongodb.net/fightgpt_database?retryWrites=true&w=majority";
        console.log('Connecting to LIVE DB...');
        await mongoose.connect(uri);
        console.log('Connected to LIVE DB');

        const NotificationSchema = new mongoose.Schema({}, { strict: false });
        const Notification = mongoose.model('Notification', NotificationSchema);

        const undefNotifications = await Notification.find({ 
            'payload.title': { $regex: /undefined/i } 
        });

        console.log(`Found ${undefNotifications.length} notifications with "undefined" in title`);
        undefNotifications.forEach(n => {
            console.log(`- ID: ${n._id}, Title: ${n.payload.title}`);
        });

        const TheorySchema = new mongoose.Schema({}, { strict: false });
        const Theory = mongoose.model('Theory', TheorySchema);

        const undefTheories = await Theory.find({
            $or: [
                { character_id: 'undefined' },
                { character_id: null }
            ]
        });

        console.log(`Found ${undefTheories.length} theories with undefined character_id`);
        undefTheories.forEach(t => {
            console.log(`- ID: ${t._id}, Game: ${t.game_id}`);
        });

        await mongoose.disconnect();
    } catch (e) {
        console.error(e);
    }
}

check();
