import dotenv from 'dotenv';
dotenv.config();
import { GoogleGenerativeAI } from '@google/generative-ai';

async function listModels() {
    try {
        const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || '');
        // The listModels method is not directly on genAI in the newest SDK, 
        // it might be on a different client or needs a fetch.
        // Actually, let's just try to hit the API directly with a simple fetch.
        const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models?key=${process.env.GEMINI_API_KEY}`);
        const data = await response.json();
        console.log(JSON.stringify(data, null, 2));
    } catch (error) {
        console.error('Failed to list models:', error);
    }
}

listModels();
