# Feedback Suite

> 成熟度：Beta

Modal、Loading、Message 共享一套内部浮层管理，集中解决各自实现时容易冲突的页面副作用。

## 关键能力

- ESC 只关闭最顶层 Modal；
- 嵌套浮层通过引用计数锁定滚动；
- Modal 捕获焦点，并在关闭后恢复原焦点；
- Loading 支持延迟展示、最短展示时间和局部容器；
- Message 支持容量限制、悬停暂停和 Promise 状态反馈。

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
