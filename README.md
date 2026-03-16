# Chen404 博客系统 - 前端

基于 Vue 3 + Vite + TypeScript 的个人博客前端，风格参考 2heng.xin，清新动漫风、樱花粉主题。

## 技术栈

| 类别 | 技术 |
|------|------|
| 框架 | Vue 3、Vite 8、TypeScript |
| 路由与状态 | Vue Router 4、Pinia |
| UI 组件库 | Element Plus、Sass |
| HTTP 请求 | Axios |
| Markdown 编辑 | md-editor-v3 |
| 其他 | dayjs、@element-plus/icons-vue |

## 快速开始

### 环境要求

- Node.js 18+
- npm 或 yarn

### 安装依赖

```bash
npm install
```

### 开发运行

```bash
npm run dev
```

访问 http://localhost:5173

### 构建部署

```bash
npm run build
npm run preview
```

## 项目结构

```
Chen404Fro/
├── public/                  # 静态资源
│   └── live2d/             # Live2D 模型文件
├── src/
│   ├── api/                # API 接口封装
│   │   ├── auth.ts         # 认证接口
│   │   ├── article.ts      # 文章接口
│   │   ├── home.ts         # 首页接口
│   │   └── ...
│   ├── assets/             # 静态资源
│   │   ├── images/
│   │   └── styles/         # 全局样式
│   │       ├── global.scss
│   │       └── variables.scss
│   ├── components/         # 公共组件
│   │   ├── Header/         # 顶部导航
│   │   ├── Footer/         # 页脚
│   │   ├── ArticleCard/    # 文章卡片
│   │   ├── Sidebar/        # 侧边栏
│   │   ├── Comment/        # 评论组件
│   │   └── Live2D/         # 看板娘
│   ├── layouts/            # 布局组件
│   │   └── DefaultLayout.vue
│   ├── router/             # 路由配置
│   │   └── index.ts
│   ├── stores/             # Pinia 状态管理
│   │   ├── app.ts          # 应用状态
│   │   ├── user.ts         # 用户状态
│   │   └── article.ts      # 文章状态
│   ├── types/              # TypeScript 类型
│   ├── utils/              # 工具函数
│   │   ├── request.ts      # Axios 封装
│   │   └── format.ts       # 格式化工具
│   ├── views/              # 页面视图
│   │   ├── Home/           # 首页
│   │   ├── Article/        # 文章详情、编辑
│   │   ├── Archive/        # 归档页
│   │   ├── Category/       # 分类页
│   │   ├── Tag/            # 标签页
│   │   ├── Guestbook/      # 留言板
│   │   ├── Friends/        # 友人帐
│   │   ├── About/          # 关于页
│   │   ├── Auth/           # 登录/注册
│   │   └── NotFound/       # 404
│   ├── App.vue
│   └── main.ts
├── doc/
│   └── architecture.md     # 架构设计文档
├── index.html
├── vite.config.ts
├── tsconfig.json
└── package.json
```

## 页面路由

| 路径 | 页面 | 说明 |
|------|------|------|
| `/` | 首页 | 文章流、Banner、站点统计 |
| `/article/:id` | 文章详情 | Markdown 渲染、代码高亮、评论 |
| `/article/edit/:id?` | 编写文章 | 需登录 |
| `/archive` | 归档 | 按年月时间线 |
| `/category/:id?` | 分类 | 分类及文章列表 |
| `/tag/:id?` | 标签 | 标签及文章列表 |
| `/guestbook` | 留言板 | 评论式留言 |
| `/friends` | 友人帐 | 友链展示与申请 |
| `/about` | 关于 | 关于本站 |
| `/login` | 登录 | 账号/邮箱登录 |
| `/register` | 注册 | 用户注册 |

## 与后端对接

- **Base URL**: 通过环境变量配置（默认 `/api`）
- **认证**: JWT Token，存 localStorage，请求头 `Authorization: Bearer <token>`
- **响应格式**: `{ code, message, data }`

环境变量配置：

```bash
# .env.development
VITE_API_BASE_URL=/api

# .env.production
VITE_API_BASE_URL=https://api.chen404.com/api
```

## 主要特性

- **清新动漫风**: 樱花粉(#fb7299)主题色，二次元氛围
- **Live2D 看板娘**: 左侧固定的交互式看板娘
- **响应式布局**: 完美适配 PC、平板、手机
- **明暗主题**: 支持亮色/暗色主题切换
- **Markdown 编辑器**: 支持文章编写和代码高亮
- **性能优化**: 路由懒加载、图片懒加载、代码分割

## 文档

- [架构设计](doc/architecture.md) - 详细架构设计说明
