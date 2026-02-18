const express = require("express");

const { productCreateSchema, productUpdateSchema } = require("../models/product");
const cache = require("../services/cache");
const db = require("../services/db");
const config = require("../config");

const router = express.Router();

function asyncHandler(handler) {
  return (req, res, next) => {
    Promise.resolve(handler(req, res, next)).catch(next);
  };
}

router.post(
  "/products",
  asyncHandler(async (req, res) => {
    const parsed = productCreateSchema.safeParse(req.body);
    if (!parsed.success) {
      return res.status(400).json({ error: "Invalid payload", details: parsed.error.errors });
    }

    const product = await db.createProduct(parsed.data);
    await cache.invalidateProductCache(product.id);

    res.status(201).json(product);
  })
);

router.get(
  "/products/:id",
  asyncHandler(async (req, res) => {
    const productId = req.params.id;
    const cached = await cache.getProductFromCache(productId);
    if (cached) {
      return res.status(200).json(cached);
    }

    const product = await db.getProduct(productId);
    if (!product) {
      return res.status(404).json({ error: "Product not found" });
    }

    await cache.setProductInCache(product, config.CACHE_TTL_SECONDS);
    res.status(200).json(product);
  })
);

router.put(
  "/products/:id",
  asyncHandler(async (req, res) => {
    const parsed = productUpdateSchema.safeParse(req.body);
    if (!parsed.success) {
      return res.status(400).json({ error: "Invalid payload", details: parsed.error.errors });
    }

    if (Object.keys(parsed.data).length === 0) {
      return res.status(400).json({ error: "At least one field must be provided" });
    }

    const product = await db.updateProduct(req.params.id, parsed.data);
    if (!product) {
      return res.status(404).json({ error: "Product not found" });
    }

    await cache.invalidateProductCache(req.params.id);
    res.status(200).json(product);
  })
);

router.delete(
  "/products/:id",
  asyncHandler(async (req, res) => {
    const deleted = await db.deleteProduct(req.params.id);
    if (!deleted) {
      return res.status(404).json({ error: "Product not found" });
    }

    await cache.invalidateProductCache(req.params.id);
    res.status(204).send();
  })
);

module.exports = router;
