const { createClient } = require("redis");

const config = require("../config");

let client;

function getCacheKey(productId) {
  return `product:${productId}`;
}

async function getClient() {
  if (!client) {
    client = createClient({
      socket: {
        host: config.REDIS_HOST,
        port: config.REDIS_PORT
      }
    });

    client.on("error", (err) => {
      console.warn("Redis client error:", err);
    });
  }

  if (!client.isOpen) {
    await client.connect();
  }

  return client;
}

async function getProductFromCache(productId) {
  try {
    const redisClient = await getClient();
    const cacheKey = getCacheKey(productId);
    const value = await redisClient.get(cacheKey);
    if (!value) {
      return null;
    }
    try {
      return JSON.parse(value);
    } catch (parseError) {
      await redisClient.del(cacheKey);
      return null;
    }
  } catch (err) {
    console.warn("Redis GET failed:", err);
    return null;
  }
}

async function setProductInCache(product, ttlSeconds) {
  try {
    const redisClient = await getClient();
    await redisClient.setEx(
      getCacheKey(product.id),
      ttlSeconds,
      JSON.stringify(product)
    );
  } catch (err) {
    console.warn("Redis SET failed:", err);
  }
}

async function invalidateProductCache(productId) {
  try {
    const redisClient = await getClient();
    await redisClient.del(getCacheKey(productId));
  } catch (err) {
    console.warn("Redis DEL failed:", err);
  }
}

module.exports = {
  getCacheKey,
  getProductFromCache,
  setProductInCache,
  invalidateProductCache
};
