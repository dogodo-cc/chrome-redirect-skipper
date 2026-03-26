# CLAUDE.md — AI 编码助手代码库指南

本文档面向在本仓库中运行的 AI 编码助手（例如 Copilot/Claude），用于快速理解项目结构、约定和常见修改流程。

---

## 一、项目概览（精简）

Redirect-Skipper 是一个 MV3 浏览器扩展，用于自动跳过外链中转/安全提示页面，直达目标链接。支持 Chrome 与 Firefox（通过构建脚本生成两套发行目录）。代码为原生 JavaScript，依赖 `webextension-polyfill` 做浏览器 API 兼容封装。

---

## 二、当前重要文件与目录（快速索引）

- 文件：[manifest.json](manifest.json) — 源 manifest（Chrome/MV3 源）
- 入口脚本：`src/service_worker.js` — 后台 Service Worker，包含匹配与跳转逻辑
- 站点配置：[src/sites.js](src/sites.js)、[src/sites.json](src/sites.json)、[src/site-config.js](src/site-config.js) — 内置站点库与配置读取
- 兼容封装：[src/browser-wrap.js](src/browser-wrap.js) — 统一 `browser` 对象访问
- UI：`page-popup.html` + [src/popup.js](src/popup.js)；`page-options.html` + [src/options.js](src/options.js)
- 工具：[src/utils.js](src/utils.js) — URL 提取、i18n、DOM 等通用函数
- 构建产物：`dist-chrome/`、`dist-firefox/`（由 `scripts/build.js` 生成，通常不手动编辑）
- 本地化：`_locales/en/messages.json`、`_locales/zh/messages.json`

---

## 三、核心数据结构与关键约定

- Site 对象（在 `src/sites.js` / `src/sites.json` 中）：
    - `hostname`（必填）、`pathname`（可选）、`title`、`param`、`getTargetUrl`、`example`
    - 规则：`getTargetUrl` 优先于 `param`；若设 `pathname`，匹配必须以该前缀开头

- 存储（`storage.sync`）结构：
    - `sites`：用户自定义站点（会与内置去重）
    - `fuzzy`：模糊匹配开关（默认 false）

- 重要约定：
    - `service_worker.js` 中的 `extractTargetUrl`（或同等实现）为跳转核心，所有跳转均通过它处理
    - `getTargetUrl` 必须在失败时返回空字符串 `''`，不抛异常；若内部使用 `fetch`，需 `.catch(() => '')`
    - 若 `getTargetUrl` 里要访问外域页面，必须在根 `manifest.json` 的 `host_permissions` 添加对应域名（否则会被拒绝）
    - 跳转前要避免与当前页同域的误跳转（检查 hostname）
    - 模糊匹配仅考虑 `target|link|href|url` 这些参数名

---

## 四、如何添加/修改站点规则

1. 优先在 [src/sites.js](src/sites.js) 或 [src/sites.json](src/sites.json) 中添加内置条目（数组末尾）。
2. 对于简单通过查询参数携带目标 URL 的页面，使用 `param` 字段；对于需要解析页面或解码的，使用 `getTargetUrl`（异步函数）。
3. 若 `getTargetUrl` 会 `fetch` 目标域名的页面，请同时更新根 [manifest.json](manifest.json) 的 `host_permissions`，例如：

```
"host_permissions": [
  "https://www.example.com/*",
  "https://another.site/*"
]
```

4. 更新后运行构建/打包（参见下文）并在目标浏览器中加载 `dist-chrome/`（或 `dist-firefox/`）进行验证。

---

## 五、构建、测试与发布

- 构建命令（在仓库根目录运行）：

```bash
npm run build:chrome    # 构建 Chrome 发行 → dist-chrome/
npm run build:firefox   # 构建 Firefox 发行 → dist-firefox/
npm run build           # 同时构建两者
```

- 构建脚本位于 `scripts/build.js`，其主要流程：清理目标目录 → 复制资源 → 根据浏览器类型调整 `manifest.json` → 生成 zip 包。

- 本地调试：可在 Chrome 的扩展页面使用“Load unpacked”加载 `dist-chrome/` 目录来验证实际行为。

---

## 六、代码风格与工程约定（要点）

- 所有对浏览器 API 的调用应通过 [src/browser-wrap.js](src/browser-wrap.js) 导出的 `browser` 对象进行，避免直接使用 `chrome.*`。
- `getTargetUrl` 必须处理好错误并返回空字符串，避免 Service Worker 因异常停止。
- 不要在内置 `sites` 中重复用户自定义 `sites`；启动时会自动做去重并写回 `storage.sync`。

---

## 七、常见修改场景与注意事项

- 需要跨域 `fetch` 页面内容以解析目标 URL：
    - 在 `getTargetUrl` 内部使用 `fetch(url).then(...).catch(() => '')`；
    - 并在 `manifest.json` 的 `host_permissions` 添加该域。

- 添加内置站点但想保持用户可编辑：添加到 `src/sites.js`（内置）并在 `page-options.html` 的 UI 保持只读显示。

- 当修改跳转逻辑（例如支持更多参数名或更严格的同源检测）时，只改 `service_worker.js` 中负责提取/校验的函数，保持其他模块不变。

---

## 八、快速上手检查清单（建议）

- 修改站点配置后：
    - 运行 `npm run build:chrome` → 加载 `dist-chrome/` 到 Chrome 验证跳转行为
    - 若新增 `fetch` 权限，确认 `manifest.json` 的 `host_permissions` 已包含目标域

- 如果遇到问题：查看 `src/service_worker.js` 与 `src/utils.js` 中的日志或错误处理分支，必要时在本地做少量 console 调试

---
