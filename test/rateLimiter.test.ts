import request from "supertest";
import { beforeEach, describe, expect, it } from "vitest";
import { redis } from "../src/redis.js";
import { app } from "../src/server.js";

describe("rate limiter", () => {
    beforeEach(async () => {
        await redis.flushdb();
    });

    it("allows requests under the limit", async () => {
        const responses = await Promise.all(
            Array.from({ length: 5 }, () => request(app).get("/limited"))
        );

        for (const response of responses) {
            expect(response.status).toBe(200);
        }
    });

    it("blocks requests over the limit", async () => {
        for (let i = 0; i < 5; i++) {
            await request(app).get("/limited");
        }

        const response = await request(app).get("/limited")

        expect(response.status).toBe(429);
        expect(response.body.message).toBe("Too many requests");
    });

    it("resets after the window passes", async () => {
        for (let i = 0; i < 5; i++) {
            await request(app).get("/limited");
        }

        await new Promise((resolve) => setTimeout(resolve, 10_100));

        const response = await request(app).get("/limited");

        expect(response.status).toBe(200);
    }, 15_000);
});