import { get, post, put } from '@/api/request'
import type {
  DevelopmentHistory,
  GitHubDevelopmentAdminConfig,
} from '@/types/development-history'

const CONFIG_PATH = '/admin/development-history/config'

export function getGitHubDevelopmentConfig(): Promise<GitHubDevelopmentAdminConfig> {
  return get(CONFIG_PATH)
}

export function updateGitHubDevelopmentConfig(
  data: GitHubDevelopmentAdminConfig,
): Promise<GitHubDevelopmentAdminConfig> {
  return put(CONFIG_PATH, data)
}

export function refreshGitHubDevelopmentHistory(): Promise<DevelopmentHistory> {
  return post(`${CONFIG_PATH}/refresh`, undefined, { timeout: 130_000 })
}
