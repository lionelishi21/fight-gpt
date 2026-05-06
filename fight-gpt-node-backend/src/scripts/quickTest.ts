import * as dotenv from 'dotenv';
import { GoogleAuth } from 'google-auth-library';

dotenv.config();

async function rawTest() {
  const project = process.env.GOOGLE_CLOUD_PROJECT;
  const location = 'us-central1';
  // Final 2026 Production Model Alias
  const model = 'gemini-2.5-flash'; 
  
  console.log(`--- 2026 Production Connection Test ---`);
  console.log(`Project: ${project}`);
  console.log(`Model: ${model}`);

  try {
    const auth = new GoogleAuth({
      scopes: 'https://www.googleapis.com/auth/cloud-platform'
    });
    const client = await auth.getClient();
    const token = await client.getAccessToken();

    const url = `https://${location}-aiplatform.googleapis.com/v1/projects/${project}/locations/${location}/publishers/google/models/${model}:streamGenerateContent`;
    
    console.log(`POST ${url}`);

    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token.token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        contents: [{ role: 'user', parts: [{ text: 'Hi' }] }]
      })
    });

    const data = await response.json();
    if (response.ok) {
      console.log('✅ SUCCESS! Vertex AI is connected using Gemini 2.5 Flash.');
      console.log('Response:', JSON.stringify(data[0]?.candidates?.[0]?.content?.parts?.[0]?.text));
    } else {
      console.error(`❌ FAILED (Status ${response.status})`);
      console.error('Full error:', JSON.stringify(data, null, 2));
    }
  } catch (e: any) {
    console.error('❌ Request crashed:', e.message);
  }
}

rawTest();
