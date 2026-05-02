"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const dotenv_1 = __importDefault(require("dotenv"));
const mongoose_1 = __importDefault(require("mongoose"));
const path_1 = __importDefault(require("path"));
// Load env from parent directory
dotenv_1.default.config({ path: path_1.default.join(__dirname, '../../.env') });
async function testConnection() {
    const uri = process.env.MONGODB_URI;
    console.log('Testing MongoDB Connection...');
    console.log(`URI defined: ${!!uri}`);
    if (uri) {
        // Mask password in URI for logging
        const maskedUri = uri.replace(/:([^:@]+)@/, ':****@');
        console.log(`URI: ${maskedUri}`);
    }
    else {
        console.error('MONGODB_URI is not defined in .env');
        return;
    }
    try {
        console.log('Attempting to connect...');
        await mongoose_1.default.connect(uri);
        console.log('Connection SUCCESS!');
        console.log(`Database: ${mongoose_1.default.connection.db?.databaseName}`);
        await mongoose_1.default.disconnect();
    }
    catch (error) {
        console.error('Connection FAILED');
        console.error(error);
        if (error instanceof Error) {
            console.error('Error Name:', error.name);
            console.error('Error Message:', error.message);
            // @ts-ignore
            if (error.reason)
                console.error('Reason:', error.reason);
        }
    }
}
testConnection();
//# sourceMappingURL=test-mongo.js.map