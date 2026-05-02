/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
import type { CommentVO } from './CommentVO';
/**
 * 统一响应结果
 */
export type ResultCommentVO = {
    /**
     * 状态码，200表示成功
     */
    code?: number;
    /**
     * 提示信息
     */
    message?: string;
    data?: CommentVO;
};

