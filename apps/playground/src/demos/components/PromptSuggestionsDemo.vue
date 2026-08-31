<template>
  <div>
    <section class="demo-block demo-block--wide">
      <h4>对话能力发现</h4>
      <div class="chat-shell">
        <div class="chat-copy">
          <strong>MindForge 助手</strong>
          <span>{{ selectedText || '不知道从哪里开始？从建议中选择一个可执行方向。' }}</span>
        </div>
        <div class="composer">
          <textarea v-model="draft" rows="2" placeholder="输入你的问题…" />
          <div class="composer-actions">
            <MfPromptSuggestions :items="staticItems" @select="fillDraft" />
            <button class="send-button" type="button" :disabled="!draft">发送</button>
          </div>
        </div>
      </div>
      <p class="demo-tip">建议只抛出选择事件；填入、立即发送、导航或执行动作由业务决定。</p>
    </section>

    <section class="demo-block demo-block--wide">
      <h4>上下文异步建议</h4>
      <div class="context-demo">
        <label>
          当前任务上下文
          <input v-model="context" placeholder="试试输入：发布、错误、文档" />
        </label>
        <MfPromptSuggestions
          v-model:open="asyncOpen"
          :source="loadSuggestions"
          :context="context"
          placement="bottom-start"
          trigger-label="查看下一步建议"
          @select="selectedText = `已选择：${$event.label}`"
        />
      </div>
      <p class="demo-tip">
        面板打开时修改上下文，旧请求会通过 AbortSignal 中止，迟到结果不会覆盖新建议。
      </p>
    </section>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import {
  MfPromptSuggestions,
  type PromptSuggestion,
  type PromptSuggestionSource
} from '@packages/prompt-suggestions'

const draft = ref('')
const context = ref('发布')
const asyncOpen = ref(false)
const selectedText = ref('')

const staticItems: PromptSuggestion[] = [
  { id: 'review', label: '检查当前改动', description: '找出风险、遗漏的测试和文档', group: '开发' },
  { id: 'tests', label: '运行项目门禁', description: '执行测试、库构建和文档构建', group: '开发' },
  { id: 'explain', label: '解释这段实现', description: '从行为和边界出发说明代码', group: '理解' },
  {
    id: 'disabled',
    label: '部署到生产环境',
    description: '当前环境不可用',
    group: '操作',
    disabled: true
  }
]

const contextualItems: Record<string, PromptSuggestion[]> = {
  发布: [
    { id: 'changelog', label: '整理变更日志', description: '归纳用户可感知的变化' },
    { id: 'exports', label: '校验子路径导出', description: '验证 ESM、CommonJS 与声明文件' }
  ],
  错误: [
    { id: 'diagnose', label: '定位根因', description: '读取错误堆栈并缩小影响范围' },
    { id: 'regression', label: '补充回归测试', description: '先复现，再验证修复结果' }
  ],
  文档: [
    { id: 'api', label: '同步 API 文档', description: '检查 Props、事件和默认值' },
    { id: 'demo', label: '更新交互 Demo', description: '让行为变化可以被直接验证' }
  ]
}

const loadSuggestions: PromptSuggestionSource = (value, signal) =>
  new Promise((resolve, reject) => {
    const timer = window.setTimeout(() => {
      const keyword = String(value).trim()
      const match = Object.entries(contextualItems).find(([key]) => keyword.includes(key))
      resolve(match?.[1] ?? [])
    }, 450)
    signal.addEventListener(
      'abort',
      () => {
        window.clearTimeout(timer)
        reject(new DOMException('Request aborted', 'AbortError'))
      },
      { once: true }
    )
  })

function fillDraft(item: PromptSuggestion): void {
  draft.value = item.label
  selectedText.value = `已填入建议：${item.label}`
}
</script>

<style scoped lang="scss">
.demo-block {
  margin-bottom: 20px;
  padding: 20px;
  background: var(--mf-bg-color-light);
  border-radius: var(--mf-border-radius-base);
  h4 {
    margin: 0 0 12px;
  }
}
.chat-shell {
  padding: 20px;
  border: 1px solid var(--mf-border-color-light);
  border-radius: 12px;
  background: #fff;
}
.chat-copy {
  display: grid;
  gap: 6px;
  margin-bottom: 18px;
  color: var(--mf-color-text-regular);
  font-size: 14px;
}
.composer {
  padding: 12px;
  border: 1px solid var(--mf-border-color-base);
  border-radius: 10px;
}
.composer textarea {
  width: 100%;
  resize: vertical;
  border: 0;
  outline: 0;
  font: inherit;
}
.composer-actions {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-top: 8px;
}
.send-button {
  padding: 7px 16px;
  border: 0;
  border-radius: 7px;
  color: #fff;
  background: var(--mf-color-primary);
  cursor: pointer;
}
.send-button:disabled {
  opacity: 0.45;
  cursor: not-allowed;
}
.context-demo {
  display: flex;
  flex-wrap: wrap;
  gap: 12px;
  align-items: end;
  padding: 18px;
  border: 1px solid var(--mf-border-color-light);
  border-radius: 10px;
  background: #fff;
}
.context-demo label {
  display: grid;
  flex: 1;
  min-width: 220px;
  gap: 7px;
  color: var(--mf-color-text-secondary);
  font-size: 13px;
}
.context-demo input {
  padding: 9px 11px;
  border: 1px solid var(--mf-border-color-base);
  border-radius: 7px;
  font: inherit;
}
</style>
