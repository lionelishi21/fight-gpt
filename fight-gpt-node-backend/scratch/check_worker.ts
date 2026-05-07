import IORedis from 'ioredis';
import dotenv from 'dotenv';

dotenv.config();

const REDIS_URL = process.env.REDIS_URL || 'redis://localhost:6379';

async function checkWorker() {
    const connection = new IORedis(REDIS_URL);
    const val = await connection.get('metapunish:worker:heartbeat');
    if (val) {
        console.log('Worker is ALIVE. Heartbeat timestamp:', new Date(parseInt(val)).toISOString());
    } else {
        console.log('Worker is OFFLINE.');
    }
    process.exit(0);
}

checkWorker();
