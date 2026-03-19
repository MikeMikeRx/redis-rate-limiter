# Redis Rate Limiter

A Redis-backed rate limiter implemented in **TypeScript** using the **sliding window algorithm** and an **atomic Lua script**.

This project shows a simple implementation of a Redis-based rate limiter using TypeScript, Express, and Lua.

---

## Features

- Sliding window rate limiting
- Redis sorted set storage
- Atomic execution with Lua
- Automatic script reload on Redis restart (`NOSCRIPT` handling)
- Express middleware integration
- Integration tests with Vitest + Supertest

---

## Example policy

5 requests / 10 seconds / per client (IP)

If the limit is exceeded: `HTTP 429 Too Many Requests`

---

## Tech stack

- TypeScript
- Express
- Redis
- Lua
- Vitest
- Supertest

---

## Running locally

Start Redis:

```bash
docker run --rm -p 6379:6379 redis:7
```
install dependencies:
```bash
npm install
```
Start server:
```bash
npm run dev
```
Endpoints:
```bash
GET /health
GET /limited
```

Running tests:
```bash
npm run test
```

---

## Limitations

- This implementation depends on a single Redis instance.
- It does not address cross-region rate limiting.
- It assumes application and Redis clocks are reasonably aligned.

## Trade-offs

- Sliding window is more accurate than a fixed window, but requires more Redis operations.
- Redis + Lua keeps the implementation simple, but introduces a dependency on Redis availability.
- Per-client limits are easy to apply, but do not cover global or tenant-wide rate limiting.

## Failure scenarios

- If Redis is unavailable, rate limiting cannot be evaluated.
- If Redis restarts, the Lua script cache is lost and must be reloaded.
- Under very high request volume, Redis becomes the main bottleneck.

## Design decisions

- Redis sorted sets are used to store request timestamps inside the active window.
- Lua is used to execute the rate limit check atomically.
- EVALSHA is used to avoid sending the full script on every request.