/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
import type { ChangePasswordDTO } from '../models/ChangePasswordDTO';
import type { CreateArticleCommand } from '../models/CreateArticleCommand';
import type { CreateCategoryCommand } from '../models/CreateCategoryCommand';
import type { CreateCommentDTO } from '../models/CreateCommentDTO';
import type { CreateTrustRequestDTO } from '../models/CreateTrustRequestDTO';
import type { EmojiItemUpsertDTO } from '../models/EmojiItemUpsertDTO';
import type { EmojiPackUpsertDTO } from '../models/EmojiPackUpsertDTO';
import type { LoginDTO } from '../models/LoginDTO';
import type { MultiFileUploadDTO } from '../models/MultiFileUploadDTO';
import type { RefreshTokenDTO } from '../models/RefreshTokenDTO';
import type { RegisterDTO } from '../models/RegisterDTO';
import type { ResultArticleDetailVO } from '../models/ResultArticleDetailVO';
import type { ResultArticleLikeResult } from '../models/ResultArticleLikeResult';
import type { ResultArticleNeighborsVO } from '../models/ResultArticleNeighborsVO';
import type { ResultBoolean } from '../models/ResultBoolean';
import type { ResultCategoryVO } from '../models/ResultCategoryVO';
import type { ResultCommentLikeResult } from '../models/ResultCommentLikeResult';
import type { ResultCommentVO } from '../models/ResultCommentVO';
import type { ResultEmojiImportResultDTO } from '../models/ResultEmojiImportResultDTO';
import type { ResultEmojiItemVO } from '../models/ResultEmojiItemVO';
import type { ResultEmojiPackVO } from '../models/ResultEmojiPackVO';
import type { ResultFavoriteToggleResultDTO } from '../models/ResultFavoriteToggleResultDTO';
import type { ResultHomeDataVO } from '../models/ResultHomeDataVO';
import type { ResultListArchiveYearVO } from '../models/ResultListArchiveYearVO';
import type { ResultListArticleListItemVO } from '../models/ResultListArticleListItemVO';
import type { ResultListBannerVO } from '../models/ResultListBannerVO';
import type { ResultListCategoryVO } from '../models/ResultListCategoryVO';
import type { ResultListEmojiItemVO } from '../models/ResultListEmojiItemVO';
import type { ResultListEmojiPackVO } from '../models/ResultListEmojiPackVO';
import type { ResultListRecentCommentVO } from '../models/ResultListRecentCommentVO';
import type { ResultListSiteMemberDTO } from '../models/ResultListSiteMemberDTO';
import type { ResultListTagVO } from '../models/ResultListTagVO';
import type { ResultListUploadFileVO } from '../models/ResultListUploadFileVO';
import type { ResultLoginResultDTO } from '../models/ResultLoginResultDTO';
import type { ResultPageResultArticleListItemVO } from '../models/ResultPageResultArticleListItemVO';
import type { ResultPageResultCategoryVO } from '../models/ResultPageResultCategoryVO';
import type { ResultPageResultCommentVO } from '../models/ResultPageResultCommentVO';
import type { ResultPageResultEmojiItemVO } from '../models/ResultPageResultEmojiItemVO';
import type { ResultPageResultEmojiPackVO } from '../models/ResultPageResultEmojiPackVO';
import type { ResultPageResultTrustRequestVO } from '../models/ResultPageResultTrustRequestVO';
import type { ResultSendCodeResultDTO } from '../models/ResultSendCodeResultDTO';
import type { ResultSiteConfigDTO } from '../models/ResultSiteConfigDTO';
import type { ResultSiteMemberDTO } from '../models/ResultSiteMemberDTO';
import type { ResultSiteOwnerDTO } from '../models/ResultSiteOwnerDTO';
import type { ResultSiteStatsVO } from '../models/ResultSiteStatsVO';
import type { ResultTagVO } from '../models/ResultTagVO';
import type { ResultTokenRefreshResultDTO } from '../models/ResultTokenRefreshResultDTO';
import type { ResultTrustRequestVO } from '../models/ResultTrustRequestVO';
import type { ResultUploadFileVO } from '../models/ResultUploadFileVO';
import type { ResultUserProfileVO } from '../models/ResultUserProfileVO';
import type { ResultVoid } from '../models/ResultVoid';
import type { ReviewCommentDTO } from '../models/ReviewCommentDTO';
import type { ReviewTrustRequestDTO } from '../models/ReviewTrustRequestDTO';
import type { SendCodeDTO } from '../models/SendCodeDTO';
import type { SingleFileUploadDTO } from '../models/SingleFileUploadDTO';
import type { SiteConfigDTO } from '../models/SiteConfigDTO';
import type { UpdateArticleCommand } from '../models/UpdateArticleCommand';
import type { UpdateCategoryCommand } from '../models/UpdateCategoryCommand';
import type { UpdateProfileDTO } from '../models/UpdateProfileDTO';
import type { UpdateTrustLevelDTO } from '../models/UpdateTrustLevelDTO';
import type { CancelablePromise } from '../core/CancelablePromise';
import { OpenAPI } from '../core/OpenAPI';
import { request as __request } from '../core/request';
export class Service {
    /**
     * 获取站点配置
     * 返回站点名称、描述、Logo、SEO 等公开配置
     * @returns ResultSiteConfigDTO OK
     * @throws ApiError
     */
    public static getSiteConfig(): CancelablePromise<ResultSiteConfigDTO> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/site/config',
        });
    }
    /**
     * 更新站点配置
     * 仅管理员可更新站点公开配置
     * @returns ResultSiteConfigDTO OK
     * @throws ApiError
     */
    public static updateSiteConfig({
        requestBody,
    }: {
        requestBody: SiteConfigDTO,
    }): CancelablePromise<ResultSiteConfigDTO> {
        return __request(OpenAPI, {
            method: 'PUT',
            url: '/site/config',
            body: requestBody,
            mediaType: 'application/json',
        });
    }
    /**
     * 获取分类详情
     * @returns ResultCategoryVO OK
     * @throws ApiError
     */
    public static getCategoryById({
        id,
    }: {
        /**
         * 分类ID
         */
        id: number,
    }): CancelablePromise<ResultCategoryVO> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/categories/{id}',
            path: {
                'id': id,
            },
        });
    }
    /**
     * 更新分类
     * 仅管理员
     * @returns ResultCategoryVO OK
     * @throws ApiError
     */
    public static updateCategory({
        id,
        requestBody,
    }: {
        /**
         * 分类ID
         */
        id: number,
        requestBody: UpdateCategoryCommand,
    }): CancelablePromise<ResultCategoryVO> {
        return __request(OpenAPI, {
            method: 'PUT',
            url: '/categories/{id}',
            path: {
                'id': id,
            },
            body: requestBody,
            mediaType: 'application/json',
        });
    }
    /**
     * 删除分类
     * 仅管理员，逻辑删除
     * @returns ResultVoid OK
     * @throws ApiError
     */
    public static deleteCategory({
        id,
    }: {
        /**
         * 分类ID
         */
        id: number,
    }): CancelablePromise<ResultVoid> {
        return __request(OpenAPI, {
            method: 'DELETE',
            url: '/categories/{id}',
            path: {
                'id': id,
            },
        });
    }
    /**
     * 更新个人资料
     * 需要登录，可更新昵称与头像
     * @returns ResultUserProfileVO OK
     * @throws ApiError
     */
    public static updateProfile({
        requestBody,
    }: {
        requestBody: UpdateProfileDTO,
    }): CancelablePromise<ResultUserProfileVO> {
        return __request(OpenAPI, {
            method: 'PUT',
            url: '/auth/profile',
            body: requestBody,
            mediaType: 'application/json',
        });
    }
    /**
     * 获取文章详情
     * 获取单篇文章的详细信息
     * @returns ResultArticleDetailVO OK
     * @throws ApiError
     */
    public static getArticleById({
        id,
        incrementView = true,
    }: {
        /**
         * 文章 ID
         */
        id: number,
        /**
         * 是否增加浏览量，默认 true
         */
        incrementView?: boolean,
    }): CancelablePromise<ResultArticleDetailVO> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/articles/{id}',
            path: {
                'id': id,
            },
            query: {
                'incrementView': incrementView,
            },
        });
    }
    /**
     * 更新文章
     * 更新已有文章，需要登录
     * @returns ResultArticleDetailVO OK
     * @throws ApiError
     */
    public static updateArticle({
        id,
        requestBody,
    }: {
        /**
         * 文章 ID
         */
        id: number,
        requestBody: UpdateArticleCommand,
    }): CancelablePromise<ResultArticleDetailVO> {
        return __request(OpenAPI, {
            method: 'PUT',
            url: '/articles/{id}',
            path: {
                'id': id,
            },
            body: requestBody,
            mediaType: 'application/json',
        });
    }
    /**
     * 删除文章
     * 逻辑删除，需要登录
     * @returns ResultVoid OK
     * @throws ApiError
     */
    public static deleteArticle({
        id,
    }: {
        /**
         * 文章 ID
         */
        id: number,
    }): CancelablePromise<ResultVoid> {
        return __request(OpenAPI, {
            method: 'DELETE',
            url: '/articles/{id}',
            path: {
                'id': id,
            },
        });
    }
    /**
     * 更新用户信任级别
     * 仅管理员可设置读者/知友状态
     * @returns ResultUserProfileVO OK
     * @throws ApiError
     */
    public static updateTrustLevel({
        id,
        requestBody,
    }: {
        /**
         * 用户 ID
         */
        id: number,
        requestBody: UpdateTrustLevelDTO,
    }): CancelablePromise<ResultUserProfileVO> {
        return __request(OpenAPI, {
            method: 'PUT',
            url: '/admin/users/{id}/trust-level',
            path: {
                'id': id,
            },
            body: requestBody,
            mediaType: 'application/json',
        });
    }
    /**
     * ?????????
     * ????????????????
     * @returns ResultTrustRequestVO OK
     * @throws ApiError
     */
    public static rejectRequest({
        id,
        requestBody,
    }: {
        /**
         * ???? ID
         */
        id: number,
        requestBody: ReviewTrustRequestDTO,
    }): CancelablePromise<ResultTrustRequestVO> {
        return __request(OpenAPI, {
            method: 'PUT',
            url: '/admin/trust-requests/{id}/reject',
            path: {
                'id': id,
            },
            body: requestBody,
            mediaType: 'application/json',
        });
    }
    /**
     * ?????????
     * ???????????????
     * @returns ResultTrustRequestVO OK
     * @throws ApiError
     */
    public static approveRequest({
        id,
        requestBody,
    }: {
        /**
         * ???? ID
         */
        id: number,
        requestBody?: ReviewTrustRequestDTO,
    }): CancelablePromise<ResultTrustRequestVO> {
        return __request(OpenAPI, {
            method: 'PUT',
            url: '/admin/trust-requests/{id}/approve',
            path: {
                'id': id,
            },
            body: requestBody,
            mediaType: 'application/json',
        });
    }
    /**
     * 审核评论
     * 仅管理员
     * @returns ResultCommentVO OK
     * @throws ApiError
     */
    public static reviewComment({
        id,
        requestBody,
    }: {
        id: number,
        requestBody: ReviewCommentDTO,
    }): CancelablePromise<ResultCommentVO> {
        return __request(OpenAPI, {
            method: 'PUT',
            url: '/admin/comments/{id}/review',
            path: {
                'id': id,
            },
            body: requestBody,
            mediaType: 'application/json',
        });
    }
    /**
     * 上传受信申请附件
     * 用于受信任用户申请的附件上传
     * @returns ResultUploadFileVO OK
     * @throws ApiError
     */
    public static uploadTrustAttachment({
        formData,
    }: {
        formData?: SingleFileUploadDTO,
    }): CancelablePromise<ResultUploadFileVO> {
        return __request(OpenAPI, {
            method: 'POST',
            url: '/upload/trust-attachment',
            formData: formData,
            mediaType: 'multipart/form-data',
        });
    }
    /**
     * 上传站点资源图片
     * 站点配置中的 Logo、Favicon 与页面封面图片上传，保持原图不压缩
     * @returns ResultUploadFileVO OK
     * @throws ApiError
     */
    public static uploadSiteAsset({
        formData,
    }: {
        formData?: SingleFileUploadDTO,
    }): CancelablePromise<ResultUploadFileVO> {
        return __request(OpenAPI, {
            method: 'POST',
            url: '/upload/site-asset',
            formData: formData,
            mediaType: 'multipart/form-data',
        });
    }
    /**
     * 批量上传文章图片
     * 一次最多上传 10 张图片
     * @returns ResultListUploadFileVO OK
     * @throws ApiError
     */
    public static uploadImages({
        formData,
    }: {
        formData?: MultiFileUploadDTO,
    }): CancelablePromise<ResultListUploadFileVO> {
        return __request(OpenAPI, {
            method: 'POST',
            url: '/upload/images',
            formData: formData,
            mediaType: 'multipart/form-data',
        });
    }
    /**
     * 上传文章图片
     * 编辑器内单张图片上传
     * @returns ResultUploadFileVO OK
     * @throws ApiError
     */
    public static uploadImage({
        formData,
    }: {
        formData?: SingleFileUploadDTO,
    }): CancelablePromise<ResultUploadFileVO> {
        return __request(OpenAPI, {
            method: 'POST',
            url: '/upload/image',
            formData: formData,
            mediaType: 'multipart/form-data',
        });
    }
    /**
     * 上传文章封面
     * 文章封面上传
     * @returns ResultUploadFileVO OK
     * @throws ApiError
     */
    public static uploadCover({
        formData,
    }: {
        formData?: SingleFileUploadDTO,
    }): CancelablePromise<ResultUploadFileVO> {
        return __request(OpenAPI, {
            method: 'POST',
            url: '/upload/cover',
            formData: formData,
            mediaType: 'multipart/form-data',
        });
    }
    /**
     * 上传头像
     * 用户头像上传
     * @returns ResultUploadFileVO OK
     * @throws ApiError
     */
    public static uploadAvatar({
        formData,
    }: {
        formData?: SingleFileUploadDTO,
    }): CancelablePromise<ResultUploadFileVO> {
        return __request(OpenAPI, {
            method: 'POST',
            url: '/upload/avatar',
            formData: formData,
            mediaType: 'multipart/form-data',
        });
    }
    /**
     * ??????
     * ???????????????? URL ??
     * @returns ResultTrustRequestVO OK
     * @throws ApiError
     */
    public static createRequest({
        requestBody,
    }: {
        requestBody: CreateTrustRequestDTO,
    }): CancelablePromise<ResultTrustRequestVO> {
        return __request(OpenAPI, {
            method: 'POST',
            url: '/trust-requests',
            body: requestBody,
            mediaType: 'application/json',
        });
    }
    /**
     * 获取评论列表
     * 按 articleId 分页查询已审核评论树
     * @returns ResultPageResultCommentVO OK
     * @throws ApiError
     */
    public static getComments({
        articleId,
        page = 1,
        size = 10,
    }: {
        articleId?: number,
        page?: number,
        size?: number,
    }): CancelablePromise<ResultPageResultCommentVO> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/comments',
            query: {
                'articleId': articleId,
                'page': page,
                'size': size,
            },
        });
    }
    /**
     * 发表评论
     * @returns ResultCommentVO OK
     * @throws ApiError
     */
    public static createComment({
        requestBody,
    }: {
        requestBody: CreateCommentDTO,
    }): CancelablePromise<ResultCommentVO> {
        return __request(OpenAPI, {
            method: 'POST',
            url: '/comments',
            body: requestBody,
            mediaType: 'application/json',
        });
    }
    /**
     * 点赞评论
     * @returns ResultCommentLikeResult OK
     * @throws ApiError
     */
    public static likeComment({
        id,
    }: {
        id: number,
    }): CancelablePromise<ResultCommentLikeResult> {
        return __request(OpenAPI, {
            method: 'POST',
            url: '/comments/{id}/like',
            path: {
                'id': id,
            },
        });
    }
    /**
     * 获取所有分类
     * @returns ResultListCategoryVO OK
     * @throws ApiError
     */
    public static getCategories({
        withArticleCount = false,
    }: {
        withArticleCount?: boolean,
    }): CancelablePromise<ResultListCategoryVO> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/categories',
            query: {
                'withArticleCount': withArticleCount,
            },
        });
    }
    /**
     * 创建分类
     * 仅管理员
     * @returns ResultCategoryVO OK
     * @throws ApiError
     */
    public static createCategory({
        requestBody,
    }: {
        requestBody: CreateCategoryCommand,
    }): CancelablePromise<ResultCategoryVO> {
        return __request(OpenAPI, {
            method: 'POST',
            url: '/categories',
            body: requestBody,
            mediaType: 'application/json',
        });
    }
    /**
     * 发送验证码
     * 支持邮箱和手机号发送验证码
     * @returns ResultSendCodeResultDTO OK
     * @throws ApiError
     */
    public static sendCode({
        requestBody,
    }: {
        requestBody: SendCodeDTO,
    }): CancelablePromise<ResultSendCodeResultDTO> {
        return __request(OpenAPI, {
            method: 'POST',
            url: '/auth/send-code',
            body: requestBody,
            mediaType: 'application/json',
        });
    }
    /**
     * 用户注册
     * 支持邮箱注册，需要验证码
     * @returns ResultUserProfileVO OK
     * @throws ApiError
     */
    public static register({
        requestBody,
    }: {
        requestBody: RegisterDTO,
    }): CancelablePromise<ResultUserProfileVO> {
        return __request(OpenAPI, {
            method: 'POST',
            url: '/auth/register',
            body: requestBody,
            mediaType: 'application/json',
        });
    }
    /**
     * 刷新 Token
     * 使用 refreshToken 换取新的访问 token，无需重新登录
     * @returns ResultTokenRefreshResultDTO OK
     * @throws ApiError
     */
    public static refresh({
        requestBody,
    }: {
        requestBody: RefreshTokenDTO,
    }): CancelablePromise<ResultTokenRefreshResultDTO> {
        return __request(OpenAPI, {
            method: 'POST',
            url: '/auth/refresh',
            body: requestBody,
            mediaType: 'application/json',
        });
    }
    /**
     * 退出登录
     * 客户端清除 token，并吊销当前 refreshToken
     * @returns ResultVoid OK
     * @throws ApiError
     */
    public static logout({
        requestBody,
    }: {
        requestBody?: RefreshTokenDTO,
    }): CancelablePromise<ResultVoid> {
        return __request(OpenAPI, {
            method: 'POST',
            url: '/auth/logout',
            body: requestBody,
            mediaType: 'application/json',
        });
    }
    /**
     * 用户登录
     * 支持用户名、邮箱、手机号三种登录方式
     * @returns ResultLoginResultDTO OK
     * @throws ApiError
     */
    public static login({
        requestBody,
    }: {
        requestBody: LoginDTO,
    }): CancelablePromise<ResultLoginResultDTO> {
        return __request(OpenAPI, {
            method: 'POST',
            url: '/auth/login',
            body: requestBody,
            mediaType: 'application/json',
        });
    }
    /**
     * 修改密码
     * 需要登录，校验旧密码，成功后发送提醒邮件
     * @returns ResultVoid OK
     * @throws ApiError
     */
    public static changePassword({
        requestBody,
    }: {
        requestBody: ChangePasswordDTO,
    }): CancelablePromise<ResultVoid> {
        return __request(OpenAPI, {
            method: 'POST',
            url: '/auth/change-password',
            body: requestBody,
            mediaType: 'application/json',
        });
    }
    /**
     * 获取文章列表
     * 支持分页、分类筛选、标签筛选；关键字仅按文章标题模糊匹配
     * @returns ResultPageResultArticleListItemVO OK
     * @throws ApiError
     */
    public static getArticles({
        page = 1,
        size = 10,
        status,
        categoryId,
        tagId,
        authorId,
        keyword,
    }: {
        /**
         * 页码，默认 1
         */
        page?: number,
        /**
         * 每页数量，默认 10
         */
        size?: number,
        /**
         * 文章状态：0-草稿 1-已发布 2-回收站
         */
        status?: number,
        /**
         * 分类 ID
         */
        categoryId?: number,
        /**
         * 标签 ID
         */
        tagId?: number,
        /**
         * 作者 ID
         */
        authorId?: number,
        /**
         * 搜索关键字，仅匹配文章标题
         */
        keyword?: string,
    }): CancelablePromise<ResultPageResultArticleListItemVO> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/articles',
            query: {
                'page': page,
                'size': size,
                'status': status,
                'categoryId': categoryId,
                'tagId': tagId,
                'authorId': authorId,
                'keyword': keyword,
            },
        });
    }
    /**
     * 创建文章
     * 发布新文章或保存草稿，需要登录
     * @returns ResultArticleDetailVO OK
     * @throws ApiError
     */
    public static createArticle({
        requestBody,
    }: {
        requestBody: CreateArticleCommand,
    }): CancelablePromise<ResultArticleDetailVO> {
        return __request(OpenAPI, {
            method: 'POST',
            url: '/articles',
            body: requestBody,
            mediaType: 'application/json',
        });
    }
    /**
     * 点赞文章
     * 为文章点赞
     * @returns ResultArticleLikeResult OK
     * @throws ApiError
     */
    public static likeArticle({
        id,
    }: {
        /**
         * 文章 ID
         */
        id: number,
    }): CancelablePromise<ResultArticleLikeResult> {
        return __request(OpenAPI, {
            method: 'POST',
            url: '/articles/{id}/like',
            path: {
                'id': id,
            },
        });
    }
    /**
     * 切换收藏
     * 登录用户收藏/取消收藏文章
     * @returns ResultFavoriteToggleResultDTO OK
     * @throws ApiError
     */
    public static toggleFavorite({
        id,
    }: {
        id: number,
    }): CancelablePromise<ResultFavoriteToggleResultDTO> {
        return __request(OpenAPI, {
            method: 'POST',
            url: '/articles/{id}/favorite',
            path: {
                'id': id,
            },
        });
    }
    /**
     * 分页查询表情包
     * 仅管理员
     * @returns ResultPageResultEmojiPackVO OK
     * @throws ApiError
     */
    public static listPacks({
        page = 1,
        size = 10,
    }: {
        page?: number,
        size?: number,
    }): CancelablePromise<ResultPageResultEmojiPackVO> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/admin/emoji/packs',
            query: {
                'page': page,
                'size': size,
            },
        });
    }
    /**
     * 新增或更新表情包
     * 仅管理员
     * @returns ResultEmojiPackVO OK
     * @throws ApiError
     */
    public static upsertPack({
        requestBody,
    }: {
        requestBody: EmojiPackUpsertDTO,
    }): CancelablePromise<ResultEmojiPackVO> {
        return __request(OpenAPI, {
            method: 'POST',
            url: '/admin/emoji/packs',
            body: requestBody,
            mediaType: 'application/json',
        });
    }
    /**
     * 分页查询表情项
     * 仅管理员
     * @returns ResultPageResultEmojiItemVO OK
     * @throws ApiError
     */
    public static listItems({
        page = 1,
        size = 12,
        packCode,
    }: {
        page?: number,
        size?: number,
        packCode?: string,
    }): CancelablePromise<ResultPageResultEmojiItemVO> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/admin/emoji/items',
            query: {
                'page': page,
                'size': size,
                'packCode': packCode,
            },
        });
    }
    /**
     * 新增或更新表情项
     * 仅管理员
     * @returns ResultEmojiItemVO OK
     * @throws ApiError
     */
    public static upsertItem({
        requestBody,
    }: {
        requestBody: EmojiItemUpsertDTO,
    }): CancelablePromise<ResultEmojiItemVO> {
        return __request(OpenAPI, {
            method: 'POST',
            url: '/admin/emoji/items',
            body: requestBody,
            mediaType: 'application/json',
        });
    }
    /**
     * 导入表情包 ZIP
     * 仅管理员
     * @returns ResultEmojiImportResultDTO OK
     * @throws ApiError
     */
    public static importZip({
        requestBody,
    }: {
        requestBody?: {
            file: Blob;
        },
    }): CancelablePromise<ResultEmojiImportResultDTO> {
        return __request(OpenAPI, {
            method: 'POST',
            url: '/admin/emoji/import',
            body: requestBody,
            mediaType: 'application/json',
        });
    }
    /**
     * ????????????
     * ??????????????????????????????
     * @returns ResultTrustRequestVO OK
     * @throws ApiError
     */
    public static getMyLatestRequest(): CancelablePromise<ResultTrustRequestVO> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/trust-requests/me/latest',
        });
    }
    /**
     * ???????????
     * ??????????????????? HTML ???
     * @returns string OK
     * @throws ApiError
     */
    public static approveByEmail({
        token,
    }: {
        /**
         * ??????
         */
        token: string,
    }): CancelablePromise<string> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/trust-requests/email-approve',
            query: {
                'token': token,
            },
        });
    }
    /**
     * 获取所有标签
     * 返回启用中的标签列表，可选择是否附带文章数量字段
     * @returns ResultListTagVO OK
     * @throws ApiError
     */
    public static getTags({
        withArticleCount = false,
    }: {
        /**
         * 是否包含文章数量，默认 false
         */
        withArticleCount?: boolean,
    }): CancelablePromise<ResultListTagVO> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/tags',
            query: {
                'withArticleCount': withArticleCount,
            },
        });
    }
    /**
     * 获取标签详情
     * 根据标签 ID 或 slug 获取单个标签详情
     * @returns ResultTagVO OK
     * @throws ApiError
     */
    public static getTagById({
        idOrSlug,
    }: {
        /**
         * 标签 ID 或 slug
         */
        idOrSlug: string,
    }): CancelablePromise<ResultTagVO> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/tags/{idOrSlug}',
            path: {
                'idOrSlug': idOrSlug,
            },
        });
    }
    /**
     * 获取站点成员详情
     * 按用户 ID 获取单个成员的公开资料
     * @returns ResultSiteMemberDTO OK
     * @throws ApiError
     */
    public static getSiteUser({
        id,
    }: {
        /**
         * 用户 ID
         */
        id: number,
    }): CancelablePromise<ResultSiteMemberDTO> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/site/users/{id}',
            path: {
                'id': id,
            },
        });
    }
    /**
     * 获取站长公开资料
     * 返回站长的公开展示信息
     * @returns ResultSiteOwnerDTO OK
     * @throws ApiError
     */
    public static getSiteOwner(): CancelablePromise<ResultSiteOwnerDTO> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/site/owner',
        });
    }
    /**
     * 获取站点成员列表
     * 返回可公开展示的站点成员列表
     * @returns ResultListSiteMemberDTO OK
     * @throws ApiError
     */
    public static getSiteMembers(): CancelablePromise<ResultListSiteMemberDTO> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/site/members',
        });
    }
    /**
     * 获取轮播图列表
     * 按位置获取启用中的轮播图
     * @returns ResultListBannerVO OK
     * @throws ApiError
     */
    public static getBanners({
        position = 1,
    }: {
        /**
         * 轮播图位置，默认 1
         */
        position?: number,
    }): CancelablePromise<ResultListBannerVO> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/site/banners',
            query: {
                'position': position,
            },
        });
    }
    /**
     * 获取首页聚合数据
     * 返回首页轮播图、站点统计、热门文章与最新评论
     * @returns ResultHomeDataVO OK
     * @throws ApiError
     */
    public static getHomeData(): CancelablePromise<ResultHomeDataVO> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/home',
        });
    }
    /**
     * 获取站点统计
     * 返回文章数、分类数、标签数、评论数与总浏览量
     * @returns ResultSiteStatsVO OK
     * @throws ApiError
     */
    public static getSiteStats(): CancelablePromise<ResultSiteStatsVO> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/home/stats',
        });
    }
    /**
     * 获取表情包列表（启用）
     * @returns ResultListEmojiPackVO OK
     * @throws ApiError
     */
    public static packs(): CancelablePromise<ResultListEmojiPackVO> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/emoji/packs',
        });
    }
    /**
     * 获取表情项列表（启用）
     * 可按 scene/packCode 过滤，scene 当前仅用于前端策略，不做后端过滤
     * @returns ResultListEmojiItemVO OK
     * @throws ApiError
     */
    public static items({
        scene,
        packCode,
    }: {
        scene?: string,
        packCode?: string,
    }): CancelablePromise<ResultListEmojiItemVO> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/emoji/items',
            query: {
                'scene': scene,
                'packCode': packCode,
            },
        });
    }
    /**
     * 获取最新评论
     * @returns ResultListRecentCommentVO OK
     * @throws ApiError
     */
    public static getRecentComments({
        limit = 5,
    }: {
        limit?: number,
    }): CancelablePromise<ResultListRecentCommentVO> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/comments/recent',
            query: {
                'limit': limit,
            },
        });
    }
    /**
     * 获取留言板评论
     * @returns ResultPageResultCommentVO OK
     * @throws ApiError
     */
    public static getGuestbookComments({
        page = 1,
        size = 10,
    }: {
        page?: number,
        size?: number,
    }): CancelablePromise<ResultPageResultCommentVO> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/comments/guestbook',
            query: {
                'page': page,
                'size': size,
            },
        });
    }
    /**
     * 获取当前用户信息
     * 需要登录，从 JWT Token 中解析当前用户资料
     * @returns ResultUserProfileVO OK
     * @throws ApiError
     */
    public static getUserInfo(): CancelablePromise<ResultUserProfileVO> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/auth/info',
        });
    }
    /**
     * 检查用户名是否存在
     * 用于注册时校验用户名是否已被占用
     * @returns ResultBoolean OK
     * @throws ApiError
     */
    public static checkUsername({
        username,
    }: {
        /**
         * 用户名
         */
        username: string,
    }): CancelablePromise<ResultBoolean> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/auth/check-username',
            query: {
                'username': username,
            },
        });
    }
    /**
     * 检查手机号是否存在
     * 用于注册时校验手机号是否已被注册
     * @returns ResultBoolean OK
     * @throws ApiError
     */
    public static checkPhone({
        phone,
    }: {
        /**
         * 手机号
         */
        phone: string,
    }): CancelablePromise<ResultBoolean> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/auth/check-phone',
            query: {
                'phone': phone,
            },
        });
    }
    /**
     * 检查邮箱是否存在
     * 用于注册时校验邮箱地址是否已被注册
     * @returns ResultBoolean OK
     * @throws ApiError
     */
    public static checkEmail({
        email,
    }: {
        /**
         * 邮箱地址
         */
        email: string,
    }): CancelablePromise<ResultBoolean> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/auth/check-email',
            query: {
                'email': email,
            },
        });
    }
    /**
     * 上一篇 / 下一篇
     * 按发布时间获取相邻文章
     * @returns ResultArticleNeighborsVO OK
     * @throws ApiError
     */
    public static getArticleNeighbors({
        id,
    }: {
        /**
         * 当前文章 ID
         */
        id: number,
    }): CancelablePromise<ResultArticleNeighborsVO> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/articles/{id}/neighbors',
            path: {
                'id': id,
            },
        });
    }
    /**
     * 获取推荐文章
     * 获取管理员推荐的文章列表
     * @returns ResultListArticleListItemVO OK
     * @throws ApiError
     */
    public static getRecommendArticles({
        limit = 6,
    }: {
        /**
         * 返回数量，默认 6
         */
        limit?: number,
    }): CancelablePromise<ResultListArticleListItemVO> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/articles/recommend',
            query: {
                'limit': limit,
            },
        });
    }
    /**
     * 我的文章列表
     * 分页获取当前登录用户的文章，需要登录
     * @returns ResultPageResultArticleListItemVO OK
     * @throws ApiError
     */
    public static getMyArticles({
        page = 1,
        size = 10,
        status,
        keyword,
    }: {
        page?: number,
        size?: number,
        status?: number,
        keyword?: string,
    }): CancelablePromise<ResultPageResultArticleListItemVO> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/articles/mine',
            query: {
                'page': page,
                'size': size,
                'status': status,
                'keyword': keyword,
            },
        });
    }
    /**
     * 我的点赞文章
     * 分页获取当前用户点赞过且仍可见的文章，需要登录
     * @returns ResultPageResultArticleListItemVO OK
     * @throws ApiError
     */
    public static getMyLikedArticles({
        page = 1,
        size = 10,
    }: {
        page?: number,
        size?: number,
    }): CancelablePromise<ResultPageResultArticleListItemVO> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/articles/mine/liked',
            query: {
                'page': page,
                'size': size,
            },
        });
    }
    /**
     * 我的收藏文章
     * 分页获取当前用户收藏的文章，需要登录
     * @returns ResultPageResultArticleListItemVO OK
     * @throws ApiError
     */
    public static getMyFavoriteArticles({
        page = 1,
        size = 10,
    }: {
        page?: number,
        size?: number,
    }): CancelablePromise<ResultPageResultArticleListItemVO> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/articles/mine/favorites',
            query: {
                'page': page,
                'size': size,
            },
        });
    }
    /**
     * 获取热门文章
     * 根据浏览量排序获取热门文章
     * @returns ResultListArticleListItemVO OK
     * @throws ApiError
     */
    public static getHotArticles({
        limit = 10,
    }: {
        /**
         * 返回数量，默认 10
         */
        limit?: number,
    }): CancelablePromise<ResultListArticleListItemVO> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/articles/hot',
            query: {
                'limit': limit,
            },
        });
    }
    /**
     * 归档时间线
     * 仅包含已发布且公开可见、有发布时间的文章，按发布时间倒序分组
     * @returns ResultListArchiveYearVO OK
     * @throws ApiError
     */
    public static listArchives(): CancelablePromise<ResultListArchiveYearVO> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/archives',
        });
    }
    /**
     * ???????????
     * ???????????????????
     * @returns ResultPageResultTrustRequestVO OK
     * @throws ApiError
     */
    public static getAdminRequests({
        page = 1,
        size = 10,
        status,
        keyword,
    }: {
        /**
         * ???? 1 ??
         */
        page?: number,
        /**
         * ????
         */
        size?: number,
        /**
         * ?????0-??? 1-??? 2-???
         */
        status?: number,
        /**
         * ????????????????????
         */
        keyword?: string,
    }): CancelablePromise<ResultPageResultTrustRequestVO> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/admin/trust-requests',
            query: {
                'page': page,
                'size': size,
                'status': status,
                'keyword': keyword,
            },
        });
    }
    /**
     * 分页获取分类
     * 仅管理员
     * @returns ResultPageResultCategoryVO OK
     * @throws ApiError
     */
    public static pageCategories({
        page = 1,
        size = 10,
    }: {
        page?: number,
        size?: number,
    }): CancelablePromise<ResultPageResultCategoryVO> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/admin/categories',
            query: {
                'page': page,
                'size': size,
            },
        });
    }
    /**
     * 删除文件
     * 根据文件 URL 删除已上传文件
     * @returns ResultVoid OK
     * @throws ApiError
     */
    public static deleteFile({
        url,
    }: {
        /**
         * 文件 URL
         */
        url: string,
    }): CancelablePromise<ResultVoid> {
        return __request(OpenAPI, {
            method: 'DELETE',
            url: '/upload/file',
            query: {
                'url': url,
            },
        });
    }
    /**
     * 删除评论
     * @returns ResultVoid OK
     * @throws ApiError
     */
    public static deleteComment({
        id,
        guestDeleteKey,
    }: {
        id: number,
        guestDeleteKey?: string,
    }): CancelablePromise<ResultVoid> {
        return __request(OpenAPI, {
            method: 'DELETE',
            url: '/comments/{id}',
            path: {
                'id': id,
            },
            query: {
                'guestDeleteKey': guestDeleteKey,
            },
        });
    }
    /**
     * 删除表情包
     * 仅管理员
     * @returns ResultVoid OK
     * @throws ApiError
     */
    public static deletePack({
        id,
    }: {
        id: number,
    }): CancelablePromise<ResultVoid> {
        return __request(OpenAPI, {
            method: 'DELETE',
            url: '/admin/emoji/packs/{id}',
            path: {
                'id': id,
            },
        });
    }
    /**
     * 删除表情项
     * 仅管理员
     * @returns ResultVoid OK
     * @throws ApiError
     */
    public static deleteItem({
        id,
    }: {
        id: number,
    }): CancelablePromise<ResultVoid> {
        return __request(OpenAPI, {
            method: 'DELETE',
            url: '/admin/emoji/items/{id}',
            path: {
                'id': id,
            },
        });
    }
}
