<template>
  <DemoLayout />
</template>

<script setup lang="ts">
import DemoLayout from './layout/DemoLayout.vue'
</script>

<style>
/* 全局样式 */
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
  height: 100vh;
}
</style>
