<template>
  <DemoLayout />
</template>

<script setup lang="ts">
import DemoLayout from './layout/DemoLayout.vue'
</script>

<style>
/* Playground 根节点只负责页面级盒模型和字体，能力样式由各模块自行维护。 */
*,
*::before,
*::after {
  box-sizing: border-box;
}

body {
  margin: 0;
  padding: 0;
  font-family:
    -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell,
    'Helvetica Neue', sans-serif;
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
  background: var(--mf-bg-color-base, #f5f7fa);
}

#app {
  /* 布局内部使用 100% 高度和独立滚动区，因此根节点必须占满视口。 */
  height: 100vh;
}
</style>
