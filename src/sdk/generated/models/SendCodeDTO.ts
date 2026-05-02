/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
/**
 * 发送验证码请求参数
 */
export type SendCodeDTO = {
    /**
     * 邮箱（邮箱验证时必填）
     */
    email?: string;
    /**
     * 手机号（短信验证时必填）
     */
    phone?: string;
    /**
     * 验证码类型：register-注册 login-登录 reset-重置密码
     */
    type: string;
};

