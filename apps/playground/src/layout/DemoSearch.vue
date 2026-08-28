<template>
  <Teleport to="body">
    <div v-if="visible" class="demo-search-overlay" @click.self="close">
      <div class="demo-search-modal" @keydown="handleKeydown">
        <div class="demo-search-input-wrapper">
          <span class="demo-search-input-icon">🔍</span>
          <input
            ref="inputRef"
            v-model="query"
            class="demo-search-input"
            placeholder="搜索组件、工具、Hook..."
            @input="onInput"
          />
          <kbd class="demo-search-input-close" @click="close">ESC</kbd>
        </div>

        <div class="demo-search-results">
          <template v-if="filteredItems.length > 0">
            <div
              v-for="(item, index) in filteredItems"
              :key="item.id"
              class="demo-search-result-item"
              :class="{ selected: index === selectedIndex }"
              @click="goTo(item.id)"
              @mouseenter="selectedIndex = index"
            >
              <span class="demo-search-result-icon">{{ getGroupIcon(item.id) }}</span>
              <span class="demo-search-result-title">{{ item.title }}</span>
              <span class="demo-search-result-group">{{ getGroupName(item.id) }}</span>
            </div>
          </template>
          <div v-else class="demo-search-empty">未找到匹配项</div>
        </div>
      </div>
    </div>
  </Teleport>
</template>

<script setup lang="ts">
import { ref, computed, watch, nextTick, onMounted, onUnmounted } from 'vue'
import { allSidebarItems, sidebarConfig } from '../config/sidebarConfig'

const props = defineProps<{
  visible: boolean
}>()

const emit = defineEmits<{
  close: []
  select: [id: string]
}>()

const query = ref('')
const selectedIndex = ref(0)
const inputRef = ref<HTMLInputElement | null>(null)

/** 搜索同时匹配用户可见标题和稳定 id，不区分大小写。 */
const filteredItems = computed(() => {
  if (!query.value.trim()) return allSidebarItems
  const q = query.value.toLowerCase()
  return allSidebarItems.filter(
    item => item.title.toLowerCase().includes(q) || item.id.toLowerCase().includes(q)
  )
})

function getGroupIcon(id: string): string {
  const group = sidebarConfig.find(g => g.items.some(i => i.id === id))
  return group?.title.split(' ')[0] ?? '📄'
}

function getGroupName(id: string): string {
  const group = sidebarConfig.find(g => g.items.some(i => i.id === id))
  return group?.title ?? ''
}

function goTo(id: string) {
  // 先通知布局切换页面，再统一重置搜索会话。
  emit('select', id)
  close()
}

function close() {
  query.value = ''
  selectedIndex.value = 0
  emit('close')
}

function onInput() {
  selectedIndex.value = 0
}

function handleKeydown(e: KeyboardEvent) {
  // 方向键只在当前结果范围内移动，Enter 选择，ESC 退出。
  if (e.key === 'ArrowDown') {
    e.preventDefault()
    selectedIndex.value = Math.min(selectedIndex.value + 1, filteredItems.value.length - 1)
  } else if (e.key === 'ArrowUp') {
    e.preventDefault()
    selectedIndex.value = Math.max(selectedIndex.value - 1, 0)
  } else if (e.key === 'Enter') {
    e.preventDefault()
    if (filteredItems.value[selectedIndex.value]) {
      goTo(filteredItems.value[selectedIndex.value].id)
    }
  } else if (e.key === 'Escape') {
    close()
  }
}

watch(
  () => props.visible,
  async val => {
    if (val) {
      // Teleport 内容需等待下一轮 DOM 更新后才能可靠聚焦。
      await nextTick()
      inputRef.value?.focus()
    }
  }
)

function handleGlobalKeydown(e: KeyboardEvent) {
  // 同时支持 macOS 的 Command 和 Windows/Linux 的 Control。
  if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
    e.preventDefault()
    if (!props.visible) {
      emit('select', '')
    }
  }
}

onMounted(() => {
  document.addEventListener('keydown', handleGlobalKeydown)
})

onUnmounted(() => {
  // 全局快捷键监听必须与组件生命周期成对释放。
  document.removeEventListener('keydown', handleGlobalKeydown)
})
</script>

<style scoped lang="scss">
.demo-search-overlay {
  // 搜索是 Playground 最高层交互，覆盖 Header、Sidebar 和 Demo 内部浮层入口。
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.4);
  display: flex;
  align-items: flex-start;
  justify-content: center;
  padding-top: 15vh;
  z-index: 10000;
}

.demo-search-modal {
  width: 520px;
  max-width: 90vw;
  background: var(--mf-bg-color-white, #fff);
  border-radius: var(--mf-border-radius-lg);
  box-shadow: 0 16px 48px rgba(0, 0, 0, 0.15);
  overflow: hidden;
}

.demo-search-input-wrapper {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 14px 16px;
  border-bottom: 1px solid var(--mf-border-color-light);
}

.demo-search-input-icon {
  font-size: 16px;
  opacity: 0.5;
}

.demo-search-input {
  flex: 1;
  border: none;
  outline: none;
  font-size: 15px;
  color: var(--mf-color-text-primary);
  background: transparent;

  &::placeholder {
    color: var(--mf-color-text-placeholder);
  }
}

.demo-search-input-close {
  font-size: 11px;
  color: var(--mf-color-text-placeholder);
  background: var(--mf-bg-color-light);
  padding: 2px 6px;
  border-radius: 3px;
  cursor: pointer;
}

.demo-search-results {
  max-height: 320px;
  overflow-y: auto;
  padding: 8px 0;
}

.demo-search-result-item {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 10px 16px;
  cursor: pointer;
  transition: background 0.15s;

  &:hover,
  &.selected {
    background: rgba(64, 158, 255, 0.06);
  }
}

.demo-search-result-icon {
  font-size: 14px;
}

.demo-search-result-title {
  flex: 1;
  font-size: 14px;
  color: var(--mf-color-text-primary);
}

.demo-search-result-group {
  font-size: 12px;
  color: var(--mf-color-text-secondary);
}

.demo-search-empty {
  padding: 24px;
  text-align: center;
  font-size: 13px;
  color: var(--mf-color-text-placeholder);
}
</style>
