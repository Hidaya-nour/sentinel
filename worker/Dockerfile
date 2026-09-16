FROM node:22-slim  AS deps
WORKDIR /app
RUN apt-get update -y && apt-get install -y --no-install-recommends openssl && rm -rf /var/lib/apt/lists/*
COPY package.json package-lock.json ./
COPY api/package.json ./api/
COPY worker/package.json ./worker/
COPY frontend/package.json ./frontend/
COPY api/prisma ./api/prisma
RUN npm ci --workspace=worker

FROM node:22-slim  AS build
WORKDIR /app
RUN apt-get update -y && apt-get install -y --no-install-recommends openssl && rm -rf /var/lib/apt/lists/*
COPY --from=deps /app/node_modules ./node_modules
COPY --from=deps /app/worker/node_modules ./worker/node_modules
COPY worker ./worker
COPY api/prisma ./api/prisma
COPY package.json package-lock.json ./
COPY api/package.json ./api/
COPY frontend/package.json ./frontend/
RUN npx prisma generate --schema=api/prisma/schema.prisma
RUN npm run build --workspace=worker

FROM node:22-slim  AS production
WORKDIR /app
ENV NODE_ENV=production
RUN apt-get update -y && apt-get install -y --no-install-recommends openssl && rm -rf /var/lib/apt/lists/*
COPY --from=deps /app/node_modules ./node_modules
COPY --from=deps /app/worker/node_modules ./worker/node_modules
COPY --from=build /app/worker/dist ./worker/dist
COPY --from=build /app/node_modules/.prisma ./node_modules/.prisma
COPY worker/package.json ./worker/

USER node

CMD ["node", "worker/dist/index.js"]
