import { defineConfig } from 'vitest/config'
import vue from '@vitejs/plugin-vue'
import { resolve } from 'path'

export default defineConfig({
  plugins: [vue()],
  test: {
    globals: true,
    // 默认测试核心状态逻辑，不强制消费者安装 DOM 模拟器；组件测试可在文件顶部声明 jsdom。
    environment: 'node',
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html']
    }
  },
  resolve: {
    alias: {
      '@': resolve(__dirname, 'apps/playground/src'),
      '@packages': resolve(__dirname, 'packages'),
      '@internal': resolve(__dirname, 'internal'),
      '@assets': resolve(__dirname, 'apps/playground/src/assets')
    }
  }
})
