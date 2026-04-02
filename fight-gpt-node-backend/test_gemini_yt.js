const { GoogleGenerativeAI } = require('@google/generative-ai');
require('dotenv').config();

async function run() {
  try {
    console.log("Starting test...");
    const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
    const modelName = "gemini-2.5-flash";
    console.log(`Using model: ${modelName}`);
    const model = genAI.getGenerativeModel({ model: modelName });

    const result = await model.generateContent([
      { text: "Watch this video: https://www.youtube.com/watch?v=4FF9xGZsgpw What happens in the first 10 seconds?" }
    ]);
    console.log(result.response.text());
  } catch (e) {
    console.error("Error:", e.message);
  }
}
run();
