import fs from "node:fs";
import path from "node:path";
import type { Redis } from "ioredis";

const script = fs.readFileSync(
  path.join(process.cwd(), "src/lua/slidingWindow.lua"),
  "utf8"
);

export type RateLimitResult = {
  allowed: boolean;
  limit: number;
  remaining: number;
  retryAfterMs: number;
};

export class SlidingWindowRateLimiter {
  private sha: string | null = null;

  private async getScriptSha(): Promise<string> {
    if (this.sha) {
      return this.sha;
    }

    this.sha = (await this.redis.script("LOAD", script)) as string;
    return this.sha;
  }

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

    const sha = await this.getScriptSha();

    const result = await this.redis.evalsha(
      sha,
      1,
      redisKey,
      now,
      windowMs,
      limit,
      requestId
    ) as [number, number, number, number];

    const [allowed, limitValue, remaining, retryAfterMs] = result;

    return {
      allowed: Boolean(allowed),
      limit: limitValue,
      remaining,
      retryAfterMs
    };
  }
}