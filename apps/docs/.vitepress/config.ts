import { defineConfig } from 'vitepress'

export default defineConfig({
  title: 'MindForge',
  description: '只沉淀高价值、可复用成品能力的 Vue 精品能力实验室',
  // 使用 SVG 保证浏览器标签页和高分屏下都保持清晰。
  head: [['link', { rel: 'icon', type: 'image/svg+xml', href: '/favicon.svg' }]],
  themeConfig: {
    search: { provider: 'local' },
    socialLinks: [{ icon: 'github', link: 'https://github.com/unicon-ajl/MindForge' }],
    nav: [
      { text: '指南', link: '/guide/' },
      { text: 'Feedback', link: '/infrastructure/feedback' },
      { text: 'Typewriter', link: '/components/typewriter' },
      { text: 'Tooltip', link: '/directives/tooltip' }
    ],
    sidebar: {
      '/guide/': [{ text: '指南', items: [{ text: '快速开始', link: '/guide/' }] }],
      '/infrastructure/': [
        {
          text: '反馈体系',
          items: [{ text: 'Feedback Suite', link: '/infrastructure/feedback' }]
        }
      ],
      '/components/': [
        {
          text: '精品组件',
          items: [{ text: 'Typewriter', link: '/components/typewriter' }]
        }
      ],
      '/directives/': [
        {
          text: '精品指令',
          items: [{ text: 'v-tooltip', link: '/directives/tooltip' }]
        }
      ]
    }
  }
})
