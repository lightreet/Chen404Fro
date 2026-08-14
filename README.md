# Chen404 博客系统 - 前端

Chen404Fro 是 Chen404 的 Vue 3 前端应用，负责页面路由、视觉体验、业务交互、手写 API 封装和 OpenAPI SDK 接入。当前版本已接入真实后端链路，覆盖博客主站、多用户共创、旅行纪念地图、Sakura Radio 音乐馆、小说书架与阅读器、GitHub 开发历程、管理后台以及 Live2D + Lyra AI 助手。

## 技术栈

| 类别 | 技术 |
| --- | --- |
| 框架 | Vue 3.5、Vite 8、TypeScript 5 |
| 路由与状态 | Vue Router 4、Pinia 3 |
| UI 与样式 | 自有设计系统（`design/` tokens + motion + icon-map、`components/ui` primitive、`components/app` 风格层）、Sass、UnoCSS、@fontsource；Element Plus 已收口为底层依赖 |
| HTTP | Axios |
| 编辑器 | md-editor-v3 |
| 地图与地理 | d3-geo、china-map-geojson、@svg-maps/china |
| 动效与视觉 | sakura-js、Swiper、Iconify、自定义 Live2D 面板 |
| 数据可视化 | ECharts |
| 本地媒体解析 | music-metadata |
| SDK | openapi-typescript-codegen |

## 环境要求

- Node.js `^20.19.0` 或 `>=22.12.0`（与当前 Vite 8 / `@vitejs/plugin-vue` engines 一致）
- npm
- 后端默认运行在 `http://localhost:10404/api`

## 常用命令

```bash
npm install
npm run dev
npm run build
npm run preview
npm run gen:sdk
npm run maps:build
npm run check:element-boundary
```

说明：

- `npm run build` 会先执行 `vue-tsc -b`，再执行 Vite 构建。
- `npm run check:element-boundary` 校验 UI 架构边界：业务层不得直接 `import` `element-plus` / `@element-plus/icons-vue`，模板里也不得出现 `<el-*>` 或 `v-loading`；仅 `components/ui`、`lib/feedback`、`compat` 及少数基础运行时文件在允许名单内。
- 当前 `package.json` 尚未提供统一测试脚本。仓库内已有两个 Node 测试文件，手动全量运行时存在 2 个音乐布局契约失败；在修复并接入脚本前，不应把 `npm run build` 等同于“前端测试全部通过”。
- 开发服务固定端口 `20204`，`strictPort = true`。
- 当前未配置 `server.proxy`，本地开发应显式配置 `VITE_API_BASE_URL` 直连后端；未配置时请求层会回退到 `/api`。

## 环境变量

```bash
VITE_API_BASE_URL=http://localhost:10404/api
VITE_AMAP_KEY=
VITE_AMAP_SECURITY_CODE=
```

说明：

- `VITE_API_BASE_URL` 用于所有业务接口和 SDK 调用。
- `VITE_AMAP_KEY` / `VITE_AMAP_SECURITY_CODE` 同时用于旅行纪念地图展示态的真实高德底图，以及编辑态的选点、定位与逆地理编码；未配置或脚本加载失败时，展示态会回退到本地 GeoJSON/SVG 地图。
- 未选择“记住登录”时，`token`、`refreshToken`、`user` 保存在 `sessionStorage`；选择后保存在 `localStorage`。请求层会在 token 距过期不足 5 分钟时主动刷新，401 时也会刷新，并发请求共享同一刷新任务。

## 当前页面与权限

| 路径 | 页面 | 权限 | 说明 |
| --- | --- | --- | --- |
| `/` | 首页 | 公开 | Hero、樱花动画、文章流 |
| `/home` | 首页别名 | 公开 | 兼容旧链接，重定向到 `/` |
| `/article/:id` | 文章详情 | 按文章可见性 | 正文、评论、上下篇、Lyra 上下文 |
| `/article/edit/:id?` | 文章编辑 | 具备文章创作权限 | Markdown 编辑、封面上传、AI 摘要/标签 |
| `/archive` | 归档 | 公开 | 真实归档数据 |
| `/category` `/category/:id` | 分类总览/详情 | 公开 | 分类页与分类文章流 |
| `/tag` `/tag/:id` | 标签总览/详情 | 公开 | 标签页与标签文章流 |
| `/guestbook` | 留言板 | 公开 | 复用评论体系 |
| `/about` | 关于页 | 公开 | 站点介绍 |
| `/user/:id` | 用户主页 | 公开 | 成员公开资料 |
| `/login` `/register` `/forgot-password` | 登录/注册/忘记密码 | 游客 | 已登录用户会被重定向 |
| `/development-history` | 开发历程 | 公开 | 展示后端聚合和缓存的 GitHub 提交历程 |
| `/bookshelf` | 小说书架 | 公开 | 展示当前身份可见书籍；知友/管理员可导入，合格所有者/管理员可管理 |
| `/reader/:bookId` | 小说阅读器 | 按书籍可见性 | 目录、章节、搜索、进度与偏好 |
| `/profile` | 个人中心 | 登录用户 | 资料、我的创作（文章/旅行/音乐）、点赞收藏、知友状态 |
| `/studio` | 旧创作中心兼容路径 | 登录用户 | 重定向到 `/profile?tab=creations` |
| `/admin` | 后台管理 | 管理员 | 消息、分类、评论、站点配置、表情包、文件、知友申请 |
| `/memory-map` | 旅行纪念地图 | 公开 | 游客可看公开地点，知友/管理员扩展读取知友内容；片段在右侧详情面板内浏览 |
| `/memory-map/create` `/memory-map/edit/:id` | 旅行编辑工作台 | 具备旅行创作权限 | 地点创建/编辑 |
| `/music` | Sakura Radio 音乐馆 | 公开 | 公开播放、歌单浏览、共享播放器 |
| `/music/tracks/new` `/music/tracks/:id/edit` | 音乐编辑工作台 | 具备音乐创作权限 | 歌曲编辑、上传、AI 匹配 |

## 当前能力

### 已接入真实后端

- 认证：登录、注册、验证码、刷新令牌、登出、资料修改、密码修改
- 内容：个人中心统一管理我的文章、旅行地点和音乐记录；支持按能力创建、更新、删除，以及文章点赞、收藏、归档、推荐
- 评论与留言：评论列表、留言板、最新评论、删除、点赞、审核
- 站点：首页聚合、Banner、公开成员信息、站点配置、站点统计
- 上传：文章图片、封面、头像、站点资源、好友申请附件、旅行图片、音乐音频/封面
- 文件管理：文件列表、详情、统计、引用状态筛选
- 表情包：公开下发、后台维护、ZIP 导入
- 好友申请：在个人中心提交和查询，后台审批
- 旅行纪念地图：公开/知友可见内容、三栏 atlas 浏览、右侧面板片段切换、所有者管理、多片段编辑、图片 EXIF 辅助定位
- Sakura Radio：公开歌曲/歌单、默认播放队列、创作者本人曲目维护、管理员歌单维护、AI 曲目信息补全、游客本地与登录用户 Redis 播放现场
- 小说书架与阅读器：公开书架、TXT/EPUB/HTML/Markdown/FB2 受控导入、异步状态轮询、目录/章节/搜索、进度与偏好恢复
- 开发历程：公开 GitHub 历程展示，后台维护仓库/令牌等私有配置并手动刷新
- 运行时功能与消息：创作/AI 功能开关，管理员消息列表、未读角标、60 秒可见页轮询
- Lyra：同步聊天、SSE 流式聊天、会话恢复、引用、相关推荐、建议按钮
- AI 后台配置：模型参数、Lyra 人设、聊天检索、小气泡配置、连接测试

### 仍属于当前边界

- `webSearchEnabled` 只是后台配置开关，尚未接入真实联网搜索
- 业务代码仍以 `src/api/*.ts` 手写封装为主，`src/sdk/generated` 主要承担对齐和类型补充
- 音乐馆尚未实现播放统计、用户收藏/点赞和 Media Session；跨会话播放现场已实现
- `src/sdk/generated` 落后于当前后端，尚未覆盖 reader、feature toggles、notifications、development history、forgot password 等接口
- 前端自动化测试尚未接入统一 npm 脚本，当前音乐布局测试存在 2 个失败项
- 后台文件管理尚未提供批量清理、批量转永久、手动触发引用重建等完整操作闭环

## 关键目录

```text
src/
├─ api/                    手写 API 封装
├─ assets/                 样式（含 tokens/motion/element-theme scss）、图片、地图贴纸、Live2D 资源
├─ design/                 设计系统 TS 入口：tokens.ts / motion.ts / icon-map.ts
├─ compat/                  迁移期兼容层（如 element-plus 图标映射）
├─ lib/feedback/           统一反馈服务：notify.ts / confirm.ts（收口 ElMessage / ElMessageBox）
├─ components/
│  ├─ ui/                  UI primitive 层（UiButton/UiInput/UiTable/UiForm/UiLoadingState/UiIcon 等）
│  ├─ app/                 App 风格层（AppSection/AppActionBar/AppStatusPill 等）
│  └─ ...                  其余业务组件（Header、ArticleCard、Live2D、TravelMemoryMap 等）
├─ composables/            useSiteConfig、useLayoutMobile、article-edit 等复用逻辑
├─ emoji/                  表情解析与渲染
├─ layouts/                页面骨架
├─ modules/                article-edit、feature-access、category-icons、music-metadata 等业务模块
├─ router/                 路由与守卫
├─ sdk/generated/          OpenAPI 生成代码
├─ stores/                 用户、播放器、管理员消息等 Pinia 状态
├─ types/                  共享类型
├─ utils/                  配置、权限、地图、校验工具
└─ views/                  路由级页面
```

## 关键业务流

### 文章编辑

- 页面：`src/views/Article/ArticleEdit.vue`
- 逻辑：`src/composables/article-edit/useArticleEdit.ts`
- 模块：`src/modules/article-edit/*`
- 支持封面上传、标签选择、AI 摘要/标签、Markdown 编辑和可调预览

### 旅行纪念地图

- 页面：`src/views/MemoryMap/MemoryMap.vue`、`TravelMemoryCreate.vue`
- 地图组件：`src/components/TravelMemoryMap/TravelMemoryMap.vue`
- 访问模型：游客读取公开内容，知友/管理员扩展读取知友内容；具备能力的用户可创建，所有者/管理员可编辑删除
- 展示地图：优先使用高德真实底图，缺少 Key 或脚本失败时回退到城市/省级 GeoJSON + 基础 SVG
- 数据模型：地点 `location` + 旅途片段 `stop` + 照片条目 `entry`，编辑页优先提交 `stops`

### Sakura Radio

- 展示页：`src/views/Music/Music.vue`
- 编辑页：`src/views/Music/MusicTrackEdit.vue`
- 播放状态：`src/stores/music-player.ts`
- 能力：公开播放、歌词展示、共享队列、创作者本人歌曲、管理员歌单与 AI 匹配、跨会话播放现场

### 小说书架与阅读器

- 书架：`src/views/Reader/Bookshelf.vue`
- 阅读器：`src/views/Reader/Reader.vue`
- API：`src/api/reader.ts`
- 能力：公开/知友/私有可见性、受控导入、异步轮询、目录/正文/搜索、阅读进度和偏好

### 后台配置

- 入口：`src/views/Admin/AdminLayout.vue`
- 站点配置页：`src/views/Admin/AdminSiteSettings.vue`
- AI 配置页：`src/views/Admin/components/AiAssistantSettings.vue`
- 当前 tab：基础信息、品牌资源、SEO、运行配置、页面封面、开发同步、AI 助手；运行配置中包含业务功能开关

## OpenAPI SDK

- 后端文档地址：`http://localhost:10404/api/v3/api-docs`
- 生成命令：`npm run gen:sdk`
- 输出目录：`src/sdk/generated`

当前业务开发仍优先改 `src/api/*.ts` 与类型文件，SDK 作为契约对齐与渐进迁移支撑。2026-08-14 扫描确认生成目录落后于后端；重新生成前应以控制器和手写 API 为当前事实，重新生成后必须审查差异并执行构建。

## 文档

- 文档索引：[`doc/文档索引.md`](doc/文档索引.md)
- 架构主文档：[`doc/architecture.md`](doc/architecture.md)
- UI 架构迁移方案：[`doc/前端 UI 架构迁移方案.md`](doc/前端%20UI%20架构迁移方案.md)
- 阶段快照：[`doc/前端功能审查与优化清单.md`](doc/前端功能审查与优化清单.md)
- 表情模块：[`src/emoji/README.md`](./src/emoji/README.md)
- SDK 说明：[`src/sdk/README.md`](./src/sdk/README.md)
- 前后端扫描与缺陷台账：[`../docs/前后端代码与文档扫描报告_2026-08-14.md`](../docs/前后端代码与文档扫描报告_2026-08-14.md)
