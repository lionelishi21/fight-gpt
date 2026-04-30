const mongoose = require('mongoose');

async function check() {
    try {
        const uri = "mongodb+srv://lionelishmael_db_user:uRBhj6kDHWm2c21j@cluster0.rjgiyva.mongodb.net/fightgpt_database?retryWrites=true&w=majority";
        await mongoose.connect(uri);

        const NotificationSchema = new mongoose.Schema({}, { strict: false });
        const Notification = mongoose.model('Notification', NotificationSchema);

        const undefNotifications = await Notification.find({ 
            'payload.title': { $regex: /undefined/i } 
        }).limit(5);

        console.log(`Payload samples:`);
        undefNotifications.forEach(n => {
            console.log(JSON.stringify(n.payload, null, 2));
        });

        await mongoose.disconnect();
    } catch (e) {
        console.error(e);
    }
}

check();
