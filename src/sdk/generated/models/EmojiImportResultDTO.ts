/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
import type { EmojiImportErrorDTO } from './EmojiImportErrorDTO';
/**
 * 表情包导入结果
 */
export type EmojiImportResultDTO = {
    /**
     * 导入的表情包编码
     */
    packCode?: string;
    /**
     * 成功导入数量
     */
    successCount?: number;
    /**
     * 失败数量
     */
    failCount?: number;
    /**
     * 失败详情列表
     */
    errors?: Array<EmojiImportErrorDTO>;
};

