const fs = require("fs");
const path = require("path");
const sqlite3 = require("sqlite3").verbose();
const { v4: uuidv4 } = require("uuid");

const config = require("../config");

let db;

function getDbPath() {
  const databaseUrl = config.DATABASE_URL || "";
  if (databaseUrl.startsWith("sqlite:////")) {
    return databaseUrl.replace("sqlite:////", "/");
  }
  if (databaseUrl.startsWith("sqlite:///")) {
    return databaseUrl.replace("sqlite:///", "");
  }
  if (databaseUrl.startsWith("sqlite://")) {
    return databaseUrl.replace("sqlite://", "");
  }
  return databaseUrl || "./data/products.db";
}

function getDb() {
  if (db) {
    return db;
  }

  const dbPath = getDbPath();
  const directory = path.dirname(dbPath);
  if (directory && directory !== ".") {
    fs.mkdirSync(directory, { recursive: true });
  }

  db = new sqlite3.Database(dbPath);
  return db;
}

function run(sql, params = []) {
  return new Promise((resolve, reject) => {
    getDb().run(sql, params, function onRun(err) {
      if (err) {
        reject(err);
        return;
      }
      resolve({ lastID: this.lastID, changes: this.changes });
    });
  });
}

function get(sql, params = []) {
  return new Promise((resolve, reject) => {
    getDb().get(sql, params, (err, row) => {
      if (err) {
        reject(err);
        return;
      }
      resolve(row || null);
    });
  });
}

async function initDb() {
  await run(
    "CREATE TABLE IF NOT EXISTS products (" +
      "id TEXT PRIMARY KEY, " +
      "name TEXT NOT NULL, " +
      "description TEXT NOT NULL, " +
      "price REAL NOT NULL, " +
      "stock_quantity INTEGER NOT NULL" +
      ")"
  );
}

async function seedProductsIfEmpty() {
  if (!config.SEED_DATA) {
    return;
  }

  const row = await get("SELECT COUNT(*) AS total FROM products");
  if (row && row.total > 0) {
    return;
  }

  const samples = [
    {
      id: uuidv4(),
      name: "Wireless Mouse",
      description: "Ergonomic mouse with adjustable DPI.",
      price: 24.99,
      stock_quantity: 120
    },
    {
      id: uuidv4(),
      name: "Mechanical Keyboard",
      description: "RGB keyboard with blue switches.",
      price: 89.99,
      stock_quantity: 75
    },
    {
      id: uuidv4(),
      name: "USB-C Hub",
      description: "7-in-1 hub with HDMI and Ethernet.",
      price: 39.99,
      stock_quantity: 60
    }
  ];

  for (const sample of samples) {
    await run(
      "INSERT INTO products (id, name, description, price, stock_quantity) VALUES (?, ?, ?, ?, ?)",
      [
        sample.id,
        sample.name,
        sample.description,
        sample.price,
        sample.stock_quantity
      ]
    );
  }
}

async function createProduct(payload) {
  const id = uuidv4();
  await run(
    "INSERT INTO products (id, name, description, price, stock_quantity) VALUES (?, ?, ?, ?, ?)",
    [id, payload.name, payload.description, payload.price, payload.stock_quantity]
  );
  return {
    id,
    ...payload
  };
}

async function getProduct(productId) {
  return await get(
    "SELECT id, name, description, price, stock_quantity FROM products WHERE id = ?",
    [productId]
  );
}

async function updateProduct(productId, updates) {
  const fields = [];
  const values = [];
  const allowed = ["name", "description", "price", "stock_quantity"];

  for (const key of allowed) {
    if (updates[key] !== undefined) {
      fields.push(`${key} = ?`);
      values.push(updates[key]);
    }
  }

  if (fields.length === 0) {
    return null;
  }

  values.push(productId);
  const result = await run(
    `UPDATE products SET ${fields.join(", ")} WHERE id = ?`,
    values
  );

  if (result.changes === 0) {
    return null;
  }

  return await getProduct(productId);
}

async function deleteProduct(productId) {
  const result = await run("DELETE FROM products WHERE id = ?", [productId]);
  return result.changes > 0;
}

module.exports = {
  initDb,
  seedProductsIfEmpty,
  createProduct,
  getProduct,
  updateProduct,
  deleteProduct
};
