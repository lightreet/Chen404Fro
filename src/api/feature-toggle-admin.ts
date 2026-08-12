import { get, put, type RequestConfig } from '@/api/request'
import type { FeatureToggleConfig } from '@/types'

const FEATURE_TOGGLE_PATH = '/admin/feature-toggles'

export function getFeatureToggleConfig(config?: RequestConfig): Promise<FeatureToggleConfig> {
  return get(FEATURE_TOGGLE_PATH, undefined, config)
}

export function updateFeatureToggleConfig(
  data: FeatureToggleConfig,
  config?: RequestConfig,
): Promise<FeatureToggleConfig> {
  return put(FEATURE_TOGGLE_PATH, data, config)
}
