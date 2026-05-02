/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
import type { UserProfileVO } from './UserProfileVO';
/**
 * 登录响应对象
 */
export type LoginResultDTO = {
    /**
     * 访问Token
     */
    token?: string;
    /**
     * 刷新Token
     */
    refreshToken?: string;
    /**
     * Token过期时间，单位秒
     */
    expires?: number;
    user?: UserProfileVO;
};

