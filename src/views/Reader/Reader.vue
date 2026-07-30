<template>
  <div
    class="reader-page"
    :class="[`reader-theme--${preference.theme}`, `reader-font--${preference.fontFamily}`]"
    :style="readerStyle"
  >
    <header class="reader-toolbar">
      <div class="reader-toolbar__side">
        <UiButton variant="text" icon-only icon="back" aria-label="返回书架" @click="router.push('/bookshelf')" />
        <button type="button" class="reader-book-title" @click="tocOpen = true">
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
        <UiButton variant="text" icon-only icon="menu" aria-label="打开目录" @click="tocOpen = true" />
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
      <main v-if="chapter" class="reader-shell">
        <article class="reader-paper">
          <header class="chapter-header">
            <p v-if="chapter.volumeTitle">{{ chapter.volumeTitle }}</p>
            <h1>{{ chapter.title }}</h1>
            <span>第 {{ chapter.chapterOrder + 1 }} / {{ chapter.chapterCount }} 章 · {{ formatCharCount(chapter.charCount) }}</span>
          </header>

          <div
            ref="contentRef"
            class="reader-content"
            v-html="hydratedHtml"
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
          <div class="drawer-section-title">
            <span>完整目录</span>
            <small>{{ book?.chapterCount || 0 }} 章</small>
          </div>
          <ReaderTocTree
            :items="toc"
            :active-chapter-id="chapter?.id"
            root
            @select="selectFromDrawer"
          />
        </template>
      </div>
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
import {
  getReaderBook,
  getReaderChapter,
  getReaderPreference,
  getReaderProgress,
  getReaderToc,
  saveReaderPreference,
  saveReaderProgress,
  searchReaderBook,
} from '@/api/reader'
import { useReaderAssetResolver } from '@/composables/reader/useReaderAssetResolver'
import { useUserStore } from '@/stores/user'
import type {
  ReaderBook,
  ReaderChapter,
  ReaderFontFamily,
  ReaderId,
  ReaderPreference,
  ReaderProgress,
  ReaderProgressCommand,
  ReaderSearchResult,
  ReaderTheme,
  ReaderTocItem,
} from '@/types/reader'

interface LocalReaderProgress extends ReaderProgressCommand {
  savedAt: string
  contentVersion: number
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
const contentRef = ref<HTMLElement>()
const searchInput = ref<{ focus: () => void }>()
const loading = ref(true)
const tocOpen = ref(false)
const settingsOpen = ref(false)
const searchKeyword = ref('')
const searchResults = ref<ReaderSearchResult[] | null>(null)
const searching = ref(false)
const showResumeNotice = ref(false)
const preferenceSaving = ref(false)
const currentProgress = ref(0)
const preference = reactive<ReaderPreference>({
  fontSize: 18,
  lineHeight: 1.85,
  contentWidth: 720,
  paragraphSpacing: 16,
  theme: 'light',
  fontFamily: 'serif',
})
const { resolveHtml, revokeAll } = useReaderAssetResolver()

const themeOptions: Array<{ value: ReaderTheme; label: string }> = [
  { value: 'light', label: '明亮' },
  { value: 'rose', label: '柔粉' },
  { value: 'dark', label: '夜间' },
]

const readerStyle = computed(() => ({
  '--reader-font-size': `${preference.fontSize}px`,
  '--reader-line-height': String(preference.lineHeight),
  '--reader-width': `${preference.contentWidth}px`,
  '--reader-paragraph-space': `${preference.paragraphSpacing}px`,
}))
const previousLabel = computed(() => chapter.value?.previousChapterId ? '回到前一章' : '已经是第一章')
const nextLabel = computed(() => chapter.value?.nextChapterId ? '继续下一章' : '本书已读完')

let scrollFrame = 0
let progressTimer = 0
let preferenceTimer = 0
let ignoreScrollUntil = 0
let initializedPreference = false

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

const loadChapter = async (chapterId: ReaderId, restore?: ReaderProgressCommand | null) => {
  loading.value = true
  revokeAll()
  try {
    const loaded = await getReaderChapter(bookId.value, chapterId)
    chapter.value = loaded
    hydratedHtml.value = await resolveHtml(loaded.contentHtml)
    await nextTick()
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
  const readingLine = 112
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
  window.cancelAnimationFrame(scrollFrame)
  scrollFrame = window.requestAnimationFrame(scheduleProgressSave)
}

const navigateChapter = async (chapterId: ReaderId) => {
  window.clearTimeout(progressTimer)
  await saveCurrentPosition(true).catch(() => undefined)
  await loadChapter(chapterId)
}

const selectFromDrawer = (chapterId: ReaderId) => {
  tocOpen.value = false
  runSilently(navigateChapter(chapterId))
}

const openSearch = () => {
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
  } finally {
    loading.value = false
  }
}

const handleKeydown = (event: KeyboardEvent) => {
  const target = event.target as HTMLElement | null
  if (target?.matches('input, textarea, select, [contenteditable="true"]')) return
  if (event.key === 'ArrowLeft' && chapter.value?.previousChapterId) {
    event.preventDefault()
    runSilently(navigateChapter(chapter.value.previousChapterId))
  } else if (event.key === 'ArrowRight' && chapter.value?.nextChapterId) {
    event.preventDefault()
    runSilently(navigateChapter(chapter.value.nextChapterId))
  } else if (event.key.toLowerCase() === 'm') {
    tocOpen.value = !tocOpen.value
  } else if (event.key.toLowerCase() === 'a') {
    settingsOpen.value = !settingsOpen.value
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

onMounted(() => {
  runSilently(loadInitial())
  window.addEventListener('scroll', updateCurrentPosition, { passive: true })
  window.addEventListener('keydown', handleKeydown)
  window.addEventListener('pagehide', handlePageHide)
  document.addEventListener('visibilitychange', handleVisibility)
})

onBeforeUnmount(() => {
  window.clearTimeout(progressTimer)
  window.clearTimeout(preferenceTimer)
  window.cancelAnimationFrame(scrollFrame)
  const progress = captureProgress()
  if (progress) persistLocal(progress)
  runSilently(saveCurrentPosition(true))
  window.removeEventListener('scroll', updateCurrentPosition)
  window.removeEventListener('keydown', handleKeydown)
  window.removeEventListener('pagehide', handlePageHide)
  document.removeEventListener('visibilitychange', handleVisibility)
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
  gap: 24px;
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
