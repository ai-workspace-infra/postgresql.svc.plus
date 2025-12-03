# Multi-stage production build for the Next.js dashboard
ARG NODE_BUILDER_IMAGE
ARG NODE_RUNTIME_IMAGE

FROM ${NODE_BUILDER_IMAGE} AS base
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

FROM ${NODE_RUNTIME_IMAGE} AS runner
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
