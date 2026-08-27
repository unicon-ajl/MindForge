<template>
  <div>
    <p class="demo-desc">Modal、Loading、Message 共享同一套层级与资源管理基础设施。</p>

    <div class="demo-block">
      <h4>嵌套浮层与最顶层 ESC</h4>
      <button class="demo-button" @click="firstVisible = true">打开第一层 Modal</button>
      <p class="demo-tip">打开第二层后按 ESC，只会关闭第二层；body 在最后一层关闭后才恢复滚动。</p>
    </div>

    <div class="demo-block">
      <h4>任务型通知</h4>
      <button class="demo-button" @click="showPromiseMessage">运行 Promise 通知</button>
    </div>

    <div ref="targetRef" class="loading-target">
      局部容器原本可以滚动
      <button class="demo-button" @click="toggleLocalLoading">
        {{ loader ? '关闭' : '打开' }}局部 Loading
      </button>
    </div>

    <MfModal v-model:visible="firstVisible" title="第一层">
      <p>第一层保持打开，滚动锁不会被内层提前释放。</p>
      <button class="demo-button" @click="secondVisible = true">打开第二层</button>
    </MfModal>
    <MfModal v-model:visible="secondVisible" title="第二层">
      <p>当前只有这一层响应 ESC 和遮罩点击。</p>
    </MfModal>
  </div>
</template>

<script setup lang="ts">
import { onScopeDispose, ref } from 'vue'
import { MfModal, loading, message, type LoadingInstance } from '@packages/feedback'

const firstVisible = ref(false)
const secondVisible = ref(false)
const targetRef = ref<HTMLElement | null>(null)
const loader = ref<LoadingInstance | null>(null)

const toggleLocalLoading = () => {
  if (loader.value) {
    loader.value.close()
    loader.value = null
  } else if (targetRef.value) {
    loader.value = loading.open({ target: targetRef.value, text: '局部处理中', lockScroll: true })
  }
}

const showPromiseMessage = () => {
  void message.promise(new Promise<string>(resolve => setTimeout(() => resolve('完成'), 1000)), {
    pending: '正在执行任务',
    success: value => `任务${value}`,
    error: '任务失败'
  })
}

onScopeDispose(() => loader.value?.close())
</script>

<style scoped lang="scss">
.demo-desc,
.demo-tip {
  color: var(--mf-color-text-secondary);
  font-size: 13px;
}
.demo-block,
.loading-target {
  margin-bottom: 20px;
  padding: 20px;
  background: var(--mf-bg-color-light);
  border-radius: var(--mf-border-radius-base);
}
.loading-target {
  height: 140px;
  overflow: auto;
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  gap: 16px;
}
.demo-button {
  padding: 8px 14px;
  border: 0;
  border-radius: 4px;
  color: #fff;
  background: var(--mf-color-primary);
  cursor: pointer;
}
</style>
