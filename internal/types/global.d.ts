/// <reference types="vite/client" />
/// <reference types="vue" />

/* eslint-disable no-var */
declare global {
  interface Navigator {
    clipboard?: {
      writeText(text: string): Promise<void>
      readText(): Promise<string>
    }
  }
}

/* 全局插件类型扩展 */
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
