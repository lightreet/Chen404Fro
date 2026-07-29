export type ReaderId = number | string
export type ReaderTheme = 'light' | 'rose' | 'dark'
export type ReaderFontFamily = 'serif' | 'sans'

export interface ReaderBook {
  id: ReaderId
  title: string
  author?: string
  description?: string
  language?: string
  sourceFormat: 'txt' | 'epub' | 'html' | 'markdown' | 'fb2' | string
  sourceEncoding?: string
  status: 'ready' | 'failed'
  parseMessage?: string
  chapterCount: number
  totalCharCount: number
  contentVersion: number
  coverUrl?: string
  currentChapterId?: ReaderId
  currentChapterTitle?: string
  progressPercent: number
  finished: boolean
  lastReadAt?: string
  createTime: string
  updateTime: string
}

export interface ReaderTocItem {
  id: ReaderId
  label: string
  chapterId?: ReaderId
  fragment?: string
  depth: number
  children: ReaderTocItem[]
}

export interface ReaderChapter {
  id: ReaderId
  bookId: ReaderId
  bookTitle: string
  chapterOrder: number
  chapterCount: number
  title: string
  volumeTitle?: string
  contentHtml: string
  charCount: number
  previousChapterId?: ReaderId
  nextChapterId?: ReaderId
}

export interface ReaderProgress {
  bookId: ReaderId
  chapterId: ReaderId
  blockIndex: number
  characterOffset: number
  progressPercent: number
  locatorContext?: string
  contentVersion: number
  finished: boolean
  lastReadAt: string
}

export interface ReaderProgressCommand {
  chapterId: ReaderId
  blockIndex: number
  characterOffset: number
  progressPercent: number
  locatorContext?: string
  finished?: boolean
}

export interface ReaderPreference {
  fontSize: number
  lineHeight: number
  contentWidth: number
  paragraphSpacing: number
  theme: ReaderTheme
  fontFamily: ReaderFontFamily
}

export interface ReaderBookUpdateCommand {
  title: string
  author?: string
  description?: string
}

export interface ReaderSearchResult {
  chapterId: ReaderId
  chapterTitle: string
  chapterOrder: number
  snippet: string
}

export interface ReaderImportOptions {
  title?: string
  author?: string
  encoding?: string
  onProgress?: (percent: number) => void
}
