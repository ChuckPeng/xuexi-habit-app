import pg from 'pg'
const { Pool } = pg

/**
 * 数据库连接配置 — 优先级：独立环境变量 > DATABASE_URL
 * 生产环境强制要求显式配置，禁止硬编码回退。
 */

function buildConfig() {
  const dbHost = process.env.DB_HOST
  const dbPort = process.env.DB_PORT
  const dbName = process.env.DB_NAME
  const dbUser = process.env.DB_USER
  const dbPassword = process.env.DB_PASSWORD

  if (dbHost && dbName && dbUser && dbPassword) {
    return {
      host: dbHost,
      port: parseInt(dbPort || '5432', 10),
      database: dbName,
      user: dbUser,
      password: dbPassword,
    }
  }

  const dbUrl = process.env.DATABASE_URL
  if (dbUrl) {
    const match = dbUrl.match(
      /postgres(?:ql)?:\/\/([^:]+):([^@]+)@([^:]+):(\d+)\/(.+)/
    )
    if (match) {
      return {
        user: match[1],
        password: match[2],
        host: match[3],
        port: parseInt(match[4], 10),
        database: match[5],
      }
    }
  }

  if (process.env.NODE_ENV === 'production') {
    throw new Error(
      '【安全错误】生产环境必须通过 DB_HOST/DB_PORT/DB_NAME/DB_USER/DB_PASSWORD 或 DATABASE_URL 环境变量配置数据库连接'
    )
  }

  console.warn('⚠ 未检测到数据库环境变量，使用本地开发默认值')
  return {
    host: 'localhost',
    port: 5432,
    database: 'xuexi',
    user: 'postgres',
    password: 'xuexi123456',
  }
}

const dbConfig = buildConfig()

if (process.env.NODE_ENV !== 'production') {
  console.log(
    `[DB] 连接目标 -> ${dbConfig.host}:${dbConfig.port}/${dbConfig.database} (user: ${dbConfig.user})`
  )
}

const pool = new Pool({
  host: dbConfig.host,
  port: dbConfig.port,
  database: dbConfig.database,
  user: dbConfig.user,
  password: dbConfig.password,
  max: 20,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 5000,
  allowExitOnIdle: false,
})

pool.on('error', (err) => {
  console.error('[DB] 连接池异常:', err.message)
})

setInterval(async () => {
  try {
    const client = await pool.connect()
    await client.query('SELECT 1')
    client.release()
  } catch (e) {
    console.error('[DB] 健康检查失败:', e.message)
  }
}, 60_000)

export default pool