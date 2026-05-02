/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
/**
 * 表情包视图对象
 */
export type EmojiPackVO = {
    /**
     * 表情包ID
     */
    id?: number;
    /**
     * 表情包编码
     */
    packCode?: string;
    /**
     * 表情包名称
     */
    name?: string;
    /**
     * 表情包描述
     */
    description?: string;
    /**
     * 图标地址
     */
    iconUrl?: string;
    /**
     * 是否启用：0-否 1-是
     */
    enabled?: number;
    /**
     * 排序值
     */
    sort?: number;
    /**
     * 创建时间
     */
    createTime?: string;
    /**
     * 更新时间
     */
    updateTime?: string;
};

