const { GoogleGenerativeAI } = require('@google/generative-ai');
require('dotenv').config();

async function testPro() {
  try {
    const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
    const m = 'gemini-1.5-pro';
    try {
        const model = genAI.getGenerativeModel({ model: m });
        await model.generateContent("test");
        console.log(`Model ${m} works!`);
    } catch (e) {
        console.log(`Model ${m} failed: ${e.message}`);
    }
  } catch (e) {
    console.error("Error:", e.message);
  }
}
testPro();
