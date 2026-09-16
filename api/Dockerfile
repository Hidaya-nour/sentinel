# ---- deps: install once, reused across build and prod stages ----
FROM node:22-slim  AS deps
WORKDIR /app
RUN apt-get update -y && apt-get install -y --no-install-recommends openssl && rm -rf /var/lib/apt/lists/*
COPY package.json package-lock.json ./
COPY api/package.json ./api/
COPY worker/package.json ./worker/
COPY frontend/package.json ./frontend/
RUN npm ci --workspace=api

# ---- build: compile TS, generate Prisma client ----
FROM node:22-slim  AS build
WORKDIR /app
RUN apt-get update -y && apt-get install -y --no-install-recommends openssl && rm -rf /var/lib/apt/lists/*
COPY --from=deps /app/node_modules ./node_modules
COPY --from=deps /app/api/node_modules ./api/node_modules
COPY api ./api
COPY package.json package-lock.json ./
COPY worker/package.json ./worker/
COPY frontend/package.json ./frontend/
RUN npx prisma generate --schema=api/prisma/schema.prisma
RUN npm run build --workspace=api

# ---- production: minimal runtime image ----
FROM node:22-slim  AS production
WORKDIR /app
ENV NODE_ENV=production
RUN apt-get update -y && apt-get install -y --no-install-recommends openssl && rm -rf /var/lib/apt/lists/*
COPY --from=deps /app/node_modules ./node_modules
COPY --from=deps /app/api/node_modules ./api/node_modules
COPY --from=build /app/api/dist ./api/dist
COPY --from=build /app/node_modules/.prisma ./node_modules/.prisma
COPY api/prisma ./api/prisma
COPY api/package.json ./api/

# Runs as non-root - a compromised Node process shouldn't have root inside the container
USER node

EXPOSE 4000
HEALTHCHECK --interval=30s --timeout=5s --start-period=10s --retries=3 \
  CMD node -e "fetch('http://localhost:4000/healthz').then(r=>process.exit(r.ok?0:1)).catch(()=>process.exit(1))"

CMD ["node", "api/dist/index.js"]
