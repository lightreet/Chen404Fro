# Chen404 博客系统 - 前端

基于 Vue 3 + Vite + TypeScript 的博客前端。当前版本已经接入真实后端链路的重点模块包括：首页文章流、文章详情与编辑、分类/标签详情、归档、留言板/评论、个人中心、基础后台管理与上传体系。

## 技术栈

| 类别 | 技术 |
| ---- | ---- |
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

默认访问地址：
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

# .env.production
cp .env.production.example .env.production
# 然后编辑 VITE_API_BASE_URL，例如：
# VITE_API_BASE_URL=https://api.chen404.com/api
```

说明：
- 生产构建必须配置 `VITE_API_BASE_URL`
- 当前仓库默认开发环境直连 `http://localhost:10404/api`
- `vite.config.ts` 当前没有配置 `server.proxy`
- 认证基于 JWT，前端会在 `localStorage` 中维护 `token`、`refreshToken`、`user`

## 当前页面与路由

| 路径 | 页面 | 说明 |
| ---- | ---- | ---- |
| `/` | 首页 | Hero、樱花动画、文章流 |
| `/home` | 首页重定向 | 重定向到 `/` |
| `/article/:id` | 文章详情 | 文章正文、上下篇、评论 |
| `/article/edit/:id?` | 编写文章 | 登录后可访问 |
| `/archive` | 归档 | 真实归档接口数据 |
| `/category` | 分类页 | 分类总览 |
| `/category/:id` | 分类详情 | 分类下文章列表 |
| `/tag` | 标签页 | 标签总览 |
| `/tag/:id` | 标签详情 | 标签下文章列表 |
| `/guestbook` | 留言板 | 复用评论链路的公开留言页 |
| `/about` | 关于页 | 站点介绍 |
| `/login` | 登录 | 游客可访问 |
| `/register` | 注册 | 游客可访问 |
| `/profile` | 个人中心 | 登录后可访问 |
| `/admin` | 后台管理 | 管理员可访问 |
| `/:pathMatch(.*)*` | 404 | 未匹配路由 |

## 当前目录结构

```text
Chen404Fro/
├─ public/
│  └─ live2d/
├─ src/
│  ├─ api/
│  ├─ assets/
│  ├─ components/
│  ├─ composables/
│  ├─ layouts/
│  ├─ router/
│  ├─ stores/
│  ├─ types/
│  ├─ utils/
│  └─ views/
├─ doc/
│  └─ architecture.md
└─ package.json
```

## 与后端对接状态

### 已接入真实后端的模块

- 认证：登录、注册、刷新令牌、获取当前用户、修改资料、修改密码
- 文章：列表、详情、我的文章、创建、更新、删除、热门、推荐、点赞、收藏
- 分类：列表、详情、创建、更新、删除
- 标签：列表、详情、标签文章流
- 归档：真实归档接口
- 评论/留言板：评论列表、留言板列表、发表评论、删除、点赞
- 上传：图片、封面、头像、批量上传、文件删除
- 首页：聚合数据、Banner、站点配置、站点统计

### 当前需要注意的边界

- 前端 API 封装已经按当前后端真实能力收敛，不再保留一批未落地的假接口
- 留言板与评论区共用评论体系，但展示场景不同
- 部分后台管理能力仍属于“基础管理”范围，不代表独立后台资源体系已经完整落地

## 主要特性

- 动漫风首页 Hero、樱花动效与 Live2D 看板娘
- 亮色 / 暗色主题切换
- JWT + refresh token 静默续期
- 个人中心与文章管理
- 管理员后台入口
- 文章编辑器与封面上传

## 文档

- [架构设计](doc/architecture.md)
