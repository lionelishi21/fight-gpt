#!/usr/bin/env node
/**
 * Simple MongoDB connection test script
 * Usage: node test-mongodb.js
 */

require('dotenv').config();
const mongoose = require('mongoose');

async function testConnection() {
  const mongoUri = process.env.MONGODB_URI;

  if (!mongoUri) {
    console.log('❌ MONGODB_URI is not set in .env file');
    console.log('\nTo set it up:');
    console.log('1. Uncomment the MONGODB_URI line in .env');
    console.log('2. Replace <db_password> with your actual MongoDB password');
    console.log('3. Format: mongodb+srv://app_user:YOUR_PASSWORD@cluster0.f7ssjug.mongodb.net/fight_gpt?retryWrites=true&w=majority&appName=Cluster0');
    process.exit(1);
  }

  // Check if URI has placeholder
  if (mongoUri.includes('<db_password>')) {
    console.log('❌ MONGODB_URI contains placeholder <db_password>');
    console.log('Please replace <db_password> with your actual MongoDB password');
    process.exit(1);
  }

  console.log('🔄 Attempting to connect to MongoDB...');
  console.log(`📍 Cluster: ${mongoUri.match(/@([^/]+)/)?.[1] || 'unknown'}`);
  console.log(`📊 Database: ${mongoUri.match(/\/([^?]+)/)?.[1] || 'unknown'}`);

  try {
    const options = {
      retryWrites: true,
      w: 'majority',
      serverSelectionTimeoutMS: 5000, // 5 second timeout
    };

    await mongoose.connect(mongoUri, options);
    
    const dbName = mongoose.connection.db?.databaseName;
    const collections = await mongoose.connection.db?.listCollections().toArray();
    
    console.log('\n✅ MongoDB connected successfully!');
    console.log(`📊 Database: ${dbName}`);
    console.log(`📁 Collections (${collections?.length || 0}):`);
    
    if (collections && collections.length > 0) {
      collections.forEach(col => {
        console.log(`   - ${col.name}`);
      });
    } else {
      console.log('   (no collections yet)');
    }
    
    await mongoose.disconnect();
    console.log('\n✅ Connection test completed successfully!');
    process.exit(0);
  } catch (error) {
    console.error('\n❌ MongoDB connection failed!');
    console.error(`Error: ${error.message}`);
    
    if (error.message.includes('authentication failed')) {
      console.log('\n💡 Possible issues:');
      console.log('   - Incorrect password in MONGODB_URI');
      console.log('   - Username might be wrong');
    } else if (error.message.includes('ENOTFOUND') || error.message.includes('getaddrinfo')) {
      console.log('\n💡 Possible issues:');
      console.log('   - Network connectivity problem');
      console.log('   - Cluster URL might be incorrect');
    } else if (error.message.includes('timeout')) {
      console.log('\n💡 Possible issues:');
      console.log('   - Network firewall blocking connection');
      console.log('   - MongoDB Atlas network access not configured');
      console.log('   - IP address not whitelisted in MongoDB Atlas');
    }
    
    process.exit(1);
  }
}

testConnection();
