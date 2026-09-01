# 视觉语言

MindForge 使用克制、清晰且可长期复用的统一视觉语言。公共能力仍可通过 CSS 变量接入业务主题，Playground 则作为默认风格的参考实现。

## 核心原则

- **内容优先**：状态色只承担识别和反馈，不用大面积高饱和底色争夺注意力。
- **表面有序**：页面背景、普通表面和浮层表面依靠细描边、轻阴影和有限的层级差异区分。
- **形状一致**：控件采用 7–10px 圆角，内容卡片与浮层采用 14–16px 圆角，不混用零散半径。
- **动效克制**：悬停只做轻微抬升或颜色变化，浮层动效解释层级变化，并遵循 `prefers-reduced-motion`。
- **焦点明确**：键盘焦点使用低透明度主色外环，不以移除 outline 换取视觉简洁。

## 默认色阶

```css
:root {
  --mf-color-primary: #5267e9;
  --mf-color-primary-hover: #4458d7;
  --mf-color-primary-soft: #eef1ff;
  --mf-color-text-primary: #182033;
  --mf-color-text-regular: #4c566a;
  --mf-color-text-secondary: #778197;
  --mf-border-color-base: #d9deea;
  --mf-border-color-light: #e6e9f0;
  --mf-bg-color-base: #f6f7fb;
  --mf-bg-color-white: #fff;
}
```

成功、警告和错误分别使用低饱和绿、琥珀和红色。它们主要用于图标、细边标识与浅色交互反馈，正文仍使用中性色。

## 圆角与阴影

```css
:root {
  --mf-border-radius-sm: 7px;
  --mf-border-radius-base: 10px;
  --mf-border-radius-lg: 14px;
  --mf-shadow-light: 0 8px 24px rgba(29, 39, 67, 0.07);
  --mf-shadow-base: 0 16px 44px rgba(29, 39, 67, 0.12);
}
```

阴影只用于表达悬浮层级。普通内容区优先使用细边框，避免页面出现大量漂浮卡片。

## 组件主题边界

公共组件在自身样式中提供完整 fallback，不要求消费者加载 Playground 主题文件。业务可以在 `:root` 或局部主题容器覆盖公开变量；Teleport 到 `body` 的 Modal、Message 和 Tooltip 应在全局作用域覆盖变量。
