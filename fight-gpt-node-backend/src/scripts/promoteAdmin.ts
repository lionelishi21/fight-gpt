import dotenv from 'dotenv';
import path from 'path';

// Load env
dotenv.config({ path: path.join(__dirname, '../../.env') });

import mongoose from 'mongoose';
import User from '../models/User';
import { Database } from '../config/database';
import { Logger } from '../helpers/logger';

async function promoteAdmin(email: string) {
    try {
        await Database.connect();

        let user = await User.findOne({ email });
        if (!user) {
            Logger.info(`User ${email} not found. Creating default admin account...`);
            user = new User({
                name: 'System Admin',
                email: email,
                password: 'AdminPassword123!', // Required by your user model validation
                role: 'admin',
                onboardingCompleted: true,
                preferences: {
                    favoriteGames: [],
                    skillLevel: 'pro'
                }
            });
            await user.save();
            Logger.info(`SUCCESS: Created new ADMIN user with email ${email} and password: AdminPassword123!`);
        } else {
            user.role = 'admin';
            await user.save();
            Logger.info(`SUCCESS: Existing user ${email} has been promoted to ADMIN.`);
        }

        Logger.info(`SUCCESS: User ${email} has been promoted to ADMIN.`);
        
        await Database.disconnect();
        process.exit(0);
    } catch (error) {
        Logger.error('Failed to promote user', error);
        process.exit(1);
    }
}

const targetEmail = process.argv[2] || 'lionelfrancis7@gmail.com';
promoteAdmin(targetEmail);
