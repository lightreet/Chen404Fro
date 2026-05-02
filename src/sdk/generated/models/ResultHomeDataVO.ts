/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
import type { HomeDataVO } from './HomeDataVO';
/**
 * 统一响应结果
 */
export type ResultHomeDataVO = {
    /**
     * 状态码，200表示成功
     */
    code?: number;
    /**
     * 提示信息
     */
    message?: string;
    data?: HomeDataVO;
};

