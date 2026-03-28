# Chen404 博客系统 - 前端

基于 Vue 3 + Vite + TypeScript 的个人博客前端。当前版本以首页文章流、文章详情/编辑、个人中心、基础后台管理以及动漫风视觉效果为主，整体采用樱花粉主题、Live2D 与自定义樱花动画。

## 技术栈

| 类别 | 技术 |
| ------ | ------ |
| 框架 | Vue 3、Vite 8、TypeScript 5 |
| 路由与状态 | Vue Router 4、Pinia |
| UI 与样式 | Element Plus、Sass、UnoCSS |
| HTTP | Axios |
| Markdown 编辑 | md-editor-v3 |
| 其他 | dayjs、@element-plus/icons-vue |

## 环境要求

- Node.js 18+
- npm

## 快速开始

### 安装依赖

```bash
npm install
```

### 本地开发

```bash
npm run dev
```

默认访问：

- `http://localhost:5173`

### 构建预览

```bash
npm run build
npm run preview
```

`npm run build` 会先执行 `vue-tsc -b`，再执行 Vite 构建。

## 环境变量

```bash
# .env.development
VITE_API_BASE_URL=http://localhost:10404/api

# .env.production（可从模板生成）
cp .env.production.example .env.production
# 编辑 VITE_API_BASE_URL，例如：
# VITE_API_BASE_URL=https://api.chen404.com/api
```

说明：

- 生产构建**必须**配置 `VITE_API_BASE_URL`（API 与主站不同域名时）；模板见根目录 `.env.production.example`
- 当前仓库已提交的 `.env.development` / `.env.example` 默认直连 `http://localhost:10404/api`
- 当前 `vite.config.ts` 未配置 `server.proxy`
- 如果你希望开发环境走同源 `/api`，需要自行补充代理配置
- 认证基于 JWT，前端会在 `localStorage` 中维护 `token`、`refreshToken`、`user`

## 当前页面与路由

| 路径 | 页面 | 说明 |
| ------ | ------ | ------ |
| `/` | 首页 | Hero、樱花动画、文章流 |
| `/home` | 首页重定向 | 重定向到 `/` |
| `/article/:id` | 文章详情 | 文章正文与上下篇 |
| `/article/edit/:id?` | 编写文章 | 登录后可访问 |
| `/archive` | 归档 | 当前包含部分静态/模拟数据逻辑 |
| `/category` | 分类页 | 分类总览 |
| `/category/:id` | 分类详情 | 分类下文章列表 |
| `/tag` | 标签页 | 当前包含模拟数据逻辑 |
| `/guestbook` | 留言板 | 当前页面为前端展示版本 |
| `/about` | 关于页 | 站点介绍 |
| `/login` | 登录 | 支持游客访问 |
| `/register` | 注册 | 支持游客访问 |
| `/profile` | 个人中心 | 登录后可访问 |
| `/admin` | 后台管理 | 管理员可访问 |
| `/:pathMatch(.*)*` | 404 | 未匹配路由 |

## 当前目录结构

```text
Chen404Fro/
├── public/
│   └── live2d/                 # Live2D 模型资源
├── src/
│   ├── api/                    # 前端 API 封装
│   │   ├── auth.ts
│   │   ├── article.ts
│   │   ├── index.ts
│   │   ├── home.ts
│   │   ├── upload.ts
│   │   ├── comment.ts
│   │   └── request.ts
│   ├── assets/
│   │   └── styles/             # 主题变量与全局样式
│   ├── components/
│   │   ├── ArticleCard/
│   │   ├── Footer/
│   │   ├── Header/
│   │   ├── Live2D/
│   │   └── SakuraOverlay/
│   ├── layouts/
│   │   └── DefaultLayout.vue
│   ├── router/
│   │   └── index.ts
│   ├── stores/
│   │   └── user.ts
│   ├── types/
│   │   └── index.ts
│   ├── utils/
│   │   ├── format.ts
│   │   ├── mock.ts
│   │   └── validation.ts
│   └── views/
│       ├── Home/
│       ├── Article/
│       ├── Archive/
│       ├── Category/
│       ├── Tag/
│       ├── Guestbook/
│       ├── About/
│       ├── Auth/
│       ├── Profile/
│       ├── Admin/
│       └── NotFound/
├── doc/
│   └── architecture.md
└── package.json
```

## 与后端对接状态

### 已基本对接的模块

- 认证：登录、注册、刷新令牌、用户信息、修改资料、修改密码
- 文章：列表、详情、我的文章、创建、更新、删除、热门、推荐、点赞
- 分类：列表、详情、创建、更新、删除
- 标签：列表
- 上传：图片、封面、头像、文件删除
- 首页：聚合数据、Banner、站点配置

### 需要注意的当前状态

- `comment.ts`、部分 `home.ts` 中存在接口封装，部分链路仍在持续迭代
- `Guestbook`、`Tag`、`Archive` 等页面仍混合使用静态展示或模拟数据逻辑
- 文档中所有说明均以当前代码为准，不代表所有设计目标都已落地

## 主要特性

- 动漫风首页 Hero、樱花动画与 Live2D 看板娘
- 亮色 / 暗色主题切换
- JWT + refresh token 静默续期
- 个人中心与文章管理
- 管理员后台入口
- 文章编辑器与封面上传

## 文档

- [架构设计](doc/architecture.md)
