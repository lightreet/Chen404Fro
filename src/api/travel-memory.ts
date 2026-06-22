import { del, get, post, put, type RequestConfig } from './request'
import type {
  CreateTravelMemoryCommand,
  TravelMemoryLocationDetail,
  TravelMemoryLocationListItem,
  UpdateTravelMemoryCommand,
} from '@/types'

const publicTravelMemoryRequestConfig: RequestConfig = {
  skipAuthRedirect: true,
  suppressErrorMessage: true,
}

export function getTravelMemories(): Promise<TravelMemoryLocationListItem[]> {
  return get('/travel-memories', undefined, publicTravelMemoryRequestConfig)
}

export function getTravelMemoryDetail(id: number | string): Promise<TravelMemoryLocationDetail> {
  return get(`/travel-memories/${String(id)}`, undefined, publicTravelMemoryRequestConfig)
}

export function getAdminTravelMemories(): Promise<TravelMemoryLocationDetail[]> {
  return get('/admin/travel-memories')
}

export function getAdminTravelMemoryDetail(id: number | string): Promise<TravelMemoryLocationDetail> {
  return get(`/admin/travel-memories/${String(id)}`)
}

export function createTravelMemory(data: CreateTravelMemoryCommand): Promise<TravelMemoryLocationDetail> {
  return post('/admin/travel-memories', data)
}

export function updateTravelMemory(
  id: number | string,
  data: UpdateTravelMemoryCommand,
): Promise<TravelMemoryLocationDetail> {
  return put(`/admin/travel-memories/${String(id)}`, data)
}

export function deleteTravelMemory(id: number | string): Promise<void> {
  return del(`/admin/travel-memories/${String(id)}`)
}
