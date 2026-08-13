import { get, put } from './request';

export interface FeatureToggleConfig {
  articleCreationEnabled: boolean;
  travelCreationEnabled: boolean;
  musicCreationEnabled: boolean;
  adminNotificationEnabled: boolean;
  aiArticleAssistEnabled: boolean;
  aiMusicAssistEnabled: boolean;
  aiArticleRecommendEnabled: boolean;
}

export function getFeatureToggleConfig(): Promise<FeatureToggleConfig> {
  return get('/admin/feature-toggles');
}

export function updateFeatureToggleConfig(
  data: FeatureToggleConfig,
): Promise<FeatureToggleConfig> {
  return put('/admin/feature-toggles', data);
}
