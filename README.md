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
