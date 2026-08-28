import { createApp } from 'vue'
import App from './App.vue'
import './assets/styles/index.scss'

// Playground 是独立演示应用，不在这里全局注册能力，Demo 需显式展示真实引入方式。
createApp(App).mount('#app')
