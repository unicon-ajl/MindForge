<template>
  <main class="demo-content">
    <!-- 面包屑 -->
    <div class="demo-breadcrumb">
      <span class="demo-breadcrumb-group">{{ currentGroup?.title ?? '' }}</span>
      <span class="demo-breadcrumb-sep">/</span>
      <span class="demo-breadcrumb-current">{{ currentItem?.title ?? '' }}</span>
    </div>

    <!-- Demo 内容 -->
    <div class="demo-content-body">
      <component :is="currentDemoComponent" v-if="currentDemoComponent" />
    </div>

    <!-- 上/下一个导航 -->
    <nav class="demo-content-nav">
      <button v-if="prevItem" class="demo-content-nav-btn" @click="$emit('navigate', prevItem.id)">
        ← {{ prevItem.title }}
      </button>
      <span v-else></span>
      <button
        v-if="nextItem"
        class="demo-content-nav-btn demo-content-nav-btn--next"
        @click="$emit('navigate', nextItem.id)"
      >
        {{ nextItem.title }} →
      </button>
    </nav>
  </main>
</template>

<script setup lang="ts">
import { computed, defineAsyncComponent } from 'vue'
import { findItemById, allSidebarItems } from '../config/sidebarConfig'

const props = defineProps<{
  currentId: string
}>()

defineEmits<{
  navigate: [id: string]
}>()

const currentInfo = computed(() => findItemById(props.currentId))
const currentItem = computed(() => currentInfo.value?.item)
const currentGroup = computed(() => currentInfo.value?.group)

const currentIndex = computed(() => allSidebarItems.findIndex(i => i.id === props.currentId))
// 上一项和下一项遵循侧边栏展平后的顺序，导航与目录始终一致。
const prevItem = computed(() =>
  currentIndex.value > 0 ? allSidebarItems[currentIndex.value - 1] : null
)
const nextItem = computed(() =>
  currentIndex.value < allSidebarItems.length - 1 ? allSidebarItems[currentIndex.value + 1] : null
)

/** kebab-case 转 PascalCase：loading-plugin → LoadingPlugin */
function toPascalCase(str: string): string {
  return str
    .split('-')
    .map(s => s.charAt(0).toUpperCase() + s.slice(1))
    .join('')
}

const demoModules = import.meta.glob('../demos/**/*.vue')

/**
 * 按配置中的目录和稳定 id 懒加载 Demo。
 * import.meta.glob 保留构建期可分析性，同时避免首屏加载全部演示代码。
 */
const currentDemoComponent = computed(() => {
  const info = currentInfo.value
  if (!info) return null
  // 同时匹配目录和文件名，避免不同分组出现同名 Demo 时加载错误。
  const name = `${toPascalCase(info.item.id)}Demo.vue`
  const entry = Object.entries(demoModules).find(
    ([key]) => key.includes(`/${info.item.dir}/`) && key.endsWith(name)
  )
  return entry ? defineAsyncComponent(entry[1] as () => Promise<{ default: unknown }>) : null
})
</script>

<style scoped lang="scss">
.demo-content {
  flex: 1;
  overflow-y: auto;
  padding: 28px 32px;
  min-width: 0;
}

.demo-breadcrumb {
  display: flex;
  align-items: center;
  gap: 6px;
  margin-bottom: 20px;
  font-size: 13px;
}

.demo-breadcrumb-group {
  color: var(--mf-color-text-secondary);
}

.demo-breadcrumb-sep {
  color: var(--mf-border-color-base);
}

.demo-breadcrumb-current {
  color: var(--mf-color-text-primary);
  font-weight: 500;
}

.demo-content-body {
  min-height: 300px;
}

.demo-content-nav {
  display: flex;
  justify-content: space-between;
  margin-top: 40px;
  padding-top: 20px;
  border-top: 1px solid var(--mf-border-color-light);
}

.demo-content-nav-btn {
  padding: 8px 16px;
  border: 1px solid var(--mf-border-color-base);
  border-radius: var(--mf-border-radius-base);
  background: var(--mf-bg-color-white, #fff);
  color: var(--mf-color-text-regular);
  font-size: 13px;
  cursor: pointer;
  transition: all var(--mf-transition-duration);

  &:hover {
    color: var(--mf-color-primary);
    border-color: var(--mf-color-primary);
  }
}

.demo-content-nav-btn--next {
  margin-left: auto;
}

@media (max-width: 768px) {
  .demo-content {
    padding: 16px;
  }
}
</style>
