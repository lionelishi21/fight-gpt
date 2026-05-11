import { VertexAI } from '@google-cloud/vertexai';
import * as dotenv from 'dotenv';
dotenv.config();

async function test() {
  const vertexAI = new VertexAI({ project: process.env.GOOGLE_CLOUD_PROJECT, location: process.env.GOOGLE_CLOUD_LOCATION || 'us-central1' });
  const model = vertexAI.getGenerativeModel({ model: 'text-embedding-004' });
  try {
    // try to see if it has embedContent
    if (typeof model.embedContent === 'function') {
      console.log('embedContent exists');
      const res = await model.embedContent('hello world');
      console.log(res.embedding?.values?.length);
    } else {
      console.log('embedContent does not exist on Vertex AI model object');
    }
  } catch (e) {
    console.error(e);
  }
}
test();
