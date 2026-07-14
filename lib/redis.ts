import Redis from "ioredis";

let redis: Redis | null = null;

function getRedis(): Redis | null {
  if (!process.env.REDIS_URL) return null;
  if (!redis) {
    redis = new Redis(process.env.REDIS_URL, {
      maxRetriesPerRequest: 3,
      retryStrategy(times) {
        const delay = Math.min(times * 50, 2000);
        return delay;
      },
      lazyConnect: true,
    });
  }
  return redis;
}

export async function getCached<T>(
  key: string,
  fetchFn: () => Promise<T>,
  ttlSeconds = 300
): Promise<T> {
  const client = getRedis();
  if (!client) return fetchFn();

  try {
    const cached = await client.get(key);
    if (cached) return JSON.parse(cached) as T;
  } catch {
    // Redis error - fall through to fetch
  }

  const data = await fetchFn();

  try {
    await client.setex(key, ttlSeconds, JSON.stringify(data));
  } catch {
    // Redis write error - ignore
  }

  return data;
}

export async function invalidateCache(pattern: string): Promise<void> {
  const client = getRedis();
  if (!client) return;

  try {
    const keys = await client.keys(pattern);
    if (keys.length > 0) {
      await client.del(...keys);
    }
  } catch {
    // ignore
  }
}

export default getRedis;
