<template>
  <div class="demo-layout">
    <DemoHeader
      :compact="isCompactViewport"
      :sidebar-open="drawerOpen"
      @open-search="searchVisible = true"
      @toggle-sidebar="drawerOpen = !drawerOpen"
    />

    <div class="demo-layout-body">
      <DemoSidebar
        :model-value="currentId"
        :collapsed="sidebarCollapsed"
        @update:model-value="handleNavigate"
      />

      <DemoContent :current-id="currentId" @navigate="handleNavigate" />
    </div>

    <DemoSearch :visible="searchVisible" @close="searchVisible = false" @select="handleNavigate" />

    <!-- 移动端遮罩 -->
    <div
      v-if="isCompactViewport && drawerOpen"
      class="demo-layout-mask"
      @click="drawerOpen = false"
    />
  </div>
</template>

<script setup lang="ts">
import { computed, ref, onMounted, onUnmounted } from 'vue'
import DemoHeader from './DemoHeader.vue'
import DemoSidebar from './DemoSidebar.vue'
import DemoContent from './DemoContent.vue'
import DemoSearch from './DemoSearch.vue'
import { isCompactWidth, shouldCollapseSidebar } from './responsive'

const currentId = ref('feedback')
const searchVisible = ref(false)
const isCompactViewport = ref(false)
const drawerOpen = ref(false)
const sidebarCollapsed = computed(() =>
  shouldCollapseSidebar(isCompactViewport.value, drawerOpen.value)
)

/**
 * 视口状态与抽屉开关分开管理。
 * 恢复桌面宽度后 Sidebar 由布局规则直接显示，不继承移动端的关闭状态。
 */
function syncViewport(): void {
  const compact = isCompactWidth(window.innerWidth)
  if (compact !== isCompactViewport.value) drawerOpen.value = false
  isCompactViewport.value = compact
}

/** 切换 Demo 后在窄屏主动关闭抽屉，把交互焦点还给正文。 */
function handleNavigate(id: string): void {
  if (!id) return
  currentId.value = id
  if (isCompactViewport.value) drawerOpen.value = false
}

onMounted(() => {
  syncViewport()
  window.addEventListener('resize', syncViewport)
})

onUnmounted(() => {
  // Layout 可能在热更新或测试中卸载，必须释放 window 监听。
  window.removeEventListener('resize', syncViewport)
})
</script>

<style scoped lang="scss">
.demo-layout {
  // 页面自身固定为视口高度，只允许内容区和侧栏独立滚动。
  display: flex;
  flex-direction: column;
  height: 100vh;
  overflow: hidden;
}

.demo-layout-body {
  display: flex;
  flex: 1;
  overflow: hidden;
}

.demo-layout-mask {
  position: fixed;
  top: 64px;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(15, 23, 42, 0.28);
  z-index: 50;
  backdrop-filter: blur(1px);
}

@media (max-width: 1023px) {
  :deep(.demo-sidebar) {
    position: fixed;
    top: 64px;
    left: 0;
    bottom: 0;
    z-index: 60;
    box-shadow: 12px 0 28px rgba(15, 23, 42, 0.14);
  }
}
</style>
