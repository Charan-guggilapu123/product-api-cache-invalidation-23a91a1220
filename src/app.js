const express = require("express");

const productsRouter = require("./routes/products");
const db = require("./services/db");

const app = express();

app.use(express.json({ limit: "1mb" }));

app.get("/health", (req, res) => {
  res.status(200).json({ status: "ok" });
});

app.use(productsRouter);

app.use((err, req, res, next) => {
  if (err && err.name === "ZodError") {
    return res.status(400).json({ error: "Invalid payload", details: err.errors });
  }

  console.error("Unhandled error:", err);
  res.status(500).json({ error: "Internal server error" });
});

async function init() {
  await db.initDb();
  await db.seedProductsIfEmpty();
}

module.exports = {
  app,
  init
};
