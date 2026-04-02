'use strict';

const express = require('express');
const axios = require('axios');
const { MongoClient } = require('mongodb');
const { v4: uuidv4 } = require('uuid');
const dotenv = require('dotenv');

dotenv.config();

const PORT = process.env.PORT || 5000;
const AI_SERVICE_URL = process.env.AI_SERVICE_URL || 'http://localhost:8000';
const MONGO_URI = process.env.MONGO_URI;
const MONGO_DB_NAME = process.env.MONGO_DB_NAME || 'fight_gpt_db';
const MONGO_CACHE_COLLECTION = process.env.MONGO_CACHE_COLLECTION || 'analysis_cache';
const MONGO_AUDIT_COLLECTION = process.env.MONGO_AUDIT_COLLECTION || 'analysis_requests';

if (!MONGO_URI) {
  // eslint-disable-next-line no-console
  console.warn('⚠️  MONGO_URI is not set. The gateway will run without caching.');
}

const app = express();
app.use(express.json({ limit: '1mb' }));

const metrics = {
  analyzeSuccess: 0,
  analyzeCacheHit: 0,
  analyzeError: 0,
};

let mongoClient;
let cacheCollection;
let auditCollection;

async function connectMongo() {
  if (!MONGO_URI) {
    return;
  }

  if (mongoClient) {
    return;
  }

  mongoClient = new MongoClient(MONGO_URI);
  await mongoClient.connect();
  const db = mongoClient.db(MONGO_DB_NAME);
  cacheCollection = db.collection(MONGO_CACHE_COLLECTION);
  auditCollection = db.collection(MONGO_AUDIT_COLLECTION);

  // eslint-disable-next-line no-console
  console.log(`✅ Connected to MongoDB database "${MONGO_DB_NAME}"`);
}

function pickCacheDocument(doc) {
  if (!doc) {
    return null;
  }

  return {
    analysis_id: doc.analysis_id || doc._id?.toString() || uuidv4(),
    youtube_url: doc.youtube_url,
    game_id: doc.game_id,
    analysis: doc.analysis,
    source: 'cache',
    cached_at: doc.cached_at,
  };
}

function validateRequestBody(body) {
  const errors = [];
  if (!body || typeof body !== 'object') {
    errors.push('Request body must be a JSON object.');
    return errors;
  }

  if (!body.youtube_url || typeof body.youtube_url !== 'string') {
    errors.push('Field "youtube_url" is required and must be a string.');
  }

  if (!body.game_id || typeof body.game_id !== 'string') {
    errors.push('Field "game_id" is required and must be a string.');
  }

  return errors;
}

app.get('/api/health', (req, res) => {
  res.status(200).json({
    status: 'ok',
    service: 'fight-gpt-api',
    metrics,
  });
});

app.post('/api/analyze', async (req, res) => {
  const validationErrors = validateRequestBody(req.body);
  if (validationErrors.length > 0) {
    metrics.analyzeError += 1;
    return res.status(400).json({ error: 'Invalid request payload', details: validationErrors });
  }

  const { youtube_url: youtubeUrl, game_id: gameId } = req.body;
  const requestId = uuidv4();

  // eslint-disable-next-line no-console
  console.log(`[${requestId}] Incoming analysis request`, { youtubeUrl, gameId });

  let auditRecordId;
  try {
    await connectMongo();

    if (auditCollection) {
      const { insertedId } = await auditCollection.insertOne({
        request_id: requestId,
        youtube_url: youtubeUrl,
        game_id: gameId,
        status: 'received',
        ip: req.ip,
        received_at: new Date(),
      });
      auditRecordId = insertedId;
    }

    const cachedDoc = cacheCollection
      ? await cacheCollection.findOne({ youtube_url: youtubeUrl, game_id: gameId })
      : null;

    if (cachedDoc) {
      metrics.analyzeCacheHit += 1;
      metrics.analyzeSuccess += 1;

      if (auditCollection && auditRecordId) {
        await auditCollection.updateOne(
          { _id: auditRecordId },
          { $set: { status: 'cache_hit', completed_at: new Date() } }
        );
      }

      const payload = pickCacheDocument(cachedDoc);
      // eslint-disable-next-line no-console
      console.log(`[${requestId}] Cache hit for ${youtubeUrl}`);
      return res.status(200).json({
        status: 'success',
        source: 'cache',
        analysis_id: payload.analysis_id,
        analysis: payload.analysis,
      });
    }

    const aiResponse = await axios.post(
      `${AI_SERVICE_URL}/analyze`,
      { youtube_url: youtubeUrl, game_id: gameId },
      { timeout: Number(process.env.AI_REQUEST_TIMEOUT_MS) || 300000 }
    );

    const analysisId = uuidv4();
    const responseBody = aiResponse.data;
    const analysisPayload = Array.isArray(responseBody.analysis)
      ? responseBody.analysis
      : [];

    if (cacheCollection) {
      await cacheCollection.updateOne(
        { youtube_url: youtubeUrl, game_id: gameId },
        {
          $set: {
            youtube_url: youtubeUrl,
            game_id: gameId,
            analysis_id: analysisId,
            analysis: analysisPayload,
            cached_at: new Date(),
            source: responseBody.source || 'new_analysis',
          },
        },
        { upsert: true }
      );
    }

    if (auditCollection && auditRecordId) {
      await auditCollection.updateOne(
        { _id: auditRecordId },
        {
          $set: {
            status: 'success',
            completed_at: new Date(),
            analysis_id: analysisId,
            source: responseBody.source || 'new_analysis',
          },
        }
      );
    }

    metrics.analyzeSuccess += 1;

    // eslint-disable-next-line no-console
    console.log(`[${requestId}] Analysis completed via AI service`);

    return res.status(200).json({
      status: 'success',
      source: responseBody.source || 'new_analysis',
      analysis_id: analysisId,
      analysis: analysisPayload,
    });
  } catch (error) {
    metrics.analyzeError += 1;

    if (auditCollection && auditRecordId) {
      await auditCollection.updateOne(
        { _id: auditRecordId },
        { $set: { status: 'error', error: error.message, completed_at: new Date() } }
      );
    }

    if (axios.isAxiosError(error)) {
      const statusCode = error.response?.status || 502;
      const message =
        statusCode === 502 ? 'AI service unavailable' : error.response?.data?.detail || error.message;

      // eslint-disable-next-line no-console
      console.error(`[${requestId}] AI service error`, { statusCode, message });
      return res.status(502).json({ error: message });
    }

    // eslint-disable-next-line no-console
    console.error(`[${requestId}] Unexpected error`, error);
    return res.status(500).json({ error: 'Internal server error' });
  }
});

async function start() {
  await connectMongo().catch((error) => {
    // eslint-disable-next-line no-console
    console.warn(`⚠️  Failed to connect to MongoDB: ${error.message}. Continuing without cache.`);
  });

  app.listen(PORT, () => {
    // eslint-disable-next-line no-console
    console.log(`🚀 Fight GPT API gateway listening on port ${PORT}`);
  });
}

process.on('SIGINT', async () => {
  if (mongoClient) {
    await mongoClient.close();
  }
  process.exit(0);
});

start().catch((error) => {
  // eslint-disable-next-line no-console
  console.error('Failed to start API gateway', error);
  process.exit(1);
});

