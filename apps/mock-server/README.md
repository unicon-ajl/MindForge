# Mock 服务

> 基于 Express 的轻量级 Mock 服务器，标准 REST API，零学习成本。

## 快速开始

```bash
# 启动 Mock 服务器（端口 3001）
npm run dev:mock

# 启动演示站点（自动代理 /api 到 Mock）
npm run dev
```

## 访问静态资源

```
http://localhost:3001/文件名          # 根路径访问
http://localhost:3001/assets/文件名   # assets 路径访问
```

## 文件结构

```
apps/mock-server/
├── server.ts                  # 启动入口（中间件 + 路由挂载）
├── middleware/
│   └── delay.ts               # 延迟工具函数
├── routes/
│   ├── userRoutes.ts          # 用户域路由
│   └── authRoutes.ts          # 认证域路由
└── assets/                    # 静态资源目录
```

## 新增接口（2 步）

### 1. 新建路由文件（或在已有文件追加）

```typescript
// apps/mock-server/routes/orderRoutes.ts
import { Router } from 'express'
import { delay } from '../middleware/delay'

const router = Router()

const orders = [{ id: 1, title: '订单A' }]

router.get('/list', async (req, res) => {
  await delay(300)
  res.json({ code: 200, data: { list: orders, total: orders.length } })
})

router.post('/', async (req, res) => {
  const newOrder = { id: orders.length + 1, ...req.body }
  orders.push(newOrder)
  res.status(201).json({ code: 200, message: '创建成功', data: newOrder })
})

export default router
```

### 2. 在 server.ts 挂载路由

```typescript
// apps/mock-server/server.ts
import orderRoutes from './routes/orderRoutes'

app.use('/api/orders', orderRoutes) // ← 追加这一行
```

## 内置工具

### delay - 模拟网络延迟

```typescript
import { delay } from '../middleware/delay'

await delay(500) // 延迟 500ms
```

### 静态资源服务

```typescript
// server.ts 中已配置
app.use(express.static(assetsDir)) // /files/xxx
app.use('/assets', express.static(assetsDir)) // /assets/files/xxx
```

## API 响应格式

```typescript
// 成功
{ code: 200, message: 'success', data: ... }

// 失败
{ code: 404, message: '资源不存在', data: null }
```

## 端口配置

默认端口 `3001`，可通过环境变量修改：

```bash
MOCK_PORT=3002 npm run dev:mock
```

端口被占用时服务会安全退出，不会强制终止其他进程。可通过 `MOCK_PORT` 切换端口。

## 迁移到其他项目

1. 复制整个 `apps/mock-server/` 目录
2. 安装依赖：`npm install express cors`
3. 启动：`npx tsx apps/mock-server/server.ts`

**零依赖迁移**：仅依赖 Express，与 Vue/React/Angular 无关。

## License

MIT
