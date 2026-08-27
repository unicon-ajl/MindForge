/** 延迟工具 */

/** 模拟网络延迟 */
export const delay = (ms: number): Promise<void> => new Promise(resolve => setTimeout(resolve, ms))
