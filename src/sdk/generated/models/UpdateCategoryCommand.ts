/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
/**
 * 更新分类命令对象
 */
export type UpdateCategoryCommand = {
    /**
     * 分类名称
     */
    name: string;
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
     * 排序值
     */
    sortOrder?: number;
    /**
     * 状态：0-禁用 1-启用
     */
    status?: number;
};

