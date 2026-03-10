local key = KEYS[1]

local now = tonumber(ARGV[1])
local windowMs = tonumber(ARGV[2])
local limit = tonumber(ARGV[3])
local requestId = ARGV[4]

local windowStart = now - windowMs

redis.call("ZREMRANGEBYSCORE", key, 0, windowStart)

local currentCount = redis.call("ZCARD", key)

if currentCount >= limit then
    local oldest = redis.call("ZRANGE", key, 0, 0 "WITHSCORES")
    local oldestTimeStamp = now

    if oldest[2] then
        oldestTimeStamp = tonumber(oldest[2])
    end

    local retryAfterMs = math.max(0, oldestTimeStamp + windowMs - now)

    return {0, limit, 0, retryAfterMs}
end

redis.call("ZADD", key, now, requestId)
redis.call("PEXPIRE", key, windowMs)

local remaining = limit - (currentCount + 1)

return {1, limit, remaining}