import { createClient } from 'redis';

let client: ReturnType<typeof createClient> | null = null;

export async function getRedisClient(): Promise<ReturnType<typeof createClient>> {
  if (!client) {
    const redisUrl = process.env.REDIS_URL;
    if (!redisUrl) {
      throw new Error('REDIS_URL is not set');
    }

    client = createClient({
      url: redisUrl,
      RESP: 2
    });

    client.on('error', (err) => {
      console.error('[Redis] Connection error:', err);
    });

    client.on('connect', () => {
      console.log('[Redis] Connected successfully');
    });

    await client.connect();
  }

  return client;
}

// Graceful shutdown
export async function disconnectRedis(): Promise<void> {
  if (client) {
    await client.disconnect();
    client = null;
  }
}
