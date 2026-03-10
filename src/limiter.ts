import type { Redis } from "ioredis";

export type RateLimitResult = {
  allowed: boolean;
  limit: number;
  remaining: number;
  retryAfterMs: number;
};

export class SlidingWindowRateLimiter {
  constructor(private readonly redis: Redis) {}

  async limit(params: {
    key: string;
    limit: number;
    windowMs: number;
  }): Promise<RateLimitResult> {
    const { key, limit, windowMs } = params;

    const now = Date.now();
    const windowStart = now - windowMs;
    const requestId = `${now}-${Math.random().toString(36).slice(2)}`;
    const redisKey = `rate_limit:${key}`;

    const pipeline = this.redis.multi();

    pipeline.zremrangebyscore(redisKey, 0, windowStart);
    pipeline.zcard(redisKey);
    pipeline.zadd(redisKey, now, requestId);
    pipeline.pexpire(redisKey, windowMs);

    const results = await pipeline.exec();

    if (!results) {
      throw new Error("Redis transaction failed");
    }

    const currentCountRaw = results[1]?.[1];
    const currentCount = typeof currentCountRaw === "number" ? currentCountRaw : Number(currentCountRaw);

    const allowed = currentCount < limit;
    const remaining = allowed ? limit - (currentCount + 1) : 0;

    if (!allowed) {
      await this.redis.zrem(redisKey, requestId);

      const oldest = await this.redis.zrange(redisKey, 0, 0, "WITHSCORES");
      const oldestTimestamp = oldest.length >= 2 ? Number(oldest[1]) : now;
      const retryAfterMs = Math.max(0, oldestTimestamp + windowMs - now);

      return {
        allowed: false,
        limit,
        remaining: 0,
        retryAfterMs
      };
    }

    return {
      allowed: true,
      limit,
      remaining,
      retryAfterMs: 0
    };
  }
}