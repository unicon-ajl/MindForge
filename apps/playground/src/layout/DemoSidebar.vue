<template>
  <aside class="demo-sidebar" :class="{ collapsed: collapsed }">
    <nav class="demo-sidebar-nav">
      <div
        v-for="group in sidebarConfig"
        :key="group.name"
        class="demo-sidebar-group"
        :class="{ expanded: expandedGroups.includes(group.name) }"
      >
        <div class="demo-sidebar-group-title" @click="toggleGroup(group.name)">
          <span class="demo-sidebar-group-arrow">▸</span>
          <span>{{ group.title }}</span>
        </div>
        <ul class="demo-sidebar-items">
          <li
            v-for="item in group.items"
            :key="item.id"
            class="demo-sidebar-item"
            :class="{ active: modelValue === item.id }"
            @click="selectItem(item.id)"
          >
            <span class="demo-sidebar-item-dot"></span>
            <span class="demo-sidebar-item-title">{{ item.title }}</span>
          </li>
        </ul>
      </div>
    </nav>
  </aside>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { sidebarConfig } from '../config/sidebarConfig'

defineProps<{
  modelValue: string
  collapsed?: boolean
}>()

const emit = defineEmits<{
  'update:modelValue': [id: string]
}>()

/** 默认展开全部正式能力，项目规模较小时优先保证可发现性。 */
const expandedGroups = ref<string[]>(sidebarConfig.map(g => g.name))

/** 原位维护展开列表，避免为简单目录引入额外树状态。 */
function toggleGroup(name: string) {
  const index = expandedGroups.value.indexOf(name)
  if (index > -1) {
    expandedGroups.value.splice(index, 1)
  } else {
    expandedGroups.value.push(name)
  }
}

function selectItem(id: string) {
  emit('update:modelValue', id)
}
</script>

<style scoped lang="scss">
.demo-sidebar {
  // flex-shrink: 0 保证内容区变窄时侧栏不会出现非预期压缩。
  width: 220px;
  height: 100%;
  overflow-y: auto;
  border-right: 1px solid var(--mf-border-color-light);
  background: var(--mf-bg-color-white, #fff);
  transition: width var(--mf-transition-duration);
  flex-shrink: 0;

  &.collapsed {
    width: 0;
    overflow: hidden;
    border-right: none;
  }
}

.demo-sidebar-nav {
  padding: 12px 0;
}

.demo-sidebar-group {
  margin-bottom: 4px;
}

.demo-sidebar-group-title {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 8px 16px;
  font-size: 13px;
  font-weight: 600;
  color: var(--mf-color-text-primary);
  cursor: pointer;
  user-select: none;
  transition: color var(--mf-transition-duration);

  &:hover {
    color: var(--mf-color-primary);
  }
}

.demo-sidebar-group-arrow {
  font-size: 10px;
  transition: transform var(--mf-transition-duration);
  display: inline-block;
}

.demo-sidebar-group.expanded .demo-sidebar-group-arrow {
  transform: rotate(90deg);
}

.demo-sidebar-items {
  // 使用 max-height 提供无需 JavaScript 测量的轻量展开动画。
  list-style: none;
  margin: 0;
  padding: 0;
  overflow: hidden;
  max-height: 0;
  transition: max-height var(--mf-transition-duration);
}

.demo-sidebar-group.expanded .demo-sidebar-items {
  max-height: 500px;
}

.demo-sidebar-item {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 7px 16px 7px 28px;
  font-size: 13px;
  color: var(--mf-color-text-regular);
  cursor: pointer;
  transition: all var(--mf-transition-duration);
  position: relative;

  &:hover {
    color: var(--mf-color-primary);
    background: rgba(64, 158, 255, 0.04);
  }

  &.active {
    color: var(--mf-color-primary);
    background: rgba(64, 158, 255, 0.08);
    font-weight: 500;
  }

  &.active .demo-sidebar-item-dot {
    background: var(--mf-color-primary);
  }
}

.demo-sidebar-item-dot {
  width: 4px;
  height: 4px;
  border-radius: 50%;
  background: var(--mf-border-color-base);
  flex-shrink: 0;
}

.demo-sidebar-item-title {
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}
</style>
