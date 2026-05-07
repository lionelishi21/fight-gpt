const { GoogleGenerativeAI } = require('@google/generative-ai');
require('dotenv').config();

async function listModels() {
  try {
    const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
    // In @google/generative-ai, listing models is done via the main client if supported
    // but often it's easier to just try a few.
    // Actually, let's try gemini-1.5-flash-002 and gemini-1.5-flash-latest
    const models = ['gemini-1.5-flash', 'gemini-1.5-flash-001', 'gemini-1.5-flash-002', 'gemini-1.5-flash-latest'];
    for (const m of models) {
        try {
            const model = genAI.getGenerativeModel({ model: m });
            await model.generateContent("test");
            console.log(`Model ${m} works!`);
        } catch (e) {
            console.log(`Model ${m} failed: ${e.message}`);
        }
    }
  } catch (e) {
    console.error("Error:", e.message);
  }
}
listModels();
