/// <reference types="vite/client" />
/// <reference types="vue" />

/* eslint-disable no-var */
declare global {
  /** 补齐部分测试/旧环境中不完整的 Clipboard 类型。 */
  interface Navigator {
    clipboard?: {
      writeText(text: string): Promise<void>
      readText(): Promise<string>
    }
  }
}

/* 为通过 app.config.globalProperties 注入的反馈和存储 API 提供模板类型。 */
declare module '@vue/runtime-core' {
  interface ComponentCustomProperties {
    $message: (typeof import('../../packages/feedback'))['message']
    $loading: (typeof import('../../packages/feedback'))['loading']
    $storage: {
      local: {
        set: <T>(key: string, value: T) => void
        get: <T>(key: string, defaultValue?: T) => T | null
        remove: (key: string) => void
        clear: () => void
      }
      session: {
        set: <T>(key: string, value: T) => void
        get: <T>(key: string, defaultValue?: T) => T | null
        remove: (key: string) => void
        clear: () => void
      }
    }
  }
}

export {}
