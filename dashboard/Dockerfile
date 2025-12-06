# =======================================================
# Global ARGs — 必须在所有 FROM 之前声明（修复你的错误）
# =======================================================
#
# 默认改为使用官方 Node 镜像，避免无法访问私有 GHCR 镜像导致的构建失败。
ARG NODE_BUILDER_IMAGE=node:22-bookworm
ARG NODE_RUNTIME_IMAGE=node:22-bookworm-slim

# -------------------------------------------------------
# Stage 1 — Build (deps + app build via Makefile)
# -------------------------------------------------------
FROM ${NODE_BUILDER_IMAGE} AS builder

WORKDIR /app/dashboard
ENV NEXT_TELEMETRY_DISABLED=1

# Ensure build tooling (curl via apt) and Yarn (via Corepack) are available
RUN apt-get update \
    && apt-get install -y --no-install-recommends curl \
    && rm -rf /var/lib/apt/lists/* \
    && corepack enable

# Copy entire project
COPY . .

# Install dependencies and build the dashboard
RUN yarn install --frozen-lockfile \
    && yarn next build

# -------------------------------------------------------
# Stage 2 — Runtime image (minimal + production deps)
# -------------------------------------------------------
FROM ${NODE_RUNTIME_IMAGE} AS runner

WORKDIR /app/dashboard
ENV NODE_ENV=production \
    RUNTIME_ENV=prod \
    REGION=cn

# Copy exact runtime artifacts
COPY --from=builder /app/dashboard/.next ./.next
COPY --from=builder /app/dashboard/package*.json ./
COPY --from=builder /app/dashboard/public ./public
COPY --from=builder /app/dashboard/node_modules ./node_modules

EXPOSE 3000

CMD ["npm", "run", "start", "--", "-p", "3000"]
