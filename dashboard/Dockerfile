# Multi-stage production build for the Next.js dashboard
FROM node:22.20.0 AS base
WORKDIR /app
ENV NEXT_TELEMETRY_DISABLED=1

FROM base AS deps
COPY dashboard/package*.json ./
RUN npm ci

FROM deps AS builder
COPY dashboard .
RUN npm run build

FROM base AS prod-deps
COPY dashboard/package*.json ./
RUN npm ci --omit=dev

FROM node:22.20.0-slim AS runner
WORKDIR /var/www/XControl/dashboard/
ENV NODE_ENV=production \
    RUNTIME_ENV=prod \
    REGION=cn

COPY --from=prod-deps /app/node_modules ./node_modules
COPY --from=builder /app/package*.json ./
COPY --from=builder /app/.next ./.next
COPY --from=builder /app/public ./public

EXPOSE 3000
CMD ["npm", "run", "start", "--", "-p", "3000"]
