# Chen404 前端架构设计

本文档描述 `Chen404Fro` 当前代码实现的前端结构，而不是历史规划稿。最近一次按代码校准时间：2026-06-03。

## 1. 架构概览

前端当前采用“页面容器 + 复用组件 + 局部组合逻辑 + 手写 API 封装 + 少量全局状态”的结构：

```text
Views
  -> Layouts
  -> Components
  -> Composables / Modules
  -> Stores + Utils
  -> src/api/*
  -> Spring Boot Backend (/api)
```

分层职责：

- `views`：路由级页面，负责页面状态和业务编排
- `layouts`：页面骨架，当前以 `DefaultLayout` 为主
- `components`：视觉与交互复用组件
- `composables`：跨页面的复用逻辑
- `modules`：业务模块级封装，例如 `article-edit`、`feature-access`
- `api`：手写接口封装，处理真实业务调用
- `sdk/generated`：OpenAPI 生成代码，作为契约补充与渐进迁移基础
- `stores`：Pinia 状态，承载登录态、播放器等跨页面状态

## 2. 目录结构

```text
src/
├─ api/
├─ assets/
│  ├─ live2d/
│  ├─ memory-map/
│  └─ styles/
├─ components/
│  ├─ Comment/
│  ├─ Editor/
│  ├─ Emoji/
│  ├─ Footer/
│  ├─ Header/
│  ├─ HeroImageFocusEditor/
│  ├─ HeroWave/
│  ├─ Live2D/
│  ├─ PageHero/
│  ├─ SakuraOverlay/
│  ├─ TravelMemoryManager/
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

## 3. 路由与访问控制

路由集中在 [`../src/router/index.ts`](../src/router/index.ts)，采用页面级懒加载。

### 路由元信息

- `requiresAuth`：要求登录
- `requiresAdmin`：要求管理员
- `requiresFriend`：要求管理员或知友
- `guest`：仅游客场景，例如登录/注册

### 当前主要路由

```text
/                         首页
/article/:id              文章详情
/article/edit/:id?        文章编辑（管理员）
/archive                  归档
/category                 分类总览
/category/:id             分类详情
/tag                      标签总览
/tag/:id                  标签详情
/guestbook                留言板
/about                    关于
/user/:id                 公开用户主页
/login                    登录
/register                 注册
/profile                  个人中心
/trust-request            好友申请（公开入口，提交时要求登录）
/admin                    后台管理（管理员）
/memory-map               旅行纪念地图（公开入口，内容按权限展示）
/memory-map/detail/:id    旅行详情页（管理员/知友）
/memory-map/create        旅行地点创建（管理员）
/memory-map/edit/:id      旅行地点编辑（管理员）
/music                    Sakura Radio 音乐馆
/music/tracks/new         歌曲创建工作台（管理员）
/music/tracks/:id/edit    歌曲编辑工作台（管理员）
```

### 路由守卫行为

- 进入页面前会先加载站点配置，并同步文档标题/SEO
- 需要登录的页面会触发 `userStore.syncAuthState()`
- 401 之后由请求层尝试刷新 token；刷新失败后跳转登录页
- 动态 import 失败时会触发“仅一次自动刷新”兜底，避免弱网白屏后直接卡死
- 不是所有受限能力都依赖路由守卫，例如 `/memory-map` 主页允许公开进入，但页面内容会按登录态和知友权限决定是否展示

## 4. API 层与契约策略

### 手写 API 封装

业务接口以 `src/api/*.ts` 为主：

| 文件 | 职责 |
| --- | --- |
| `request.ts` | Axios 实例、统一响应解包、token 注入、401 刷新、超时提示 |
| `auth.ts` | 登录、注册、验证码、资料、密码、登出 |
| `article.ts` | 文章、分类、标签、归档 |
| `comment.ts` | 评论、留言板、审核、点赞 |
| `home.ts` | 首页数据、站点配置、Banner、站点统计 |
| `upload.ts` | 图片、音频、封面、附件上传与文件删除 |
| `trust-request.ts` | 好友申请及后台审批 |
| `travel-memory.ts` | 旅行纪念地图查询与管理 |
| `music.ts` | Sakura Radio 公开播放、歌曲与歌单管理 |
| `ai.ts` | 文章 AI、Lyra 同步/流式聊天、会话恢复 |
| `ai-admin.ts` | AI 后台配置与连接测试 |
| `emoji.ts` | 表情包公开接口与后台维护 |
| `admin-file.ts` | 后台文件列表、详情、统计 |

### SDK 边界

- 生成目录：`src/sdk/generated`
- 来源：后端 OpenAPI 文档
- 当前策略：生成 SDK 主要用于契约核对和部分读接口；高频业务接口仍优先经由手写 API 层，以便统一处理鉴权、超时和错误提示

### 请求层职责

`src/api/request.ts` 当前负责：

- 读取 `VITE_API_BASE_URL`
- 自动写入 `Authorization: Bearer <token>`
- 统一解析后端 `{ code, message, data }`
- 401 时串行刷新 `refreshToken`
- AI 请求的更长超时与专用超时文案

## 5. 状态与组合逻辑

### 主要 store

- [`../src/stores/user.ts`](../src/stores/user.ts)：用户、token、登录态同步、本地持久化
- [`../src/stores/music-player.ts`](../src/stores/music-player.ts)：共享播放器队列、音量、播放模式、时间进度
- [`../src/stores/app.ts`](../src/stores/app.ts)：轻量应用状态
- [`../src/stores/article.ts`](../src/stores/article.ts)：文章相关保留状态

### 主要 composable / module

- `useSiteConfig`：加载、缓存和回退站点配置
- `useLayoutMobile`：布局侧的设备判断
- `composables/article-edit/useArticleEdit.ts`：文章编辑页的页面编排
- `modules/article-edit/*`：文章编辑提交模型、标签逻辑、常量
- `modules/feature-access/constants.ts`：知友/权限封面文案与 Hero 资源映射

整体上，前端没有把所有业务数据推入 Pinia，而是保持“页面请求 + 局部状态”为主，仅把真正跨页面共享的状态收敛到 store。

## 6. 视觉骨架与站点配置

### 布局骨架

- `DefaultLayout.vue`：主站统一布局
- `Header` / `Footer`：公共导航与页脚
- `PageHero.vue`：功能页统一封面
- `HeroWave.vue`：Hero 到正文的波浪过渡
- `SakuraOverlay.vue`：樱花动效
- `Live2D.vue`：看板娘入口

### 站点配置

后台站点配置页为 [`../src/views/Admin/AdminSiteSettings.vue`](../src/views/Admin/AdminSiteSettings.vue)，当前维护的配置分区：

- 基础信息
- 品牌资源
- SEO
- 运行配置
- 页面封面
- AI 助手

当前已接入的页面封面 key：

```text
trust-request / home / archive / memory-map / music / category / about / guestbook
```

## 7. 关键业务模块

### 7.1 文章编辑

相关文件：

- `views/Article/ArticleEdit.vue`
- `views/Article/article-edit/ArticleEdit.styles.scss`
- `composables/article-edit/useArticleEdit.ts`
- `modules/article-edit/*`
- `components/Editor/*`
- `components/MdResizablePreview/*`

当前能力：

- 创建/编辑文章
- 草稿与发布
- 分类/标签选择
- 封面上传
- Markdown 编辑与预览调整
- AI 摘要与标签生成

### 7.2 旅行纪念地图

相关文件：

- `views/MemoryMap/MemoryMap.vue`
- `views/MemoryMap/TravelMemoryDetail.vue`
- `views/MemoryMap/TravelMemoryCreate.vue`
- `components/TravelMemoryMap/TravelMemoryMap.vue`
- `components/TravelMemoryManager/TravelMemoryManager.vue`
- `api/travel-memory.ts`

当前实现要点：

- 主页面是“地图册页 + 地点详情 + 旅行胶片”组合页
- 独立详情页保留大图、缩略图、照片切换与分段描述
- 创建/编辑页支持地图点选、自动定位、地点搜索、图片上传、EXIF 辅助坐标回填
- 地图组件优先加载本地城市/省份 GeoJSON；失败时回退基础 SVG 地图
- 编辑态可接入高德地图能力，支持底图、定位与逆地理编码

### 7.3 Sakura Radio 音乐馆

相关文件：

- `views/Music/Music.vue`
- `views/Music/MusicTrackEdit.vue`
- `components/Live2D/Live2DMusicPanel.vue`
- `stores/music-player.ts`
- `api/music.ts`

当前实现要点：

- `/music` 负责公开播放、歌单浏览、歌词、高亮进度和管理员入口
- 歌曲新建/编辑为独立工作台，不再嵌入传统后台 tab
- 共享播放器通过 `music-player` store 统一驱动音乐馆页与 Live2D 随身播放器
- 支持纯文本歌词与 LRC 时间轴歌词
- 管理员可调用 AI 匹配接口补全歌手、专辑、年份、语言、风格、标签、推荐语和心情短句

### 7.4 Lyra 聊天

相关文件：

- `components/Live2D/Live2DChatPanel.vue`
- `api/ai.ts`
- `views/Admin/components/AiAssistantSettings.vue`

当前实现要点：

- 同步聊天：`POST /ai/chat`
- 流式聊天：`POST /ai/chat/stream`
- 会话恢复：`GET /ai/chat/sessions/{sessionId}`
- 面板长回答与人物小气泡短句分层展示
- 后台可配置模型、Lyra 人设、检索策略、小气泡长度与长回复提示语

### 7.5 后台管理

后台入口为 [`../src/views/Admin/AdminLayout.vue`](../src/views/Admin/AdminLayout.vue)。

当前一级菜单：

- 分类管理
- 站点配置
- 表情包管理
- 文件管理
- 好友申请

音乐馆管理和旅行纪念地图管理没有塞进传统 `/admin` 菜单，而是放在各自业务页面中提供管理员入口与工作台。

## 8. 典型业务流

### 登录与续期

1. 登录页调用 `auth.ts`
2. token / refreshToken 持久化到 `localStorage`
3. 页面请求统一经 `request.ts`
4. 401 时刷新 token，刷新失败则清空本地状态并跳转登录页

### 旅行地点创建

1. 管理员在 `TravelMemoryCreate.vue` 选择坐标或搜索地点
2. 上传图片后拿到后端返回的 URL、拍摄时间和可能的 EXIF 坐标
3. 页面整理成 `CreateTravelMemoryCommand`
4. 调用 `/admin/travel-memories`

### 歌曲维护

1. 管理员上传音频/封面
2. 工作台保存歌曲元数据与歌词
3. 可选调用 `/admin/music/tracks/ai/suggest` 获取候选元数据
4. 保存后返回音乐馆继续维护歌单

### AI 配置保存

1. 后台页读取 `/admin/ai/config`
2. 前端按分 tab 编辑模型、人设、聊天和小气泡参数
3. 保存时提交统一 `AiAdminConfig`
4. 可用 `/test-connection` 验证配置

## 9. 构建与发布边界

`vite.config.ts` 当前关键配置：

- `host = 0.0.0.0`
- `port = 5173`
- `strictPort = true`
- `@` 指向 `src`
- Element Plus 自动样式引入
- UnoCSS
- `manualChunks` 对布局壳、Vue 运行时和 `ArticleCard` 做了针对性拆分

这样做的目的，是降低首页在弱网下动态 chunk 拉取过多导致白屏的概率。

## 10. 当前已知边界

- `webSearchEnabled` 目前仅是配置项，还没有真实联网工具接入
- SDK 与手写 API 并存，后续仍需继续收敛
- 音乐馆缺播放统计、用户互动、Media Session、断点恢复
- 文件管理缺批量治理操作闭环
- 旅行纪念地图仍需持续关注移动端性能和地图数据体积

## 11. 文档维护规则

- 路由、权限、后台入口变化时，优先更新本文档和 `README.md`
- 业务实现以代码为准，审查类文档不作为主依据
- 若某功能同时出现“方案文档 + 推进文档 + 现状文档”，应优先合并为一篇维护文档
