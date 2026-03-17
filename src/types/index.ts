// 统一导出所有类型

// 基础响应类型
export interface ApiResponse<T = unknown> {
  code: number;
  message: string;
  data: T;
}

// 分页请求参数
export interface PageParams {
  page?: number;
  size?: number;
}

// 分页响应结果
export interface PageResult<T> {
  list: T[];
  total: number;
  page: number;
  size: number;
}

// ==================== 用户相关类型 ====================

export interface User {
  id: number;
  username: string;
  nickname: string;
  email?: string;
  phone?: string;
  avatar: string;
  role: UserRole;
  status: UserStatus;
  createTime: string;
}

export enum UserRole {
  USER = 0,
  ADMIN = 1,
}

export enum UserStatus {
  DISABLED = 0,
  ENABLED = 1,
}

// ==================== 认证相关类型 ====================

// 登录请求参数
export interface LoginParams {
  username: string; // 用户名/邮箱/手机号
  password: string;
  captcha?: string; // 图形验证码（可选）
}

// 登录响应
export interface LoginResult {
  token: string;
  refreshToken: string;
  expires: number; // token 过期时间（秒）
  user: User;
}

// 注册请求参数
export interface RegisterParams {
  username: string;
  password: string;
  nickname?: string;
  email?: string;
  phone?: string;
  code?: string; // 短信/邮箱验证码
  registerType: 'email' | 'phone';
}

// 发送验证码请求
export interface SendCodeParams {
  phone?: string;
  email?: string;
  type: 'register' | 'login' | 'reset';
}

// 忘记密码请求
export interface ForgotPasswordParams {
  account: string; // 邮箱或手机号
  code: string;
  newPassword: string;
}

// 修改密码请求
export interface ChangePasswordParams {
  oldPassword: string;
  newPassword: string;
}

// 更新个人资料请求
export interface UpdateProfileParams {
  nickname: string;
  avatar: string;
}

// ==================== 首页相关类型 ====================

// 站点统计信息
export interface SiteStats {
  articleCount: number;
  categoryCount: number;
  tagCount: number;
  commentCount: number;
  viewCount: number;
}

// 站点配置
export interface SiteConfig {
  siteName: string;
  siteDescription: string;
  siteLogo: string;
  siteFavicon: string;
  icp: string; // ICP备案号
  github?: string;
  email?: string;
}

// 轮播图/Banner
export interface Banner {
  id: number;
  title: string;
  subtitle?: string;
  image: string;
  link?: string;
  sort: number;
}

// 热门文章
export interface HotArticle {
  id: number;
  title: string;
  viewCount: number;
}

// 最新评论
export interface RecentComment {
  id: number;
  content: string;
  authorName: string;
  authorAvatar: string;
  articleId: number;
  articleTitle: string;
  createTime: string;
}

// 首页数据聚合
export interface HomeData {
  banners: Banner[];
  stats: SiteStats;
  hotArticles: HotArticle[];
  recentComments: RecentComment[];
}

// ==================== 文章相关类型 ====================

export interface Article {
  /** 文章 ID（后端 Long 序列化为 string，避免大数精度丢失） */
  id: number | string;
  title: string;
  summary: string;
  content?: string;
  /** 服务端渲染好的 HTML（若有则优先展示） */
  contentHtml?: string;
  coverImage?: string;
  authorId: number;
  categoryId: number;
  status: ArticleStatus;
  viewCount: number;
  commentCount: number;
  likeCount: number;
  /** 是否置顶：0-否 1-是 */
  isTop: number;
  /** 是否推荐：0-否 1-是 */
  isRecommend: number;
  publishTime: string;
  createTime: string;
  updateTime: string;
  // 关联数据
  category?: Category;
  tags?: Tag[];
  author?: Author;
}

export enum ArticleStatus {
  DRAFT = 0,
  PUBLISHED = 1,
  RECYCLED = 2,
}

export interface Category {
  id: number;
  name: string;
  slug: string;
  description?: string;
  icon?: string;
  articleCount?: number;
  sortOrder: number;
}

export interface Tag {
  id: number;
  name: string;
  slug: string;
  color: string;
  articleCount?: number;
}

export interface Author {
  id: number;
  username: string;
  nickname: string;
  avatar: string;
  bio?: string;
}

// 文章查询参数
export interface ArticleQueryParams extends PageParams {
  keyword?: string;
  categoryId?: number;
  tagId?: number;
  status?: ArticleStatus;
  orderBy?: 'newest' | 'hottest' | 'recommend';
}

// 归档数据
export interface ArchiveYear {
  year: number;
  count: number;
  months: ArchiveMonth[];
}

export interface ArchiveMonth {
  month: number;
  count: number;
  articles: Article[];
}

// ==================== 评论相关类型 ====================

export interface Comment {
  id: number;
  articleId?: number;
  parentId: number;
  content: string;
  authorName: string;
  authorEmail?: string;
  authorWebsite?: string;
  authorIp?: string;
  status: CommentStatus;
  createTime: string;
  updateTime: string;
  children?: Comment[];
  // 关联数据
  article?: {
    id: number;
    title: string;
  };
}

export enum CommentStatus {
  PENDING = 0,
  APPROVED = 1,
  REJECTED = 2,
}

// 发表评论请求
export interface CreateCommentParams {
  articleId?: number;
  parentId?: number;
  content: string;
  authorName: string;
  authorEmail?: string;
  authorWebsite?: string;
}

// ==================== 友链相关类型 ====================

export interface FriendLink {
  id: number;
  siteName: string;
  siteUrl: string;
  siteLogo?: string;
  description?: string;
  email?: string;
  status: FriendLinkStatus;
  sortOrder: number;
  createTime: string;
}

export enum FriendLinkStatus {
  PENDING = 0,
  APPROVED = 1,
  REJECTED = 2,
}

// 申请友链请求
export interface ApplyFriendLinkParams {
  siteName: string;
  siteUrl: string;
  siteLogo?: string;
  description?: string;
  email?: string;
}
