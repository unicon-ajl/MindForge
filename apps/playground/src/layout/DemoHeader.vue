<template>
  <header class="demo-header">
    <div class="demo-header-left">
      <button
        v-if="compact"
        type="button"
        class="demo-menu-trigger"
        :aria-label="sidebarOpen ? '关闭能力目录' : '打开能力目录'"
        :aria-expanded="sidebarOpen"
        @click="emit('toggleSidebar')"
      >
        <span></span><span></span><span></span>
      </button>
      <span class="demo-logo">⚡</span>
      <h1 class="demo-title">MindForge</h1>
      <span class="demo-subtitle">Vue 精品能力实验室</span>
    </div>
    <div class="demo-header-right">
      <div class="demo-search-trigger" @click="emit('openSearch')">
        <span class="demo-search-icon">🔍</span>
        <span class="demo-search-placeholder">搜索...</span>
        <kbd class="demo-search-shortcut">⌘K</kbd>
      </div>
    </div>
  </header>
</template>

<script setup lang="ts">
defineProps<{ compact: boolean; sidebarOpen: boolean }>()

/** Header 不持有搜索状态，只向布局层发送打开意图。 */
const emit = defineEmits<{
  openSearch: []
  toggleSidebar: []
}>()
</script>

<style scoped lang="scss">
.demo-header {
  // sticky 保持全局入口可见；层级低于搜索弹层和移动端侧栏。
  display: flex;
  align-items: center;
  justify-content: space-between;
  height: 64px;
  padding: 0 24px;
  background: rgba(255, 255, 255, 0.94);
  border-bottom: 1px solid var(--mf-border-color-light);
  position: sticky;
  top: 0;
  z-index: 100;
  backdrop-filter: blur(14px);
}

.demo-header-left {
  display: flex;
  align-items: center;
  gap: 10px;
}

.demo-logo {
  font-size: 26px;
}

.demo-title {
  font-size: 18px;
  font-weight: 700;
  color: var(--mf-color-text-primary);
  margin: 0;
}

.demo-subtitle {
  margin-left: 2px;
  padding-left: 12px;
  border-left: 1px solid var(--mf-border-color-base);
  color: var(--mf-color-text-secondary);
  font-size: 12px;
}

.demo-menu-trigger {
  display: grid;
  width: 34px;
  height: 34px;
  padding: 8px;
  border: 1px solid var(--mf-border-color-light);
  border-radius: 8px;
  place-content: center;
  gap: 4px;
  background: #fff;
  cursor: pointer;

  span {
    display: block;
    width: 16px;
    height: 2px;
    border-radius: 2px;
    background: var(--mf-color-text-regular);
  }
}

.demo-search-trigger {
  display: flex;
  align-items: center;
  gap: 8px;
  min-width: 190px;
  padding: 8px 10px;
  border: 1px solid var(--mf-border-color-base);
  border-radius: 9px;
  cursor: pointer;
  transition: border-color var(--mf-transition-duration);
  user-select: none;

  &:hover {
    border-color: var(--mf-color-primary);
  }
}

.demo-search-icon {
  font-size: 14px;
  opacity: 0.6;
}

.demo-search-placeholder {
  font-size: 13px;
  color: var(--mf-color-text-placeholder);
}

.demo-search-shortcut {
  margin-left: auto;
  font-size: 11px;
  color: var(--mf-color-text-secondary);
  background: var(--mf-bg-color-light);
  padding: 1px 5px;
  border-radius: 3px;
  border: 1px solid var(--mf-border-color-light);
}

@media (max-width: 768px) {
  .demo-header {
    padding: 0 14px;
  }

  .demo-subtitle,
  .demo-search-placeholder,
  .demo-search-shortcut {
    display: none;
  }

  .demo-search-trigger {
    min-width: auto;
    padding: 7px 9px;
  }
}
</style>
