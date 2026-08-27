/** 第三方服务路由汇总 */

import { Router } from 'express'
import { delay } from '../../middleware/delay'
import { openSSE, sendSSE } from '../../utils/sse'

const router = Router()

// ===== 短信服务 =====

router.post('/sms/send', async (req, res) => {
  await delay(300)
  const { phone } = req.body
  if (!phone || !/^1\d{10}$/.test(phone)) {
    return res.status(400).json({ code: 400, message: '手机号格式错误', data: null })
  }
  res.json({ code: 200, message: '发送成功', data: { code: '123456' } })
})

// ===== OSS 服务 =====

router.get('/oss/sts', async (_req, res) => {
  await delay(200)
  res.json({
    code: 200,
    message: 'success',
    data: {
      accessKeyId: 'mock-key',
      accessKeySecret: 'mock-secret',
      bucket: 'mock-bucket',
      region: 'oss-cn-hangzhou'
    }
  })
})

// ===== SSE 流式响应 =====

router.get('/sse/chat', (req, res) => {
  const { close } = openSSE(req, res)

  // 开始事件
  sendSSE(res, null, { messageType: 'START', data: '' })

  const input = typeof req.query.input === 'string' ? req.query.input : ''
  if (!input.trim()) {
    sendSSE(res, null, { messageType: 'END', data: '' })
    sendSSE(res, 'end', { done: true })
    res.end()
    close()
    return
  }

  // 模拟流式输出
  let count = 0
  const timer = setInterval(() => {
    count++
    const chunk = `片段${count} `
    sendSSE(res, null, { messageType: 'DATA', data: chunk })

    if (count >= 5) {
      clearInterval(timer)
      sendSSE(res, null, { messageType: 'END', data: '' })
      sendSSE(res, 'end', { done: true })
      res.end()
      close()
    }
  }, 500)

  req.once('close', () => clearInterval(timer))
})

export default router
