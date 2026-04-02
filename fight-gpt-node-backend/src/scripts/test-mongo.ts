import dotenv from 'dotenv';
import mongoose from 'mongoose';
import path from 'path';

// Load env from parent directory
dotenv.config({ path: path.join(__dirname, '../../.env') });

async function testConnection() {
    const uri = process.env.MONGODB_URI;
    console.log('Testing MongoDB Connection...');
    console.log(`URI defined: ${!!uri}`);

    if (uri) {
        // Mask password in URI for logging
        const maskedUri = uri.replace(/:([^:@]+)@/, ':****@');
        console.log(`URI: ${maskedUri}`);
    } else {
        console.error('MONGODB_URI is not defined in .env');
        return;
    }

    try {
        console.log('Attempting to connect...');
        await mongoose.connect(uri);
        console.log('Connection SUCCESS!');
        console.log(`Database: ${mongoose.connection.db?.databaseName}`);
        await mongoose.disconnect();
    } catch (error) {
        console.error('Connection FAILED');
        console.error(error);
        if (error instanceof Error) {
            console.error('Error Name:', error.name);
            console.error('Error Message:', error.message);
            // @ts-ignore
            if (error.reason) console.error('Reason:', error.reason);
        }
    }
}

testConnection();
