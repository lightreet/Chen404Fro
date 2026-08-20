<template>
  <div
    class="reader-page"
    :class="[`reader-theme--${preference.theme}`, `reader-font--${preference.fontFamily}`]"
    :style="readerStyle"
  >
    <header class="reader-toolbar">
      <div class="reader-toolbar__side">
        <UiButton variant="text" icon-only icon="back" aria-label="返回书架" @click="router.push('/bookshelf')" />
        <button type="button" class="reader-book-title" @click="openToc">
          <span>{{ book?.title || '小说阅读' }}</span>
          <small v-if="chapter">{{ chapter.title }}</small>
        </button>
      </div>
      <div class="reader-toolbar__progress" aria-label="全书阅读进度">
        <span>{{ currentProgress.toFixed(1) }}%</span>
        <div><i :style="{ width: `${currentProgress}%` }" /></div>
      </div>
      <div class="reader-toolbar__side reader-toolbar__actions">
        <UiButton variant="text" icon-only icon="search" aria-label="书内搜索" @click="openSearch" />
        <UiButton variant="text" icon-only icon="menu" aria-label="打开目录" @click="openToc" />
        <UiButton variant="text" icon-only icon="edit" aria-label="打开阅读笔记" @click="openNotes" />
        <UiButton variant="text" icon-only icon="settings" aria-label="阅读设置" @click="settingsOpen = true" />
      </div>
    </header>

    <UiLoadingState
      class="reader-loading"
      :loading="loading"
      :fullscreen="true"
      variant="plain"
      message="正在展开这一章…"
    >
      <main
        v-if="chapter"
        class="reader-shell"
        :class="{ 'reader-shell--continuous': preference.readingMode === 'continuous' }"
      >
        <article v-if="preference.readingMode === 'paged'" class="reader-paper">
          <header class="chapter-header">
            <p v-if="chapter.volumeTitle">{{ chapter.volumeTitle }}</p>
            <h1>{{ chapter.title }}</h1>
            <span>第 {{ chapter.chapterOrder + 1 }} / {{ chapter.chapterCount }} 章 · {{ formatCharCount(chapter.charCount) }}</span>
          </header>

          <div
            ref="contentRef"
            class="reader-content"
            v-html="hydratedHtml"
            @pointerup="scheduleSelectionCapture"
            @keyup="scheduleSelectionCapture"
          />

          <nav class="chapter-navigation" aria-label="章节导航">
            <button
              type="button"
              :disabled="!chapter.previousChapterId"
              @click="chapter.previousChapterId && navigateChapter(chapter.previousChapterId)"
            >
              <UiIcon name="arrow-left" />
              <span><small>上一章</small>{{ previousLabel }}</span>
            </button>
            <button
              type="button"
              :disabled="!chapter.nextChapterId"
              @click="chapter.nextChapterId && navigateChapter(chapter.nextChapterId)"
            >
              <span><small>{{ chapter.nextChapterId ? '下一章' : '已读完' }}</small>{{ nextLabel }}</span>
              <UiIcon name="arrow-right" />
            </button>
          </nav>
        </article>

        <template v-else>
          <div v-if="loadingPrevious" class="chapter-load-state" aria-live="polite">
            <UiIcon name="loading" spin />正在接上上一章…
          </div>
          <button
            v-else-if="previousLoadError"
            type="button"
            class="chapter-load-retry"
            @click="loadAdjacentChapter('previous')"
          >
            上一章加载失败，点击重试
          </button>

          <article
            v-for="entry in loadedChapters"
            :key="String(entry.chapter.id)"
            class="reader-paper continuous-chapter"
            :data-reader-chapter-id="String(entry.chapter.id)"
          >
            <header class="chapter-header">
              <p v-if="entry.chapter.volumeTitle">{{ entry.chapter.volumeTitle }}</p>
              <h1>{{ entry.chapter.title }}</h1>
              <span>
                第 {{ entry.chapter.chapterOrder + 1 }} / {{ entry.chapter.chapterCount }} 章
                · {{ formatCharCount(entry.chapter.charCount) }}
              </span>
            </header>
            <div
              class="reader-content"
              :data-reader-content-id="String(entry.chapter.id)"
              v-html="entry.html"
              @pointerup="scheduleSelectionCapture"
              @keyup="scheduleSelectionCapture"
            />
          </article>

          <div v-if="loadingNext" class="chapter-load-state" aria-live="polite">
            <UiIcon name="loading" spin />正在展开下一章…
          </div>
          <button
            v-else-if="nextLoadError"
            type="button"
            class="chapter-load-retry"
            @click="loadAdjacentChapter('next')"
          >
            下一章加载失败，点击重试
          </button>
          <div v-else-if="!lastLoadedChapter?.nextChapterId" class="book-finished-state">
            <UiIcon name="success" />
            <strong>本书已读完</strong>
            <span>故事在这里暂时落下句点。</span>
          </div>
        </template>
      </main>

      <div v-else-if="!loading" class="reader-error">
        <UiEmpty
          title="暂时无法打开这本小说"
          description="文件可能已经删除，或目录中没有可阅读章节。"
          icon="warning"
        >
          <template #action>
            <UiButton variant="primary" @click="router.push('/bookshelf')">返回书架</UiButton>
          </template>
        </UiEmpty>
      </div>
    </UiLoadingState>

    <UiDrawer
      v-model="tocOpen"
      direction="ltr"
      size="min(420px, 92vw)"
      title="目录与搜索"
      class="reader-drawer"
    >
      <div class="reader-drawer__body">
        <div class="reader-search">
          <UiInput
            ref="searchInput"
            v-model="searchKeyword"
            prefix-icon="search"
            clearable
            placeholder="搜索正文（至少 2 个字）"
            @enter="runSearch"
          />
          <UiButton variant="secondary" :loading="searching" @click="runSearch">搜索</UiButton>
        </div>

        <div v-if="searchResults !== null" class="search-results">
          <div class="drawer-section-title">
            <span>搜索结果</span>
            <button type="button" @click="clearSearch">返回目录</button>
          </div>
          <button
            v-for="result in searchResults"
            :key="String(result.chapterId)"
            type="button"
            class="search-result"
            @click="selectFromDrawer(result.chapterId)"
          >
            <strong>{{ result.chapterTitle }}</strong>
            <p>{{ result.snippet }}</p>
          </button>
          <UiEmpty
            v-if="!searchResults.length"
            size="sm"
            title="没有找到相关内容"
            description="试试更短或不同的关键词"
            icon="search"
          />
        </div>

        <template v-else>
          <div class="drawer-section-title toc-locator-bar">
            <span>完整目录 <small>{{ book?.chapterCount || 0 }} 章</small></span>
            <button type="button" @click="locateCurrentChapter">
              <UiIcon name="location" />定位当前章节
            </button>
          </div>
          <ReaderTocTree
            ref="tocTreeRef"
            :items="toc"
            :active-chapter-id="chapter?.id"
            root
            @select="selectFromDrawer"
          />
        </template>
      </div>
    </UiDrawer>

    <UiDrawer
      v-model="notesOpen"
      direction="rtl"
      size="min(420px, 94vw)"
      title="阅读笔记"
      class="reader-drawer reader-notes-drawer"
    >
      <ReaderNotesList
        :notes="notes"
        :loading="notesLoading"
        :error="notesError"
        @retry="loadNotes(true)"
        @jump="jumpToNote"
        @edit="editNote"
        @delete="removeNote"
      />
    </UiDrawer>

    <UiDrawer
      v-model="settingsOpen"
      direction="rtl"
      size="min(380px, 92vw)"
      title="阅读设置"
      class="reader-drawer"
    >
      <div class="reader-settings">
        <section>
          <h3>阅读方式</h3>
          <div class="reading-mode-options" role="radiogroup" aria-label="阅读方式">
            <button
              v-for="mode in readingModeOptions"
              :key="mode.value"
              type="button"
              role="radio"
              :aria-checked="preference.readingMode === mode.value"
              :class="{ 'is-active': preference.readingMode === mode.value }"
              @click="changeReadingMode(mode.value)"
            >
              <span><UiIcon :name="mode.icon" />{{ mode.label }}</span>
              <small>{{ mode.description }}</small>
            </button>
          </div>
        </section>

        <section>
          <h3>页面主题</h3>
          <div class="theme-options">
            <button
              v-for="theme in themeOptions"
              :key="theme.value"
              type="button"
              :class="[`is-${theme.value}`, { 'is-active': preference.theme === theme.value }]"
              @click="preference.theme = theme.value"
            >
              <i />
              <span>{{ theme.label }}</span>
            </button>
          </div>
        </section>

        <section>
          <div class="setting-label"><h3>字号</h3><span>{{ preference.fontSize }} px</span></div>
          <UiSlider v-model="preference.fontSize" :min="14" :max="32" :step="1" />
        </section>

        <section>
          <div class="setting-label"><h3>行高</h3><span>{{ preference.lineHeight.toFixed(2) }}</span></div>
          <UiSlider v-model="preference.lineHeight" :min="1.3" :max="2.6" :step="0.05" />
        </section>

        <section>
          <div class="setting-label"><h3>正文宽度</h3><span>{{ preference.contentWidth }} px</span></div>
          <UiSlider v-model="preference.contentWidth" :min="520" :max="1100" :step="20" />
        </section>

        <section>
          <div class="setting-label"><h3>段落间距</h3><span>{{ preference.paragraphSpacing }} px</span></div>
          <UiSlider v-model="preference.paragraphSpacing" :min="8" :max="40" :step="2" />
        </section>

        <section>
          <h3>正文字体</h3>
          <div class="font-options">
            <button
              type="button"
              :class="{ 'is-active': preference.fontFamily === 'serif' }"
              @click="preference.fontFamily = 'serif'"
            >
              宋体阅读
            </button>
            <button
              type="button"
              :class="{ 'is-active': preference.fontFamily === 'sans' }"
              @click="preference.fontFamily = 'sans'"
            >
              黑体阅读
            </button>
          </div>
        </section>

        <p class="preference-status">
          <UiIcon :name="preferenceSaving ? 'loading' : 'success'" :spin="preferenceSaving" />
          {{ preferenceSaving
            ? '正在同步设置…'
            : isLoggedIn ? '设置会同步到你的其他设备' : '当前设置保存在此设备，登录后可同步' }}
        </p>
      </div>
    </UiDrawer>

    <Transition name="m-fade">
      <UiButton
        v-if="selectionTriggerVisible"
        class="selection-note-trigger"
        variant="secondary"
        size="sm"
        icon="edit"
        :style="selectionTriggerStyle"
        @pointerdown.prevent
        @click="startNoteFromSelection"
      >记笔记</UiButton>
    </Transition>

    <ReaderNoteEditor
      v-if="editorDraft"
      :note-id="editorDraft.noteId"
      :excerpt="editorDraft.excerpt"
      :reflection="editorDraft.reflection"
      :highlight-color="editorDraft.highlightColor"
      :theme="preference.theme"
      :saving="noteSaving"
      :left="editorDraft.left"
      :top="editorDraft.top"
      @cancel="closeNoteEditor"
      @save="saveNote"
    />

    <Transition name="m-fade">
      <button
        v-if="showResumeNotice"
        type="button"
        class="resume-notice"
        @click="showResumeNotice = false"
      >
        <UiIcon name="success" />
        已回到上次阅读的位置
      </button>
    </Transition>
  </div>
</template>

<script setup lang="ts">
import {
  computed,
  nextTick,
  onBeforeUnmount,
  onMounted,
  reactive,
  ref,
  watch,
} from 'vue'
import { storeToRefs } from 'pinia'
import { useRoute, useRouter } from 'vue-router'
import {
  UiButton,
  UiDrawer,
  UiEmpty,
  UiIcon,
  UiInput,
  UiLoadingState,
  UiSlider,
} from '@/components/ui'
import ReaderTocTree from '@/components/Reader/ReaderTocTree.vue'
import ReaderNoteEditor from '@/components/Reader/ReaderNoteEditor.vue'
import ReaderNotesList from '@/components/Reader/ReaderNotesList.vue'
import {
  createReaderNote,
  deleteReaderNote,
  getReaderBook,
  getReaderChapter,
  getReaderPreference,
  getReaderProgress,
  getReaderToc,
  listReaderNotes,
  saveReaderPreference,
  saveReaderProgress,
  searchReaderBook,
  updateReaderNote,
} from '@/api/reader'
import { useReaderAssetResolver } from '@/composables/reader/useReaderAssetResolver'
import { confirmDelete, notify } from '@/lib/feedback'
import { useUserStore } from '@/stores/user'
import type {
  ReaderBook,
  ReaderChapter,
  ReaderFontFamily,
  ReaderId,
  ReaderNote,
  ReaderNoteColor,
  ReaderNoteCreateCommand,
  ReaderPreference,
  ReaderProgress,
  ReaderProgressCommand,
  ReaderReadingMode,
  ReaderSearchResult,
  ReaderTheme,
  ReaderTocItem,
} from '@/types/reader'

interface LocalReaderProgress extends ReaderProgressCommand {
  savedAt: string
  contentVersion: number
}

type ReaderSelectionAnchor = Omit<ReaderNoteCreateCommand, 'reflection' | 'highlightColor'>

interface ReaderNoteEditorDraft {
  mode: 'create' | 'edit'
  noteId?: ReaderId
  anchor?: ReaderSelectionAnchor
  excerpt: string
  reflection?: string
  highlightColor: ReaderNoteColor
  left: number
  top: number
}

interface LoadedReaderChapter {
  chapter: ReaderChapter
  html: string
}

interface ReaderTocTreeHandle {
  locateChapter: (chapterId?: ReaderId) => Promise<boolean>
}

const route = useRoute()
const router = useRouter()
const userStore = useUserStore()
userStore.initUser()
const { isLoggedIn } = storeToRefs(userStore)
const bookId = computed(() => String(route.params.bookId))
const book = ref<ReaderBook>()
const chapter = ref<ReaderChapter>()
const toc = ref<ReaderTocItem[]>([])
const hydratedHtml = ref('')
const loadedChapters = ref<LoadedReaderChapter[]>([])
const contentRef = ref<HTMLElement>()
const tocTreeRef = ref<ReaderTocTreeHandle>()
const searchInput = ref<{ focus: () => void }>()
const loading = ref(true)
const tocOpen = ref(false)
const notesOpen = ref(false)
const settingsOpen = ref(false)
const locateOnTocOpen = ref(true)
const searchKeyword = ref('')
const searchResults = ref<ReaderSearchResult[] | null>(null)
const searching = ref(false)
const showResumeNotice = ref(false)
const preferenceSaving = ref(false)
const currentProgress = ref(0)
const notes = ref<ReaderNote[]>([])
const notesLoading = ref(false)
const notesLoaded = ref(false)
const notesError = ref('')
const noteSaving = ref(false)
const loadingPrevious = ref(false)
const loadingNext = ref(false)
const previousLoadError = ref(false)
const nextLoadError = ref(false)
const selectionAnchor = ref<ReaderSelectionAnchor>()
const selectionTriggerVisible = ref(false)
const selectionTriggerPosition = reactive({ left: 16, top: 72 })
const editorDraft = ref<ReaderNoteEditorDraft>()
const preference = reactive<ReaderPreference>({
  fontSize: 18,
  lineHeight: 1.85,
  contentWidth: 720,
  paragraphSpacing: 16,
  theme: 'light',
  fontFamily: 'serif',
  readingMode: 'paged',
})
const { resolveHtml, revokeAll } = useReaderAssetResolver()

const NOTE_HIGHLIGHT_NAMES = [
  'reader-note-rose',
  'reader-note-sage',
  'reader-note-blue',
  'reader-note-amber',
  'reader-note-focus',
] as const

const noteRangeById = new Map<string, Range>()

const themeOptions: Array<{ value: ReaderTheme; label: string }> = [
  { value: 'light', label: '明亮' },
  { value: 'rose', label: '柔粉' },
  { value: 'dark', label: '夜间' },
]

const readingModeOptions: Array<{
  value: ReaderReadingMode
  label: string
  description: string
  icon: string
}> = [
  { value: 'paged', label: '单章阅读', description: '读完后手动切换章节', icon: 'book' },
  { value: 'continuous', label: '连续阅读', description: '滚动时自动衔接章节', icon: 'arrow-down' },
]

const readerStyle = computed(() => ({
  '--reader-font-size': `${preference.fontSize}px`,
  '--reader-line-height': String(preference.lineHeight),
  '--reader-width': `${preference.contentWidth}px`,
  '--reader-paragraph-space': `${preference.paragraphSpacing}px`,
}))
const selectionTriggerStyle = computed(() => ({
  left: `${selectionTriggerPosition.left}px`,
  top: `${selectionTriggerPosition.top}px`,
}))
const previousLabel = computed(() => chapter.value?.previousChapterId ? '回到前一章' : '已经是第一章')
const nextLabel = computed(() => chapter.value?.nextChapterId ? '继续下一章' : '本书已读完')
const firstLoadedChapter = computed(() => loadedChapters.value[0]?.chapter)
const lastLoadedChapter = computed(() => loadedChapters.value.at(-1)?.chapter)

let scrollFrame = 0
let progressTimer = 0
let preferenceTimer = 0
let selectionTimer = 0
let noteFocusTimer = 0
let ignoreScrollUntil = 0
let initializedPreference = false
let lastScrollY = 0
let adjacentLoadFrame = 0

const MAX_CONTINUOUS_CHAPTERS = 5

const flattenFirstChapterId = (items: ReaderTocItem[]): ReaderId | undefined => {
  for (const item of items) {
    if (item.chapterId) return item.chapterId
    const childId = flattenFirstChapterId(item.children || [])
    if (childId) return childId
  }
  return undefined
}

const localStorageKey = () => `chen404:reader-progress:${bookId.value}`
const readLocalProgress = (): LocalReaderProgress | null => {
  try {
    const value = localStorage.getItem(localStorageKey())
    return value ? JSON.parse(value) as LocalReaderProgress : null
  } catch {
    return null
  }
}

const chooseRestoreProgress = (
  server: ReaderProgress | null,
  local: LocalReaderProgress | null,
): ReaderProgressCommand | null => {
  if (local && local.contentVersion === book.value?.contentVersion) {
    const localTime = Date.parse(local.savedAt)
    const serverTime = Date.parse(server?.lastReadAt || '')
    if (!server || localTime > serverTime) return local
  }
  return server
}

interface DomTextPoint {
  node: Text
  offset: number
}

interface BlockBoundary {
  blockIndex: number
  characterOffset: number
}

interface HighlightRegistryLike {
  set: (name: string, highlight: unknown) => void
  delete: (name: string) => void
}

type HighlightConstructorLike = new (...ranges: Range[]) => unknown

const getHighlightApi = () => {
  const registry = typeof CSS === 'undefined'
    ? undefined
    : (CSS as unknown as { highlights?: HighlightRegistryLike }).highlights
  const HighlightConstructor = typeof window === 'undefined'
    ? undefined
    : (window as unknown as { Highlight?: HighlightConstructorLike }).Highlight
  return { registry, HighlightConstructor }
}

const NOTE_HIGHLIGHT_STYLE_ID = 'reader-note-highlight-styles'
const ensureNoteHighlightStyles = () => {
  if (document.getElementById(NOTE_HIGHLIGHT_STYLE_ID)) return
  const style = document.createElement('style')
  style.id = NOTE_HIGHLIGHT_STYLE_ID
  style.textContent = `
    .reader-content::highlight(reader-note-rose) { background-color: rgba(216, 143, 157, 0.30); }
    .reader-content::highlight(reader-note-sage) { background-color: rgba(158, 172, 134, 0.29); }
    .reader-content::highlight(reader-note-blue) { background-color: rgba(143, 169, 196, 0.29); }
    .reader-content::highlight(reader-note-amber) { background-color: rgba(217, 174, 105, 0.28); }
    .reader-content::highlight(reader-note-focus) {
      background-color: rgba(251, 114, 153, 0.34);
      text-decoration: underline 2px rgba(251, 114, 153, 0.78);
    }
    .reader-theme--dark .reader-content::highlight(reader-note-rose) { background-color: rgba(171, 107, 121, 0.40); }
    .reader-theme--dark .reader-content::highlight(reader-note-sage) { background-color: rgba(121, 137, 105, 0.40); }
    .reader-theme--dark .reader-content::highlight(reader-note-blue) { background-color: rgba(107, 132, 157, 0.42); }
    .reader-theme--dark .reader-content::highlight(reader-note-amber) { background-color: rgba(165, 128, 75, 0.40); }
  `
  document.head.appendChild(style)
}

const contentBlocks = () => contentRef.value
  ? [...contentRef.value.querySelectorAll<HTMLElement>('[data-reader-block]')]
  : []

const textPointInElement = (element: HTMLElement, characterOffset: number): DomTextPoint | null => {
  if (characterOffset < 0) return null
  const walker = document.createTreeWalker(element, NodeFilter.SHOW_TEXT)
  let current = walker.nextNode() as Text | null
  let remaining = characterOffset
  let last: Text | null = null
  while (current) {
    last = current
    const length = current.data.length
    if (remaining <= length) return { node: current, offset: remaining }
    remaining -= length
    current = walker.nextNode() as Text | null
  }
  return remaining === 0 && last ? { node: last, offset: last.data.length } : null
}

const boundaryInBlock = (node: Node, offset: number): BlockBoundary | null => {
  const element = node.nodeType === Node.ELEMENT_NODE
    ? node as Element
    : node.parentElement
  const block = element?.closest<HTMLElement>('[data-reader-block]')
  const root = contentRef.value
  if (!block || !root?.contains(block)) return null
  const blocks = contentBlocks()
  const blockIndex = blocks.indexOf(block)
  if (blockIndex < 0) return null
  try {
    const probe = document.createRange()
    probe.selectNodeContents(block)
    probe.setEnd(node, offset)
    return { blockIndex, characterOffset: probe.toString().length }
  } catch {
    return null
  }
}

const rangeFromAnchors = (note: ReaderNote): Range | null => {
  const blocks = contentBlocks()
  const startBlock = blocks[note.startBlockIndex]
  const endBlock = blocks[note.endBlockIndex]
  if (!startBlock || !endBlock) return null
  const start = textPointInElement(startBlock, note.startCharacterOffset)
  const end = textPointInElement(endBlock, note.endCharacterOffset)
  if (!start || !end) return null
  const range = document.createRange()
  try {
    range.setStart(start.node, start.offset)
    range.setEnd(end.node, end.offset)
    return range.toString() === note.excerpt ? range : null
  } catch {
    return null
  }
}

const contentTextSnapshot = () => {
  const nodes: Array<{ node: Text; start: number; end: number }> = []
  const root = contentRef.value
  if (!root) return { text: '', nodes }
  const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT)
  let current = walker.nextNode() as Text | null
  let offset = 0
  let text = ''
  while (current) {
    const start = offset
    text += current.data
    offset += current.data.length
    nodes.push({ node: current, start, end: offset })
    current = walker.nextNode() as Text | null
  }
  return { text, nodes }
}

const textPointAtGlobalOffset = (
  nodes: Array<{ node: Text; start: number; end: number }>,
  offset: number,
): DomTextPoint | null => {
  for (const item of nodes) {
    if (offset >= item.start && offset <= item.end) {
      return { node: item.node, offset: offset - item.start }
    }
  }
  const last = nodes.at(-1)
  return last && offset === last.end ? { node: last.node, offset: last.node.data.length } : null
}

const relocatedRange = (note: ReaderNote): Range | null => {
  const { text, nodes } = contentTextSnapshot()
  if (!note.excerpt || !text) return null
  let searchFrom = 0
  let bestStart = -1
  let bestScore = -1
  while (searchFrom <= text.length) {
    const start = text.indexOf(note.excerpt, searchFrom)
    if (start < 0) break
    const before = text.slice(Math.max(0, start - (note.prefixContext?.length || 0)), start)
    const end = start + note.excerpt.length
    const after = text.slice(end, end + (note.suffixContext?.length || 0))
    const score = Number(Boolean(note.prefixContext) && before.endsWith(note.prefixContext || ''))
      + Number(Boolean(note.suffixContext) && after.startsWith(note.suffixContext || ''))
    if (score > bestScore) {
      bestScore = score
      bestStart = start
    }
    searchFrom = start + Math.max(1, note.excerpt.length)
  }
  if (bestStart < 0) return null
  const start = textPointAtGlobalOffset(nodes, bestStart)
  const end = textPointAtGlobalOffset(nodes, bestStart + note.excerpt.length)
  if (!start || !end) return null
  const range = document.createRange()
  range.setStart(start.node, start.offset)
  range.setEnd(end.node, end.offset)
  return range
}

const locateNoteRange = (note: ReaderNote) => rangeFromAnchors(note) || relocatedRange(note)

const resolveNoteTargetChapterId = (note: ReaderNote): ReaderId | undefined =>
  note.targetChapterId ?? (note.contentChanged ? undefined : note.chapterId)

const clearNoteHighlights = () => {
  noteRangeById.clear()
  const { registry } = getHighlightApi()
  for (const name of NOTE_HIGHLIGHT_NAMES) registry?.delete(name)
}

const renderNoteHighlights = () => {
  clearNoteHighlights()
  if (!chapter.value || !contentRef.value) return
  const rangesByColor: Record<ReaderNoteColor, Range[]> = {
    rose: [],
    sage: [],
    blue: [],
    amber: [],
  }
  for (const note of notes.value) {
    const targetChapterId = resolveNoteTargetChapterId(note)
    if (String(targetChapterId) !== String(chapter.value.id)) continue
    const range = locateNoteRange(note)
    if (!range) continue
    noteRangeById.set(String(note.id), range)
    rangesByColor[note.highlightColor].push(range)
  }
  const { registry, HighlightConstructor } = getHighlightApi()
  if (!registry || !HighlightConstructor) return
  for (const color of Object.keys(rangesByColor) as ReaderNoteColor[]) {
    if (rangesByColor[color].length) {
      registry.set(`reader-note-${color}`, new HighlightConstructor(...rangesByColor[color]))
    }
  }
}

const rangeContext = (range: Range) => {
  const root = contentRef.value
  if (!root) return { prefixContext: '', suffixContext: '' }
  const prefixRange = document.createRange()
  prefixRange.selectNodeContents(root)
  prefixRange.setEnd(range.startContainer, range.startOffset)
  const suffixRange = document.createRange()
  suffixRange.selectNodeContents(root)
  suffixRange.setStart(range.endContainer, range.endOffset)
  return {
    prefixContext: prefixRange.toString().slice(-120),
    suffixContext: suffixRange.toString().slice(0, 120),
  }
}

const captureSelection = () => {
  if (editorDraft.value || !chapter.value || !book.value || !contentRef.value) return
  const selection = document.getSelection()
  if (!selection || selection.rangeCount === 0 || selection.isCollapsed) {
    selectionTriggerVisible.value = false
    selectionAnchor.value = undefined
    return
  }
  const range = selection.getRangeAt(0).cloneRange()
  if (preference.readingMode === 'continuous') {
    const startElement = range.startContainer.nodeType === Node.ELEMENT_NODE
      ? range.startContainer as Element
      : range.startContainer.parentElement
    const endElement = range.endContainer.nodeType === Node.ELEMENT_NODE
      ? range.endContainer as Element
      : range.endContainer.parentElement
    const startRoot = startElement?.closest<HTMLElement>('[data-reader-content-id]')
    const endRoot = endElement?.closest<HTMLElement>('[data-reader-content-id]')
    if (!startRoot || startRoot !== endRoot) {
      selectionTriggerVisible.value = false
      selectionAnchor.value = undefined
      return
    }
    const selectedEntry = findLoadedChapter(startRoot.dataset.readerContentId || '')
    if (selectedEntry && String(selectedEntry.chapter.id) !== String(chapter.value.id)) {
      chapter.value = selectedEntry.chapter
      contentRef.value = startRoot
      renderNoteHighlights()
      void router.replace({ query: { ...route.query, chapter: String(selectedEntry.chapter.id) } })
    }
  }
  if (!contentRef.value.contains(range.startContainer) || !contentRef.value.contains(range.endContainer)) {
    selectionTriggerVisible.value = false
    selectionAnchor.value = undefined
    return
  }
  const excerpt = range.toString()
  if (!excerpt.trim()) return
  if (excerpt.length > 5000) {
    selectionTriggerVisible.value = false
    notify.warning('单条笔记最多记录 5000 个字符，请缩短选区')
    return
  }
  const start = boundaryInBlock(range.startContainer, range.startOffset)
  const end = boundaryInBlock(range.endContainer, range.endOffset)
  if (!start || !end) {
    selectionTriggerVisible.value = false
    return
  }
  const context = rangeContext(range)
  selectionAnchor.value = {
    chapterId: chapter.value.id,
    startBlockIndex: start.blockIndex,
    startCharacterOffset: start.characterOffset,
    endBlockIndex: end.blockIndex,
    endCharacterOffset: end.characterOffset,
    excerpt,
    prefixContext: context.prefixContext,
    suffixContext: context.suffixContext,
    contentVersion: book.value.contentVersion,
  }
  const rects = [...range.getClientRects()].filter(rect => rect.width || rect.height)
  const rect = rects.at(-1) || range.getBoundingClientRect()
  const triggerWidth = 88
  const triggerHeight = 36
  let left = Math.min(window.innerWidth - triggerWidth - 12, rect.right + 8)
  if (left < 12) left = Math.max(12, rect.left)
  let top = rect.bottom + 8
  if (top + triggerHeight > window.innerHeight - 12) top = rect.top - triggerHeight - 8
  selectionTriggerPosition.left = left
  selectionTriggerPosition.top = Math.max(68, top)
  selectionTriggerVisible.value = true
}

const scheduleSelectionCapture = () => {
  window.clearTimeout(selectionTimer)
  selectionTimer = window.setTimeout(captureSelection, 80)
}

const requestNoteLogin = () => {
  selectionTriggerVisible.value = false
  notify.warning('登录后才能保存自己的阅读笔记')
  runSilently(router.push({ path: '/login', query: { redirect: route.fullPath } }))
}

const editorPositionNear = (rect: Pick<DOMRect, 'left' | 'right' | 'top' | 'bottom'>) => {
  const width = 390
  const height = 470
  const left = Math.max(12, Math.min(window.innerWidth - width - 12, rect.right - width))
  const preferredTop = rect.bottom + 10
  const top = preferredTop + height <= window.innerHeight - 12
    ? preferredTop
    : Math.max(76, rect.top - height - 10)
  return { left, top }
}

const startNoteFromSelection = () => {
  if (!isLoggedIn.value) {
    requestNoteLogin()
    return
  }
  const anchor = selectionAnchor.value
  if (!anchor) return
  const position = editorPositionNear({
    left: selectionTriggerPosition.left,
    right: selectionTriggerPosition.left + 88,
    top: selectionTriggerPosition.top,
    bottom: selectionTriggerPosition.top + 36,
  })
  editorDraft.value = {
    mode: 'create',
    anchor,
    excerpt: anchor.excerpt,
    reflection: '',
    highlightColor: 'rose',
    ...position,
  }
  selectionTriggerVisible.value = false
  document.getSelection()?.removeAllRanges()
}

const closeNoteEditor = () => {
  editorDraft.value = undefined
  selectionAnchor.value = undefined
  selectionTriggerVisible.value = false
  document.getSelection()?.removeAllRanges()
}

const sortNotes = () => {
  notes.value.sort((left, right) => left.chapterOrder - right.chapterOrder
    || left.startBlockIndex - right.startBlockIndex
    || left.startCharacterOffset - right.startCharacterOffset
    || String(left.id).localeCompare(String(right.id)))
}

const loadNotes = async (force = false) => {
  if (!isLoggedIn.value || (notesLoaded.value && !force) || notesLoading.value) return
  notesLoading.value = true
  notesError.value = ''
  try {
    notes.value = await listReaderNotes(bookId.value)
    sortNotes()
    notesLoaded.value = true
    await nextTick()
    renderNoteHighlights()
  } catch {
    notesError.value = '暂时无法加载阅读笔记，请检查网络后重试。'
  } finally {
    notesLoading.value = false
  }
}

const openNotes = () => {
  if (!isLoggedIn.value) {
    requestNoteLogin()
    return
  }
  tocOpen.value = false
  settingsOpen.value = false
  notesOpen.value = true
  runSilently(loadNotes())
}

const editNote = (note: ReaderNote, event: MouseEvent) => {
  const rect = (event.currentTarget as HTMLElement | null)?.getBoundingClientRect()
  const fallback = { left: window.innerWidth - 440, right: window.innerWidth - 24, top: 88, bottom: 124 }
  notesOpen.value = false
  editorDraft.value = {
    mode: 'edit',
    noteId: note.id,
    excerpt: note.excerpt,
    reflection: note.reflection || '',
    highlightColor: note.highlightColor,
    ...editorPositionNear(rect || fallback),
  }
}

const saveNote = async (value: { reflection: string; highlightColor: ReaderNoteColor }) => {
  const draft = editorDraft.value
  if (!draft || noteSaving.value) return
  noteSaving.value = true
  try {
    const saved = draft.mode === 'create' && draft.anchor
      ? await createReaderNote(bookId.value, {
          ...draft.anchor,
          reflection: value.reflection,
          highlightColor: value.highlightColor,
        })
      : await updateReaderNote(draft.noteId as ReaderId, {
          reflection: value.reflection,
          highlightColor: value.highlightColor,
        })
    const index = notes.value.findIndex(note => String(note.id) === String(saved.id))
    if (index >= 0) notes.value.splice(index, 1, saved)
    else notes.value.push(saved)
    notesLoaded.value = true
    notesError.value = ''
    sortNotes()
    await nextTick()
    renderNoteHighlights()
    notify.success(draft.mode === 'create' ? '阅读笔记已保存' : '阅读笔记已更新')
    closeNoteEditor()
  } finally {
    noteSaving.value = false
  }
}

const removeNote = async (note: ReaderNote) => {
  const confirmed = await confirmDelete('删除这条阅读笔记？原文高亮和感悟将一并删除，且无法恢复。', {
    title: '删除阅读笔记',
    confirmText: '删除笔记',
    cancelText: '保留笔记',
  })
  if (!confirmed) return
  await deleteReaderNote(note.id)
  notes.value = notes.value.filter(item => String(item.id) !== String(note.id))
  await nextTick()
  renderNoteHighlights()
  notify.success('阅读笔记已删除')
}

const findLoadedChapter = (chapterId: ReaderId) => loadedChapters.value
  .find(entry => String(entry.chapter.id) === String(chapterId))

const syncContentRef = () => {
  if (!chapter.value) {
    contentRef.value = undefined
    return
  }
  if (preference.readingMode === 'paged') return
  contentRef.value = document.querySelector<HTMLElement>(
    `[data-reader-content-id="${String(chapter.value.id)}"]`,
  ) || undefined
}

const activateLoadedChapter = async (entry: LoadedReaderChapter) => {
  if (String(chapter.value?.id) === String(entry.chapter.id) && contentRef.value) return
  chapter.value = entry.chapter
  await nextTick()
  syncContentRef()
  renderNoteHighlights()
  void router.replace({ query: { ...route.query, chapter: String(entry.chapter.id) } })
}

const syncActiveChapterFromScroll = () => {
  if (preference.readingMode !== 'continuous' || !loadedChapters.value.length) return
  const readingLine = Math.max(112, window.innerHeight * 0.3)
  const sections = [...document.querySelectorAll<HTMLElement>('[data-reader-chapter-id]')]
  let active = sections[0]
  for (const section of sections) {
    if (section.getBoundingClientRect().top <= readingLine) active = section
    else break
  }
  const entry = active && findLoadedChapter(active.dataset.readerChapterId || '')
  if (entry) runSilently(activateLoadedChapter(entry))
}

const trimContinuousWindow = async (direction: 'previous' | 'next') => {
  if (loadedChapters.value.length <= MAX_CONTINUOUS_CHAPTERS) return
  if (direction === 'previous') {
    loadedChapters.value.pop()
    await nextTick()
    return
  }
  const heightBefore = document.documentElement.scrollHeight
  loadedChapters.value.shift()
  await nextTick()
  const removedHeight = heightBefore - document.documentElement.scrollHeight
  if (removedHeight > 0) window.scrollBy({ top: -removedHeight, behavior: 'auto' })
}

const loadAdjacentChapter = async (direction: 'previous' | 'next') => {
  if (preference.readingMode !== 'continuous') return
  const edge = direction === 'previous' ? firstLoadedChapter.value : lastLoadedChapter.value
  const targetId = direction === 'previous' ? edge?.previousChapterId : edge?.nextChapterId
  if (!targetId) return
  const loadingState = direction === 'previous' ? loadingPrevious : loadingNext
  const errorState = direction === 'previous' ? previousLoadError : nextLoadError
  if (loadingState.value || findLoadedChapter(targetId)) return
  loadingState.value = true
  errorState.value = false
  const heightBefore = document.documentElement.scrollHeight
  try {
    const loaded = await getReaderChapter(bookId.value, targetId)
    const entry = { chapter: loaded, html: await resolveHtml(loaded.contentHtml) }
    if (direction === 'previous') loadedChapters.value.unshift(entry)
    else loadedChapters.value.push(entry)
    await nextTick()
    if (direction === 'previous') {
      const addedHeight = document.documentElement.scrollHeight - heightBefore
      if (addedHeight > 0) window.scrollBy({ top: addedHeight, behavior: 'auto' })
    }
    await trimContinuousWindow(direction)
  } catch {
    errorState.value = true
  } finally {
    loadingState.value = false
  }
}

const maybeLoadAdjacentChapter = () => {
  if (preference.readingMode !== 'continuous') return
  window.cancelAnimationFrame(adjacentLoadFrame)
  adjacentLoadFrame = window.requestAnimationFrame(() => {
    const currentScrollY = window.scrollY
    const scrollingUp = currentScrollY < lastScrollY
    lastScrollY = currentScrollY
    const distanceToBottom = document.documentElement.scrollHeight - currentScrollY - window.innerHeight
    if (distanceToBottom < window.innerHeight * 1.25) {
      runSilently(loadAdjacentChapter('next'))
    }
    if (scrollingUp && currentScrollY < Math.max(180, window.innerHeight * 0.6)) {
      runSilently(loadAdjacentChapter('previous'))
    }
  })
}

const loadChapter = async (chapterId: ReaderId, restore?: ReaderProgressCommand | null) => {
  loading.value = true
  selectionTriggerVisible.value = false
  selectionAnchor.value = undefined
  clearNoteHighlights()
  revokeAll()
  try {
    const loaded = await getReaderChapter(bookId.value, chapterId)
    chapter.value = loaded
    hydratedHtml.value = await resolveHtml(loaded.contentHtml)
    loadedChapters.value = [{ chapter: loaded, html: hydratedHtml.value }]
    previousLoadError.value = false
    nextLoadError.value = false
    await nextTick()
    syncContentRef()
    renderNoteHighlights()
    ignoreScrollUntil = Date.now() + 500
    if (restore && String(restore.chapterId) === String(loaded.id)) {
      restorePosition(restore)
      currentProgress.value = Number(restore.progressPercent || 0)
      showResumeNotice.value = Number(restore.blockIndex || 0) > 0
      if (showResumeNotice.value) window.setTimeout(() => { showResumeNotice.value = false }, 3200)
    } else {
      window.scrollTo({ top: 0, behavior: 'auto' })
      updateCurrentPosition()
    }
    void router.replace({
      query: { ...route.query, chapter: String(loaded.id) },
    })
  } finally {
    loading.value = false
  }
  if (preference.readingMode === 'continuous') {
    runSilently(loadAdjacentChapter('previous'))
    maybeLoadAdjacentChapter()
  }
}

const restorePosition = (progress: ReaderProgressCommand) => {
  const blocks = contentRef.value?.querySelectorAll<HTMLElement>('[data-reader-block]')
  const target = blocks?.[Math.min(progress.blockIndex || 0, Math.max(0, (blocks?.length || 1) - 1))]
  if (!target) {
    window.scrollTo({ top: 0, behavior: 'auto' })
    return
  }
  const textLength = Math.max(1, target.textContent?.length || 1)
  const ratio = Math.min(1, Math.max(0, (progress.characterOffset || 0) / textLength))
  const top = target.getBoundingClientRect().top + window.scrollY - 104 + target.offsetHeight * ratio
  window.scrollTo({ top: Math.max(0, top), behavior: 'auto' })
}

const captureProgress = (): ReaderProgressCommand | null => {
  if (!chapter.value || !contentRef.value) return null
  const blocks = [...contentRef.value.querySelectorAll<HTMLElement>('[data-reader-block]')]
  if (!blocks.length) return null
  const readingLine = preference.readingMode === 'continuous'
    ? Math.max(112, window.innerHeight * 0.3)
    : 112
  let selected = blocks[0]
  for (const block of blocks) {
    if (block.getBoundingClientRect().top <= readingLine) selected = block
    else break
  }
  const rect = selected.getBoundingClientRect()
  const ratio = rect.height > 0
    ? Math.min(1, Math.max(0, (readingLine - rect.top) / rect.height))
    : 0
  const blockIndex = Math.max(0, blocks.indexOf(selected))
  const text = selected.textContent || ''
  const characterOffset = Math.round(text.length * ratio)
  const chapterRatio = (blockIndex + ratio) / Math.max(1, blocks.length)
  const percent = Math.min(100, Math.max(0,
    ((chapter.value.chapterOrder + chapterRatio) / Math.max(1, chapter.value.chapterCount)) * 100))
  return {
    chapterId: chapter.value.id,
    blockIndex,
    characterOffset,
    progressPercent: Number(percent.toFixed(3)),
    locatorContext: text.slice(
      Math.max(0, characterOffset - 36),
      Math.min(text.length, characterOffset + 72),
    ),
    finished: !chapter.value.nextChapterId && percent >= 99.8,
  }
}

const persistLocal = (progress: ReaderProgressCommand) => {
  if (!book.value) return
  const local: LocalReaderProgress = {
    ...progress,
    savedAt: new Date().toISOString(),
    contentVersion: book.value.contentVersion,
  }
  localStorage.setItem(localStorageKey(), JSON.stringify(local))
}

const saveCurrentPosition = async (server = true) => {
  const progress = captureProgress()
  if (!progress) return
  persistLocal(progress)
  currentProgress.value = Number(progress.progressPercent)
  if (server && isLoggedIn.value) {
    await saveReaderProgress(bookId.value, progress)
  }
}

const runSilently = (task: Promise<unknown>) => {
  void task.catch(() => undefined)
}

const scheduleProgressSave = () => {
  const progress = captureProgress()
  if (!progress) return
  persistLocal(progress)
  currentProgress.value = Number(progress.progressPercent)
  window.clearTimeout(progressTimer)
  if (isLoggedIn.value) {
    progressTimer = window.setTimeout(() => {
      runSilently(saveReaderProgress(bookId.value, progress))
    }, 1200)
  }
}

const updateCurrentPosition = () => {
  if (Date.now() < ignoreScrollUntil) return
  if (!editorDraft.value) selectionTriggerVisible.value = false
  window.cancelAnimationFrame(scrollFrame)
  scrollFrame = window.requestAnimationFrame(() => {
    syncActiveChapterFromScroll()
    scheduleProgressSave()
  })
  maybeLoadAdjacentChapter()
}

const navigateChapter = async (chapterId: ReaderId) => {
  window.clearTimeout(progressTimer)
  await saveCurrentPosition(true).catch(() => undefined)
  await loadChapter(chapterId)
}

const focusNoteRange = (note: ReaderNote) => {
  const range = noteRangeById.get(String(note.id)) || locateNoteRange(note)
  if (!range) return false
  noteRangeById.set(String(note.id), range)
  const { registry, HighlightConstructor } = getHighlightApi()
  if (registry && HighlightConstructor) {
    registry.set('reader-note-focus', new HighlightConstructor(range))
    window.clearTimeout(noteFocusTimer)
    noteFocusTimer = window.setTimeout(() => registry.delete('reader-note-focus'), 1800)
  } else {
    const selection = document.getSelection()
    selection?.removeAllRanges()
    selection?.addRange(range)
  }
  const rect = range.getBoundingClientRect()
  window.scrollTo({
    top: Math.max(0, rect.top + window.scrollY - 118),
    behavior: 'smooth',
  })
  return true
}

const jumpToNote = async (note: ReaderNote) => {
  const targetChapterId = resolveNoteTargetChapterId(note)
  notesOpen.value = false
  if (!targetChapterId) {
    notify.warning('原章节已经变化，暂时无法定位这条笔记')
    return
  }
  try {
    if (String(chapter.value?.id) !== String(targetChapterId)) {
      await navigateChapter(targetChapterId)
    } else {
      renderNoteHighlights()
    }
    await nextTick()
    if (!focusNoteRange(note)) {
      window.scrollTo({ top: 0, behavior: 'smooth' })
      notify.warning('原文位置已经变化，已跳转到对应章节')
    }
  } catch {
    notify.error('暂时无法打开笔记对应的章节，请稍后重试')
  }
}

const selectFromDrawer = (chapterId: ReaderId) => {
  tocOpen.value = false
  runSilently(navigateChapter(chapterId))
}

const locateCurrentChapter = async () => {
  if (searchResults.value !== null) {
    clearSearch()
    await nextTick()
  }
  await tocTreeRef.value?.locateChapter(chapter.value?.id)
}

const openToc = () => {
  locateOnTocOpen.value = true
  tocOpen.value = true
}

const openSearch = () => {
  locateOnTocOpen.value = false
  tocOpen.value = true
  window.setTimeout(() => searchInput.value?.focus(), 220)
}

const runSearch = async () => {
  const query = searchKeyword.value.trim()
  if (query.length < 2 || searching.value) return
  searching.value = true
  try {
    searchResults.value = await searchReaderBook(bookId.value, query)
  } finally {
    searching.value = false
  }
}

const clearSearch = () => {
  searchResults.value = null
  searchKeyword.value = ''
}

const changeReadingMode = async (mode: ReaderReadingMode) => {
  if (preference.readingMode === mode || !chapter.value) return
  const progress = captureProgress()
  const activeEntry = findLoadedChapter(chapter.value.id)
    || { chapter: chapter.value, html: hydratedHtml.value }
  preference.readingMode = mode
  hydratedHtml.value = activeEntry.html
  loadedChapters.value = [activeEntry]
  previousLoadError.value = false
  nextLoadError.value = false
  await nextTick()
  syncContentRef()
  if (progress) restorePosition(progress)
  renderNoteHighlights()
  lastScrollY = window.scrollY
  if (mode === 'continuous') {
    runSilently(loadAdjacentChapter('previous'))
    maybeLoadAdjacentChapter()
  }
}

const schedulePreferenceSave = () => {
  localStorage.setItem('chen404:reader-preference', JSON.stringify(preference))
  if (!initializedPreference || !isLoggedIn.value) return
  window.clearTimeout(preferenceTimer)
  preferenceTimer = window.setTimeout(async () => {
    preferenceSaving.value = true
    try {
      const saved = await saveReaderPreference({ ...preference })
      Object.assign(preference, normalizePreference(saved))
    } catch {
      // localStorage 已保存偏好，网络恢复后下一次修改会重新同步。
    } finally {
      preferenceSaving.value = false
    }
  }, 600)
}

const normalizePreference = (value: Partial<ReaderPreference>): ReaderPreference => ({
  fontSize: Number(value.fontSize || 18),
  lineHeight: Number(value.lineHeight || 1.85),
  contentWidth: Number(value.contentWidth || 720),
  paragraphSpacing: Number(value.paragraphSpacing || 16),
  theme: (value.theme || 'light') as ReaderTheme,
  fontFamily: (value.fontFamily || 'serif') as ReaderFontFamily,
  readingMode: value.readingMode === 'continuous' ? 'continuous' : 'paged',
})

const loadInitial = async () => {
  loading.value = true
  try {
    const signedIn = await userStore.syncAuthState()
    const [loadedBook, loadedToc] = await Promise.all([
      getReaderBook(bookId.value),
      getReaderToc(bookId.value),
    ])
    const [serverProgress, serverPreference] = signedIn
      ? await Promise.all([getReaderProgress(bookId.value), getReaderPreference()])
      : [null, null]
    book.value = loadedBook
    toc.value = loadedToc
    let localPreference: Partial<ReaderPreference> = {}
    try {
      localPreference = JSON.parse(localStorage.getItem('chen404:reader-preference') || '{}')
    } catch {
      localPreference = {}
    }
    Object.assign(preference, normalizePreference({ ...(serverPreference || {}), ...localPreference }))
    initializedPreference = signedIn

    const localProgress = readLocalProgress()
    const restore = chooseRestoreProgress(serverProgress, localProgress)
    const queryChapter = typeof route.query.chapter === 'string' ? route.query.chapter : undefined
    const target = queryChapter || restore?.chapterId || flattenFirstChapterId(loadedToc)
    if (target) await loadChapter(target, queryChapter ? null : restore)
    if (signedIn) runSilently(loadNotes())
  } finally {
    loading.value = false
  }
}

const handleKeydown = (event: KeyboardEvent) => {
  const target = event.target as HTMLElement | null
  if (target?.matches('input, textarea, select, [contenteditable="true"]')) return
  if (target?.closest('.reader-drawer, .reader-note-editor')) return
  if (preference.readingMode === 'paged' && event.key === 'ArrowLeft' && chapter.value?.previousChapterId) {
    event.preventDefault()
    runSilently(navigateChapter(chapter.value.previousChapterId))
  } else if (preference.readingMode === 'paged' && event.key === 'ArrowRight' && chapter.value?.nextChapterId) {
    event.preventDefault()
    runSilently(navigateChapter(chapter.value.nextChapterId))
  } else if (event.key.toLowerCase() === 'm') {
    tocOpen.value = !tocOpen.value
  } else if (event.key.toLowerCase() === 'a') {
    settingsOpen.value = !settingsOpen.value
  } else if (event.key.toLowerCase() === 'n') {
    openNotes()
  }
}

const handleVisibility = () => {
  if (document.visibilityState === 'hidden') runSilently(saveCurrentPosition(true))
}
const handlePageHide = () => {
  const progress = captureProgress()
  if (progress) persistLocal(progress)
  runSilently(saveCurrentPosition(true))
}

const formatCharCount = (value: number) => value >= 10_000
  ? `${(value / 10_000).toFixed(1)} 万字`
  : `${value} 字`

watch(preference, schedulePreferenceSave, { deep: true })
watch(tocOpen, (open) => {
  if (!open || !locateOnTocOpen.value) return
  window.setTimeout(() => runSilently(locateCurrentChapter()), 260)
})
watch(isLoggedIn, (signedIn) => {
  if (signedIn) {
    runSilently(loadNotes(true))
  } else {
    notes.value = []
    notesLoaded.value = false
    notesOpen.value = false
    clearNoteHighlights()
  }
})

onMounted(() => {
  ensureNoteHighlightStyles()
  lastScrollY = window.scrollY
  runSilently(loadInitial())
  window.addEventListener('scroll', updateCurrentPosition, { passive: true })
  window.addEventListener('keydown', handleKeydown)
  window.addEventListener('pagehide', handlePageHide)
  document.addEventListener('visibilitychange', handleVisibility)
  document.addEventListener('selectionchange', scheduleSelectionCapture)
})

onBeforeUnmount(() => {
  window.clearTimeout(progressTimer)
  window.clearTimeout(preferenceTimer)
  window.clearTimeout(selectionTimer)
  window.clearTimeout(noteFocusTimer)
  window.cancelAnimationFrame(scrollFrame)
  window.cancelAnimationFrame(adjacentLoadFrame)
  clearNoteHighlights()
  document.getElementById(NOTE_HIGHLIGHT_STYLE_ID)?.remove()
  const progress = captureProgress()
  if (progress) persistLocal(progress)
  runSilently(saveCurrentPosition(true))
  window.removeEventListener('scroll', updateCurrentPosition)
  window.removeEventListener('keydown', handleKeydown)
  window.removeEventListener('pagehide', handlePageHide)
  document.removeEventListener('visibilitychange', handleVisibility)
  document.removeEventListener('selectionchange', scheduleSelectionCapture)
})
</script>

<style scoped lang="scss">
.reader-page {
  --reader-bg: #f7f3ef;
  --reader-paper: #fffdf9;
  --reader-text: #332e30;
  --reader-muted: #81777a;
  --reader-border: rgba(78, 60, 67, 0.13);
  min-height: 100vh;
  background: var(--reader-bg);
  color: var(--reader-text);
  transition:
    background-color 200ms ease,
    color 200ms ease;
}

.reader-theme--rose {
  --reader-bg: #f8eeee;
  --reader-paper: #fff9f7;
  --reader-text: #402f35;
  --reader-muted: #8a6d76;
  --reader-border: rgba(113, 71, 84, 0.14);
}

.reader-theme--dark {
  --reader-bg: #171417;
  --reader-paper: #211d21;
  --reader-text: #ded5d8;
  --reader-muted: #9f9297;
  --reader-border: rgba(255, 255, 255, 0.09);
}

.reader-toolbar {
  position: fixed;
  z-index: 30;
  top: 0;
  left: 0;
  right: 0;
  display: grid;
  grid-template-columns: 1fr minmax(160px, 340px) 1fr;
  align-items: center;
  min-height: 64px;
  padding: 8px clamp(10px, 2vw, 28px);
  border-bottom: 1px solid var(--reader-border);
  background: color-mix(in srgb, var(--reader-bg) 88%, transparent);
  backdrop-filter: blur(16px);
}

.reader-toolbar :deep(.ui-button) {
  color: var(--reader-muted);
}

.reader-toolbar__side {
  display: flex;
  align-items: center;
  gap: 4px;
  min-width: 0;
}

.reader-toolbar__actions {
  justify-content: flex-end;
}

.reader-book-title {
  display: grid;
  min-width: 0;
  padding: 2px 8px;
  border: 0;
  background: transparent;
  color: var(--reader-text);
  text-align: left;
  cursor: pointer;
}

.reader-book-title span,
.reader-book-title small {
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.reader-book-title span {
  font-size: 14px;
  font-weight: 650;
}

.reader-book-title small {
  color: var(--reader-muted);
  font-size: 11px;
}

.reader-toolbar__progress {
  display: flex;
  align-items: center;
  gap: 10px;
  color: var(--reader-muted);
  font-size: 11px;
  font-variant-numeric: tabular-nums;
}

.reader-toolbar__progress > div {
  flex: 1;
  height: 2px;
  overflow: hidden;
  background: var(--reader-border);
}

.reader-toolbar__progress i {
  display: block;
  height: 100%;
  background: var(--primary);
}

.reader-loading {
  min-height: 100vh;
}

.reader-shell {
  padding: 108px 20px 84px;
}

.reader-shell--continuous {
  display: grid;
  gap: 28px;
}

.reader-paper {
  width: min(var(--reader-width), calc(100vw - 40px));
  min-height: calc(100vh - 150px);
  margin: 0 auto;
  padding: clamp(42px, 7vw, 90px) clamp(24px, 7vw, 94px);
  border: 1px solid var(--reader-border);
  background: var(--reader-paper);
  box-shadow: 0 24px 70px rgba(55, 41, 47, 0.08);
}

.reader-theme--dark .reader-paper {
  box-shadow: 0 24px 70px rgba(0, 0, 0, 0.24);
}

.continuous-chapter {
  min-height: 0;
}

.continuous-chapter .chapter-header {
  margin-bottom: clamp(42px, 6vw, 68px);
}

.chapter-load-state,
.chapter-load-retry,
.book-finished-state {
  width: min(var(--reader-width), calc(100vw - 40px));
  margin: 0 auto;
}

.chapter-load-state,
.chapter-load-retry {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  min-height: 54px;
  border: 1px solid var(--reader-border);
  background: var(--reader-paper);
  color: var(--reader-muted);
  font-size: 13px;
}

.chapter-load-retry {
  color: var(--primary);
  cursor: pointer;
}

.book-finished-state {
  display: grid;
  justify-items: center;
  gap: 8px;
  padding: 38px 20px;
  color: var(--reader-muted);
  text-align: center;
}

.book-finished-state :deep(.ui-icon) {
  color: var(--primary);
  font-size: 24px;
}

.book-finished-state strong {
  color: var(--reader-text);
  font-size: 16px;
}

.book-finished-state span {
  font-size: 12px;
}

.chapter-header {
  margin-bottom: clamp(48px, 8vw, 82px);
  padding-bottom: 28px;
  border-bottom: 1px solid var(--reader-border);
  text-align: center;
}

.chapter-header p {
  margin: 0 0 12px;
  color: var(--primary);
  font-size: 12px;
  font-weight: 700;
  letter-spacing: 0.14em;
}

.chapter-header h1 {
  margin: 0 0 18px;
  color: var(--reader-text);
  font-family: 'Noto Serif SC', 'Songti SC', SimSun, serif;
  font-size: clamp(28px, 5vw, 44px);
  font-weight: 650;
  line-height: 1.35;
  text-wrap: balance;
}

.chapter-header span {
  color: var(--reader-muted);
  font-size: 12px;
}

.reader-content {
  color: var(--reader-text);
  font-size: var(--reader-font-size);
  line-height: var(--reader-line-height);
  overflow-wrap: anywhere;
}

.reader-font--serif .reader-content {
  font-family: 'Noto Serif SC', 'Source Han Serif SC', 'Songti SC', SimSun, serif;
}

.reader-font--sans .reader-content {
  font-family: 'Noto Sans SC', 'Microsoft YaHei', sans-serif;
}

.reader-content :deep(p),
.reader-content :deep(blockquote),
.reader-content :deep(pre),
.reader-content :deep(ul),
.reader-content :deep(ol) {
  margin: 0 0 var(--reader-paragraph-space);
}

.reader-content :deep(p) {
  text-align: justify;
  text-indent: 2em;
}

.reader-content :deep(h1),
.reader-content :deep(h2),
.reader-content :deep(h3),
.reader-content :deep(h4) {
  margin: 2.4em 0 1em;
  color: var(--reader-text);
  font-family: inherit;
  line-height: 1.45;
  text-indent: 0;
}

.reader-content :deep(blockquote) {
  padding: 10px 0 10px 20px;
  border-left: 3px solid color-mix(in srgb, var(--primary) 48%, transparent);
  color: var(--reader-muted);
}

.reader-content :deep(pre) {
  overflow-x: auto;
  padding: 16px;
  border: 1px solid var(--reader-border);
  background: color-mix(in srgb, var(--reader-bg) 72%, transparent);
  font-family: ui-monospace, SFMono-Regular, Consolas, monospace;
  font-size: 0.85em;
  line-height: 1.7;
  text-indent: 0;
}

.reader-content :deep(img) {
  display: block;
  max-width: 100%;
  max-height: 78vh;
  margin: 34px auto;
  object-fit: contain;
}

.reader-content :deep(.reader-image-fallback) {
  display: block;
  margin: 20px 0;
  color: var(--reader-muted);
  font-size: 0.82em;
  text-align: center;
}

.chapter-navigation {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 16px;
  margin-top: clamp(70px, 12vw, 130px);
  padding-top: 28px;
  border-top: 1px solid var(--reader-border);
}

.chapter-navigation button {
  display: flex;
  align-items: center;
  gap: 12px;
  min-height: 72px;
  padding: 12px 14px;
  border: 0;
  background: transparent;
  color: var(--reader-text);
  cursor: pointer;
  text-align: left;
}

.chapter-navigation button:last-child {
  justify-content: flex-end;
  text-align: right;
}

.chapter-navigation button:hover:not(:disabled) {
  background: color-mix(in srgb, var(--primary) 8%, transparent);
}

.chapter-navigation button:disabled {
  opacity: 0.38;
  cursor: default;
}

.chapter-navigation span {
  display: grid;
  font-size: 13px;
}

.chapter-navigation small {
  color: var(--reader-muted);
  font-size: 11px;
}

.reader-error {
  display: grid;
  place-items: center;
  min-height: 100vh;
}

.reader-drawer__body,
.reader-settings {
  display: grid;
  grid-template-columns: minmax(0, 1fr);
  gap: 24px;
  min-width: 0;
}

.reader-drawer__body {
  overflow-x: hidden;
  width: 100%;
}

.reader-search {
  display: grid;
  grid-template-columns: 1fr auto;
  gap: 8px;
}

.drawer-section-title,
.setting-label {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
  color: var(--color-text-primary);
}

.drawer-section-title {
  margin-bottom: 10px;
  padding-bottom: 10px;
  border-bottom: 1px solid var(--color-border-light);
  font-size: 13px;
  font-weight: 700;
}

.drawer-section-title button {
  border: 0;
  background: transparent;
  color: var(--primary);
  cursor: pointer;
  font-size: 12px;
}

.drawer-section-title small {
  color: var(--color-text-tertiary);
}

.toc-locator-bar {
  position: sticky;
  z-index: 2;
  top: -20px;
  margin: -8px 0 10px;
  padding: 14px 0 10px;
  background: var(--color-surface);
  min-width: 0;
  width: 100%;
}

.toc-locator-bar > span {
  display: flex;
  align-items: baseline;
  gap: 6px;
  min-width: 0;
}

.toc-locator-bar button {
  display: inline-flex;
  align-items: center;
  gap: 5px;
  flex: none;
}

.search-results {
  display: grid;
  gap: 6px;
}

.search-result {
  display: grid;
  gap: 5px;
  padding: 12px;
  border: 0;
  border-radius: 9px;
  background: transparent;
  color: var(--color-text-primary);
  text-align: left;
  cursor: pointer;
}

.search-result:hover {
  background: var(--color-accent-soft);
}

.search-result p {
  margin: 0;
  color: var(--color-text-tertiary);
  font-size: 12px;
  line-height: 1.6;
}

.reader-settings section {
  display: grid;
  gap: 12px;
  padding-bottom: 22px;
  border-bottom: 1px solid var(--color-border-light);
}

.reader-settings h3 {
  margin: 0;
  color: var(--color-text-primary);
  font-size: 14px;
}

.reading-mode-options {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 9px;
}

.reading-mode-options button {
  display: grid;
  gap: 6px;
  min-height: 82px;
  padding: 13px;
  border: 1px solid var(--color-border);
  border-radius: 10px;
  background: var(--color-surface);
  color: var(--color-text-secondary);
  cursor: pointer;
  text-align: left;
}

.reading-mode-options button:hover {
  border-color: color-mix(in srgb, var(--primary) 54%, var(--color-border));
}

.reading-mode-options button.is-active {
  border-color: var(--primary);
  background: var(--color-accent-soft);
  color: var(--primary);
}

.reading-mode-options button > span {
  display: flex;
  align-items: center;
  gap: 7px;
  font-size: 13px;
  font-weight: 700;
}

.reading-mode-options button small {
  color: var(--color-text-tertiary);
  font-size: 11px;
  line-height: 1.5;
}

.setting-label span {
  color: var(--color-text-tertiary);
  font-size: 12px;
  font-variant-numeric: tabular-nums;
}

.theme-options {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 9px;
}

.theme-options button {
  display: grid;
  gap: 7px;
  padding: 7px;
  border: 1px solid var(--color-border);
  border-radius: 9px;
  background: transparent;
  color: var(--color-text-secondary);
  cursor: pointer;
  font-size: 12px;
}

.theme-options button.is-active,
.font-options button.is-active {
  border-color: var(--primary);
  color: var(--primary);
}

.theme-options i {
  display: block;
  height: 38px;
  border: 1px solid rgba(0, 0, 0, 0.08);
  border-radius: 5px;
}

.theme-options .is-light i { background: #fffdf9; }
.theme-options .is-rose i { background: #fff1ef; }
.theme-options .is-dark i { background: #211d21; }

.font-options {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 8px;
}

.font-options button {
  height: 42px;
  border: 1px solid var(--color-border);
  border-radius: 9px;
  background: var(--color-surface);
  color: var(--color-text-secondary);
  cursor: pointer;
}

.font-options button:first-child {
  font-family: 'Noto Serif SC', 'Songti SC', serif;
}

.preference-status {
  display: flex;
  align-items: center;
  gap: 7px;
  margin: 0;
  color: var(--color-text-tertiary);
  font-size: 12px;
}

.selection-note-trigger {
  position: fixed;
  z-index: var(--z-popover);
  border-color: color-mix(in srgb, var(--primary) 62%, var(--reader-border));
  background: var(--reader-paper);
  color: var(--primary);
  box-shadow: 0 4px 8px rgba(48, 35, 41, 0.12);
}

.selection-note-trigger:hover {
  border-color: var(--primary);
  background: color-mix(in srgb, var(--primary) 7%, var(--reader-paper));
}

.resume-notice {
  position: fixed;
  z-index: 35;
  right: 22px;
  bottom: 22px;
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 11px 15px;
  border: 1px solid var(--reader-border);
  background: var(--reader-paper);
  color: var(--reader-text);
  box-shadow: 0 14px 36px rgba(48, 35, 41, 0.14);
  cursor: pointer;
  font-size: 13px;
}

.resume-notice :deep(.ui-icon) {
  color: var(--primary);
}

@media (max-width: 760px) {
  .reader-toolbar {
    grid-template-columns: minmax(0, 1fr) auto;
  }
  .reader-toolbar__progress {
    position: absolute;
    right: 0;
    bottom: -2px;
    left: 0;
  }
  .reader-toolbar__progress > span {
    display: none;
  }
  .reader-toolbar__actions :deep(.ui-button:first-child) {
    display: none;
  }
  .reader-shell {
    padding: 66px 0 0;
  }
  .reader-paper {
    width: 100%;
    min-height: calc(100vh - 66px);
    padding: 48px clamp(20px, 6vw, 34px) 64px;
    border: 0;
    box-shadow: none;
  }
  .reader-shell--continuous {
    gap: 0;
    padding-bottom: 0;
  }
  .continuous-chapter + .continuous-chapter {
    border-top: 10px solid var(--reader-bg);
  }
  .chapter-load-state,
  .chapter-load-retry,
  .book-finished-state {
    width: 100%;
  }
  .chapter-header {
    margin-bottom: 48px;
  }
  .chapter-navigation {
    gap: 4px;
  }
}

@media (prefers-reduced-motion: reduce) {
  .reader-page,
  .reader-toolbar,
  .reader-paper {
    transition: none;
  }
}
</style>
