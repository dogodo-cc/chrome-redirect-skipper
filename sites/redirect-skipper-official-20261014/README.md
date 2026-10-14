# Redirect-Skipper 官网

简洁科技风的中文官网，使用静态 HTML、CSS 和 JavaScript。包含浏览器安装入口、交互式跳转示意、可搜索的内置站点规则、自定义规则指南与常见问题。

## 源码管理

本目录由主仓库直接管理，不创建独立的 `.git`，也不作为 Git 子模块。官网源码和配置随主仓库一起提交。

## 本地预览

在该目录运行 `python3 -m http.server 4173 --directory build`，然后访问 `http://localhost:4173`。

## 内容来源

- 插件仓库：`https://github.com/dogodo-cc/chrome-redirect-skipper`
- 功能、站点列表、图标和面板截图来自创建时的本地插件源码。
- `build/assets/sites.json` 为创建时 `src/sites.json` 与 `src/sites.js` 的站点快照，不会动态拉取远程规则。官网展示的是规则数量。
- 浏览器商店入口已核实，隐私说明链接到开发者的 Chrome 商店声明。
- 字体使用 Google Fonts，失败时回退到系统字体。
- 演示开关仅用于展示跳转效果，不会更改已安装扩展的设置。

## 部署

官网文件保存在 `build/`，该目录不会匹配主仓库忽略 `dist` 的规则。Sites 身份与静态托管目录在 `.openai/hosting.json` 中保存，静态目录设置为 `build`。Sites 托管元数据保留在此目录中；源码仍统一由主仓库管理。

## 字体约定

正文、搜索输入、站点名称和主要操作使用 `--text-body: 1rem`（默认 16px）；域名、说明与次要操作使用 `--text-small: .875rem`（默认 14px）；装饰性的英文标签使用 `--text-label: .75rem`（默认 12px）。手机断点保持相同的阅读字号，通过换行、调整列数和增加空间适配屏幕。新增文字应按语义复用这些变量。
