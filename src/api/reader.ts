import { del, get, getBlob, patch, post, put } from './request'
import type {
  ReaderBook,
  ReaderBookImportPreview,
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
  if (options.description?.trim()) formData.append('description', options.description.trim())
  if (options.encoding?.trim()) formData.append('encoding', options.encoding.trim())
  if (options.visibility) formData.append('visibility', options.visibility)
  if (options.coverFileId != null) formData.append('coverFileId', String(options.coverFileId))
  return post('/reader/books/import', formData, {
    timeout: 120_000,
    timeoutErrorMessage: '小说上传或后台任务创建超时，请检查网络后重试',
    onUploadProgress: (event) => {
      if (!event.total || !options.onProgress) return
      options.onProgress(Math.min(99, Math.round((event.loaded / event.total) * 100)))
    },
  })
}

export function previewReaderBook(file: File, encoding?: string): Promise<ReaderBookImportPreview> {
  const formData = new FormData()
  formData.append('file', file)
  if (encoding?.trim()) formData.append('encoding', encoding.trim())
  return post('/reader/books/preview', formData, {
    timeout: 120_000,
    timeoutErrorMessage: '书籍资料解析超时，请直接补充资料后继续导入',
    suppressErrorMessage: true,
  })
}

export function uploadReaderBookCover(file: File): Promise<{ id?: ReaderId; url: string; name: string }> {
  const formData = new FormData()
  formData.append('file', file)
  return post('/upload/novel-cover', formData)
}

export function listReaderBooks(): Promise<ReaderBook[]> {
  return get('/reader/books')
}

export function getReaderBook(bookId: ReaderId): Promise<ReaderBook> {
  return get(`/reader/books/${String(bookId)}`)
}

export function getReaderBookImportStatus(bookId: ReaderId): Promise<ReaderBook> {
  return get(`/reader/books/${String(bookId)}`, undefined, {
    suppressErrorMessage: true,
  })
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
