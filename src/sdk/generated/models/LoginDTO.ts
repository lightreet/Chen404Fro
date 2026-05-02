/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
/**
 * 登录请求参数
 */
export type LoginDTO = {
    /**
     * 用户名/邮箱/手机号
     */
    username: string;
    /**
     * 密码
     */
    password: string;
    /**
     * 验证码（可选）
     */
    captcha?: string;
};

