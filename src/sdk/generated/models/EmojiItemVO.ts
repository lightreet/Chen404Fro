/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
/**
 * 表情项视图对象
 */
export type EmojiItemVO = {
    /**
     * 表情项ID
     */
    id?: number;
    /**
     * 表情包编码
     */
    packCode?: string;
    /**
     * 短代码
     */
    shortcode?: string;
    /**
     * 显示名称
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
     * Unicode 字符串
     */
    unicode?: string;
    /**
     * 图片资源地址
     */
    assetUrl?: string;
    /**
     * 宽度
     */
    width?: number;
    /**
     * 高度
     */
    height?: number;
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

