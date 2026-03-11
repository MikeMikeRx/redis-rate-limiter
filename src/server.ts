import express, { type Request, type Response, type NextFunction } from "express";
import { redis } from "./redis.js";
import { SlidingWindowRateLimiter } from "./limiter.js";

export const app = express();
const limiter = new SlidingWindowRateLimiter(redis);

app.use(express.json());

function getClientKey(req: Request): string {
    const forwarded = req.headers["x-forwarded-for"];
    if (typeof forwarded === "string" && forwarded.length > 0) {
        return forwarded.split(",")[0].trim();
    }

    return req.ip ?? "unknown";
}

async function rateLimitMiddleware(req: Request, res: Response, next: NextFunction) {
    try {
        const result = await limiter.limit({
            key: getClientKey(req),
            limit: 5,
            windowMs: 200
        });

        res.setHeader("X-RateLimit-Limit", String(result.limit));
        res.setHeader("X-RateLimit-Remaining", String(result.remaining));

        if (!result.allowed) {
            res.setHeader("Retry-After", String(Math.ceil(result.retryAfterMs / 1000)));

            return res.status(429).json({
                message: "Too many requests",
                retryAfterMs: result.retryAfterMs
            });
        }

        next();
    } catch (error) {
        next(error);
    }
}
    
app.get("/health", (_req, res) => {
    res.json({ ok: true });
});

app.get("/limited", rateLimitMiddleware, (_req, res) => {
    res.json({ message: "Request allowed" });
});

app.use((error: unknown, _req: Request, res: Response, _next: NextFunction) => {
    console.error(error);
    res.status(500).json({ message: "Internal server error" });
});

const port = Number(process.env.PORT ?? 3000);

app.listen(port, () => {
    console.log(`Server running on http://localhost:${port}`);
});
