# API 模块说明

## 目录结构

```
api/
├── index.ts          # 统一导出所有 API
├── request.ts        # Axios 封装（请求/响应拦截器）
├── auth.ts           # 认证相关（登录、注册、密码重置）
├── home.ts           # 首页相关（站点统计、Banner、热门文章）
├── article.ts        # 文章相关（列表、详情、分类、标签、归档）
├── comment.ts        # 评论相关（列表、发表、审核）
├── friend.ts         # 友链相关（列表、申请）
└── upload.ts         # 文件上传相关
```

## 使用示例

### 1. 认证模块 (auth.ts)

```typescript
import { login, register, sendVerifyCode, getUserInfo } from '@/api';

// 登录
const { token, user } = await login({
  username: 'user@example.com',
  password: 'password123',
});

// 注册
const user = await register({
  username: 'newuser',
  password: 'password123',
  email: 'user@example.com',
  nickname: '新用户',
  registerType: 'email',
});

// 发送验证码
await sendVerifyCode({
  phone: '13800138000',
  type: 'register',
});

// 获取用户信息
const userInfo = await getUserInfo();
```

### 2. 首页模块 (home.ts)

```typescript
import { getHomeData, getSiteStats, getHotArticles, getBanners } from '@/api';

// 获取首页聚合数据
const homeData = await getHomeData();

// 获取站点统计
const stats = await getSiteStats();

// 获取热门文章
const hotArticles = await getHotArticles(10);

// 获取轮播图
const banners = await getBanners();
```

### 3. 文章模块 (article.ts)

```typescript
import {
  getArticles,
  getArticleById,
  getCategories,
  getTags,
  getArchives,
} from '@/api';

// 获取文章列表
const { list, total } = await getArticles({
  page: 1,
  size: 10,
  categoryId: 1,
  orderBy: 'newest',
});

// 获取文章详情
const article = await getArticleById(1);

// 获取分类列表
const categories = await getCategories();

// 获取标签列表
const tags = await getTags();

// 获取归档数据
const archives = await getArchives();
```

### 4. 评论模块 (comment.ts)

```typescript
import { getComments, createComment, getGuestbookComments } from '@/api';

// 获取文章评论
const { list } = await getComments(articleId, { page: 1, size: 20 });

// 获取留言板评论
const { list } = await getGuestbookComments({ page: 1, size: 20 });

// 发表评论
const comment = await createComment({
  articleId: 1,
  content: '写得真好！',
  authorName: '访客',
  authorEmail: 'visitor@example.com',
});
```

### 5. 友链模块 (friend.ts)

```typescript
import { getFriendLinks, applyFriendLink } from '@/api';

// 获取友链列表
const friends = await getFriendLinks();

// 申请友链
await applyFriendLink({
  siteName: '示例站点',
  siteUrl: 'https://example.com',
  siteLogo: 'https://example.com/logo.png',
  description: '一个技术博客',
  email: 'admin@example.com',
});
```

### 6. 文件上传 (upload.ts)

```typescript
import { uploadImage, uploadImages } from '@/api';

// 单张图片上传
const { url } = await uploadImage(file, 'articles');

// 多张图片上传
const { urls } = await uploadImages([file1, file2], 'gallery');
```

## 类型定义

所有 API 相关的类型定义在 `src/types/index.ts` 中，包括：

- `User` - 用户信息
- `LoginParams` / `LoginResult` - 登录参数和结果
- `RegisterParams` - 注册参数
- `Article` / `ArticleQueryParams` - 文章和查询参数
- `Category` / `Tag` - 分类和标签
- `Comment` / `CreateCommentParams` - 评论和创建参数
- `FriendLink` - 友链信息
- `PageParams` / `PageResult<T>` - 分页参数和结果

## 环境配置

API 基础地址通过环境变量配置：

```
# .env.development
VITE_API_BASE_URL=http://localhost:8080/api

# .env.production
VITE_API_BASE_URL=https://api.chen404.com/api
```

## 错误处理

所有 API 请求的错误已在 `request.ts` 中统一处理：

- 401 - 未授权，自动跳转到登录页
- 403 - 拒绝访问
- 404 - 资源不存在
- 500 - 服务器错误
- 网络错误 - 显示网络连接失败提示

## Mock 数据

在开发阶段可以使用 Mock 数据，只需在 `request.ts` 中配置：

```typescript
const request = axios.create({
  baseURL: '/mock', // 使用 mock 数据
});
```
