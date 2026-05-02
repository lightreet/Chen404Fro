/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
/**
 * 注册请求参数
 */
export type RegisterDTO = {
    /**
     * 用户名，3-20位字母数字下划线
     */
    username: string;
    /**
     * 密码，6-20位
     */
    password: string;
    /**
     * 昵称（可选）
     */
    nickname?: string;
    /**
     * 邮箱（邮箱注册时必填）
     */
    email?: string;
    /**
     * 手机号（手机注册时必填）
     */
    phone?: string;
    /**
     * 验证码
     */
    code: string;
    /**
     * 注册类型：email-邮箱注册 phone-手机号注册
     */
    registerType?: string;
};

