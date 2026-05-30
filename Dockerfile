# ============================================================
# xuexi-habit-app — 多阶段构建（后端 API + 前端 SPA）
# ============================================================

# ------------------- Stage 1: 构建前端 -------------------
FROM node:20-alpine AS frontend-builder
WORKDIR /app/frontend
COPY frontend/package*.json ./
RUN npm ci
COPY frontend/ ./
RUN npm run build

# ------------------- Stage 2: 安装后端依赖 -------------------
FROM node:20-alpine AS backend-deps
WORKDIR /build
COPY backend/package.json backend/package-lock.json* ./
RUN npm ci --production && npm cache clean --force

# ------------------- Stage 3: 最终镜像 -------------------
FROM node:20-alpine

RUN addgroup -g 1001 -S nodejs && adduser -S nodejs -u 1001
WORKDIR /app

COPY --from=backend-deps --chown=nodejs:nodejs /build/node_modules ./node_modules
COPY --chown=nodejs:nodejs backend/package.json ./
COPY --chown=nodejs:nodejs backend/src/ ./src/
COPY --chown=nodejs:nodejs backend/public/ ./public/
COPY --from=frontend-builder --chown=nodejs:nodejs /app/frontend/dist ./public/

EXPOSE 8080
USER nodejs
CMD ["node", "src/app.js"]