/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
/**
 * 表情包创建/更新参数
 */
export type EmojiPackUpsertDTO = {
    /**
     * 表情包编码（唯一）
     */
    packCode?: string;
    /**
     * 表情包名称
     */
    name?: string;
    /**
     * 描述
     */
    description?: string;
    /**
     * 图标URL
     */
    iconUrl?: string;
    /**
     * 是否启用：0-否 1-是
     */
    enabled?: number;
    /**
     * 排序号
     */
    sort?: number;
};

