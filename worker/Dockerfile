FROM node:22-slim  AS deps
WORKDIR /app
COPY package.json package-lock.json ./
COPY worker/package.json ./worker/
RUN npm ci --workspace=worker

FROM node:22-slim  AS build
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY --from=deps /app/worker/node_modules ./worker/node_modules
COPY worker ./worker
COPY api/prisma ./api/prisma
COPY package.json package-lock.json ./
RUN npx prisma generate --schema=api/prisma/schema.prisma
RUN npm run build --workspace=worker

FROM node:22-slim  AS production
WORKDIR /app
ENV NODE_ENV=production
COPY --from=deps /app/node_modules ./node_modules
COPY --from=deps /app/worker/node_modules ./worker/node_modules
COPY --from=build /app/worker/dist ./worker/dist
COPY --from=build /app/node_modules/.prisma ./node_modules/.prisma
COPY worker/package.json ./worker/

USER node

CMD ["node", "worker/dist/index.js"]
