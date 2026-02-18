const dotenv = require("dotenv");

dotenv.config();

function parseBool(value, defaultValue) {
  if (value === undefined) {
    return defaultValue;
  }
  return ["1", "true", "yes", "on"].includes(value.toLowerCase());
}

const API_PORT = Number(process.env.API_PORT || 8080);
const REDIS_HOST = process.env.REDIS_HOST || "localhost";
const REDIS_PORT = Number(process.env.REDIS_PORT || 6379);
const CACHE_TTL_SECONDS = Number(process.env.CACHE_TTL_SECONDS || 3600);
const DATABASE_URL = process.env.DATABASE_URL || "sqlite:///./data/products.db";
const SEED_DATA = parseBool(process.env.SEED_DATA, true);

module.exports = {
  API_PORT,
  REDIS_HOST,
  REDIS_PORT,
  CACHE_TTL_SECONDS,
  DATABASE_URL,
  SEED_DATA
};
