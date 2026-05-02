/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
/**
 * 表情项创建/更新参数
 */
export type EmojiItemUpsertDTO = {
    /**
     * 表情包编码
     */
    packCode?: string;
    /**
     * 短码（唯一，如 basic_smile）
     */
    shortcode?: string;
    /**
     * 名称
     */
    label?: string;
    /**
     * 分类
     */
    category?: string;
    /**
     * 类型：0-unicode 1-image
     */
    type?: number;
    /**
     * Unicode 表情（type=0）
     */
    unicode?: string;
    /**
     * 资源URL（type=1）
     */
    assetUrl?: string;
    /**
     * 宽度（可选）
     */
    width?: number;
    /**
     * 高度（可选）
     */
    height?: number;
    /**
     * 是否启用：0-否 1-是
     */
    enabled?: number;
    /**
     * 排序号
     */
    sort?: number;
};

