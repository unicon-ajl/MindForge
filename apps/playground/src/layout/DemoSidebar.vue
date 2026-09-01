<template>
  <aside class="demo-sidebar" :class="{ collapsed }">
    <div class="demo-sidebar-heading">
      <span>能力目录</span>
      <span class="demo-sidebar-total">{{ sidebarConfig.length }} 类</span>
    </div>

    <nav class="demo-sidebar-nav" aria-label="能力导航">
      <section
        v-for="group in sidebarConfig"
        :key="group.name"
        class="demo-sidebar-group"
        :class="{ expanded: expandedGroup === group.name }"
      >
        <button
          type="button"
          class="demo-sidebar-group-trigger"
          :aria-expanded="expandedGroup === group.name"
          :aria-controls="`sidebar-group-${group.name}`"
          @click="toggleGroup(group.name)"
        >
          <span class="demo-sidebar-group-title">{{ group.title }}</span>
          <span class="demo-sidebar-group-count">{{ group.items.length }}</span>
          <span class="demo-sidebar-group-arrow" aria-hidden="true">
            <svg class="demo-sidebar-group-arrow-icon" viewBox="0 0 24 24">
              <path d="m9 18 6-6-6-6" />
            </svg>
          </span>
        </button>

        <div class="demo-sidebar-collapse">
          <div class="demo-sidebar-collapse-inner">
            <ul :id="`sidebar-group-${group.name}`" class="demo-sidebar-items">
              <li v-for="item in group.items" :key="item.id">
                <button
                  type="button"
                  class="demo-sidebar-item"
                  :class="{ active: modelValue === item.id }"
                  :aria-current="modelValue === item.id ? 'page' : undefined"
                  @click="selectItem(item.id)"
                >
                  <span class="demo-sidebar-item-title" :title="item.title">{{ item.title }}</span>
                </button>
              </li>
            </ul>
          </div>
        </div>
      </section>
    </nav>

    <div class="demo-sidebar-footer">
      <span aria-hidden="true">✦</span>
      <span>只展示通过正式准入标准的能力</span>
    </div>
  </aside>
</template>

<script setup lang="ts">
import { ref, watch } from 'vue'
import { findItemById, sidebarConfig } from '../config/sidebarConfig'

const props = defineProps<{
  modelValue: string
  collapsed?: boolean
}>()

const emit = defineEmits<{
  'update:modelValue': [id: string]
}>()

/** 当前能力所属分组默认展开，目录增长后也只占用一组内容的高度。 */
const expandedGroup = ref(
  findItemById(props.modelValue)?.group.name ?? sidebarConfig[0]?.name ?? ''
)

/** 搜索、上下篇导航等外部入口切换能力时，侧栏同步露出它所在的分组。 */
watch(
  () => props.modelValue,
  id => {
    const groupName = findItemById(id)?.group.name
    if (groupName) expandedGroup.value = groupName
  }
)

/** 同一时刻最多展开一个一级分类，避免能力增加后侧栏无限拉长。 */
function toggleGroup(name: string): void {
  expandedGroup.value = expandedGroup.value === name ? '' : name
}

function selectItem(id: string): void {
  emit('update:modelValue', id)
}
</script>

<style scoped lang="scss">
.demo-sidebar {
  // 侧栏保持文档站的稳定阅读宽度；窄屏时由布局切换为抽屉，不压缩导航文案。
  display: flex;
  width: 280px;
  height: 100%;
  flex-shrink: 0;
  flex-direction: column;
  overflow: hidden;
  border-right: 1px solid var(--mf-border-color-light);
  background: var(--mf-bg-color-white, #fff);
  transition:
    width var(--mf-transition-duration),
    transform var(--mf-transition-duration);

  &.collapsed {
    width: 0;
    border-right: none;
  }
}

.demo-sidebar-heading {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 24px 24px 14px;
  color: var(--mf-color-text-placeholder);
  font-size: 12px;
  font-weight: 600;
  letter-spacing: 0.08em;
}

.demo-sidebar-total {
  padding: 3px 8px;
  border-radius: 999px;
  color: var(--mf-color-primary);
  background: rgba(82, 103, 233, 0.1);
  font-size: 11px;
  font-weight: 500;
  letter-spacing: 0;
}

.demo-sidebar-nav {
  flex: 1;
  min-height: 0;
  padding: 0 16px 16px;
  overflow-y: auto;
  scrollbar-width: thin;
  scrollbar-color: var(--mf-border-color-light) transparent;
}

.demo-sidebar-group {
  margin-bottom: 8px;
}

.demo-sidebar-group-trigger {
  display: grid;
  width: 100%;
  min-height: 44px;
  grid-template-columns: minmax(0, 1fr) auto 24px;
  align-items: center;
  gap: 9px;
  padding: 8px 12px;
  border: 0;
  border-radius: 8px;
  color: var(--mf-color-text-regular);
  background: transparent;
  text-align: left;
  cursor: pointer;
  transition:
    color 160ms ease,
    background 160ms ease,
    transform 120ms ease;

  &:hover {
    color: var(--mf-color-primary);
    background: var(--mf-bg-color-base);

    .demo-sidebar-group-arrow {
      color: var(--mf-color-primary);
      background: rgba(82, 103, 233, 0.1);
    }
  }

  &:active {
    transform: scale(0.985);
  }

  &:focus-visible {
    outline: 2px solid rgba(82, 103, 233, 0.3);
    outline-offset: 2px;
  }
}

.demo-sidebar-group-title {
  min-width: 0;
  font-size: 14px;
  font-weight: 600;
}

.demo-sidebar-group-count {
  color: var(--mf-color-text-placeholder);
  font-size: 12px;
}

.demo-sidebar-group-arrow {
  display: inline-flex;
  width: 24px;
  height: 24px;
  align-items: center;
  justify-content: center;
  border-radius: 6px;
  color: var(--mf-color-text-placeholder);
  transition:
    color 160ms ease,
    background 160ms ease;
}

.demo-sidebar-group-arrow-icon {
  width: 15px;
  height: 15px;
  fill: none;
  stroke: currentcolor;
  stroke-linecap: round;
  stroke-linejoin: round;
  stroke-width: 2;
  transform: rotate(0);
  transform-origin: center;
  transition: transform 220ms var(--mf-transition-timing);
}

.demo-sidebar-group.expanded {
  .demo-sidebar-group-trigger {
    background: var(--mf-bg-color-base);
  }

  .demo-sidebar-group-title {
    color: var(--mf-color-text-primary);
  }

  .demo-sidebar-group-arrow {
    color: var(--mf-color-primary);
    background: rgba(82, 103, 233, 0.1);
  }

  .demo-sidebar-group-arrow-icon {
    transform: rotate(90deg);
  }
}

.demo-sidebar-collapse {
  // 网格轨道会按真实内容高度插值，避免 max-height 远大于内容时产生“瞬间弹开”的错觉。
  display: grid;
  grid-template-rows: 0fr;
  visibility: hidden;
  opacity: 0;
  transition:
    grid-template-rows 220ms var(--mf-transition-timing),
    opacity 160ms ease,
    visibility 220ms;
}

.demo-sidebar-collapse-inner {
  min-height: 0;
  overflow: hidden;
}

.demo-sidebar-items {
  margin: 4px 0 0 21px;
  padding: 2px 0 4px 12px;
  min-height: 0;
  overflow: hidden;
  border-left: 1px solid var(--mf-border-color-extra-light);
  list-style: none;
}

.demo-sidebar-group.expanded .demo-sidebar-collapse {
  grid-template-rows: 1fr;
  visibility: visible;
  opacity: 1;
  transition:
    grid-template-rows 220ms var(--mf-transition-timing),
    opacity 180ms 40ms ease;
}

.demo-sidebar-item {
  position: relative;
  display: block;
  width: 100%;
  min-height: 38px;
  padding: 8px 10px 8px 13px;
  border: 0;
  border-radius: 6px;
  color: var(--mf-color-text-secondary);
  background: transparent;
  text-align: left;
  cursor: pointer;
  transition:
    color 160ms ease,
    background 160ms ease,
    transform 120ms ease;

  &:hover {
    color: var(--mf-color-primary);
    background: rgba(82, 103, 233, 0.05);
  }

  &:active {
    transform: translateX(2px);
  }

  &:focus-visible {
    outline: 2px solid rgba(82, 103, 233, 0.3);
    outline-offset: -2px;
  }

  &.active {
    color: var(--mf-color-primary);
    background: rgba(82, 103, 233, 0.08);
    font-weight: 600;
  }

  &.active::before {
    // 当前页只用短指示条定位，避免额外图标或卡片与正文竞争视觉层级。
    position: absolute;
    top: 7px;
    bottom: 7px;
    left: 0;
    width: 2px;
    border-radius: 0 2px 2px 0;
    background: var(--mf-color-primary);
    content: '';
  }
}

.demo-sidebar-item-title {
  overflow: hidden;
  font-size: 13px;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.demo-sidebar-footer {
  display: flex;
  align-items: center;
  gap: 7px;
  margin: 0 24px;
  padding: 14px 0 16px;
  border-top: 1px solid var(--mf-border-color-extra-light);
  color: var(--mf-color-text-placeholder);
  font-size: 10px;

  > span:first-child {
    color: var(--mf-color-warning);
  }
}

@media (max-width: 1023px) {
  .demo-sidebar {
    width: 280px;

    &.collapsed {
      width: 280px;
      transform: translateX(-105%);
    }
  }
}

@media (prefers-reduced-motion: reduce) {
  .demo-sidebar-group-trigger,
  .demo-sidebar-group-arrow,
  .demo-sidebar-group-arrow-icon,
  .demo-sidebar-collapse,
  .demo-sidebar-item {
    transition: none;
  }
}
</style>
