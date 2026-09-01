<template>
  <div>
    <div class="demo-block">
      <h4>嵌套浮层与最顶层 ESC</h4>
      <button class="demo-button" @click="firstVisible = true">打开第一层 Modal</button>
      <p class="demo-tip">
        第二层不显示关闭按钮，但仍可用 ESC 或遮罩关闭；顶层禁止 ESC 时不会误关下层。
      </p>
    </div>

    <div class="demo-block">
      <h4>完整通知状态</h4>
      <div class="demo-actions">
        <button class="demo-button" @click="showMessage('info')">提示</button>
        <button class="demo-button demo-button--success" @click="showMessage('success')">
          成功
        </button>
        <button class="demo-button demo-button--warning" @click="showMessage('warning')">
          警告
        </button>
        <button class="demo-button demo-button--danger" @click="showMessage('error')">错误</button>
        <button class="demo-button demo-button--secondary" @click="showPromiseMessage">
          Promise 生命周期
        </button>
      </div>
      <p class="demo-tip">
        状态色只用于图标与侧边标识；主文案说明结果，辅助文案补充下一步。Promise
        会在同一位置完成状态迁移。
      </p>
    </div>

    <div class="demo-block demo-block--wide">
      <h4>局部 Loading</h4>
      <button class="demo-button" @click="toggleLocalLoading">
        {{ loader ? '关闭' : '打开' }}局部 Loading
      </button>
      <button v-if="loader" class="demo-button demo-button--secondary" @click="updateLocalLoading">
        更新任务状态
      </button>
      <p class="demo-tip">遮罩会同步目标容器的 aria-busy，并支持原位更新文案和动画类型。</p>
    </div>

    <div ref="targetRef" class="loading-target">
      <span>局部容器原本可以滚动</span>
      <span>Loading 只覆盖当前容器，不影响页面其他区域。</span>
    </div>

    <MfModal v-model:visible="firstVisible" title="第一层">
      <p>第一层保持打开，滚动锁不会被内层提前释放。</p>
      <button class="demo-button" @click="secondVisible = true">打开第二层</button>
    </MfModal>
    <MfModal v-model:visible="secondVisible" title="第二层" :closable="false">
      <p>当前只有这一层响应 ESC 和遮罩点击。</p>
    </MfModal>
  </div>
</template>

<script setup lang="ts">
import { onScopeDispose, ref } from 'vue'
import {
  MfModal,
  loading,
  message,
  type LoadingInstance,
  type MessageType
} from '@packages/feedback'

const firstVisible = ref(false)
const secondVisible = ref(false)
const targetRef = ref<HTMLElement | null>(null)
// 保存句柄让控制按钮位于遮罩外时仍可主动关闭局部 Loading。
const loader = ref<LoadingInstance | null>(null)

const toggleLocalLoading = () => {
  if (loader.value) {
    loader.value.close()
    loader.value = null
  } else if (targetRef.value) {
    loader.value = loading.open({ target: targetRef.value, text: '局部处理中', lockScroll: true })
  }
}

const updateLocalLoading = () => {
  loader.value?.update({ text: '正在完成最后一步', spinner: 'circle' })
}

const showPromiseMessage = () => {
  // 使用同一消息句柄演示 pending 到 success 的原位状态迁移。
  void message.promise(new Promise<string>(resolve => setTimeout(() => resolve('完成'), 1000)), {
    pending: { message: '正在执行任务', description: '请稍候…' },
    success: value => ({ message: `任务${value}`, description: '结果已保存' }),
    error: { message: '任务失败', description: '请检查网络后重试' }
  })
}

const messageContent: Record<MessageType, { message: string; description: string }> = {
  info: { message: '提示信息', description: '配置已保存，将在下次启动时生效' },
  success: { message: '操作成功', description: '数据已经同步到云端' },
  warning: { message: '需要注意', description: '当前网络不稳定，部分内容可能延迟' },
  error: { message: '提交失败', description: '服务暂时不可用，请稍后重试' }
}

const showMessage = (type: MessageType) => message.open({ ...messageContent[type], type })

// Demo 被动态组件切换卸载时，不能把局部遮罩遗留在已移除的目标上。
onScopeDispose(() => loader.value?.close())
</script>

<style scoped lang="scss">
.loading-target {
  margin-bottom: 20px;
  background: radial-gradient(circle at 90% 10%, rgba(82, 103, 233, 0.08), transparent 34%), #fff;
}
.loading-target {
  height: 140px;
  overflow: auto;
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  gap: 16px;
  color: var(--mf-color-text-regular);
}
.demo-button + .demo-button {
  margin-left: 0;
}
.demo-actions {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}
</style>
