# Product API with Redis Cache (Node.js)

High-performance REST API for a product catalog using Redis cache-aside with TTL and cache invalidation on writes. The service uses Express.js with SQLite for persistence and Redis for caching.

## Features
- Cache-aside reads with Redis TTL
- Cache invalidation on create, update, delete
- Resilient cache fallback when Redis is unavailable
- SQLite persistence with automatic seed data
- Docker and Docker Compose orchestration

## Tech Stack
- Node.js, Express.js
- Redis (cache)
- SQLite (persistence)
- Jest, Supertest (tests)

## Setup
1. Copy environment file and adjust values as needed:
   ```bash
   cp .env.example .env
   ```
2. Build and run the stack:
   ```bash
   docker-compose up --build
   ```

The API will be available at `http://localhost:8080` by default.

## Environment Variables
Defined in [.env.example](.env.example):
- `API_PORT`: API service port (default 8080)
- `REDIS_HOST`: Redis host (default redis)
- `REDIS_PORT`: Redis port (default 6379)
- `CACHE_TTL_SECONDS`: TTL for cached products
- `DATABASE_URL`: SQLite path (e.g., `sqlite:///./data/products.db`)
- `SEED_DATA`: Seed sample products on startup (`true` or `false`)

## API Endpoints

### Create Product
`POST /products`

Request:
```json
{
  "name": "Example Product",
  "description": "A detailed description of the product.",
  "price": 29.99,
  "stock_quantity": 100
}
```

Response: `201 Created`
```json
{
  "id": "<generated-uuid>",
  "name": "Example Product",
  "description": "A detailed description of the product.",
  "price": 29.99,
  "stock_quantity": 100
}
```

### Get Product by ID
`GET /products/{id}`

Response: `200 OK`
```json
{
  "id": "<product-id>",
  "name": "Example Product",
  "description": "A detailed description of the product.",
  "price": 29.99,
  "stock_quantity": 100
}
```

Response: `404 Not Found`

### Update Product by ID
`PUT /products/{id}`

Request:
```json
{
  "price": 34.99,
  "stock_quantity": 95
}
```

Response: `200 OK`
```json
{
  "id": "<product-id>",
  "name": "Example Product",
  "description": "A detailed description of the product.",
  "price": 34.99,
  "stock_quantity": 95
}
```

Response: `404 Not Found`

### Delete Product by ID
`DELETE /products/{id}`

Response: `204 No Content`

Response: `404 Not Found`

### Health Check
`GET /health`

Response: `200 OK`
```json
{
  "status": "ok"
}
```

## Caching Strategy
- **Cache-aside on reads**: `GET /products/{id}` checks Redis first. On a miss, data is fetched from SQLite and stored in Redis with `CACHE_TTL_SECONDS`.
- **Invalidate on writes**: `POST`, `PUT`, and `DELETE` update the database first, then delete the cached entry for that product ID to ensure fresh reads.
- **Resilience**: Redis errors are logged, and the service falls back to the database without failing the request.

## Running Tests
Run tests using the test compose file (installs dev dependencies in a test image):
```bash
docker-compose -f docker-compose.yml -f docker-compose.test.yml run --rm api-service-test
```

The tests validate cache miss, cache hit, and invalidation behavior.

## Project Structure
```
.
├── src/
│   ├── app.js
│   ├── index.js
│   ├── config.js
│   ├── models/
│   ├── routes/
│   └── services/
├── tests/
├── Dockerfile
├── docker-compose.yml
├── .env.example
└── package.json
```

## Demo Artifacts
- Add screenshots of API requests and Redis cache hit/miss behavior.
- Add a short demo video link (2-5 minutes) showing cache behavior.

## Design Decisions
- SQLite provides a lightweight, file-based persistence layer for simplicity.
- Redis is used exclusively for cache-aside with TTL to avoid stale entries.
- Express.js provides a lightweight, fast JSON API framework.
