# ============================================================
# xuexi-habit-app 后端镜像 — 多阶段构建
# ============================================================
# 构建：  docker build -t xuexi-habit-app .
# 运行：  docker run -p 8080:8080 --env-file .env xuexi-habit-app
# ============================================================

# ------------------- Stage 1: 依赖安装 -------------------
FROM node:20-alpine AS builder

WORKDIR /build

COPY backend/package.json backend/package-lock.json* ./
RUN npm ci --production && npm cache clean --force

# ------------------- Stage 2: 生产运行镜像 -------------------
FROM node:20-alpine

RUN addgroup -g 1001 -S nodejs \
 && adduser  -S nodejs -u 1001

WORKDIR /app

COPY --from=builder --chown=nodejs:nodejs /build/node_modules ./node_modules
COPY --chown=nodejs:nodejs backend/package.json ./
COPY --chown=nodejs:nodejs backend/src/       ./src/
COPY --chown=nodejs:nodejs backend/public/    ./public/

EXPOSE 8080

HEALTHCHECK --interval=30s --timeout=5s --start-period=10s --retries=3 \
  CMD node -e "require('http').get('http://localhost:8080/api/health',(r)=>{process.exit(r.statusCode===200?0:1)})"

USER nodejs

CMD ["node", "src/app.js"]