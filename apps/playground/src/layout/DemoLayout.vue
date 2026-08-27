<template>
  <div class="demo-layout">
    <DemoHeader @open-search="searchVisible = true" />

    <div class="demo-layout-body">
      <DemoSidebar v-model="currentId" :collapsed="sidebarCollapsed" />

      <DemoContent :current-id="currentId" @navigate="currentId = $event" />
    </div>

    <DemoSearch
      :visible="searchVisible"
      @close="searchVisible = false"
      @select="currentId = $event"
    />

    <!-- 移动端遮罩 -->
    <div
      v-if="!sidebarCollapsed && isMobile"
      class="demo-layout-mask"
      @click="sidebarCollapsed = true"
    />
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, onUnmounted } from 'vue'
import DemoHeader from './DemoHeader.vue'
import DemoSidebar from './DemoSidebar.vue'
import DemoContent from './DemoContent.vue'
import DemoSearch from './DemoSearch.vue'

const currentId = ref('feedback')
const searchVisible = ref(false)
const sidebarCollapsed = ref(false)
const isMobile = ref(false)

function checkMobile() {
  isMobile.value = window.innerWidth <= 768
  if (isMobile.value) {
    sidebarCollapsed.value = true
  }
}

onMounted(() => {
  checkMobile()
  window.addEventListener('resize', checkMobile)
})

onUnmounted(() => {
  window.removeEventListener('resize', checkMobile)
})
</script>

<style scoped lang="scss">
.demo-layout {
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
  top: 56px;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.3);
  z-index: 50;
}

@media (max-width: 768px) {
  :deep(.demo-sidebar) {
    position: fixed;
    top: 56px;
    left: 0;
    bottom: 0;
    z-index: 60;
    box-shadow: 2px 0 8px rgba(0, 0, 0, 0.1);
  }
}
</style>
