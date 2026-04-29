import { GoogleGenerativeAI } from '@google/generative-ai';
import dotenv from 'dotenv';
dotenv.config();

async function main() {
    const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || '');
    // The listModels method is not available on the GoogleGenerativeAI class directly in some versions
    // We can try to use the model and see if it works with a simple prompt
    const models = ['gemini-1.5-flash', 'gemini-1.5-flash-latest', 'gemini-1.5-pro', 'gemini-2.0-flash-exp'];
    
    for (const modelName of models) {
        try {
            console.log(`Testing ${modelName}...`);
            const model = genAI.getGenerativeModel({ model: modelName });
            const result = await model.generateContent('Hello');
            console.log(`[SUCCESS] ${modelName}: ${result.response.text()}`);
        } catch (e: any) {
            console.log(`[FAILED] ${modelName}: ${e.message}`);
        }
    }
}

main();
