const fs = require("fs");
const os = require("os");
const path = require("path");
const request = require("supertest");
const { createClient } = require("redis");

const TEST_DB = path.join(os.tmpdir(), "test_products.db");

let redisClient;
let app;
let init;
let cache;

beforeAll(async () => {
  process.env.DATABASE_URL = `sqlite:////${TEST_DB}`;
  process.env.CACHE_TTL_SECONDS = "5";
  process.env.SEED_DATA = "false";

  if (fs.existsSync(TEST_DB)) {
    fs.unlinkSync(TEST_DB);
  }

  ({ app, init } = require("../src/app"));
  cache = require("../src/services/cache");

  await init();

  redisClient = createClient({
    socket: {
      host: process.env.REDIS_HOST || "redis",
      port: Number(process.env.REDIS_PORT || 6379)
    }
  });

  try {
    await redisClient.connect();
    await redisClient.flushDb();
  } catch (err) {
    console.warn("Redis unavailable for tests:", err);
  }
});

afterAll(async () => {
  if (redisClient && redisClient.isOpen) {
    await redisClient.quit();
  }

  if (fs.existsSync(TEST_DB)) {
    fs.unlinkSync(TEST_DB);
  }
});

test("cache miss, hit, and invalidation", async () => {
  if (!redisClient || !redisClient.isOpen) {
    return;
  }

  const payload = {
    name: "Test Product",
    description: "Test Description",
    price: 19.99,
    stock_quantity: 10
  };

  const createResponse = await request(app).post("/products").send(payload);
  expect(createResponse.statusCode).toBe(201);

  const productId = createResponse.body.id;
  const cacheKey = cache.getCacheKey(productId);

  let cached = await redisClient.get(cacheKey);
  expect(cached).toBeNull();

  const getResponse = await request(app).get(`/products/${productId}`);
  expect(getResponse.statusCode).toBe(200);

  cached = await redisClient.get(cacheKey);
  expect(cached).not.toBeNull();

  const updateResponse = await request(app)
    .put(`/products/${productId}`)
    .send({ price: 29.99, stock_quantity: 8 });
  expect(updateResponse.statusCode).toBe(200);

  cached = await redisClient.get(cacheKey);
  expect(cached).toBeNull();

  const getAfterUpdate = await request(app).get(`/products/${productId}`);
  expect(getAfterUpdate.statusCode).toBe(200);
  expect(getAfterUpdate.body.price).toBe(29.99);

  cached = await redisClient.get(cacheKey);
  expect(cached).not.toBeNull();

  const deleteResponse = await request(app).delete(`/products/${productId}`);
  expect(deleteResponse.statusCode).toBe(204);

  cached = await redisClient.get(cacheKey);
  expect(cached).toBeNull();

  const getAfterDelete = await request(app).get(`/products/${productId}`);
  expect(getAfterDelete.statusCode).toBe(404);
});
