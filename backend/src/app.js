import Koa from 'koa'
import Router from 'koa-router'
import cors from '@koa/cors'
import bodyParser from 'koa-bodyparser'
import dotenv from 'dotenv'
import serve from 'koa-static'
import fs from 'fs'
import path from 'path'

// 路由
import authRoutes from './routes/auth.js'
import familyRoutes from './routes/families.js'
import goalRoutes from './routes/goals.js'
import taskRoutes from './routes/tasks.js'
import rewardRoutes from './routes/rewards.js'
import exchangeRoutes from './routes/exchanges.js'
import achievementRoutes from './routes/achievements.js'
import signinRoutes from './routes/signin.js'
import approvalRoutes from './routes/approvals.js'
import logRoutes from './routes/logs.js'
import statisticsRoutes from './routes/statistics.js'
import stickersRoutes from './routes/stickers.js'
import displayRoutes from './routes/display.js'
import reportRoutes from './routes/report.js'
import backupRoutes from './routes/backup.js'
import streakRoutes from './routes/streak.js'
import wheelRoutes from './routes/wheel.js'
import avatarRoutes from './routes/avatars.js'
import stickerLotteryRoutes from './routes/stickerLottery.js'
import emojiPetsRoutes from './routes/emojiPets.js'
import pointRoutes from './routes/points.js'

// 加载环境变量
try {
  dotenv.config({ path: process.cwd() + '/../.env' })
} catch (e) {
  dotenv.config()
}

const app = new Koa()
const PORT = process.env.PORT || 8080

// CORS
const corsOrigin = process.env.ALLOWED_ORIGIN || ''
if (!corsOrigin && process.env.NODE_ENV === 'production') {
  console.warn('【警告】生产环境未设置 ALLOWED_ORIGIN，默认拒绝所有跨域请求')
}
app.use(cors({
  origin: corsOrigin || false,
  credentials: true
}))
app.use(bodyParser())

// API 路由
const router = new Router()
router.get('/api/health', (ctx) => {
  ctx.body = { code: 0, message: 'ok', timestamp: new Date().toISOString() }
})

app.use(router.routes())
app.use(authRoutes.routes())
app.use(familyRoutes.routes())
app.use(goalRoutes.routes())
app.use(taskRoutes.routes())
app.use(rewardRoutes.routes())
app.use(exchangeRoutes.routes())
app.use(achievementRoutes.routes())
app.use(signinRoutes.routes())
app.use(logRoutes.routes())
app.use(approvalRoutes.routes())
app.use(statisticsRoutes.routes())
app.use(stickersRoutes.routes())
app.use(displayRoutes.routes())
app.use(reportRoutes.routes())
app.use(backupRoutes.routes())
app.use(streakRoutes.routes())
app.use(wheelRoutes.routes())
app.use(stickerLotteryRoutes.routes())
app.use(emojiPetsRoutes.routes())
app.use(pointRoutes.routes())
app.use(avatarRoutes.routes())

// 静态文件（头像、前端 SPA）
app.use(serve('./public', { maxage: 86400000 }))

// SPA 回退：未匹配的 GET 请求返回 index.html
const indexPath = path.join(process.cwd(), 'public', 'index.html')
app.use(async (ctx, next) => {
  await next()
  if (ctx.status === 404 && ctx.method === 'GET' && !ctx.path.startsWith('/api')) {
    if (fs.existsSync(indexPath)) {
      ctx.type = 'html'
      ctx.body = fs.createReadStream(indexPath)
      ctx.status = 200
    }
  }
})

// 错误处理
app.use(async (ctx, next) => {
  try {
    await next()
  } catch (err) {
    console.error('【请求错误】:', err.message, err.stack)
    ctx.status = err.status || 500
    ctx.body = {
      code: 500,
      message: err.message || 'Internal Server Error',
      data: null
    }
  }
})

// 全局异常处理
process.on('uncaughtException', (err) => {
  console.error('【严重错误-未捕获异常】:', err.message, err.stack)
  setTimeout(() => process.exit(1), 1000)
})

process.on('unhandledRejection', (reason) => {
  console.error('【警告-未处理的Promise拒绝】:', reason)
})

// 优雅关闭
async function gracefulShutdown(signal) {
  console.log(`【关闭】收到 ${signal}，开始优雅关闭...`)
  server.close(() => console.log('【关闭】HTTP 服务器已关闭'))
  try {
    const pool = (await import('./config/database.js')).default
    await pool.end()
    console.log('【关闭】数据库连接池已关闭')
  } catch (e) {
    console.error('【关闭】关闭数据库连接池失败:', e.message)
  }
  process.exit(0)
}

process.on('SIGTERM', () => gracefulShutdown('SIGTERM'))
process.on('SIGINT', () => gracefulShutdown('SIGINT'))

// 启动
const server = app.listen(PORT, '0.0.0.0', () => {
  console.log(`✅ Server running on port ${PORT} [${process.env.NODE_ENV || 'development'}]`)
})