FROM node:22-slim  AS build
WORKDIR /app
COPY package.json package-lock.json ./
COPY api/package.json ./api/
COPY worker/package.json ./worker/
COPY frontend/package.json ./frontend/
RUN npm ci --workspace=frontend
COPY frontend ./frontend
ARG VITE_API_URL
ENV VITE_API_URL=${VITE_API_URL}
RUN npm run build --workspace=frontend

FROM nginx:1.27-alpine AS production
COPY --from=build /app/frontend/dist /usr/share/nginx/html
COPY frontend/nginx.conf /etc/nginx/conf.d/default.conf
EXPOSE 80
HEALTHCHECK --interval=30s --timeout=3s --retries=3 \
  CMD wget -q --spider http://127.0.0.1/ || exit 1