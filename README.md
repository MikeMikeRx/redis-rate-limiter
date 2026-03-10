# Redis Rate Limiter

Sliding-window rate limiter built with Node.js, TypeScript, Express, and Redis.

🚧 Work in progress — project is actively evolving.

## Features

- Sliding-window algorithm
- Per-client request tracking
- Redis-backed state
- Retry-After support
- Rate-limit headers

## Algorithm

For each request:
1. Remove expired timestamps from Redis sorted set
2. Count active requests inside the current window
3. Reject if count is at limit
4. Add current request timestamp
5. Set Redis key expiration

## Example policy

- 5 requests
- per 10 seconds
- per IP

## Run locally

```bash
npm install
npm run dev