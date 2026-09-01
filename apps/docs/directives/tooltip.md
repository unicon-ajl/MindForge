# v-tooltip

> 成熟度：Beta

面向纯文本提示的 Vue 指令。提供自动翻转、视口避让、滚动跟随、溢出判断和键盘无障碍能力。

## 注册

```ts
import { tooltipPlugin } from 'mind-forge/tooltip'

app.use(tooltipPlugin)
```

局部使用时，在 `<script setup>` 中导入 `vTooltip` 即可。

## 基础使用

```vue
<button v-tooltip="'提示内容'">悬停或聚焦</button>
```

## 仅在内容溢出时显示

```vue
<span v-tooltip.overflow="fullText" class="ellipsis" tabindex="0">{{ fullText }}</span>
```

溢出判断同时覆盖单行省略和多行截断。

`div`、`span` 等非交互元素无需额外配置即可响应鼠标悬停，但它们默认不能被键盘聚焦。若提示内容对理解页面有帮助，应添加 `tabindex="0"`，让用户可以通过 Tab 键聚焦并查看提示：

```vue
<!-- 只支持鼠标悬停 -->
<span v-tooltip="'完整内容'">省略文本</span>

<!-- 同时支持鼠标悬停和键盘访问 -->
<span v-tooltip="'完整内容'" tabindex="0">省略文本</span>
```

`button`、`a`、`input` 等原生交互元素本身可以聚焦，无需重复添加 `tabindex="0"`。`tabindex` 只用于补充键盘可访问性，不是 Tooltip 显示的必要条件。

## 对象配置

```vue
<button
  v-tooltip="{
    content: '保存当前修改',
    placement: 'right',
    theme: 'light',
    delay: [300, 80],
    offset: 10,
    maxWidth: 240,
    disabled: false
  }"
>
  保存
</button>
```

| 配置        | 默认值  | 说明                          |
| ----------- | ------- | ----------------------------- |
| `content`   | —       | 纯文本内容，不解析 HTML       |
| `placement` | `top`   | 首选位置，空间不足时自动翻转  |
| `theme`     | `dark`  | 内置 `dark`、`light` 两种主题 |
| `overflow`  | `false` | 仅在目标内容溢出时显示        |
| `disabled`  | `false` | 禁用提示                      |
| `delay`     | `120`   | 显示延迟，或 `[显示, 隐藏]`   |
| `offset`    | `8`     | 与目标元素的间距              |
| `maxWidth`  | `320`   | 最大宽度                      |

## 主题

```vue
<button v-tooltip="{ content: '白底黑字', theme: 'light' }">浅色提示</button>
```

需要自定义品牌风格时，可覆盖以下 CSS 变量：

```css
:root {
  --mf-tooltip-background: #1f6feb;
  --mf-tooltip-color: #fff;
  --mf-tooltip-arrow-color: #1f6feb;
  --mf-tooltip-border: rgba(255, 255, 255, 0.1);
  --mf-tooltip-shadow: 0 6px 20px rgb(31 111 235 / 24%);
  --mf-tooltip-radius: 8px;
  --mf-tooltip-padding: 8px 12px;
  --mf-tooltip-font-size: 13px;
}
```

Tooltip 挂载在 `body` 下，因此局部组件的 `scoped` 样式和目标元素上的 CSS 变量不会传递给它；请在 `:root`、`body` 或全局 `.mf-tooltip` 中覆盖变量。

## 交互与无障碍

- 支持鼠标悬停和键盘聚焦；
- 触摸指针不会误触发；
- 自动设置 `role="tooltip"` 和 `aria-describedby`；
- 无论由鼠标悬停还是键盘聚焦触发，ESC 都会立即关闭；悬停关闭后需移出再移入才会重新显示；
- 多个 Tooltip 与 Modal 嵌套时共享浮层栈，ESC 每次只关闭最后显示的一层；
- 关闭时只移除当前 Tooltip 添加的 `aria-describedby` token，保留业务运行期间追加的描述关系；
- 滚动、缩放和尺寸变化时自动更新位置；
- 箭头会根据最终翻转方向绘制圆润形状；
- 卸载时清除 DOM、定时器和定位监听；
- 内容使用 `textContent`，不接受 HTML。
