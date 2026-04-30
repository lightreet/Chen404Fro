# Chen404 前端架构设计

## 1. 架构概览

```text
Views (Home / Article / Category / Tag / Guestbook / Profile / Admin ...)
  -> Layout (DefaultLayout)
  -> Components (Header / Footer / ArticleCard / Comment / Live2D / SakuraOverlay)
  -> Composables (useSiteConfig / useLayoutMobile / article-edit/*)
  -> Stores + Utils (Pinia / request / format / validation)
  -> API Layer (auth / article / home / upload / comment)
  -> Spring Boot Backend (/api)
```

当前前端已经不再是“只有页面驱动、没有额外分层”的状态。除页面与组件外，`src/composables` 已经承担了站点配置、移动端布局、文章编辑等关键复用逻辑。

## 2. 技术栈

| 分类 | 技术 | 说明 |
| ---- | ---- | ---- |
| 框架 | Vue 3.5 | 页面与组件开发 |
| 构建 | Vite 8 | 开发与打包 |
| 语言 | TypeScript 5 | 类型定义 |
| 路由 | Vue Router 4 | SPA 路由与守卫 |
| 状态 | Pinia 3 | 用户状态为主 |
| UI | Element Plus | 表单、弹窗、分页等 |
| 样式 | Sass + UnoCSS | 主题变量与组件样式 |
| 网络 | Axios | 请求与响应拦截 |
| 编辑器 | md-editor-v3 | 文章编写 |

## 3. 当前目录结构

```text
src/
├─ api/
├─ assets/
│  └─ styles/
├─ components/
│  ├─ ArticleCard/
│  ├─ Comment/
│  ├─ Footer/
│  ├─ Header/
│  ├─ Live2D/
│  └─ SakuraOverlay/
├─ composables/
│  ├─ useLayoutMobile.ts
│  ├─ useSiteConfig.ts
│  └─ article-edit/
├─ layouts/
├─ router/
├─ stores/
├─ types/
├─ utils/
└─ views/
```

## 4. 页面与数据现状

### 已有页面

- 首页：`Home.vue`
- 文章：`ArticleDetail.vue`、`ArticleEdit.vue`
- 分类：`Category.vue`、`CategoryDetail.vue`
- 标签：`Tag.vue`、`TagDetail.vue`
- 归档：`Archive.vue`
- 留言板：`Guestbook.vue`
- 认证：`Login.vue`、`Register.vue`
- 个人中心：`Profile.vue`
- 后台：`AdminLayout.vue` 及相关管理页

### 数据对接状态

| 模块 | 当前状态 |
| ---- | ---- |
| 认证 | 已接后端 |
| 文章 | 已接后端 |
| 分类 | 已接后端 |
| 标签 | 已接后端 |
| 归档 | 已接后端 |
| 留言板 | 已接后端评论链路 |
| 上传 | 已接后端 |
| 首页聚合 | 已接后端 |

这里需要明确区分两件事：
- “前端已有 API 封装”
- “这条后端链路已真实落地”

当前文档以第二种口径为准。

## 5. 路由设计

当前路由集中在 [`src/router/index.ts`](../src/router/index.ts) 中，主要特点：

- 页面级懒加载
- `requiresAuth` 控制登录访问
- `requiresAdmin` 做前端角色守卫
- `/home` 重定向到 `/`

主要业务路由：

```text
/                      首页
/article/:id           文章详情
/article/edit/:id?     文章编辑
/archive               归档
/category              分类
/category/:id          分类详情
/tag                   标签
/tag/:id               标签详情
/guestbook             留言板
/about                 关于
/login                 登录
/register              注册
/profile               个人中心
/admin                 后台管理
```

## 6. 状态管理

当前主要使用 [`src/stores/user.ts`](../src/stores/user.ts) 管理登录态：

- `user`：当前用户信息
- `token`：访问令牌
- `refreshToken`：刷新令牌
- `isLoggedIn`：基于 `token + user` 的计算属性
- `login / logout / initUser / updateUserInfo`：登录态与本地持久化逻辑

绝大多数业务数据仍采用“页面内请求 + 局部状态”模式，并未全部集中到 Pinia。

## 7. 请求层设计

[`src/api/request.ts`](../src/api/request.ts) 是统一请求入口，负责：

- 基于 `VITE_API_BASE_URL` 设置 `baseURL`
- 自动附加 `Authorization: Bearer <token>`
- 解析后端统一响应 `{ code, message, data }`
- `401` 时尝试使用 `refreshToken` 静默续期
- 刷新失败后跳转登录页

当前 API 封装已经按真实后端能力收敛，避免继续保留未落地接口声明。

## 8. 视觉层与页面氛围

### 主题系统

- 主色定义在 [`src/assets/styles/variables.scss`](../src/assets/styles/variables.scss)
- 支持亮色 / 暗色主题
- 首页 Hero、个人中心、按钮和标签等共用同一套主题变量

### 动效组件

- `Live2D.vue`：左侧看板娘
- `SakuraOverlay.vue`：首页樱花动画

## 9. 文档维护建议

前端文档维护时，建议优先同步以下内容：

- 路由变动后，同步更新 README 与本架构文档
- 页面从模拟数据切到真实接口后，及时移除“模拟态”说明
- 新增 composables、核心公共组件或共享业务层时，补充到目录结构与架构分层说明中
