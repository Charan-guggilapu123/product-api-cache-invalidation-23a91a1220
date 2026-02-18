FROM node:20-slim AS deps
WORKDIR /app
COPY package.json package-lock.json* ./
RUN npm install --omit=dev

FROM node:20-slim AS deps-dev
WORKDIR /app
COPY package.json package-lock.json* ./
RUN npm install

FROM node:20-slim AS test
WORKDIR /app
ENV NODE_ENV=test
COPY --from=deps-dev /app/node_modules ./node_modules
COPY package.json ./package.json
COPY src ./src
COPY tests ./tests
CMD ["npm", "test"]

FROM node:20-slim
WORKDIR /app
ENV NODE_ENV=production
COPY --from=deps /app/node_modules ./node_modules
COPY package.json ./package.json
COPY src ./src
EXPOSE 8080
CMD ["node", "src/index.js"]
