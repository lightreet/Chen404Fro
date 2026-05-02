/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
/**
 * 首页轮播图视图对象
 */
export type BannerVO = {
    /**
     * 轮播图ID
     */
    id?: number;
    /**
     * 标题
     */
    title?: string;
    /**
     * 副标题
     */
    subtitle?: string;
    /**
     * 图片地址
     */
    image?: string;
    /**
     * 跳转链接
     */
    link?: string;
    /**
     * 打开方式：0-当前页 1-新窗口
     */
    target?: number;
    /**
     * 展示位置
     */
    position?: number;
    /**
     * 背景色
     */
    backgroundColor?: string;
    /**
     * 文字颜色
     */
    textColor?: string;
    /**
     * 排序值
     */
    sortOrder?: number;
    /**
     * 状态：0-停用 1-启用
     */
    status?: number;
    /**
     * 开始生效时间
     */
    startTime?: string;
    /**
     * 结束生效时间
     */
    endTime?: string;
};

