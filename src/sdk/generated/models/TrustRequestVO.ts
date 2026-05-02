/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
import type { TrustRequestAttachmentVO } from './TrustRequestAttachmentVO';
/**
 * 响应数据
 */
export type TrustRequestVO = {
    id?: number;
    userId?: number;
    username?: string;
    nickname?: string;
    userEmail?: string;
    userTrustLevel?: number;
    status?: number;
    reason?: string;
    attachments?: Array<TrustRequestAttachmentVO>;
    contactEmail?: string;
    reviewNote?: string;
    reviewedBy?: number;
    reviewerName?: string;
    reviewedAt?: string;
    createTime?: string;
    updateTime?: string;
};

