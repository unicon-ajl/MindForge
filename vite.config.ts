import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import { resolve } from 'path'
import dts from 'vite-plugin-dts'

export default defineConfig(({ command, mode }) => {
  // 单一配置同时服务组件库和 Playground，两种产物必须写入不同目录。
  const isBuildLib = mode === 'lib'
  const isDev = command === 'serve'
  const playgroundRoot = resolve(__dirname, 'apps/playground')

  return {
    plugins: [
      vue(),
      // 仅库构建生成声明，避免拖慢 Playground 开发服务。
      isBuildLib &&
        dts({
          include: ['packages/**/*.ts', 'packages/**/*.vue'],
          exclude: ['**/*.spec.ts', '**/*.test.ts'],
          entryRoot: '.',
          outDir: 'dist',
          staticImport: true,
          insertTypesEntry: false
        })
    ].filter(Boolean),
    root: isBuildLib ? __dirname : playgroundRoot,
    resolve: {
      alias: {
        '@': resolve(playgroundRoot, 'src'),
        '@packages': resolve(__dirname, 'packages'),
        '@internal': resolve(__dirname, 'internal'),
        '@assets': resolve(playgroundRoot, 'src/assets')
      }
    },
    css: {
      preprocessorOptions: {
        scss: {
          api: 'modern',
          // 所有 Vue/SCSS 文件共享设计变量，无需逐文件重复 @use。
          additionalData: `@use "@assets/styles/variables.scss" as *;`
        }
      }
    },
    build: isBuildLib
      ? {
          lib: {
            entry: resolve(__dirname, 'packages/index.ts'),
            name: 'MindForge',
            fileName: format => (format === 'es' ? 'mind-forge.es.js' : 'mind-forge.cjs'),
            formats: ['es', 'cjs']
          },
          rollupOptions: {
            // 由使用方提供，防止库内重复打包框架实例。
            external: ['vue'],
            output: {
              exports: 'named'
            }
          },
          outDir: resolve(__dirname, 'dist'),
          sourcemap: true
        }
      : {
          // Playground 输出与库产物彻底隔离。
          outDir: resolve(__dirname, 'dist-demo'),
          emptyOutDir: true,
          sourcemap: isDev
        },
    test: {
      globals: true,
      environment: 'node',
      coverage: {
        provider: 'v8',
        reporter: ['text', 'json', 'html']
      }
    }
  }
})
