import { get, post, put } from './request';
import type { AiAdminConfig, AiConfigTestRequest, AiConfigTestResponse } from '@/types';

const AI_CONFIG_PATH = '/admin/ai/config';

export function getAiAdminConfig(): Promise<AiAdminConfig> {
  return get(AI_CONFIG_PATH);
}

export function updateAiAdminConfig(data: AiAdminConfig): Promise<AiAdminConfig> {
  return put(AI_CONFIG_PATH, data);
}

export function testAiAdminConfig(data: AiConfigTestRequest): Promise<AiConfigTestResponse> {
  return post(`${AI_CONFIG_PATH}/test-connection`, data);
}
