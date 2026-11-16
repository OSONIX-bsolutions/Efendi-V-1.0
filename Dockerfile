# syntax=docker/dockerfile:1

# ==============================================================================
# Stage 1: Build Frontend (Vite SPA) and Production Backend (esbuild)
# ==============================================================================
FROM node:22-alpine AS builder
WORKDIR /app

COPY package.json package-lock.json* bun.lock* ./
RUN npm ci

COPY . .

# Optional build-time public Supabase vars (also supported at runtime via server injection)
ARG VITE_SUPABASE_URL=""
ARG VITE_SUPABASE_ANON_KEY=""
ENV VITE_SUPABASE_URL=$VITE_SUPABASE_URL
ENV VITE_SUPABASE_ANON_KEY=$VITE_SUPABASE_ANON_KEY

RUN npm run build

# ==============================================================================
# Stage 2: Minimal Production Runtime Image for Google Cloud Run
# ==============================================================================
FROM node:22-alpine AS runner
WORKDIR /app

ENV NODE_ENV=production
ENV PORT=8080

COPY package.json package-lock.json* ./
RUN npm ci --omit=dev && npm cache clean --force

COPY --from=builder /app/dist ./dist
COPY --from=builder /app/dist-server ./dist-server
COPY --from=builder /app/public ./public

# Run as non-root user
RUN chown -R node:node /app
USER node

EXPOSE 8080

HEALTHCHECK --interval=30s --timeout=5s --start-period=10s --retries=3 \
  CMD wget -qO- http://127.0.0.1:${PORT}/api/health || exit 1

CMD ["npm", "start"]
