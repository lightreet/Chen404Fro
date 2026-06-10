# Chen404 博客系统 - 前端

Chen404Fro 是 Chen404 的 Vue 3 前端应用，负责页面路由、视觉体验、业务交互、手写 API 封装和 OpenAPI SDK 接入。当前版本已接入真实后端链路，覆盖博客主站、后台、旅行纪念地图、Sakura Radio 音乐馆以及 Live2D + Lyra AI 助手。

## 技术栈

| 类别 | 技术 |
| --- | --- |
| 框架 | Vue 3.5、Vite 8、TypeScript 5 |
| 路由与状态 | Vue Router 4、Pinia 3 |
| UI 与样式 | Element Plus、Sass、UnoCSS |
| HTTP | Axios |
| 编辑器 | md-editor-v3 |
| 地图与地理 | d3-geo、china-map-geojson、@svg-maps/china |
| 动效与视觉 | sakura-js、Swiper、Iconify、自定义 Live2D 面板 |
| SDK | openapi-typescript-codegen |

## 环境要求

- Node.js 18+
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
```

说明：

- `npm run build` 会先执行 `vue-tsc -b`，再执行 Vite 构建。
- 开发服务固定端口 `5173`，`strictPort = true`。
- 当前未配置 `server.proxy`，默认通过 `VITE_API_BASE_URL` 直连后端。

## 环境变量

```bash
VITE_API_BASE_URL=http://localhost:10404/api
VITE_AMAP_KEY=
VITE_AMAP_SECURITY_CODE=
```

说明：

- `VITE_API_BASE_URL` 用于所有业务接口和 SDK 调用。
- `VITE_AMAP_KEY` / `VITE_AMAP_SECURITY_CODE` 同时用于旅行纪念地图展示态的真实高德底图，以及编辑态的选点、定位与逆地理编码；未配置或脚本加载失败时，展示态会回退到本地 GeoJSON/SVG 地图。
- JWT 登录态默认保存在 `localStorage`：`token`、`refreshToken`、`user`。

## 当前页面与权限

| 路径 | 页面 | 权限 | 说明 |
| --- | --- | --- | --- |
| `/` | 首页 | 公开 | Hero、樱花动画、文章流 |
| `/article/:id` | 文章详情 | 按文章可见性 | 正文、评论、上下篇、Lyra 上下文 |
| `/article/edit/:id?` | 文章编辑 | 管理员 | Markdown 编辑、封面上传、AI 摘要/标签 |
| `/archive` | 归档 | 公开 | 真实归档数据 |
| `/category` `/category/:id` | 分类总览/详情 | 公开 | 分类页与分类文章流 |
| `/tag` `/tag/:id` | 标签总览/详情 | 公开 | 标签页与标签文章流 |
| `/guestbook` | 留言板 | 公开 | 复用评论体系 |
| `/about` | 关于页 | 公开 | 站点介绍 |
| `/user/:id` | 用户主页 | 公开 | 成员公开资料 |
| `/login` `/register` | 登录/注册 | 游客 | 已登录用户会被重定向 |
| `/profile` | 个人中心 | 登录用户 | 资料、我的内容、知友状态 |
| `/trust-request` | 好友申请 | 公开 | 页面公开，提交申请时要求登录 |
| `/admin` | 后台管理 | 管理员 | 分类、站点配置、AI、表情包、文件、好友申请 |
| `/memory-map` | 旅行纪念地图 | 公开入口 | 页面可进入，具体内容仅管理员或知友可见 |
| `/memory-map/detail/:id` | 旅行详情页 | 管理员或知友 | 独立旅行游记页 |
| `/memory-map/create` `/memory-map/edit/:id` | 旅行编辑工作台 | 管理员 | 地点创建/编辑 |
| `/music` | Sakura Radio 音乐馆 | 公开 | 公开播放、歌单浏览、共享播放器 |
| `/music/tracks/new` `/music/tracks/:id/edit` | 音乐编辑工作台 | 管理员 | 歌曲编辑、上传、AI 匹配 |

## 当前能力

### 已接入真实后端

- 认证：登录、注册、验证码、刷新令牌、登出、资料修改、密码修改
- 内容：文章列表/详情/我的文章、创建、更新、删除、点赞、收藏、归档、推荐
- 评论与留言：评论列表、留言板、最新评论、删除、点赞、审核
- 站点：首页聚合、Banner、公开成员信息、站点配置、站点统计
- 上传：文章图片、封面、头像、站点资源、好友申请附件、旅行图片、音乐音频/封面
- 文件管理：文件列表、详情、统计、引用状态筛选
- 表情包：公开下发、后台维护、ZIP 导入
- 好友申请：提交、查询、后台审批
- 旅行纪念地图：公开入口 + 访问封面、管理员/知友受限内容、三栏 atlas 浏览、独立旅行游记页、多片段编辑、图片 EXIF 辅助定位
- Sakura Radio：公开歌曲/歌单、默认播放队列、后台歌曲/歌单维护、AI 曲目信息补全
- Lyra：同步聊天、SSE 流式聊天、会话恢复、引用、相关推荐、建议按钮
- AI 后台配置：模型参数、Lyra 人设、聊天检索、小气泡配置、连接测试

### 仍属于当前边界

- `webSearchEnabled` 只是后台配置开关，尚未接入真实联网搜索
- 业务代码仍以 `src/api/*.ts` 手写封装为主，`src/sdk/generated` 主要承担对齐和类型补充
- 音乐馆尚未实现播放统计、用户收藏/点赞、Media Session、断点续播
- 后台文件管理尚未提供批量清理、批量转永久、手动触发引用重建等完整操作闭环

## 关键目录

```text
src/
├─ api/                    手写 API 封装
├─ assets/                 样式、图片、地图贴纸、Live2D 资源
├─ components/             公共组件
├─ composables/            复用逻辑
├─ emoji/                  表情解析与渲染
├─ layouts/                页面骨架
├─ modules/                article-edit、feature-access 等业务模块
├─ router/                 路由与守卫
├─ sdk/generated/          OpenAPI 生成代码
├─ stores/                 用户、播放器等 Pinia 状态
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

- 页面：`src/views/MemoryMap/MemoryMap.vue`、`TravelMemoryDetail.vue`、`TravelMemoryCreate.vue`
- 地图组件：`src/components/TravelMemoryMap/TravelMemoryMap.vue`
- 访问模型：`/memory-map` 公开进入，但内容仅管理员或知友可见；管理员可进入创建/编辑工作台
- 展示地图：优先使用高德真实底图，缺少 Key 或脚本失败时回退到城市/省级 GeoJSON + 基础 SVG
- 数据模型：地点 `location` + 旅途片段 `stop` + 照片条目 `entry`，编辑页优先提交 `stops`

### Sakura Radio

- 展示页：`src/views/Music/Music.vue`
- 编辑页：`src/views/Music/MusicTrackEdit.vue`
- 播放状态：`src/stores/music-player.ts`
- 能力：公开播放、歌词展示、共享队列、管理员维护歌曲与歌单、AI 匹配曲目信息

### 后台配置

- 入口：`src/views/Admin/AdminLayout.vue`
- 站点配置页：`src/views/Admin/AdminSiteSettings.vue`
- AI 配置页：`src/views/Admin/components/AiAssistantSettings.vue`
- 当前 tab：基础信息、品牌资源、SEO、运行配置、页面封面、AI 助手

## OpenAPI SDK

- 后端文档地址：`http://localhost:10404/api/v3/api-docs`
- 生成命令：`npm run gen:sdk`
- 输出目录：`src/sdk/generated`

当前业务开发仍优先改 `src/api/*.ts` 与 `src/types/index.ts`，SDK 作为契约对齐与渐进迁移支撑。

## 文档

- 文档索引：[`doc/文档索引.md`](./doc/文档索引.md)
- 架构主文档：[`doc/architecture.md`](./doc/architecture.md)
- 阶段快照：[`doc/前端功能审查与优化清单.md`](./doc/前端功能审查与优化清单.md)
- 表情模块：[`src/emoji/README.md`](./src/emoji/README.md)
- SDK 说明：[`src/sdk/README.md`](./src/sdk/README.md)
