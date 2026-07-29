import { del, get, getBlob, patch, post, put } from './request'
import type {
  ReaderBook,
  ReaderBookUpdateCommand,
  ReaderChapter,
  ReaderImportOptions,
  ReaderPreference,
  ReaderProgress,
  ReaderProgressCommand,
  ReaderSearchResult,
  ReaderTocItem,
  ReaderId,
} from '@/types/reader'

export function importReaderBook(file: File, options: ReaderImportOptions = {}): Promise<ReaderBook> {
  const formData = new FormData()
  formData.append('file', file)
  if (options.title?.trim()) formData.append('title', options.title.trim())
  if (options.author?.trim()) formData.append('author', options.author.trim())
  if (options.encoding?.trim()) formData.append('encoding', options.encoding.trim())
  return post('/reader/books/import', formData, {
    timeout: 120_000,
    timeoutErrorMessage: '小说解析时间较长，本次请求已超时，请检查文件大小后重试',
    onUploadProgress: (event) => {
      if (!event.total || !options.onProgress) return
      options.onProgress(Math.min(99, Math.round((event.loaded / event.total) * 100)))
    },
  })
}

export function listReaderBooks(): Promise<ReaderBook[]> {
  return get('/reader/books')
}

export function getReaderBook(bookId: ReaderId): Promise<ReaderBook> {
  return get(`/reader/books/${String(bookId)}`)
}

export function updateReaderBook(
  bookId: ReaderId,
  command: ReaderBookUpdateCommand,
): Promise<ReaderBook> {
  return patch(`/reader/books/${String(bookId)}`, command)
}

export function deleteReaderBook(bookId: ReaderId): Promise<void> {
  return del(`/reader/books/${String(bookId)}`)
}

export function getReaderToc(bookId: ReaderId): Promise<ReaderTocItem[]> {
  return get(`/reader/books/${String(bookId)}/toc`)
}

export function getReaderChapter(bookId: ReaderId, chapterId: ReaderId): Promise<ReaderChapter> {
  return get(`/reader/books/${String(bookId)}/chapters/${String(chapterId)}`)
}

export function searchReaderBook(bookId: ReaderId, keyword: string): Promise<ReaderSearchResult[]> {
  return get(`/reader/books/${String(bookId)}/search`, { keyword })
}

export function getReaderProgress(bookId: ReaderId): Promise<ReaderProgress | null> {
  return get(`/reader/books/${String(bookId)}/progress`, undefined, {
    suppressErrorMessage: true,
  })
}

export function saveReaderProgress(
  bookId: ReaderId,
  command: ReaderProgressCommand,
): Promise<ReaderProgress> {
  return put(`/reader/books/${String(bookId)}/progress`, command, {
    suppressErrorMessage: true,
  })
}

export function clearReaderProgress(bookId: ReaderId): Promise<void> {
  return del(`/reader/books/${String(bookId)}/progress`)
}

export function getReaderPreference(): Promise<ReaderPreference> {
  return get('/reader/preferences')
}

export function saveReaderPreference(command: ReaderPreference): Promise<ReaderPreference> {
  return put('/reader/preferences', command, {
    suppressErrorMessage: true,
  })
}

export function getReaderAssetBlob(assetUrl: string): Promise<Blob> {
  const base = import.meta.env.VITE_API_BASE_URL || '/api'
  const normalized = assetUrl.startsWith(base)
    ? assetUrl.slice(base.length)
    : assetUrl.replace(/^\/api/, '')
  return getBlob(normalized, {
    timeout: 30_000,
    suppressErrorMessage: true,
  })
}
