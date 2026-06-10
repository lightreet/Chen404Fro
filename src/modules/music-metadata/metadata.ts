import { parseBlob } from 'music-metadata'

export interface ParsedMusicCover {
  file: File
  source: 'embedded'
}

export interface ParsedMusicMetadata {
  title?: string
  artist?: string
  album?: string
  releaseYear?: number
  language?: string
  genre?: string
  lyricText?: string
  cover?: ParsedMusicCover
  sourceFields: string[]
}

type UnknownRecord = Record<string, unknown>

const IMAGE_EXTENSION_BY_MIME: Record<string, string> = {
  'image/jpeg': 'jpg',
  'image/jpg': 'jpg',
  'image/png': 'png',
  'image/webp': 'webp',
  'image/gif': 'gif',
}

const NOISY_METADATA_VALUES = new Set([
  'kuwo',
  'unknown',
  '<unknown>',
  'untitled',
  'null',
  'none',
  '???',
  '未知',
  '无',
])

export async function parseMusicFileMetadata(file: File): Promise<ParsedMusicMetadata> {
  const fallback = parseMetadataFromFileName(file.name)
  try {
    const metadata = await parseBlob(file, {
      duration: false,
      skipCovers: false,
    })
    const common = metadata.common
    const parsed: ParsedMusicMetadata = {
      title: normalizeText(common.title) || fallback.title,
      artist: normalizeText(common.artist) || normalizeText(common.artists?.join(' / ')) || fallback.artist,
      album: normalizeText(common.album),
      releaseYear: normalizeYear(common.year, common.date, common.releasedate, common.originalyear),
      language: normalizeText(common.language),
      genre: normalizeText(common.genre?.join(' / ')),
      lyricText: normalizeLyrics(common.lyrics),
      cover: createCoverFile(common.picture?.[0], file.name),
      sourceFields: [],
    }
    parsed.sourceFields = collectSourceFields(parsed, fallback)
    return parsed
  } catch {
    return {
      ...fallback,
      sourceFields: collectSourceFields(fallback, fallback),
    }
  }
}

function parseMetadataFromFileName(fileName: string): ParsedMusicMetadata {
  const baseName = fileName.replace(/\.[^.]+$/, '').trim()
  const normalized = baseName
    .replace(/[_]+/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
  const separators = [' - ', ' – ', ' — ', '-']
  for (const separator of separators) {
    const index = normalized.indexOf(separator)
    if (index <= 0) continue
    const artist = normalizeText(normalized.slice(0, index))
    const title = normalizeText(normalized.slice(index + separator.length))
    if (artist && title) {
      return { artist, title, sourceFields: [] }
    }
  }
  return {
    title: normalizeText(normalized),
    sourceFields: [],
  }
}

function normalizeText(value?: unknown) {
  if (typeof value !== 'string') return undefined
  const normalized = value.replace(/\u0000/g, '').replace(/\s+/g, ' ').trim()
  if (!normalized) return undefined
  if (NOISY_METADATA_VALUES.has(normalized.toLowerCase())) return undefined
  return normalized
}

function normalizeYear(...candidates: Array<number | string | undefined>) {
  for (const candidate of candidates) {
    const raw = typeof candidate === 'number' ? String(candidate) : candidate
    const match = raw?.match(/\b(19\d{2}|20\d{2})\b/)
    if (!match) continue
    const year = Number(match[1])
    if (year >= 1900 && year <= new Date().getFullYear()) {
      return year
    }
  }
  return undefined
}

function normalizeLyrics(lyrics?: unknown[]) {
  if (!Array.isArray(lyrics)) return undefined
  const lines = lyrics
    .map((item) => {
      if (typeof item === 'string') return item
      if (!item || typeof item !== 'object') return ''
      const record = item as UnknownRecord
      const text = record.text ?? record.description ?? record.content
      return typeof text === 'string' ? text : ''
    })
    .map((line) => line.trim())
    .filter(Boolean)
  return lines.length ? lines.join('\n') : undefined
}

function createCoverFile(picture: { data: Uint8Array, format: string } | undefined, audioFileName: string) {
  if (!picture?.data?.length || !picture.format) return undefined
  const mimeType = picture.format.toLowerCase()
  const extension = IMAGE_EXTENSION_BY_MIME[mimeType] || 'jpg'
  const baseName = audioFileName.replace(/\.[^.]+$/, '').trim() || 'music-cover'
  const coverBytes = new Uint8Array(picture.data.byteLength)
  coverBytes.set(picture.data)
  const blob = new Blob([coverBytes.buffer], { type: mimeType })
  return {
    file: new File([blob], `${baseName}.${extension}`, { type: mimeType }),
    source: 'embedded' as const,
  }
}

function collectSourceFields(metadata: ParsedMusicMetadata, fallback: ParsedMusicMetadata) {
  const fields: string[] = []
  if (metadata.title) fields.push(metadata.title === fallback.title ? '文件名标题' : '标题')
  if (metadata.artist) fields.push(metadata.artist === fallback.artist ? '文件名歌手' : '歌手')
  if (metadata.album) fields.push('专辑')
  if (metadata.releaseYear) fields.push('年份')
  if (metadata.language) fields.push('语言')
  if (metadata.genre) fields.push('流派')
  if (metadata.lyricText) fields.push('歌词')
  if (metadata.cover) fields.push('封面')
  return fields
}
