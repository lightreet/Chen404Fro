import { get } from '@/api/request'
import type { DevelopmentHistory } from '@/types/development-history'

export function getDevelopmentHistory(): Promise<DevelopmentHistory> {
  return get<DevelopmentHistory>('/site/development-history', undefined, {
    suppressErrorMessage: true,
  })
}
