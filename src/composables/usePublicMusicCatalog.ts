import { computed, ref, shallowRef } from 'vue';
import {
  getPublicMusicPlaylist,
  getPublicMusicPlaylists,
  getPublicMusicTracks,
} from '@/api/music';
import type { MusicPlaylist, MusicTrack } from '@/types';

const tracks = shallowRef<MusicTrack[]>([]);
const playlists = shallowRef<MusicPlaylist[]>([]);
const loading = ref(false);
const error = ref('');

let catalogLoaded = false;
let pendingCatalogRequest: Promise<void> | null = null;

export function usePublicMusicCatalog() {
  const selectedPlaylistId = ref<number | null>(null);
  const keyword = ref('');

  const selectedPlaylist = computed<MusicPlaylist | null>(() => {
    if (selectedPlaylistId.value == null) return null;
    return playlists.value.find((playlist) => playlist.id === selectedPlaylistId.value) ?? null;
  });

  const filteredTracks = computed(() => {
    const sourceTracks = resolvePlaylistTracks(selectedPlaylist.value, tracks.value);
    const normalizedKeyword = keyword.value.trim().toLowerCase();
    if (!normalizedKeyword) return sourceTracks;
    return sourceTracks.filter((track) => matchesTrackKeyword(track, normalizedKeyword));
  });

  const loadCatalog = async (force = false): Promise<void> => {
    if (pendingCatalogRequest) {
      return pendingCatalogRequest;
    }
    if (catalogLoaded && !force) {
      return;
    }

    loading.value = true;
    error.value = '';

    const request = (async () => {
      try {
        const [trackRows, playlistRows] = await Promise.all([
          getPublicMusicTracks(),
          getPublicMusicPlaylists(),
        ]);
        const hydratedPlaylists = await hydratePublicPlaylists(playlistRows);

        tracks.value = trackRows;
        playlists.value = hydratedPlaylists;
        catalogLoaded = true;

        if (
          selectedPlaylistId.value != null
          && !hydratedPlaylists.some((playlist) => playlist.id === selectedPlaylistId.value)
        ) {
          selectedPlaylistId.value = null;
        }
      } catch (cause) {
        error.value = resolveCatalogError(cause);
      } finally {
        loading.value = false;
        pendingCatalogRequest = null;
      }
    })();

    pendingCatalogRequest = request;
    return request;
  };

  const retry = () => loadCatalog(true);

  const selectPlaylist = (playlistId: number | null) => {
    if (playlistId == null) {
      selectedPlaylistId.value = null;
      return;
    }
    selectedPlaylistId.value = playlists.value.some((playlist) => playlist.id === playlistId)
      ? playlistId
      : null;
  };

  return {
    loading,
    error,
    tracks,
    playlists,
    selectedPlaylistId,
    keyword,
    filteredTracks,
    selectedPlaylist,
    loadCatalog,
    retry,
    selectPlaylist,
  };
}

async function hydratePublicPlaylists(rows: MusicPlaylist[]): Promise<MusicPlaylist[]> {
  return Promise.all(rows.map(async (playlist) => {
    if (playlist.id == null) {
      return normalizePlaylist(playlist);
    }

    try {
      const detail = await getPublicMusicPlaylist(playlist.id);
      return {
        ...playlist,
        ...detail,
        tracks: detail.tracks ?? playlist.tracks ?? [],
      };
    } catch {
      return normalizePlaylist(playlist);
    }
  }));
}

function normalizePlaylist(playlist: MusicPlaylist): MusicPlaylist {
  return {
    ...playlist,
    tracks: playlist.tracks ?? [],
  };
}

function resolvePlaylistTracks(
  playlist: MusicPlaylist | null,
  catalogTracks: MusicTrack[],
): MusicTrack[] {
  if (!playlist) return catalogTracks;

  const catalogTrackMap = new Map(catalogTracks.map((track) => [track.id, track]));
  const seenTrackIds = new Set<number>();

  return (playlist.tracks ?? []).reduce<MusicTrack[]>((resolvedTracks, track) => {
    if (seenTrackIds.has(track.id)) return resolvedTracks;
    seenTrackIds.add(track.id);
    resolvedTracks.push(catalogTrackMap.get(track.id) ?? track);
    return resolvedTracks;
  }, []);
}

function matchesTrackKeyword(track: MusicTrack, keyword: string): boolean {
  return [
    track.title,
    track.artist,
    track.album,
    track.genre,
    track.language,
    ...(track.tags ?? []),
  ].some((value) => (value ?? '').toLowerCase().includes(keyword));
}

function resolveCatalogError(cause: unknown): string {
  if (cause instanceof Error && cause.message.trim()) {
    return cause.message;
  }
  return '音乐目录暂时加载失败，请稍后重试。';
}
