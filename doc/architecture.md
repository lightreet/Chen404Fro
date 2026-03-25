# Chen404 前端架构设计

## 1. 架构概览

```text
Views (Home / Article / Category / Profile / Admin ...)
  ↓
Layout (DefaultLayout)
  ↓
Components (Header / Footer / ArticleCard / Live2D / SakuraOverlay)
  ↓
Stores + Utils (Pinia / request / format / validation / mock)
  ↓
API Layer (auth / article / home / upload / comment / friend)
  ↓
Spring Boot Backend (/api)
```

当前前端以页面驱动为主，没有额外的 composables 分层；业务逻辑主要分布在页面组件、Pinia store 与 `src/api` 模块中。

## 2. 技术栈

| 分类 | 技术 | 说明 |
| ------ | ------ | ------ |
| 框架 | Vue 3.5 | 页面与组件开发 |
| 构建 | Vite 8 | 开发与打包 |
| 语言 | TypeScript 5 | 类型定义 |
| 路由 | Vue Router 4 | SPA 路由与守卫 |
| 状态 | Pinia 3 | 用户状态为主 |
| UI | Element Plus | 表单、弹窗、分页等 |
| 样式 | Sass + UnoCSS | 主题变量、组件样式 |
| 网络 | Axios | 请求与响应拦截 |
| 编辑器 | md-editor-v3 | 文章编写 |

## 3. 当前目录结构

```text
src/
├── api/
│   ├── auth.ts
│   ├── article.ts
│   ├── home.ts
│   ├── upload.ts
│   ├── comment.ts
│   ├── friend.ts
│   └── request.ts
├── assets/
│   └── styles/
│       └── variables.scss
├── components/
│   ├── ArticleCard/
│   ├── Footer/
│   ├── Header/
│   ├── Live2D/
│   └── SakuraOverlay/
├── layouts/
│   └── DefaultLayout.vue
├── router/
│   └── index.ts
├── stores/
│   └── user.ts
├── types/
│   └── index.ts
├── utils/
│   ├── format.ts
│   ├── mock.ts
│   └── validation.ts
└── views/
    ├── Home/
    ├── Article/
    ├── Archive/
    ├── Category/
    ├── Tag/
    ├── Guestbook/
    ├── Friends/
    ├── About/
    ├── Auth/
    ├── Profile/
    ├── Admin/
    └── NotFound/
```

## 4. 页面与数据现状

### 已有页面

- 首页：`Home.vue`
- 文章：`ArticleDetail.vue`、`ArticleEdit.vue`
- 分类：`Category.vue`、`CategoryDetail.vue`
- 标签：`Tag.vue`
- 归档：`Archive.vue`
- 留言板：`Guestbook.vue`
- 友人帐：`Friends.vue`
- 认证：`Login.vue`、`Register.vue`
- 个人中心：`Profile.vue`
- 后台：`AdminLayout.vue`、`AdminCategories.vue`

### 数据对接状态

| 模块 | 当前状态 |
| ------ | ------ |
| 认证 | 已接后端 |
| 文章 | 已接后端 |
| 分类 | 已接后端 |
| 标签 | 部分使用模拟数据 |
| 归档 | 包含模拟数据逻辑 |
| 留言板 | 当前为前端展示版本 |
| 友人帐 | 当前为前端展示版本 |
| 上传 | 已接后端 |
| 首页聚合 | 已接后端 |

这意味着前端架构文档需要同时区分“API 封装已存在”和“后端链路已完整落地”这两个层面。

## 5. 路由设计

当前路由集中在 [`src/router/index.ts`](../src/router/index.ts) 中，主要特点：

- 页面级懒加载
- `requiresAuth` 控制登录访问
- `requiresAdmin` 通过本地用户角色做前端守卫
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
/guestbook             留言板
/friends               友人帐
/about                 关于
/login                 登录
/register              注册
/profile               个人中心
/admin                 后台管理
```

## 6. 状态管理

当前主要使用 [`src/stores/user.ts`](../src/stores/user.ts) 管理用户登录态：

- `user`：当前用户信息
- `token`：访问令牌
- `isLoggedIn`：基于 `token + user` 的计算属性
- `login / logout / initUser / updateUserInfo`：登录态与本地持久化逻辑

前端目前没有把所有业务数据都放到 Pinia 中，大部分页面仍采用“页面内请求 + 局部状态”的实现。

## 7. 请求层设计

[`src/api/request.ts`](../src/api/request.ts) 是统一请求入口，负责：

- 基于 `VITE_API_BASE_URL` 设置 `baseURL`
- 自动附加 `Authorization: Bearer <token>`
- 解析后端统一响应 `{ code, message, data }`
- 401 时尝试使用 `refreshToken` 静默续期
- 刷新失败后跳转登录页

这部分是前后端联动的关键基础设施，文档应优先保持准确。

## 8. 视觉层与页面氛围

### 主题系统

- 主色定义在 [`src/assets/styles/variables.scss`](../src/assets/styles/variables.scss)
- 支持亮色 / 暗色主题
- 首页 Hero、个人中心、按钮和标签等都基于同一套主题变量

### 动效组件

- `Live2D.vue`：左侧看板娘
- `SakuraOverlay.vue`：首页樱花动画

当前 `SakuraOverlay.vue` 已加入：

- 前景 / 中景 / 远景层级
- 动漫风花瓣轮廓
- 自定义透明度、模糊与速度分层
- 弱风感、轻漂浮的动画节奏

## 9. 文档维护建议

前端文档后续维护时，建议按以下原则更新：

- 路由变动后同步更新 README 与本架构文档
- 如果页面改为真实接口，及时移除“模拟数据 / 展示页”标记
- 新增核心组件（如新的全局视觉组件、公共业务组件）时补到目录与架构说明中
