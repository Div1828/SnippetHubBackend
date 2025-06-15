const Redis = require("ioredis");

const redis = new Redis({
  host: process.env.REDIS_HOST,
  port: 6379,
  username: "default",
  password: process.env.REDIS_PASSWORD,
  tls: {}, 
});

redis.on("connect", () => console.log("✅ Connected to Redis (Upstash)"));
redis.on("error", (err) => console.error("❌ Redis error:", err));

module.exports = redis;
