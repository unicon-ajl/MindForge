<template>
  <header class="demo-header">
    <div class="demo-header-left">
      <span class="demo-logo">⚡</span>
      <h1 class="demo-title">MindForge</h1>
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
/** Header 不持有搜索状态，只向布局层发送打开意图。 */
const emit = defineEmits<{
  openSearch: []
}>()
</script>

<style scoped lang="scss">
.demo-header {
  // sticky 保持全局入口可见；层级低于搜索弹层和移动端侧栏。
  display: flex;
  align-items: center;
  justify-content: space-between;
  height: 56px;
  padding: 0 20px;
  background: var(--mf-bg-color-white, #fff);
  border-bottom: 1px solid var(--mf-border-color-light);
  position: sticky;
  top: 0;
  z-index: 100;
}

.demo-header-left {
  display: flex;
  align-items: center;
  gap: 10px;
}

.demo-logo {
  font-size: 24px;
}

.demo-title {
  font-size: 18px;
  font-weight: 600;
  color: var(--mf-color-text-primary);
  margin: 0;
}

.demo-search-trigger {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 6px 14px;
  border: 1px solid var(--mf-border-color-base);
  border-radius: var(--mf-border-radius-base);
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
  font-size: 11px;
  color: var(--mf-color-text-secondary);
  background: var(--mf-bg-color-light);
  padding: 1px 5px;
  border-radius: 3px;
  border: 1px solid var(--mf-border-color-light);
}

@media (max-width: 768px) {
  .demo-search-placeholder,
  .demo-search-shortcut {
    display: none;
  }

  .demo-search-trigger {
    padding: 6px 10px;
  }
}
</style>
