# Chen404 博客系统 - 前端

基于 Vue 3.5 + Vite 8 + TypeScript 5 的博客前端。当前版本已经接入真实后端链路：首页文章流、文章详情与编辑、分类/标签详情、归档、留言板/评论、个人中心、基础后台管理、上传与文件管理、表情包、受信申请、旅行纪念地图、Live2D + Lyra AI 聊天、AI 后台配置。

## 技术栈

| 类别 | 技术 |
| ---- | ---- |
| 框架 | Vue 3.5、Vite 8、TypeScript 5 |
| 路由与状态 | Vue Router 4、Pinia 3 |
| UI 与样式 | Element Plus、Sass、UnoCSS |
| HTTP | Axios |
| Markdown 编辑 | md-editor-v3、自定义工具栏 |
| 地图与地理 | d3-geo、china-map-geojson、@svg-maps/china |
| 动效与视觉 | sakura-js、Swiper、Iconify、自定义 Live2D 面板 |
| SDK | openapi-typescript-codegen |

## 环境要求

- Node.js 18+
- npm
- 后端服务默认运行在 `http://localhost:10404/api`

## 快速开始

安装依赖：

```bash
npm install
```

本地开发：

```bash
npm run dev
```

当前 Vite 固定端口：

```text
http://localhost:5173
```

构建预览：

```bash
npm run build
npm run preview
```

`npm run build` 会先执行 `vue-tsc -b`，再执行 Vite 构建。

## 环境变量

```bash
# .env.development
VITE_API_BASE_URL=http://localhost:10404/api

# .env.production
VITE_API_BASE_URL=https://api.example.com/api
```

说明：

- 生产构建必须配置 `VITE_API_BASE_URL`。
- `vite.config.ts` 当前没有配置 `server.proxy`，前端直连后端 API。
- `vite.config.ts` 中 `server.port = 5173` 且 `strictPort = true`。
- 认证基于 JWT，前端会在 `localStorage` 中维护 `token`、`refreshToken`、`user`。

## 常用脚本

| 命令 | 说明 |
| ---- | ---- |
| `npm run dev` | 启动 Vite 开发服务 |
| `npm run build` | 类型检查并构建生产包 |
| `npm run preview` | 预览构建产物 |
| `npm run gen:sdk` | 从 OpenAPI 生成 `src/sdk/generated` |
| `npm run maps:build` | 构建中国城市地图数据 |

## 当前页面与路由

| 路径 | 页面 | 权限 | 说明 |
| ---- | ---- | ---- | ---- |
| `/` | 首页 | 公开 | Hero、樱花动画、文章流 |
| `/home` | 首页重定向 | 公开 | 重定向到 `/` |
| `/article/:id` | 文章详情 | 按文章可见性 | 文章正文、上下篇、评论、Lyra 当前文章上下文 |
| `/article/edit/:id?` | 编写/编辑文章 | 管理员 | Markdown 编辑、封面上传、AI 摘要/标签 |
| `/archive` | 归档 | 公开 | 真实归档接口数据 |
| `/memory-map` | 旅行纪念地图 | 管理员/知友 | 旅行地点地图与列表 |
| `/memory-map/detail/:id` | 旅行地点详情 | 管理员/知友 | 地点详情与游记条目 |
| `/memory-map/create` | 新增旅行地点 | 管理员 | 后台创建入口 |
| `/memory-map/edit/:id` | 编辑旅行地点 | 管理员 | 后台编辑入口 |
| `/category` | 分类页 | 公开 | 分类总览 |
| `/category/:id` | 分类详情 | 公开 | 分类下文章列表 |
| `/tag` | 标签页 | 公开 | 标签总览 |
| `/tag/:id` | 标签详情 | 公开 | 标签下文章列表 |
| `/guestbook` | 留言板 | 公开 | 复用评论链路的公开留言页 |
| `/about` | 关于页 | 公开 | 站点介绍 |
| `/user/:id` | 用户主页 | 公开 | 公开成员资料 |
| `/trust-request` | 受信申请 | 公开 | 申请知友访问权限 |
| `/login` | 登录 | 游客 | 登录后重定向 |
| `/register` | 注册 | 游客 | 邮箱验证码注册 |
| `/profile` | 个人中心 | 登录 | 资料、我的内容、受信状态 |
| `/admin` | 后台管理 | 管理员 | 分类、站点配置、AI 助手、表情包、文件、受信申请 |
| `/:pathMatch(.*)*` | 404 | 公开 | 未匹配路由 |

## 后台管理能力

`/admin` 当前由 `AdminLayout.vue` 承载，主要模块：

- 分类管理：分页查看分类。
- 站点配置：基础信息、品牌资源、SEO、运行配置、页面封面、AI 助手。
- AI 助手：模型调用、Lyra 人设、聊天与检索、小气泡。
- 表情包管理：表情包、表情项、ZIP 导入。
- 文件管理：文件列表、引用关系、详情、重建引用。
- 受信申请：申请列表、审核通过/驳回。

后台布局已针对中等分辨率做自适应：后台页使用宽内容容器，AI 配置页的卡片和表单在较窄窗口下自动收缩。

## 与后端对接状态

### 已接入真实后端的模块

- 认证：登录、注册、刷新令牌、获取当前用户、修改资料、修改密码、登出。
- 文章：列表、详情、我的文章、创建、更新、删除、热门、推荐、点赞、收藏、归档、上下篇。
- 文章 AI：摘要与标签生成。
- 分类：列表、详情、创建、更新、删除、后台分页。
- 标签：列表、详情、标签文章流。
- 评论/留言板：评论列表、留言板列表、最新评论、发表评论、删除、点赞、审核。
- 上传：文章图片、封面、站点资源、头像、受信附件、旅行图片、文件删除。
- 首页：聚合数据、Banner、站点配置、站点统计。
- 站点配置：公开配置读取、管理员更新。
- 表情包：公开下发、后台维护、ZIP 导入。
- 文件管理：后台列表、详情、引用关系重建。
- 受信申请：提交、最新申请、后台审批。
- 旅行纪念地图：公开受限查询、后台 CRUD。
- Live2D / Lyra：同步聊天、SSE 流式聊天、会话恢复、引用、相关推荐、快捷建议。
- AI 后台配置：读取、保存、测试连接、API Key 脱敏。

### 当前边界

- `webSearchEnabled` 只是预留开关，尚未接入真实联网搜索。
- 旅行纪念地图访问面向管理员和知友，不是完全公开页面。
- OpenAPI SDK 已生成在 `src/sdk/generated`，但业务代码仍主要使用手写 `src/api/*.ts` 封装。
- 留言板与评论区共用后端评论体系，但前端展示场景不同。

## 关键目录结构

```text
Chen404Fro/
├─ src/
│  ├─ api/                       # 手写 API 封装
│  ├─ assets/                    # 静态资源、样式、地图贴纸
│  ├─ components/                # 公共组件
│  │  ├─ Live2D/                 # Lyra 入口与聊天面板
│  │  ├─ TravelMemoryMap/        # 旅行地图渲染
│  │  └─ ...
│  ├─ composables/               # useSiteConfig、useLayoutMobile、文章编辑逻辑
│  ├─ emoji/                     # 表情解析、渲染与场景策略
│  ├─ modules/                   # article-edit、feature-access 等业务模块
│  ├─ router/
│  ├─ sdk/generated/             # OpenAPI 生成代码
│  ├─ stores/
│  ├─ types/
│  ├─ utils/
│  └─ views/
│     ├─ Admin/
│     ├─ Article/
│     ├─ MemoryMap/
│     └─ ...
├─ doc/architecture.md
└─ package.json
```

## OpenAPI SDK

- 后端 OpenAPI：`http://localhost:10404/api/v3/api-docs`
- 生成脚本：`npm run gen:sdk`
- 默认输出：`src/sdk/generated`
- 可通过 `OPENAPI_INPUT` 指定文档地址。

示例：

```bash
OPENAPI_INPUT=http://localhost:10404/api/v3/api-docs npm run gen:sdk
```

## 主要特性

- 动漫风首页 Hero、樱花动效与 Live2D 看板娘。
- 亮色 / 暗色主题切换。
- JWT + refresh token 静默续期。
- 个人中心、公开用户主页、受信申请。
- 文章编辑器、封面上传、AI 摘要/标签。
- Live2D Lyra 聊天面板，支持同步与流式回复。
- 聊天面板完整回答与人物小气泡短句分层。
- 管理员后台配置站点、AI、文件、表情包、受信申请。
- 旅行纪念地图与地点游记。
- `modules/article-edit` 承接文章编辑页接口与提交模型。
- `emoji` 模块承接表情解析、渲染与场景策略。

## 文档

- [前端架构设计](doc/architecture.md)
- [表情模块说明](src/emoji/README.md)
- [SDK 说明](src/sdk/README.md)
