import { defineConfig } from 'vitepress'

export default defineConfig({
  title: 'MindForge',
  description: '面向 Vue 3 的精品通用能力集合',
  themeConfig: {
    search: { provider: 'local' },
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
