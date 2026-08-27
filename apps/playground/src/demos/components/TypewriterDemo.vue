<template>
  <div>
    <p class="demo-desc">打字机效果组件，支持逐字显示、打字速度控制、光标样式、循环播放等特性。</p>

    <div class="demo-block">
      <h4><span class="demo-tag">基础</span>默认打字效果</h4>
      <div class="demo-box">
        <MfTypewriter text="你好，欢迎使用 MindForge 组件库！" />
      </div>
      <p class="demo-tip">💡 最简用法，传入 <code>text</code> 即可，默认带闪烁光标</p>
    </div>

    <div class="demo-block">
      <h4><span class="demo-tag demo-tag--success">速度</span>自定义打字速度</h4>
      <div class="demo-box" style="flex-direction: column; gap: 16px; align-items: flex-start">
        <div>
          <span style="color: var(--mf-color-text-secondary); font-size: 12px">快速 (50ms): </span>
          <MfTypewriter text="快速打字效果展示" :speed="50" />
        </div>
        <div>
          <span style="color: var(--mf-color-text-secondary); font-size: 12px">正常 (100ms): </span>
          <MfTypewriter text="正常打字效果展示" :speed="100" />
        </div>
        <div>
          <span style="color: var(--mf-color-text-secondary); font-size: 12px">慢速 (200ms): </span>
          <MfTypewriter text="慢速打字效果展示" :speed="200" />
        </div>
      </div>
      <p class="demo-tip">💡 通过 <code>speed</code> 属性控制每个字符的显示间隔（毫秒）</p>
    </div>

    <div class="demo-block">
      <h4><span class="demo-tag demo-tag--warning">模式</span>三种播放模式</h4>
      <div class="demo-box" style="flex-direction: column; gap: 16px; align-items: flex-start">
        <div>
          <span style="color: var(--mf-color-text-secondary); font-size: 12px"
            >type (只打字):
          </span>
          <MfTypewriter text="打完后保持不变" mode="type" />
        </div>
        <div>
          <span style="color: var(--mf-color-text-secondary); font-size: 12px"
            >delete (打完删除):
          </span>
          <MfTypewriter text="打完后自动删除" mode="delete" :pause-duration="1500" />
        </div>
        <div>
          <span style="color: var(--mf-color-text-secondary); font-size: 12px"
            >loop (循环播放):
          </span>
          <MfTypewriter text="无限循环播放中..." mode="loop" :pause-duration="1500" />
        </div>
      </div>
      <p class="demo-tip">
        💡 <code>mode</code> 支持 type / delete / loop 三种模式，<code>pause-duration</code>
        控制停顿时间
      </p>
    </div>

    <div class="demo-block">
      <h4><span class="demo-tag demo-tag--success">光标</span>样式配置</h4>
      <div class="demo-box" style="flex-direction: column; gap: 16px; align-items: flex-start">
        <!-- 隐藏光标 -->
        <div>
          <span style="color: var(--mf-color-text-secondary); font-size: 12px">隐藏光标: </span>
          <MfTypewriter text="没有光标的打字效果" :show-cursor="false" />
        </div>
        <!-- 自定义颜色 -->
        <div>
          <span style="color: var(--mf-color-text-secondary); font-size: 12px">红色光标: </span>
          <MfTypewriter text="红色光标效果" cursor-color="#f56c6c" />
        </div>
        <div>
          <span style="color: var(--mf-color-text-secondary); font-size: 12px">绿色光标: </span>
          <MfTypewriter text="绿色光标效果" cursor-color="#67c23a" />
        </div>
        <div>
          <span style="color: var(--mf-color-text-secondary); font-size: 12px"
            >渐变色彩虹光标 (CSS变量):
          </span>
          <MfTypewriter text="彩虹渐变光标" class="rainbow-cursor" :cursor-blink-speed="600" />
        </div>
        <div>
          <span style="color: var(--mf-color-text-secondary); font-size: 12px"
            >快速闪烁 (300ms):
          </span>
          <MfTypewriter text="快速闪烁光标" :cursor-blink-speed="300" />
        </div>
        <div>
          <span style="color: var(--mf-color-text-secondary); font-size: 12px"
            >慢速闪烁 (2000ms):
          </span>
          <MfTypewriter text="慢速闪烁光标" :cursor-blink-speed="2000" />
        </div>
      </div>
      <p class="demo-tip">
        💡 <code>cursorColor</code> 控制颜色，<code>cursorBlinkSpeed</code> 控制闪烁速度；也可通过
        CSS 变量 <code>--mf-typewriter-cursor-*</code> 全局自定义（宽度/高度/圆角等）
      </p>
    </div>

    <div class="demo-block">
      <h4><span class="demo-tag demo-tag--warning">手动</span>外部控制</h4>
      <div class="demo-box" style="flex-direction: column; gap: 16px; align-items: flex-start">
        <MfTypewriter ref="twRef" text="点击按钮控制我" :immediate="false" />
        <div style="display: flex; gap: 8px">
          <button @click="handleStart">开始</button>
          <button @click="handleStop">停止</button>
          <button @click="handleReset">重置</button>
        </div>
      </div>
      <p class="demo-tip">
        💡 通过 ref 调用 <code>start()</code> / <code>stop()</code> / <code>reset()</code> 方法，
        配合 <code>:immediate="false"</code> 实现手动控制
      </p>
    </div>

    <div class="demo-block">
      <h4><span class="demo-tag">事件</span>监听回调（完整日志）</h4>
      <div class="demo-box" style="flex-direction: column; gap: 12px; align-items: flex-start">
        <!-- 控制区 -->
        <div class="event-controls">
          <MfTypewriter
            ref="eventTwRef"
            :text="eventText"
            :speed="eventSpeed"
            :mode="eventMode"
            :pause-duration="1000"
            @type="onType"
            @done="onDone"
            @deleted="onDeleted"
            @loop="onLoop"
          />
          <div class="control-bar">
            <select v-model="eventMode" class="mode-select">
              <option value="type">type 模式</option>
              <option value="delete">delete 模式</option>
              <option value="loop">loop 模式</option>
            </select>
            <button @click="handleEventStart">开始</button>
            <button @click="handleEventStop">停止</button>
            <button @click="clearLogs">清空日志</button>
          </div>
        </div>

        <!-- 统计面板 -->
        <div class="stats-panel">
          <div class="stat-item">
            <span class="stat-label">type 触发</span>
            <span class="stat-value stat-value--primary">{{ stats.typeCount }}</span>
          </div>
          <div class="stat-item">
            <span class="stat-label">done 触发</span>
            <span class="stat-value stat-value--success">{{ stats.doneCount }}</span>
          </div>
          <div class="stat-item">
            <span class="stat-label">deleted 触发</span>
            <span class="stat-value stat-value--warning">{{ stats.deletedCount }}</span>
          </div>
          <div class="stat-item">
            <span class="stat-label">loop 触发</span>
            <span class="stat-value stat-value--info">{{ stats.loopCount }}</span>
          </div>
          <div class="stat-item">
            <span class="stat-label">总事件数</span>
            <span class="stat-value">{{ eventLogs.length }}</span>
          </div>
        </div>

        <!-- 日志面板 -->
        <div class="event-log">
          <div class="log-header">
            <span>📋 事件日志 (自动滚动)</span>
            <span class="log-count">{{ eventLogs.length }} 条</span>
          </div>
          <div ref="logContainerRef" class="log-body">
            <div v-if="eventLogs.length === 0" class="log-empty">
              暂无日志，点击「开始」按钮触发事件
            </div>
            <div
              v-for="(log, i) in eventLogs"
              :key="i"
              :class="['log-item', `log-item--${log.type}`]"
            >
              <span class="log-index">#{{ i + 1 }}</span>
              <span class="log-time">{{ log.time }}</span>
              <span class="log-event">{{ log.label }}</span>
              <span v-if="log.detail" class="log-detail">{{ log.detail }}</span>
            </div>
          </div>
        </div>
      </div>
      <p class="demo-tip">
        💡 切换模式可观察不同事件的触发时机：<code>type</code>(每字符+索引) /
        <code>done</code>(打字完成) / <code>deleted</code>(删除完成) / <code>loop</code>(新一轮)
      </p>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, nextTick } from 'vue'
import { MfTypewriter, type TypewriterInstance } from '@packages/typewriter'

// ===== 手动控制区 =====
const twRef = ref<TypewriterInstance>()

const handleStart = () => twRef.value?.start()
const handleStop = () => twRef.value?.stop()
const handleReset = () => twRef.value?.reset()

// ===== 事件监听区 =====
const eventTwRef = ref<TypewriterInstance>()
const logContainerRef = ref<HTMLElement>()
const eventText = 'MindForge 打字机组件 - 事件监听完整演示！'
const eventSpeed = 80
const eventMode = ref<'type' | 'delete' | 'loop'>('loop')

/** 日志条目结构 */
interface LogEntry {
  type: 'type' | 'done' | 'deleted' | 'loop'
  label: string
  detail?: string
  time: string
}

/** 事件日志 */
const eventLogs = ref<LogEntry[]>([])

/** 事件统计 */
const stats = reactive({
  typeCount: 0,
  doneCount: 0,
  deletedCount: 0,
  loopCount: 0
})

/** 获取当前时间戳 */
function getTime(): string {
  const now = new Date()
  return `${String(now.getMinutes()).padStart(2, '0')}:${String(now.getSeconds()).padStart(2, '0')}.${String(now.getMilliseconds()).padStart(3, '0')}`
}

/** 添加日志并滚动到底部 */
function pushLog(entry: LogEntry) {
  // 限制最大日志数，保留最近 100 条
  if (eventLogs.value.length >= 100) {
    eventLogs.value = [...eventLogs.value.slice(-80)]
  }
  eventLogs.value = [...eventLogs.value, entry]

  // 自动滚动到底部
  nextTick(() => {
    if (logContainerRef.value) {
      logContainerRef.value.scrollTop = logContainerRef.value.scrollHeight
    }
  })
}

function onType(char: string, index: number) {
  stats.typeCount++
  pushLog({
    type: 'type',
    label: 'type',
    detail: `char="${char}" index=${index}`,
    time: getTime()
  })
}

function onDone() {
  stats.doneCount++
  pushLog({
    type: 'done',
    label: '✅ done',
    detail: '打字完成',
    time: getTime()
  })
}

function onDeleted() {
  stats.deletedCount++
  pushLog({
    type: 'deleted',
    label: '🗑️ deleted',
    detail: '删除完成',
    time: getTime()
  })
}

function onLoop() {
  stats.loopCount++
  pushLog({
    type: 'loop',
    label: '🔄 loop',
    detail: `第 ${stats.loopCount} 轮`,
    time: getTime()
  })
}

const handleEventStart = () => eventTwRef.value?.start()
const handleEventStop = () => eventTwRef.value?.stop()

function clearLogs() {
  eventLogs.value = []
  stats.typeCount = 0
  stats.doneCount = 0
  stats.deletedCount = 0
  stats.loopCount = 0
}
</script>

<style scoped lang="scss">
.demo-desc {
  color: var(--mf-color-text-secondary);
  font-size: 14px;
  margin-bottom: 20px;
}

.demo-block {
  margin-bottom: 24px;
  padding: 20px;
  background: var(--mf-bg-color-light);
  border-radius: var(--mf-border-radius-base);

  h4 {
    display: flex;
    align-items: center;
    gap: 8px;
    font-size: 14px;
    font-weight: 500;
    color: var(--mf-color-text-primary);
    margin: 0 0 12px;
  }
}

.demo-box {
  display: flex;
  flex-wrap: wrap;
  gap: 12px;
  align-items: center;
}

.demo-tag {
  display: inline-block;
  font-size: 11px;
  font-weight: 500;
  padding: 1px 6px;
  border-radius: 3px;
  background: rgba(64, 158, 255, 0.1);
  color: var(--mf-color-primary);

  &--success {
    background: rgba(103, 194, 58, 0.1);
    color: var(--mf-color-success);
  }

  &--warning {
    background: rgba(230, 162, 60, 0.1);
    color: var(--mf-color-warning);
  }
}

.demo-tip {
  margin: 12px 0 0;
  font-size: 12px;
  color: var(--mf-color-text-secondary);
  padding: 8px 12px;
  background: rgba(64, 158, 255, 0.04);
  border-radius: var(--mf-border-radius-base);
  border-left: 2px solid var(--mf-color-primary);
}

.event-controls {
  display: flex;
  flex-direction: column;
  gap: 10px;
  width: 100%;
}

.control-bar {
  display: flex;
  align-items: center;
  gap: 8px;
  flex-wrap: wrap;
}

.mode-select {
  height: 28px;
  padding: 0 8px;
  font-size: 12px;
  border: 1px solid #dcdfe6;
  border-radius: var(--mf-border-radius-base);
  background: #fff;
  color: var(--mf-color-text-primary);
  cursor: pointer;
  outline: none;

  &:focus {
    border-color: var(--mf-color-primary);
  }
}

.stats-panel {
  display: flex;
  gap: 16px;
  flex-wrap: wrap;
  padding: 12px 16px;
  background: linear-gradient(135deg, #f5f7fa 0%, #e8ecf1 100%);
  border-radius: var(--mf-border-radius-base);
  border: 1px solid #ebeef5;

  .stat-item {
    display: flex;
    align-items: center;
    gap: 6px;
  }

  .stat-label {
    font-size: 12px;
    color: var(--mf-color-text-secondary);
  }

  .stat-value {
    font-size: 14px;
    font-weight: 600;
    font-family: monospace;
    color: var(--mf-color-text-primary);
    min-width: 24px;
    text-align: center;

    &--primary {
      color: var(--mf-color-primary);
    }

    &--success {
      color: var(--mf-color-success);
    }

    &--warning {
      color: var(--mf-color-warning);
    }

    &--info {
      color: #909399;
    }
  }
}

.event-log {
  width: 100%;
  border: 1px solid #ebeef5;
  border-radius: var(--mf-border-radius-base);
  overflow: hidden;

  .log-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 8px 12px;
    background: #fafafa;
    border-bottom: 1px solid #ebeef5;
    font-size: 12px;
    color: var(--mf-color-text-secondary);

    .log-count {
      font-family: monospace;
      color: var(--mf-color-primary);
      font-weight: 500;
    }
  }

  .log-body {
    max-height: 240px;
    overflow-y: auto;
    padding: 4px 0;

    &::-webkit-scrollbar {
      width: 6px;
    }

    &::-webkit-scrollbar-thumb {
      background: #c0c4cc;
      border-radius: 3px;
    }
  }

  .log-empty {
    padding: 24px 12px;
    text-align: center;
    color: #c0c4cc;
    font-size: 13px;
  }

  .log-item {
    display: flex;
    align-items: center;
    gap: 8px;
    padding: 4px 12px;
    font-family: monospace;
    font-size: 12px;
    line-height: 1.8;
    border-left: 3px solid transparent;
    transition: background-color 0.15s;

    &:hover {
      background: rgba(64, 158, 255, 0.04);
    }

    // 不同事件类型的颜色标识
    &--type {
      border-left-color: var(--mf-color-primary);

      .log-event {
        color: var(--mf-color-primary);
      }
    }

    &--done {
      border-left-color: var(--mf-color-success);
      background: rgba(103, 194, 58, 0.03);

      .log-event {
        color: var(--mf-color-success);
        font-weight: 600;
      }
    }

    &--deleted {
      border-left-color: var(--mf-color-warning);

      .log-event {
        color: var(--mf-color-warning);
        font-weight: 600;
      }
    }

    &--loop {
      border-left-color: #909399;
      background: rgba(144, 147, 153, 0.03);

      .log-event {
        color: #909399;
        font-weight: 600;
      }
    }
  }

  .log-index {
    color: #c0c4cc;
    min-width: 32px;
    font-size: 11px;
  }

  .log-time {
    color: #c0c4cc;
    min-width: 60px;
    font-size: 11px;
  }

  .log-event {
    min-width: 70px;
  }

  .log-detail {
    color: var(--mf-color-text-regular);
  }
}

/* ===== 彩虹光标演示（CSS 变量自定义） ===== */
.rainbow-cursor {
  --mf-typewriter-cursor-bg: linear-gradient(
    180deg,
    #ff6b6b,
    #feca57,
    #48dbfb,
    #ff9ff3,
    #54a0ff,
    #5f27cd
  );
  --mf-typewriter-cursor-width: 2px;
  --mf-typewriter-cursor-height: 1.2em;
  --mf-typewriter-cursor-radius: 2px;
  --mf-typewriter-blink-duration: 1s;
  --mf-typewriter-cursor-gap: 4px;

  .mf-typewriter__cursor {
    background-size: 100% 300%;
    animation:
      mf-cursor-blink var(--mf-typewriter-blink-duration, 1s) step-end infinite,
      rainbow-flow 2s ease infinite;
  }
}

@keyframes rainbow-flow {
  0% {
    background-position: 0% 0%;
  }

  50% {
    background-position: 0% 100%;
  }

  100% {
    background-position: 0% 0%;
  }
}
</style>
