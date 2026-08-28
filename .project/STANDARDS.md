# MindForge 项目规范

## 1. 产品边界

MindForge 只保留值得跨项目复用的成品能力。技术上可以封装，不代表值得进入仓库。

以下内容直接拒绝或删除：

- 普通 Button、Input、Tag 等基础 UI；
- 简单 debounce、日期格式化、正则校验等常见工具；
- 只包装少量响应式状态的 Hook；
- 与成熟生态重复且没有明显优势的实现；
- 只有抽象价值、缺少直观业务价值的基础设施。

项目不设置 experiments、legacy 或 compatibility 目录保存低价值代码。

## 2. 目录职责

```text
packages/           可发布的正式能力
internal/           正式能力共享但不公开的实现
apps/playground/    交互演示
apps/docs/          文档站
apps/mock-server/   开发辅助服务
```

正式能力按业务问题组织，不按 components、hooks、utils、plugins 堆放。

## 3. 准入标准

正式能力必须同时满足：

1. 解决明确、常见且容易处理不完整的业务问题；
2. 相比普通实现覆盖关键边界，并保持 API 直观；
3. 不绑定无必要的第三方实现；
4. 源码、Playground、Docs 同步；
5. 核心机制具有自动化测试；
6. 明确 Beta、Stable 或 Deprecated 状态；
7. ESM、CommonJS、样式和声明文件可以独立消费。

## 4. 导出边界

- `mind-forge` 是完整正式入口；
- 子路径按业务能力命名，如 `mind-forge/feedback`；
- `internal` 永不从公共入口导出；
- 不提供 experimental 公共入口。

## 5. 变更同步

任何代码变更都必须检查并同步关联文档，不限于新增能力。

| 代码变更                    | 必须同步检查                |
| --------------------------- | --------------------------- |
| 公共 API、Props、事件、类型 | 能力文档、Demo、README 示例 |
| 行为、默认值、边界条件      | 能力文档、Demo 提示、测试   |
| 导出路径、目录、依赖        | README、快速开始、构建配置  |
| 样式和交互                  | Playground Demo、交互说明   |
| 删除或重命名                | 全部引用、导航、文档和示例  |

新增能力必须同时落地：

```text
packages/<capability>/
apps/playground/src/demos/<domain>/<Capability>Demo.vue
apps/docs/<domain>/<capability>.md
```

不存在关联文档时，应在交付说明中明确写明“无需更新文档”及原因，不得默认跳过。

## 6. 交付门禁

```bash
npm test -- --run
npm run build:lib
npm run build
npm run docs:build
```

发布前额外验证 ESM、CommonJS、子路径导出和类型声明。

## 7. 生命周期底线

- 模块顶层不得直接访问浏览器全局对象；
- 定时器、监听器和 Observer 必须清理；
- 多实例共享资源必须集中协调；
- 恢复页面状态时必须保留调用前的原值；
- 开发服务不得自动终止未知端口进程。

## 8. 注释规范

- 公共类型和 API 使用 TSDoc，至少说明用途、单位、默认行为或安全边界；
- 模块级状态应说明存在原因、生命周期及多实例关系；
- 状态协调、异步竞态、资源清理、兼容处理和反直觉逻辑必须说明“为什么”；
- 样式中的定位策略、层级关系、动画和主题覆盖应注明设计意图；
- 注释应通俗、一语中的，不复述代码字面含义；
- 行为变化时同步更新注释，禁止保留失真的历史说明。
