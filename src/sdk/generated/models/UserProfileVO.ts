/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
/**
 * 用户资料视图对象
 */
export type UserProfileVO = {
    /**
     * 用户ID
     */
    id?: number;
    /**
     * 用户名
     */
    username?: string;
    /**
     * 昵称
     */
    nickname?: string;
    /**
     * 邮箱
     */
    email?: string;
    /**
     * 手机号
     */
    phone?: string;
    /**
     * 头像地址
     */
    avatar?: string;
    /**
     * 个人简介
     */
    bio?: string;
    /**
     * 用户状态：0-禁用 1-启用
     */
    status?: number;
    /**
     * 角色值
     */
    role?: number;
    /**
     * 角色编码
     */
    roleCode?: string;
    /**
     * 角色名称
     */
    roleName?: string;
    /**
     * 信任级别：0-读者 1-知友
     */
    trustLevel?: number;
    /**
     * 信任级别名称
     */
    trustLevelName?: string;
    /**
     * 成员标签
     */
    memberLabel?: string;
    /**
     * 创建时间
     */
    createTime?: string;
    /**
     * 最后登录时间
     */
    lastLoginTime?: string;
    /**
     * 最后登录IP
     */
    lastLoginIp?: string;
};

