# =======================================================
# Global ARGs — 必须在所有 FROM 之前声明（修复你的错误）
# =======================================================
ARG NODE_BUILDER_IMAGE=ghcr.io/cloud-neutral-toolkit/node-builder:latest
ARG NODE_RUNTIME_IMAGE=ghcr.io/cloud-neutral-toolkit/node-runtime:latest

# -------------------------------------------------------
# Stage 1 — Build (deps + app build via Makefile)
# -------------------------------------------------------
FROM ${NODE_BUILDER_IMAGE} AS builder

WORKDIR /app
ENV NEXT_TELEMETRY_DISABLED=1

# Copy entire project
COPY . .

# Run Makefile build (must produce .next + node_modules cleaned)
RUN make build

# -------------------------------------------------------
# Stage 2 — Runtime image (minimal + production deps)
# -------------------------------------------------------
FROM ${NODE_RUNTIME_IMAGE} AS runner

WORKDIR /app
ENV NODE_ENV=production \
    RUNTIME_ENV=prod \
    REGION=cn

# Copy exact runtime artifacts
COPY --from=builder /app/.next ./.next
COPY --from=builder /app/package*.json ./
COPY --from=builder /app/public ./public
COPY --from=builder /app/node_modules ./node_modules

EXPOSE 3000

CMD ["npm", "run", "start", "--", "-p", "3000"]
