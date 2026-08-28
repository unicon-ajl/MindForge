/** SSE 工具（服务端推送） */

import type { Request, Response } from 'express'

/**
 * 建立 SSE 连接并启动注释帧心跳。
 * 返回 close 让路由在正常结束和客户端断开两条路径中都能释放定时器。
 */
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

/** 将任意数据序列化为单条 SSE 帧；event 为空时发送默认 message 事件。 */
export function sendSSE(res: Response, event: string | null, data: unknown): void {
  if (event) res.write(`event: ${event}\n`)
  res.write(`data: ${JSON.stringify(data)}\n\n`)
}
