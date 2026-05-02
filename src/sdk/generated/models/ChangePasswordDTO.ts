/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
/**
 * 修改密码请求参数
 */
export type ChangePasswordDTO = {
    /**
     * 当前密码
     */
    oldPassword: string;
    /**
     * 新密码（6-20位）
     */
    newPassword: string;
};

