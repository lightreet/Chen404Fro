import { AI_REQUEST_TIMEOUT_MESSAGE, AI_REQUEST_TIMEOUT_MS, del, get, patch, post, put } from './request'
import type {
  MusicPlaylist,
  MusicPlaylistTracksCommand,
  MusicPlaylistUpsertCommand,
  MusicTrack,
  MusicTrackAiSuggestRequest,
  MusicTrackAiSuggestResponse,
  MusicTrackStatus,
  MusicTrackUpsertCommand,
} from '@/types'

export function getPublicMusicTracks(): Promise<MusicTrack[]> {
  return get('/music/tracks')
}

export function getPublicMusicPlaylists(): Promise<MusicPlaylist[]> {
  return get('/music/playlists')
}

export function getPublicMusicPlaylist(id: number | string): Promise<MusicPlaylist> {
  return get(`/music/playlists/${String(id)}`)
}

export function getAdminMusicTracks(): Promise<MusicTrack[]> {
  return get('/admin/music/tracks')
}

export function getAdminMusicTrack(id: number | string): Promise<MusicTrack> {
  return get(`/admin/music/tracks/${String(id)}`)
}

export function createMusicTrack(data: MusicTrackUpsertCommand): Promise<MusicTrack> {
  return post('/admin/music/tracks', data)
}

export function updateMusicTrack(id: number | string, data: MusicTrackUpsertCommand): Promise<MusicTrack> {
  return put(`/admin/music/tracks/${String(id)}`, data)
}

export function updateMusicTrackStatus(id: number | string, status: MusicTrackStatus): Promise<MusicTrack> {
  return patch(`/admin/music/tracks/${String(id)}/status`, undefined, { params: { status } })
}

export function deleteMusicTrack(id: number | string): Promise<void> {
  return del(`/admin/music/tracks/${String(id)}`)
}

export function suggestMusicTrack(data: MusicTrackAiSuggestRequest): Promise<MusicTrackAiSuggestResponse> {
  return post('/admin/music/tracks/ai/suggest', data, {
    timeout: AI_REQUEST_TIMEOUT_MS,
    timeoutErrorMessage: AI_REQUEST_TIMEOUT_MESSAGE,
  })
}

export function getAdminMusicPlaylists(): Promise<MusicPlaylist[]> {
  return get('/admin/music/playlists')
}

export function createMusicPlaylist(data: MusicPlaylistUpsertCommand): Promise<MusicPlaylist> {
  return post('/admin/music/playlists', data)
}

export function updateMusicPlaylist(id: number | string, data: MusicPlaylistUpsertCommand): Promise<MusicPlaylist> {
  return put(`/admin/music/playlists/${String(id)}`, data)
}

export function deleteMusicPlaylist(id: number | string): Promise<void> {
  return del(`/admin/music/playlists/${String(id)}`)
}

export function saveMusicPlaylistTracks(
  id: number | string,
  data: MusicPlaylistTracksCommand,
): Promise<MusicPlaylist> {
  return put(`/admin/music/playlists/${String(id)}/tracks`, data)
}
