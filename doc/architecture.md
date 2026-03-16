# Chen404 前端架构设计

## 1. 技术架构

```
┌─────────────────────────────────────────────────────────────┐
│                      视图层 (Views)                         │
│   Home | Article | Archive | Category | Tag | Guestbook    │
└─────────────────────────────────────────────────────────────┘
                              ↓
┌─────────────────────────────────────────────────────────────┐
│                    组件层 (Components)                      │
│  Header | Footer | ArticleCard | Sidebar | Comment | Live2D │
└─────────────────────────────────────────────────────────────┘
                              ↓
┌─────────────────────────────────────────────────────────────┐
│                    逻辑层 (Composable)                      │
│  Stores (Pinia) | Utils | Hooks                             │
└─────────────────────────────────────────────────────────────┘
                              ↓
┌─────────────────────────────────────────────────────────────┐
│                      数据层 (API)                           │
│  Auth | Article | Category | Tag | Comment | Upload         │
└─────────────────────────────────────────────────────────────┘
                              ↓
┌─────────────────────────────────────────────────────────────┐
│                      服务端 (Backend)                       │
│              Spring Boot API (http://localhost:8080)        │
└─────────────────────────────────────────────────────────────┘
```

## 2. 技术栈

| 层级 | 技术 | 版本 | 说明 |
|------|------|------|------|
| 框架 | Vue | 3.5.x | 响应式框架 |
| 构建工具 | Vite | 8.x | 快速构建 |
| 语言 | TypeScript | 5.9.x | 类型安全 |
| 路由 | Vue Router | 4.x | SPA 路由 |
| 状态管理 | Pinia | 3.x | 全局状态 |
| UI 库 | Element Plus | 2.13.x | 组件库 |
| 样式 | Sass | 1.98.x | CSS 预处理器 |
| HTTP | Axios | 1.13.x | HTTP 请求 |
| 编辑器 | md-editor-v3 | 6.x | Markdown 编辑 |
| 工具 | dayjs | 1.11.x | 日期处理 |

## 3. 项目结构

```
src/
├── api/                    # API 接口层
│   ├── auth.ts            # 认证接口
│   ├── article.ts         # 文章接口
│   ├── home.ts            # 首页接口
│   ├── category.ts        # 分类接口
│   ├── tag.ts             # 标签接口
│   ├── comment.ts         # 评论接口
│   ├── friend.ts          # 友链接口
│   └── upload.ts          # 上传接口
├── assets/                # 静态资源
│   ├── images/           # 图片资源
│   └── styles/           # 样式文件
│       ├── global.scss   # 全局样式
│       ├── variables.scss # SCSS 变量
│       └── mixins.scss   # SCSS Mixins
├── components/           # 公共组件
│   ├── Header/          # 顶部导航
│   ├── Footer/          # 页脚
│   ├── ArticleCard/     # 文章卡片
│   ├── Sidebar/         # 侧边栏
│   ├── Comment/         # 评论组件
│   ├── Pagination/      # 分页组件
│   ├── Live2D/          # Live2D 看板娘
│   └── Loading/         # 加载组件
├── layouts/             # 布局组件
│   └── DefaultLayout.vue # 默认布局
├── router/              # 路由配置
│   └── index.ts
├── stores/              # Pinia 状态管理
│   ├── app.ts          # 应用状态（主题等）
│   ├── user.ts         # 用户状态
│   └── article.ts      # 文章状态
├── types/              # TypeScript 类型定义
│   └── index.ts
├── utils/              # 工具函数
│   ├── request.ts     # Axios 封装
│   ├── storage.ts     # 本地存储封装
│   └── format.ts      # 格式化工具
├── views/              # 页面视图
│   ├── Home/          # 首页
│   ├── Article/       # 文章详情/编辑
│   ├── Archive/       # 归档页
│   ├── Category/      # 分类页
│   ├── Tag/           # 标签页
│   ├── Guestbook/     # 留言板
│   ├── Friends/       # 友人帐
│   ├── About/         # 关于页
│   ├── Auth/          # 登录/注册
│   └── NotFound/      # 404
├── App.vue
└── main.ts
```

## 4. 核心设计

### 4.1 路由设计

```typescript
// router/index.ts
const routes = [
  {
    path: '/',
    component: DefaultLayout,
    children: [
      { path: '', name: 'Home', component: () => import('@/views/Home/index.vue') },
      { path: 'article/:id', name: 'Article', component: () => import('@/views/Article/index.vue') },
      { path: 'archive', name: 'Archive', component: () => import('@/views/Archive/index.vue') },
      { path: 'category/:id?', name: 'Category', component: () => import('@/views/Category/index.vue') },
      { path: 'tag/:id?', name: 'Tag', component: () => import('@/views/Tag/index.vue') },
      { path: 'guestbook', name: 'Guestbook', component: () => import('@/views/Guestbook/index.vue') },
      { path: 'friends', name: 'Friends', component: () => import('@/views/Friends/index.vue') },
      { path: 'about', name: 'About', component: () => import('@/views/About/index.vue') },
      { path: 'article/edit/:id?', name: 'ArticleEdit', component: () => import('@/views/Article/Edit.vue'), meta: { requiresAuth: true } },
    ]
  },
  { path: '/login', name: 'Login', component: () => import('@/views/Auth/Login.vue') },
  { path: '/register', name: 'Register', component: () => import('@/views/Auth/Register.vue') },
  { path: '/:pathMatch(.*)*', name: 'NotFound', component: () => import('@/views/NotFound/index.vue') },
]
```

### 4.2 状态管理 (Pinia)

```typescript
// stores/user.ts
export const useUserStore = defineStore('user', {
  state: () => ({
    token: localStorage.getItem('token') || '',
    userInfo: null as UserInfo | null,
    isLoggedIn: false,
  }),
  actions: {
    async login(credentials: LoginParams) {
      const res = await loginApi(credentials)
      this.token = res.token
      this.userInfo = res.user
      this.isLoggedIn = true
      localStorage.setItem('token', res.token)
    },
    logout() {
      this.token = ''
      this.userInfo = null
      this.isLoggedIn = false
      localStorage.removeItem('token')
    },
  },
})
```

### 4.3 HTTP 请求封装

```typescript
// utils/request.ts
const request = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL || '/api',
  timeout: 10000,
})

// 请求拦截器
request.interceptors.request.use((config) => {
  const token = localStorage.getItem('token')
  if (token) {
    config.headers.Authorization = `Bearer ${token}`
  }
  return config
})

// 响应拦截器
request.interceptors.response.use(
  (response) => response.data,
  (error) => {
    if (error.response?.status === 401) {
      // Token 过期，跳转到登录
      router.push('/login')
    }
    return Promise.reject(error)
  }
)
```

## 5. UI 设计系统

### 5.1 色彩系统

```scss
// styles/variables.scss
:root {
  // 主题色 - 樱花粉
  --primary: #fb7299;
  --primary-light: #ff85a7;
  --primary-dark: #e44d78;
  --primary-hover: #ff9eb3;

  // 背景色
  --bg-primary: #f4f5f7;
  --bg-secondary: #ffffff;
  --bg-hover: #f5f5f5;

  // 文字色
  --text-primary: #212121;
  --text-secondary: #666666;
  --text-tertiary: #999999;

  // 边框
  --border-color: #e3e5e7;

  // 功能色
  --success: #67c23a;
  --warning: #e6a23c;
  --danger: #f56c6c;
  --info: #909399;
}

// 暗色主题
[data-theme="dark"] {
  --bg-primary: #18191c;
  --bg-secondary: #232427;
  --text-primary: #e3e5e7;
  --text-secondary: #a1a3a6;
  --border-color: #3a3c40;
}
```

### 5.2 响应式断点

```typescript
// breakpoints
const breakpoints = {
  sm: 640,   // 手机横屏
  md: 768,   // 平板
  lg: 1024,  // 小桌面
  xl: 1280,  // 桌面
  '2xl': 1536 // 大桌面
}
```

### 5.3 布局系统

```
容器最大宽度: 1200px
侧边栏宽度: 280px
间距系统: 4px 基准 (4, 8, 12, 16, 20, 24, 32, 40, 48)
```

## 6. 组件设计

### 6.1 文章卡片 (ArticleCard)

- **双栏交替布局**: 奇数卡片图片在右，偶数卡片图片在左
- **悬停效果**: translateY(-4px) + 阴影增强
- **响应式**: 移动端单列显示

### 6.2 Live2D 看板娘

- **位置**: 左侧固定 (bottom: 0, left: 0)
- **大小**: 280px x 350px
- **交互**: 鼠标跟随、点击对话、定时动作
- **功能按钮**: 聊天、换装、截图、关闭

### 6.3 导航栏 (Header)

- **滚动行为**: 向下隐藏，向上显示
- **透明效果**: 顶部透明，滚动后毛玻璃效果
- **移动端**: 汉堡菜单

## 7. 性能优化

### 7.1 加载优化

- **路由懒加载**: `component: () => import('@/views/xxx.vue')`
- **图片懒加载**: `loading="lazy"`
- **组件异步加载**: 非首屏组件延迟加载

### 7.2 构建优化

- **代码分割**: 按路由自动分割
- **Tree Shaking**: 移除未使用代码
- **Gzip**: 服务端开启压缩

### 7.3 运行时优化

- **v-memo**: 列表项缓存
- **shallowRef**: 非响应式数据
- **keep-alive**: 页面状态缓存

## 8. API 模块

| 模块 | 文件 | 说明 |
|------|------|------|
| 认证 | `api/auth.ts` | 登录、注册、Token 刷新 |
| 文章 | `api/article.ts` | 文章列表、详情、CRUD |
| 首页 | `api/home.ts` | 聚合数据、轮播图、热门文章 |
| 分类 | `api/category.ts` | 分类列表、详情 |
| 标签 | `api/tag.ts` | 标签列表、详情 |
| 评论 | `api/comment.ts` | 评论列表、发表 |
| 友链 | `api/friend.ts` | 友链列表、申请 |
| 上传 | `api/upload.ts` | 图片/文件上传 |

## 9. 类型定义

```typescript
// types/index.ts

// 通用响应
export interface Result<T> {
  code: number
  message: string
  data: T
}

// 分页响应
export interface PageResult<T> {
  list: T[]
  total: number
  page: number
  size: number
}

// 用户
export interface User {
  id: number
  username: string
  nickname: string
  email: string
  avatar: string
  role: number
}

// 文章
export interface Article {
  id: number
  title: string
  summary: string
  content: string
  coverImage?: string
  category: Category
  tags: Tag[]
  author: User
  viewCount: number
  commentCount: number
  publishTime: string
}

// 分类
export interface Category {
  id: number
  name: string
  slug: string
  description?: string
  articleCount: number
}

// 标签
export interface Tag {
  id: number
  name: string
  slug: string
  color: string
  articleCount: number
}

// 评论
export interface Comment {
  id: number
  content: string
  authorName: string
  authorAvatar?: string
  createTime: string
  children?: Comment[]
}
```

## 10. 开发规范

### 10.1 代码规范

- 使用 Composition API
- 组件名使用 PascalCase
- 组合式函数使用 useXxx 命名
- 类型定义使用 TypeScript 接口

### 10.2 文件规范

- 视图文件: `views/Xxx/index.vue`
- 组件文件: `components/Xxx/index.vue`
- 工具文件: `utils/xxx.ts`
- 类型文件: `types/xxx.ts`

### 10.3 样式规范

- 使用 SCSS 预处理器
- 变量定义在 `variables.scss`
- 组件样式使用 scoped
- BEM 命名规范
