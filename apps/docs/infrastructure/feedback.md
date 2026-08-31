# Feedback Suite

> 成熟度：Beta

Modal、Loading、Message 共享一套内部浮层管理，集中解决各自实现时容易冲突的页面副作用。

## 关键能力

- ESC 只关闭最顶层 Modal；
- 嵌套浮层通过引用计数锁定滚动；
- Modal 捕获焦点，并在关闭后恢复原焦点；
- Loading 支持延迟展示、最短展示时间和局部容器；
- Message 支持容量限制、悬停暂停和 Promise 状态反馈。

公共入口只暴露 `MfModal`、`loading` 和 `message`。Loading 与 Message 的内部渲染组件不单独发布，避免同一能力出现两套生命周期和交互语义。

```ts
import { MfModal, loading, message } from 'mind-forge/feedback'

const task = loading.open({ text: '处理中', minDuration: 300 })
task.close()

await message.promise(save(), {
  pending: '正在保存',
  success: '保存成功',
  error: '保存失败'
})
```

Overlay Manager 是内部实现，不作为公共 API 发布。

## Modal

```vue
<MfModal
  v-model:visible="visible"
  title="编辑资料"
  :width="560"
  :closable="false"
  :close-on-escape="true"
>
  表单内容
</MfModal>
```

| Prop            | 类型               | 默认值    | 说明                                              |
| --------------- | ------------------ | --------- | ------------------------------------------------- |
| `visible`       | `boolean`          | `false`   | 受控显示状态，配合 `v-model:visible`              |
| `title`         | `string`           | `''`      | 默认标题，同时作为无障碍名称来源                  |
| `width`         | `string \| number` | `'520px'` | 数字按 px 处理，并自动限制在移动端视口内          |
| `closable`      | `boolean`          | `true`    | 只控制关闭按钮，不影响 ESC                        |
| `maskClosable`  | `boolean`          | `true`    | 只有栈顶 Modal 响应遮罩关闭                       |
| `closeOnEscape` | `boolean`          | `true`    | 是否响应 ESC；不可关闭的顶层 Modal 会阻止关闭下层 |
| `trapFocus`     | `boolean`          | `true`    | 将 Tab 焦点限制在当前栈顶 Modal                   |
| `lockScroll`    | `boolean`          | `true`    | 使用引用计数锁定 body 滚动                        |
| `closeLabel`    | `string`           | `'Close'` | 关闭按钮的无障碍文案                              |
| `ariaLabel`     | `string`           | —         | 自定义 header 时推荐显式提供的对话框名称          |

Modal 开始退场时立即退出 ESC 栈，遮罩完全退场后才恢复滚动和打开前的焦点。`closable`、`closeOnEscape`、`trapFocus` 和 `lockScroll` 的职责互不绑定。

## Loading

```ts
const task = loading.open({
  target: container,
  text: '正在上传',
  spinner: 'dots',
  delay: 120,
  minDuration: 300
})

task.update({ text: '正在校验', spinner: 'circle' })
task.close()
```

| 选项          | 类型                           | 默认值          | 说明                                 |
| ------------- | ------------------------------ | --------------- | ------------------------------------ |
| `text`        | `string`                       | `'Loading...'`  | 辅助说明文本                         |
| `spinner`     | `'dots' \| 'circle' \| 'bars'` | `'dots'`        | 加载动画类型                         |
| `target`      | `HTMLElement`                  | `document.body` | 指定时只覆盖局部容器                 |
| `delay`       | `number`                       | `0`             | 延迟显示毫秒数，快速任务不会创建 DOM |
| `minDuration` | `number`                       | `300`           | 显示后的最短可见毫秒数               |
| `lockScroll`  | `boolean`                      | `true`          | 是否锁定目标容器滚动                 |
| `background`  | `string`                       | —               | 当前实例的遮罩颜色                   |
| `color`       | `string`                       | —               | 当前实例的动画与文字颜色             |

局部 Loading 会为目标建立定位上下文并设置 `aria-busy="true"`；并发任务全部关闭后，原有 `position`、`overflow` 和 `aria-busy` 才会恢复。调用 `close()` 后实例立即退出控制栈，DOM 仍可能为满足 `minDuration` 短暂保留。

## Message

```ts
message.configure({
  maxCount: 4,
  duration: 3000,
  closeLabel: '关闭通知'
})

const notice = message.info('正在同步', { duration: 0 })
notice.update({ message: '同步完成', type: 'success', duration: 2000 })
```

`message.info/success/warning/error` 支持持续时间数字简写或完整选项。`duration: 0` 表示常驻；鼠标悬停或键盘焦点进入通知时暂停剩余倒计时。Promise 从无倒计时的 pending 切换到 success/error 时会继承当前暂停状态；悬停与焦点同时存在时，需要两种交互都离开后才恢复计时。错误通知使用 `alert` 语义，其余通知使用 `status` 语义。

全局方法：

- `message.open(options)`：创建通知并返回可更新句柄；
- `message.configure(config)`：配置后续通知的容量、默认时长和关闭文案；
- `message.close(id)`：关闭指定通知；
- `message.clearAll()`：关闭全部通知；
- `message.promise(task, labels)`：将同一通知从 pending 原位更新为 success 或 error。

## 动画与服务端渲染

Modal、Loading、Message 都遵循 `prefers-reduced-motion`。Loading 和 Message 在 SSR 环境返回安全的空操作句柄，不会在模块加载阶段访问浏览器全局对象。
