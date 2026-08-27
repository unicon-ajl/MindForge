/** 主服务路由汇总 */

import { Router } from 'express'
import { delay } from '../../middleware/delay'

const router = Router()

// ===== 模拟数据 =====
interface User {
  id: number
  name: string
  age: number
  email: string
  role: string
}

const users: User[] = [
  { id: 1, name: '张三', age: 25, email: 'zhangsan@example.com', role: 'admin' },
  { id: 2, name: '李四', age: 30, email: 'lisi@example.com', role: 'user' },
  { id: 3, name: '王五', age: 28, email: 'wangwu@example.com', role: 'user' }
]

const tokens = new Set<string>()

// ===== 用户接口 =====

// 分页列表
router.get('/users/list', async (req, res) => {
  await delay(300)
  const page = Number(req.query.page) || 1
  const pageSize = Number(req.query.pageSize) || 10
  const start = (page - 1) * pageSize
  res.json({
    code: 200,
    message: 'success',
    data: {
      list: users.slice(start, start + pageSize),
      total: users.length,
      page,
      pageSize
    }
  })
})

// 详情
router.get('/users/:id', (req, res) => {
  const user = users.find(u => u.id === Number(req.params.id))
  if (!user) {
    return res.status(404).json({ code: 404, message: '用户不存在', data: null })
  }
  res.json({ code: 200, message: 'success', data: user })
})

// 创建
router.post('/users', async (req, res) => {
  await delay(500)
  const newUser: User = {
    id: users.length + 1,
    name: '',
    age: 0,
    email: '',
    role: 'user',
    ...req.body
  }
  users.push(newUser)
  res.status(201).json({ code: 200, message: '创建成功', data: newUser })
})

// 更新
router.put('/users/:id', (req, res) => {
  const index = users.findIndex(u => u.id === Number(req.params.id))
  if (index === -1) {
    return res.status(404).json({ code: 404, message: '用户不存在', data: null })
  }
  users[index] = { ...users[index], ...req.body }
  res.json({ code: 200, message: '更新成功', data: users[index] })
})

// 删除
router.delete('/users/:id', (req, res) => {
  const index = users.findIndex(u => u.id === Number(req.params.id))
  if (index === -1) {
    return res.status(404).json({ code: 404, message: '用户不存在', data: null })
  }
  users.splice(index, 1)
  res.json({ code: 200, message: '删除成功', data: null })
})

// ===== 认证接口 =====

// 登录
router.post('/auth/login', async (req, res) => {
  await delay(500)
  const { username, password } = req.body
  if (username === 'admin' && password === '123456') {
    const token = 'mock-token-admin'
    tokens.add(token)
    return res.json({
      code: 200,
      message: '登录成功',
      data: { token, userInfo: { id: 1, username: 'admin', nickname: '管理员', role: 'admin' } }
    })
  }
  res.status(401).json({ code: 401, message: '用户名或密码错误', data: null })
})

// 获取当前用户信息
router.get('/auth/userinfo', (req, res) => {
  const token = req.headers.authorization?.replace('Bearer ', '') ?? ''
  if (!token || !tokens.has(token)) {
    return res.status(401).json({ code: 401, message: '未登录或登录已过期', data: null })
  }
  res.json({
    code: 200,
    message: 'success',
    data: { id: 1, username: 'admin', nickname: '管理员' }
  })
})

// 退出登录
router.post('/auth/logout', (req, res) => {
  const token = req.headers.authorization?.replace('Bearer ', '') ?? ''
  if (token) tokens.delete(token)
  res.json({ code: 200, message: '已退出登录', data: null })
})

export default router
