import { ChatService } from '../services/ChatService';
import { AiService } from '../services/AiService';
import { GameMetadataService } from '../services/GameMetadataService';
import { CharacterEncyclopediaService } from '../services/CharacterEncyclopediaService';
import { AnalysisRepository } from '../repositories/AnalysisRepository';
import { AuditLogRepository } from '../repositories/AuditLogRepository';
import { AppConfig } from '../config/app';
import * as dotenv from 'dotenv';
import * as path from 'path';

// Load env vars
dotenv.config();

async function testVertex() {
  console.log('--- Vertex AI Connection Test ---');
  console.log(`Project: ${AppConfig.GOOGLE_CLOUD_PROJECT}`);
  console.log(`Bucket: ${AppConfig.GOOGLE_STORAGE_BUCKET}`);

  try {
    const chatService = new ChatService();
    console.log('\n1. Testing Text Chat...');
    const chatRes = await chatService.sendMessage('Tell me a quick tip for Akuma in SF6.');
    if (chatRes.success) {
      console.log('✅ Chat success!');
      console.log('Response:', chatRes.message.slice(0, 100) + '...');
    } else {
      console.error('❌ Chat failed:', chatRes.error);
    }

    console.log('\n2. Testing Embedding...');
    const aiService = new AiService(
      'none', // API key not used for Vertex
      'gemini-2.0-flash',
      {} as any,
      {} as any
    );
    const embedding = await aiService.generateEmbedding('Akuma Raging Demon');
    if (embedding && embedding.length > 0) {
      console.log(`✅ Embedding success! (Dimensions: ${embedding.length})`);
    } else {
      console.error('❌ Embedding failed');
    }

  } catch (error) {
    console.error('❌ Test crashed:', error);
  }
}

testVertex();
