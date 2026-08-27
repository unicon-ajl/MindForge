/** SSE 工具（服务端推送） */

import type { Request, Response } from 'express'

/** 建立 SSE 连接（自动心跳保活） */
export function openSSE(req: Request, res: Response): { close: () => void } {
  res.setHeader('Content-Type', 'text/event-stream; charset=utf-8')
  res.setHeader('Cache-Control', 'no-cache, no-transform')
  res.setHeader('Connection', 'keep-alive')
  res.flushHeaders?.()
  // 注释帧不会触发业务事件，只负责保活。
  const ping = setInterval(() => res.write(': ping\n\n'), 15000)
  const close = () => clearInterval(ping)
  req.on('close', close)
  return { close }
}

/** 发送 SSE 事件 */
export function sendSSE(res: Response, event: string | null, data: unknown): void {
  if (event) res.write(`event: ${event}\n`)
  res.write(`data: ${JSON.stringify(data)}\n\n`)
}
