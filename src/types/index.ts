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
  bio?: string;
  role: UserRole;
  roleCode?: UserRoleCode;
  roleName?: string;
  trustLevel?: UserTrustLevel;
  trustLevelName?: string;
  memberLabel?: string;
  status: UserStatus;
  createTime: string;
  lastLoginTime?: string;
  lastLoginIp?: string;
}

export enum UserRole {
  USER = 0,
  ADMIN = 1,
}

export enum UserRoleCode {
  USER = 'user',
  ADMIN = 'admin',
}

export enum UserTrustLevel {
  NORMAL = 0,
  FRIEND = 1,
}

export enum UserStatus {
  DISABLED = 0,
  ENABLED = 1,
}

// ==================== 认证相关类型 ====================

// 登录请求参数
export interface LoginParams {
  username: string;
  password: string;
  captcha?: string;
}

// 登录响应
export interface LoginResult {
  token: string;
  refreshToken: string;
  expires: number;
  user: User;
}

// 注册请求参数
export interface RegisterParams {
  username: string;
  password: string;
  nickname?: string;
  email?: string;
  phone?: string;
  code?: string;
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
  email: string;
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
  bio?: string;
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
  icp: string;
  beian?: string;
  github?: string;
  email?: string;
  copyright?: string;
  seoKeywords?: string;
  seoDescription?: string;
  commentAudit?: boolean;
  commentGuest?: boolean;
  heroImages?: Record<string, string>;
  heroImagePositions?: Record<string, string>;
}

export interface SiteOwner {
  id: number | string;
  username: string;
  nickname: string;
  email?: string;
  avatar: string;
  bio?: string;
  memberLabel?: string;
}

// 轮播图 Banner
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

// ==================== 旅行纪念地图相关类型 ====================

export type TravelMemoryGeoSource = 'NONE' | 'EXIF' | 'MANUAL';

export interface TravelMemoryEntry {
  id?: number;
  imageUrl: string;
  remark?: string;
  thanksNote?: string;
  shotAt?: string;
  displayOrder?: number;
  stopId?: number;
  cover?: boolean;
  stopCover?: boolean;
  sourceLatitude?: number;
  sourceLongitude?: number;
  geoSource?: TravelMemoryGeoSource;
}

export interface TravelMemoryStop {
  id?: number;
  title: string;
  storyNote?: string;
  coverImage?: string;
  visitedAt?: string;
  latitude?: number;
  longitude?: number;
  sortOrder?: number;
  entryCount?: number;
  entries: TravelMemoryEntry[];
}

export interface TravelMemoryLocationListItem {
  id: number;
  title: string;
  province?: string;
  city?: string;
  latitude?: number;
  longitude?: number;
  summaryNote?: string;
  coverImage?: string;
  visitedAt?: string;
  visitedEndAt?: string;
  entryCount?: number;
}

export interface TravelMemoryLocationDetail extends TravelMemoryLocationListItem {
  status?: number;
  sortOrder?: number;
  entries: TravelMemoryEntry[];
  stops?: TravelMemoryStop[];
  createTime?: string;
  updateTime?: string;
}

export interface TravelMemoryEntryUpsertCommand {
  id?: number;
  imageUrl: string;
  remark?: string;
  thanksNote?: string;
  shotAt?: string;
  displayOrder?: number;
  cover?: boolean;
  stopCover?: boolean;
  sourceLatitude?: number;
  sourceLongitude?: number;
  geoSource?: TravelMemoryGeoSource;
}

export interface TravelMemoryStopUpsertCommand {
  id?: number;
  title: string;
  storyNote?: string;
  visitedAt?: string;
  latitude?: number;
  longitude?: number;
  sortOrder?: number;
  entries: TravelMemoryEntryUpsertCommand[];
}

export interface CreateTravelMemoryCommand {
  title: string;
  province?: string;
  city?: string;
  latitude?: number;
  longitude?: number;
  summaryNote?: string;
  visitedAt?: string;
  visitedEndAt?: string;
  status?: number;
  sortOrder?: number;
  stops?: TravelMemoryStopUpsertCommand[];
  entries?: TravelMemoryEntryUpsertCommand[];
}

export interface UpdateTravelMemoryCommand extends CreateTravelMemoryCommand {}

// ==================== 音乐电台相关类型 ====================

export type MusicTrackStatus = 'draft' | 'published' | 'archived';
export type MusicLyricType = 'plain' | 'lrc';

export interface MusicTrack {
  id: number;
  title: string;
  artist: string;
  album?: string;
  duration?: number;
  releaseYear?: number;
  language?: string;
  genre?: string;
  tags: string[];
  audioFileId?: number;
  audioUrl: string;
  coverFileId?: number;
  coverUrl?: string;
  lyricType: MusicLyricType;
  lyrics?: string;
  lyricSource?: string;
  recommendation?: string;
  moodText?: string;
  status: MusicTrackStatus;
  sortOrder?: number;
  createTime?: string;
  updateTime?: string;
}

export interface MusicPlaylist {
  id?: number;
  name: string;
  description?: string;
  coverFileId?: number;
  coverUrl?: string;
  openingText?: string;
  defaultPlaylist?: boolean;
  publicPlaylist?: boolean;
  sortOrder?: number;
  createTime?: string;
  updateTime?: string;
  tracks: MusicTrack[];
}

export interface MusicTrackUpsertCommand {
  title: string;
  artist: string;
  album?: string;
  releaseYear?: number;
  language?: string;
  genre?: string;
  tags: string[];
  audioFileId?: number;
  audioUrl: string;
  coverFileId?: number;
  coverUrl?: string;
  lyricType: MusicLyricType;
  lyrics?: string;
  lyricSource?: string;
  recommendation?: string;
  moodText?: string;
  status?: MusicTrackStatus;
  sortOrder?: number;
}

export interface MusicTrackAiSuggestRequest {
  title: string;
  artist?: string;
  album?: string;
  releaseYear?: number;
  language?: string;
  genre?: string;
  lyrics?: string;
  limit?: number;
}

export interface MusicTrackAiCandidate {
  title?: string;
  artist?: string;
  album?: string;
  releaseYear?: number;
  language?: string;
  genre?: string;
  tags?: string[];
  recommendation?: string;
  moodText?: string;
  lyricSource?: string;
  confidence?: 'high' | 'medium' | 'low' | string;
  matchReason?: string;
}

export interface MusicTrackAiSuggestResponse {
  candidates: MusicTrackAiCandidate[];
}

export interface MusicPlaylistUpsertCommand {
  name: string;
  description?: string;
  coverFileId?: number;
  coverUrl?: string;
  openingText?: string;
  defaultPlaylist?: boolean;
  publicPlaylist?: boolean;
  sortOrder?: number;
}

export interface MusicPlaylistTracksCommand {
  trackIds: number[];
}

// ==================== 文章相关类型 ====================

export interface ArticleAuthorSummary {
  id: number | string;
  username: string;
  nickname: string;
  avatar: string;
  bio?: string;
}

export interface ArticleCategorySummary {
  id: number;
  name: string;
  slug: string;
  description?: string;
  icon?: string;
}

export interface ArticleTagSummary {
  id: number;
  name: string;
  slug: string;
  color: string;
}

export interface ArticleListItem {
  /** 文章 ID（后端 Long 序列化为 string，避免大数精度丢失） */
  id: number | string;
  title: string;
  summary: string;
  coverImage?: string;
  authorId: number | string;
  categoryId: number;
  status: ArticleStatus;
  viewCount: number;
  commentCount: number;
  likeCount: number;
  /** 是否置顶：0-否 1-是 */
  isTop: number;
  /** 是否推荐：0-否 1-是 */
  isRecommend: number;
  /** 可见性：0-公开 1-登录可见 2-好友可见 3-私密 */
  visibility?: ArticleVisibility;
  /** 评论策略：0-关闭 1-登录可评 2-好友可评 3-游客可评 */
  commentPolicy?: ArticleCommentPolicy;
  publishTime: string;
  createTime: string;
  updateTime: string;
  category?: ArticleCategorySummary;
  tags?: ArticleTagSummary[];
  author?: ArticleAuthorSummary;
  canEdit?: boolean;
  canDelete?: boolean;
  liked?: boolean;
  favorited?: boolean;
}

export interface ArticleDetail extends ArticleListItem {
  content?: string;
  /** 服务端渲染好的 HTML（若有则优先展示） */
  contentHtml?: string;
  isOriginal?: number;
  originalUrl?: string;
  canComment?: boolean;
}

/**
 * 兼容现有视图逐步迁移；新接口类型优先使用 ArticleListItem / ArticleDetail。
 */
export type Article = ArticleDetail;

export enum ArticleStatus {
  DRAFT = 0,
  PUBLISHED = 1,
  RECYCLED = 2,
}

export enum ArticleVisibility {
  PUBLIC = 0,
  LOGIN = 1,
  FRIEND = 2,
  PRIVATE = 3,
}

export enum ArticleCommentPolicy {
  CLOSED = 0,
  REGISTERED = 1,
  FRIEND = 2,
  PUBLIC = 3,
}

export interface Category {
  id: number;
  name: string;
  slug: string;
  description?: string;
  icon?: string;
  articleCount?: number;
  sortOrder: number;
  /** 管理端：0 禁用 1 启用 */
  status?: number;
}

export interface CreateArticleCommand {
  title: string;
  summary?: string;
  content: string;
  coverImage?: string;
  categoryId: number;
  status: ArticleStatus;
  isTop?: number;
  isRecommend?: number;
  isOriginal?: number;
  originalUrl?: string;
  password?: string;
  visibility?: ArticleVisibility;
  commentPolicy?: ArticleCommentPolicy;
  tagIds?: number[];
  tagNames?: string[];
}

export interface UpdateArticleCommand extends CreateArticleCommand {}

export interface AiArticleAssistRequest {
  title?: string;
  content: string;
  regenerate?: boolean;
  currentSummary?: string;
  currentTags?: string[];
}

export interface AiArticleAssistResponse {
  summary: string;
  tags: string[];
}

export interface AiChatMessage {
  role: 'user' | 'assistant';
  content: string;
}

export interface AiChatCitation {
  articleId: number | string;
  articleTitle: string;
  url: string;
  snippet?: string;
}

export interface AiChatRelatedArticle {
  articleId: number | string;
  articleTitle: string;
  url: string;
}

export interface AiChatRequest {
  sessionId?: string;
  visitorId?: string;
  messages: AiChatMessage[];
  pageContext?: string;
  currentArticleId?: number | string;
  currentArticleTitle?: string;
  stream?: boolean;
}

export interface AiChatResponse {
  sessionId: string;
  messageId: string;
  scene: 'helper' | 'companion';
  replyText: string;
  panelAnswer?: string;
  bubbleText?: string;
  mood: string;
  citations: AiChatCitation[];
  relatedArticles: AiChatRelatedArticle[];
  suggestions: string[];
  traceId: string;
  finishReason: string;
}

export interface AiAdminConfig {
  llm: {
    enabled?: boolean;
    baseUrl?: string;
    model?: string;
    apiStyle?: 'chat-completions' | 'responses' | string;
    apiKeyConfigured?: boolean;
    apiKeyPreview?: string;
    apiKey?: string;
    temperature?: number;
    maxTokens?: number;
    timeoutSeconds?: number;
  };
  maid: {
    name?: string;
    personaVersion?: string;
    systemPrompt?: string;
    helperPrompt?: string;
    companionPrompt?: string;
  };
  chat: {
    enabled?: boolean;
    retrievalEnabled?: boolean;
    maxCitationCount?: number;
    maxContextMessages?: number;
    maxArticleContentChars?: number;
    maxArticleSummaryChars?: number;
    maxSuggestionCount?: number;
    relatedArticleLimit?: number;
    requireRecommendIntentForRelatedArticles?: boolean;
    bubbleMaxChars?: number;
    bubbleLongReplyText?: string;
  };
  tools: {
    webSearchEnabled?: boolean;
  };
}

export interface AiConfigTestRequest {
  message?: string;
  useUnsavedConfig?: boolean;
  config?: AiAdminConfig;
}

export interface AiConfigTestResponse {
  success: boolean;
  message: string;
  sampleText?: string;
  traceId?: string;
  latencyMs?: number;
}

export interface AiChatHistoryMessage {
  messageId: string;
  role: 'user' | 'assistant';
  content: string;
  scene?: 'helper' | 'companion';
  mood?: string;
  citations: AiChatCitation[];
  relatedArticles: AiChatRelatedArticle[];
  suggestions: string[];
}

export interface AiChatSessionDetailResponse {
  sessionId: string;
  title: string;
  sourcePage: string;
  sourceArticleId?: number | string;
  messages: AiChatHistoryMessage[];
}

export interface CreateCategoryCommand {
  name: string;
  slug?: string;
  description?: string;
  icon?: string;
  sortOrder?: number;
  status?: number;
}

export interface UpdateCategoryCommand extends CreateCategoryCommand {}

export interface Tag {
  id: number;
  name: string;
  slug: string;
  color: string;
  articleCount?: number;
}

export interface Author {
  id: number | string;
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
  authorId?: number | string;
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
  articleId?: number | string;
  parentId: number;
  rootId: number;
  content: string;
  authorName: string;
  authorEmail?: string;
  authorWebsite?: string;
  authorAvatar?: string;
  authorId?: number | string;
  authorIp?: string;
  isAdmin: number;
  likeCount: number;
  status: CommentStatus;
  createTime: string;
  updateTime: string;
  children?: Comment[];
  replyToAuthorName?: string;
  replyToUserId?: number;
  article?: {
    id: number | string;
    title: string;
  };
  /** 游客评论的自助删除 key（仅在创建评论时返回一次） */
  guestDeleteKey?: string;
  /** 当前登录用户是否已点赞该评论 */
  likedByMe?: boolean;
}

export enum CommentStatus {
  PENDING = 0,
  APPROVED = 1,
  REJECTED = 2,
}

// 发表评论请求
export interface CreateCommentParams {
  articleId?: number | string;
  parentId?: number;
  content: string;
  authorName: string;
  authorEmail?: string;
  authorWebsite?: string;
}

// ==================== 好友申请相关类型 ====================

export enum TrustRequestStatus {
  PENDING = 0,
  APPROVED = 1,
  REJECTED = 2,
}

export interface TrustRequestAttachment {
  id: number;
  fileName: string;
  fileUrl: string;
  fileSize?: number;
  contentType?: string;
  createTime?: string;
}

export interface TrustRequest {
  id: number | string;
  userId: number | string;
  username?: string;
  nickname?: string;
  userEmail?: string;
  userTrustLevel?: UserTrustLevel;
  status: TrustRequestStatus;
  reason: string;
  attachments: TrustRequestAttachment[];
  contactEmail?: string;
  reviewNote?: string;
  reviewedBy?: number | string;
  reviewerName?: string;
  reviewedAt?: string;
  createTime: string;
  updateTime: string;
}
