/**
 * 模拟可预测的网络耗时，用于验证前端 Loading、竞态和取消交互。
 * 只用于开发环境，不包含随机抖动，保证演示和测试结果稳定。
 */
export const delay = (ms: number): Promise<void> => new Promise(resolve => setTimeout(resolve, ms))
