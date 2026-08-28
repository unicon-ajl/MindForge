/** @module MockServer 为 Playground 提供稳定、可控的本地接口。 */

import express from 'express'
import cors from 'cors'
import path from 'path'
import { fileURLToPath } from 'url'
import mainRoutes from './routes/main'
import thirdPartyRoutes from './routes/thirdParty'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

const app = express()
const PORT = Number(process.env.MOCK_PORT) || 3001

// 统一解析常见请求体。
app.use(cors())
app.use(express.json({ limit: '8mb' }))
app.use(express.urlencoded({ extended: true }))

// 同时支持 /assets/file 和 /file。
const assetsDir = path.join(__dirname, 'assets')
app.use('/assets', express.static(assetsDir))
app.use(express.static(assetsDir))

// 用前缀区分主服务和第三方服务。
app.use('/api', mainRoutes)
app.use('/third-party', thirdPartyRoutes)

/** 启动 HTTP 服务，并为端口冲突和进程信号提供明确退出路径。 */
function start(): void {
  const server = app.listen(PORT, () => {
    console.log(`\n⚡ Mock server running at http://localhost:${PORT}`)
    console.log(`   Main service:  http://localhost:${PORT}/api`)
    console.log(`   Third-party:   http://localhost:${PORT}/third-party`)
    console.log(`   Static files:  http://localhost:${PORT}/test.txt\n`)
  })

  server.on('error', (err: NodeJS.ErrnoException) => {
    if (err.code === 'EADDRINUSE') {
      console.error(`\n端口 ${PORT} 已被占用。请设置 MOCK_PORT 使用其他端口。\n`)
      process.exitCode = 1
      return
    }
    throw err
  })

  let isShuttingDown = false
  const shutdown = () => {
    // 第二次信号直接退出，避免关闭过程卡死。
    if (isShuttingDown) process.exit(0)
    isShuttingDown = true
    console.log('\n👋 Mock server stopped')
    server.close(() => process.exit(0))
    // 活跃长连接可能阻止 close 回调，超时后兜底退出开发进程。
    setTimeout(() => process.exit(0), 3000)
  }

  process.on('SIGINT', shutdown)
  process.on('SIGTERM', shutdown)
}

start()
