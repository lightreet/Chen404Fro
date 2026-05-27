# Chen404 前端架构设计

本文档描述当前前端代码实现，而不是历史规划。最后同步时间：2026-05-28。

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
- `stores`：Pinia 状态，承载用户状态、轻量应用状态和 Sakura Radio 播放器状态。

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
│  ├─ HeroWave/
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
/music                    Sakura Radio 音乐馆
/music/tracks/new         创建音乐曲目，管理员
/music/tracks/:id/edit    编辑音乐曲目，管理员
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
| `music.ts` | Sakura Radio 公开播放、音乐管理、歌单管理、AI 曲目信息补全 |
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
- [`src/stores/music-player.ts`](../src/stores/music-player.ts)：Sakura Radio 播放队列、当前歌曲、播放模式、音量、进度和默认电台加载。

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
- 功能页封面：`src/components/PageHero/PageHero.vue`
- 柔波过渡：`src/components/HeroWave/HeroWave.vue`
- 樱花动效：`SakuraOverlay`
- Live2D：`Live2D.vue`

PageHero 当前采用“背景图 + 轻雾渐变 + 内容层 + HeroWave 过渡”的统一结构。封面底部的波浪以静态前景波形兜底，动画只作用在更低透明度的背层，避免 SVG transform 位移时露出底色缝隙；内容区顶部再叠一层浅色渐变，让封面和正文过渡更自然。

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

## 9. Sakura Radio 音乐馆

主要文件：

- `src/views/Music/Music.vue`
- `src/views/Music/MusicTrackEdit.vue`
- `src/components/Live2D/Live2DMusicPanel.vue`
- `src/stores/music-player.ts`
- `src/api/music.ts`
- `src/api/upload.ts`

当前能力：

- `/music` 公开展示音乐馆、默认电台、公开歌单、唱片架、推荐语和歌词。
- 管理员在 `/music` 看到新增歌曲、编辑歌曲、删除未被歌单引用歌曲、管理歌单、设置默认电台等入口。
- `/music/tracks/new` 与 `/music/tracks/:id/edit` 是独立工作台页面，不再套用顶部全站导航，交互形态与文章编写页一致。
- 支持音乐音频和封面上传，保存曲目时后端会转为永久文件。
- 支持纯文本歌词和基础 LRC 时间轴歌词，播放时可高亮当前歌词。
- `music-player` store 统一驱动 `/music` 页面和 Live2D 随身播放器。
- 音量和播放模式持久化到 `localStorage`。
- 管理员可调用 `/admin/music/tracks/ai/suggest` 补全歌手、专辑、年份、语言、风格、标签、推荐语和心情短句。

当前边界：

- 歌单新增、编辑、排序、默认电台已完成，但歌单删除接口与前端操作尚未实现。
- 播放统计、收藏/点赞、评论、第三方平台同步、Media Session 系统级控制尚未实现。
- 浏览器自动播放仍受用户手势限制，Live2D 音乐按钮会在用户点击后加载并播放默认电台。
- 当前播放器只持久化音量和播放模式，不跨会话恢复播放进度。

## 10. Live2D 与 Lyra 聊天

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

## 11. 后台管理

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
- 文件管理已支持文件统计、引用状态筛选、详情抽屉、音乐音频/封面的归属类型筛选。

## 12. 旅行纪念地图

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
- 前端加载 `public/maps/china-city.geojson` 和 `china-province.geojson`，加载失败时回退基础地图。

## 13. 受信申请与访问控制

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

## 14. 表情系统

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

## 15. OpenAPI SDK

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

## 16. 构建与分包

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

## 17. 当前不足与优化方向

当前已识别的前端优化方向：

- OpenAPI SDK 已生成，但业务层仍以手写 API 为主；后续应逐步把类型和接口口径收敛到同一来源。
- `webSearchEnabled` 只是后台配置与前端开关，尚未接真实联网搜索。
- Sakura Radio 仍缺歌单删除、播放统计、用户互动、Media Session、断点恢复和异常音频全队列失败保护。
- 后台文件管理暂未提供批量清理、批量转永久、手动触发引用重建等完整操作闭环。
- 旅行地图的城市 GeoJSON 已本地化，但生产体积、许可证说明、加载失败观测和移动端性能还值得持续验收。
- PageHero 已统一柔波与渐变过渡，后续新增封面页面需要继续做跨桌面/移动截图回归，避免底部缝隙和正文首屏错位。
- 站点配置里仍有少量运行时字段是“后台可配、前台部分接入”的状态，需要随每个页面迭代逐项关闭差距。
- 当前前端自动化测试很轻，主要依赖类型检查和构建；播放器、权限守卫、AI SSE、旅行地图交互可补 Vitest 或 Playwright 覆盖。

## 18. 文档维护规则

前端文档维护时优先同步：

- 新增路由或路由权限变化。
- 新增后台 tab 或后台管理页。
- 新增 `src/api/*.ts` 能力。
- Live2D / AI 响应字段变化。
- 旅行地图、受信申请、表情系统等跨前后端功能变化。
- Vite 配置、端口、环境变量或构建脚本变化。
