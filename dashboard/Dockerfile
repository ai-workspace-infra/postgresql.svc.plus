# =======================================================
# Global ARGs — 必须在所有 FROM 之前声明
# =======================================================
ARG NODE_BUILDER_IMAGE=node:22-bookworm
ARG NODE_RUNTIME_IMAGE=node:22-slim

# -------------------------------------------------------
# Stage 1 — Builder (Turbopack + standalone)
# -------------------------------------------------------
FROM ${NODE_BUILDER_IMAGE} AS builder

WORKDIR /app/dashboard

ENV NEXT_TELEMETRY_DISABLED=1 \
    NEXT_PRIVATE_TURBOPACK=1

RUN apt-get update \
    && apt-get install -y --no-install-recommends curl \
    && rm -rf /var/lib/apt/lists/* \
    && corepack enable \
    && corepack prepare yarn@4.12.0 --activate

# Copy monorepo 内容
COPY . .

# 安装完整依赖（包含 devDependencies）
# ⚡ 使用 Turbopack 编译并启用 standalone 输出
RUN find . -name "package-lock.json" -delete
RUN yarn install --immutable
RUN yarn next build

# -------------------------------------------------------
# Stage 2 — Runtime (极致瘦身)
# -------------------------------------------------------
FROM ${NODE_RUNTIME_IMAGE} AS runner

WORKDIR /app/dashboard/

ENV NODE_ENV=production \
    RUNTIME_ENV=prod \
    REGION=cn \
    PORT=3000

# ---------------------------
# 安装 tini（修复子进程 + 更快退出）
# ---------------------------
RUN apt-get update \
    && apt-get install -y --no-install-recommends tini ca-certificates \
    && rm -rf /var/lib/apt/lists/*

ENTRYPOINT ["/usr/bin/tini", "--"]

# ---------------------------
# 导入 standalone 的运行产物
# ---------------------------
COPY --from=builder /app/dashboard/.next/standalone ./
COPY --from=builder /app/dashboard/.next/static ./static
COPY --from=builder /app/dashboard/public ./public

# ---------------------------
# 额外瘦身（可减少 15–40 MB）
# ---------------------------
#RUN rm -rf node_modules/next/dist/compiled/@vercel/og/* \
#    && rm -rf node_modules/sharp/vendor/* \
#    && find node_modules -name "*.md" -delete \
#    && find node_modules -name "*.map" -delete

# （如果 Edge Runtime 里用不到 font/SWC 也可移除，比现在更狠）

EXPOSE 3000

CMD ["node", "server.js"]
