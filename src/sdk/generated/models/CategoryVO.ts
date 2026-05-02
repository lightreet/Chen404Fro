/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
/**
 * 分类视图对象
 */
export type CategoryVO = {
    /**
     * 分类ID
     */
    id?: number;
    /**
     * 分类名称
     */
    name?: string;
    /**
     * 分类别名
     */
    slug?: string;
    /**
     * 分类描述
     */
    description?: string;
    /**
     * 分类图标
     */
    icon?: string;
    /**
     * 文章数量
     */
    articleCount?: number;
    /**
     * 排序值
     */
    sortOrder?: number;
    /**
     * 状态：0-禁用 1-启用
     */
    status?: number;
    /**
     * 创建时间
     */
    createTime?: string;
    /**
     * 更新时间
     */
    updateTime?: string;
};

