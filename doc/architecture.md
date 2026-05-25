# Chen404 前端架构设计

本文档描述当前前端代码实现，而不是历史规划。最后同步时间：2026-05-25。

## 1. 架构概览

```text
Views
  -> Layouts
  -> Components
  -> Composables / Modules
  -> Stores + Utils
  -> API Layer
  -> Spring Boot Backend (/api)
```

当前前端已经形成以下分层：

- `views`：页面级容器，负责路由页面和局部状态。
- `layouts`：页面骨架，目前主要是 `DefaultLayout`。
- `components`：公共视觉与交互组件。
- `composables`：跨页面复用逻辑，例如站点配置、移动端判断、文章编辑。
- `modules`：较完整的业务模块，例如 `article-edit`、`feature-access`。
- `api`：手写 API 封装。
- `sdk/generated`：OpenAPI 生成代码，目前作为补充。
- `stores`：Pinia 状态，当前以用户状态为主。

## 2. 技术栈

| 分类 | 技术 | 说明 |
| ---- | ---- | ---- |
| 框架 | Vue 3.5 | 页面与组件开发 |
| 构建 | Vite 8 | 开发与打包 |
| 语言 | TypeScript 5 | 类型定义 |
| 路由 | Vue Router 4 | SPA 路由与守卫 |
| 状态 | Pinia 3 | 用户状态、轻量全局状态 |
| UI | Element Plus | 表单、弹窗、分页、后台组件 |
| 样式 | Sass + UnoCSS | 主题变量与原子能力 |
| 网络 | Axios | 请求与响应拦截 |
| 编辑器 | md-editor-v3 | 文章编写 |
| 地图 | d3-geo、china-map-geojson | 旅行纪念地图 |
| 动效 | sakura-js、Swiper | 页面氛围与轮播 |

## 3. 当前目录结构

```text
src/
├─ api/
├─ assets/
│  ├─ live2d/
│  ├─ memory-map/
│  └─ styles/
├─ components/
│  ├─ ArticleCard/
│  ├─ Comment/
│  ├─ Editor/
│  ├─ Emoji/
│  ├─ Footer/
│  ├─ Header/
│  ├─ Live2D/
│  ├─ PageHero/
│  ├─ SakuraOverlay/
│  ├─ TravelMemoryMap/
│  └─ UserProfile/
├─ composables/
│  └─ article-edit/
├─ emoji/
├─ iconify/
├─ layouts/
├─ modules/
│  ├─ article-edit/
│  └─ feature-access/
├─ router/
├─ sdk/
│  └─ generated/
├─ stores/
├─ types/
├─ utils/
└─ views/
```

## 4. 页面与路由

当前路由集中在 [`src/router/index.ts`](../src/router/index.ts)。

主要特点：

- 页面级懒加载。
- `requiresAuth` 控制登录访问。
- `requiresAdmin` 控制管理员访问。
- `requiresFriend` 控制管理员/知友访问。
- `guest` 控制登录页、注册页这类游客页面。
- `/home` 重定向到 `/`。

主要业务路由：

```text
/                         首页
/article/:id              文章详情
/article/edit/:id?        文章编辑，管理员
/archive                  归档
/memory-map               旅行纪念地图，管理员/知友
/memory-map/detail/:id    旅行地点详情，管理员/知友
/memory-map/create        创建旅行地点，管理员
/memory-map/edit/:id      编辑旅行地点，管理员
/category                 分类总览
/category/:id             分类详情
/tag                      标签总览
/tag/:id                  标签详情
/guestbook                留言板
/about                    关于
/user/:id                 公开用户主页
/trust-request            受信申请
/login                    登录
/register                 注册
/profile                  个人中心
/admin                    后台管理
```

## 5. API 层

手写 API 封装位于 `src/api/`：

| 文件 | 说明 |
| ---- | ---- |
| `request.ts` | Axios 实例、统一响应解析、token 注入、401 刷新 |
| `auth.ts` | 登录、注册、验证码、用户资料、密码 |
| `article.ts` | 文章、分类、标签、归档、AI 文章辅助 |
| `comment.ts` | 评论、留言板、审核、点赞 |
| `home.ts` | 首页、站点配置、Banner |
| `upload.ts` | 上传与删除文件 |
| `emoji.ts` | 表情包公开与后台接口 |
| `admin-file.ts` | 后台文件管理 |
| `travel-memory.ts` | 旅行纪念地图 |
| `trust-request.ts` | 受信申请 |
| `ai.ts` | Lyra 聊天、SSE、会话恢复 |
| `ai-admin.ts` | AI 后台配置 |

`src/api/request.ts` 负责：

- 基于 `VITE_API_BASE_URL` 设置 `baseURL`。
- 自动附加 `Authorization: Bearer <token>`。
- 解析后端统一响应 `{ code, message, data }`。
- `401` 时尝试使用 `refreshToken` 静默续期。
- 刷新失败后跳转登录页。
- 支持跳过错误提示或跳过认证跳转的请求选项。

## 6. 状态管理

主要 store：

- [`src/stores/user.ts`](../src/stores/user.ts)：用户、token、登录态同步、登录/登出、本地持久化。
- [`src/stores/app.ts`](../src/stores/app.ts)：轻量应用状态。
- [`src/stores/article.ts`](../src/stores/article.ts)：文章相关状态保留。

绝大多数业务数据仍采用“页面内请求 + 局部状态”模式，并没有全部集中到 Pinia。

## 7. 站点配置与主题

`useSiteConfig` 负责：

- 拉取公开站点配置。
- 提供缓存。
- 在接口失败时回退默认站点信息。
- 配合 `siteConfig.ts` 解析站点名称、Logo、Favicon、SEO、页面封面、文章分页等运行时配置。

主题与视觉：

- 变量定义：`src/assets/styles/variables.scss`
- 全局样式：`src/assets/styles/global.scss`
- 默认布局：`src/layouts/DefaultLayout.vue`
- 樱花动效：`SakuraOverlay`
- Live2D：`Live2D.vue`

## 8. 文章编辑模块

文章编辑页由以下文件协作：

- `src/views/Article/ArticleEdit.vue`
- `src/views/Article/article-edit/ArticleEdit.styles.scss`
- `src/composables/article-edit/useArticleEdit.ts`
- `src/modules/article-edit/*`
- `src/components/Editor/*`
- `src/components/MdResizablePreview/*`

能力：

- 创建/编辑文章。
- 草稿和发布。
- 分类/标签选择。
- 封面上传。
- Markdown 编辑。
- 图片插入与预览调整。
- AI 摘要与标签生成。

## 9. Live2D 与 Lyra 聊天

主要文件：

- `src/components/Live2D/Live2D.vue`
- `src/components/Live2D/Live2DChatPanel.vue`
- `src/api/ai.ts`
- `src/api/ai-admin.ts`
- `src/views/Admin/components/AiAssistantSettings.vue`

当前能力：

- 同步聊天：`POST /ai/chat`
- 流式聊天：`POST /ai/chat/stream`
- 会话恢复：`GET /ai/chat/sessions/{sessionId}`
- 引用片段展示。
- 相关推荐文章展示。
- 快捷建议。
- 面板完整回答与人物小气泡短句分层。

响应字段使用策略：

- 聊天面板优先使用 `panelAnswer`。
- 小气泡优先使用 `bubbleText`。
- `replyText` 作为旧字段兼容。

## 10. 后台管理

后台入口：

- `src/views/Admin/AdminLayout.vue`

后台页面：

- `AdminCategories.vue`
- `AdminSiteSettings.vue`
- `AdminEmojiManager.vue`
- `AdminFiles.vue`
- `AdminTrustRequests.vue`
- `components/AiAssistantSettings.vue`

布局特点：

- 使用 `DefaultLayout wide-content`。
- 后台容器覆盖全局 `1200px` 限制。
- 中等宽度下收缩侧边菜单与内容网格。
- AI 配置页卡片和表单使用响应式布局，避免右侧内容被裁。

## 11. 旅行纪念地图

主要文件：

- `src/views/MemoryMap/MemoryMap.vue`
- `src/views/MemoryMap/TravelMemoryDetail.vue`
- `src/views/MemoryMap/TravelMemoryCreate.vue`
- `src/components/TravelMemoryMap/TravelMemoryMap.vue`
- `src/components/TravelMemoryManager/TravelMemoryManager.vue`
- `src/api/travel-memory.ts`

能力：

- 管理员/知友可查看旅行地图。
- 管理员可创建、编辑、删除旅行地点。
- 支持地点图片、游记条目、坐标、访问时间范围。
- 上传旅行图片时后端可解析 EXIF。

## 12. 受信申请与访问控制

主要文件：

- `src/views/TrustRequest/TrustRequest.vue`
- `src/views/Profile/ProfileTrustRequestPanel.vue`
- `src/api/trust-request.ts`
- `src/modules/feature-access/constants.ts`
- `src/components/FeatureAccessCover.vue`

当前模型：

- 游客或普通用户可申请成为知友。
- 管理员在后台审核。
- 部分页面如旅行地图要求管理员或知友身份。
- 前端守卫只做体验层保护，最终权限以后端为准。

## 13. 表情系统

主要文件：

- `src/emoji/*`
- `src/components/Emoji/EmojiPickerPanel.vue`
- `src/components/Editor/MdEditorEmojiToolbar.vue`
- `src/views/Admin/AdminEmojiManager.vue`
- `src/api/emoji.ts`

能力：

- 评论、文章、签名等不同场景可使用表情。
- 后端下发表情包和表情项。
- 后台可维护表情包并导入 ZIP。
- 前端负责表情 token 解析和渲染。

## 14. OpenAPI SDK

后端 OpenAPI：

```text
http://localhost:10404/api/v3/api-docs
```

生成命令：

```bash
npm run gen:sdk
```

生成目录：

```text
src/sdk/generated
```

当前业务代码仍主要使用手写 `src/api/*.ts`，生成 SDK 用于类型参考、后续迁移和接口对齐。

## 15. 构建与分包

`vite.config.ts` 当前配置：

- `server.host = 0.0.0.0`
- `server.port = 5173`
- `server.strictPort = true`
- `@` 指向 `src`
- Element Plus 自动导入样式
- UnoCSS
- 手动分包：
  - `vendor-element-plus`
  - `vendor-vue`
  - `chunk-layout-shell`
  - `chunk-article-card`

分包目的：

- 减少首页弱网下动态 import 并发过多导致白屏的风险。
- 避免将 Vue 运行时错误卷入某个业务页 chunk。

## 16. 文档维护规则

前端文档维护时优先同步：

- 新增路由或路由权限变化。
- 新增后台 tab 或后台管理页。
- 新增 `src/api/*.ts` 能力。
- Live2D / AI 响应字段变化。
- 旅行地图、受信申请、表情系统等跨前后端功能变化。
- Vite 配置、端口、环境变量或构建脚本变化。
