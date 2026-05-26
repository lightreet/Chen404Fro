import { get, post } from './request'
import type { PageParams, PageResult } from '@/types'

export interface AdminFileReference {
  fileId: number | string
  moduleCode: string
  bizType: string
  bizId: number | string
  fieldKey: string
  sourceType: string
  bizLabel?: string
}

export interface AdminFile {
  id: number | string
  fileName?: string
  fileOriginalName?: string
  fileUrl: string
  objectName?: string
  fileSize?: number
  contentType?: string
  userId?: number | string
  username?: string
  status?: string
  refType?: string
  refId?: number | string
  referenceStatus: 'PENDING' | 'REFERENCED' | 'UNREFERENCED' | 'DELETED' | 'UNKNOWN'
  referenceCount: number
  referenceModules: string[]
  createTime?: string
  updateTime?: string
}

export interface AdminFileDetail extends AdminFile {
  references: AdminFileReference[]
}

export interface AdminFileStatsBucket {
  key: string
  label: string
  count: number
}

export interface AdminFileStats {
  totalFiles: number
  totalSize: number
  referencedCount: number
  pendingCount: number
  unreferencedCount: number
  deletedCount: number
  referenceRecordCount: number
  statusBuckets: AdminFileStatsBucket[]
  refTypeBuckets: AdminFileStatsBucket[]
}

export interface AdminFileQueryParams extends PageParams {
  keyword?: string
  status?: string
  refType?: string
  referenced?: boolean
}

export interface RebuildFileReferencesResult {
  articles: number
  users: number
  travelLocations: number
  trustRequests: number
  references: number
}

export function getAdminFiles(params?: AdminFileQueryParams): Promise<PageResult<AdminFile>> {
  return get('/admin/files', params)
}

export function getAdminFileDetail(id: number | string): Promise<AdminFileDetail> {
  return get(`/admin/files/${id}`)
}

export function getAdminFileStats(): Promise<AdminFileStats> {
  return get('/admin/files/stats')
}

export function rebuildFileReferences(): Promise<RebuildFileReferencesResult> {
  return post('/admin/files/rebuild-references')
}
