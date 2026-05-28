<template>
  <div class="track-edit-page">
    <header class="track-edit-topbar">
      <div class="topbar-row">
        <button type="button" class="topbar-back" @click="goBack">
          <el-icon><ArrowLeft /></el-icon>
          <span>返回音乐馆</span>
        </button>
        <div class="topbar-meta">
          <span class="draft-hint">
            {{ form.status === 'published' ? '公开' : '草稿' }}
            · {{ form.title?.trim() ? form.title : pageTitle }}
          </span>
          <span class="topbar-context">Sakura Radio</span>
        </div>
      </div>
    </header>

      <main v-loading="loading" class="track-edit-layout">
        <section class="track-edit-main">
          <div class="editor-panel editor-panel--title">
            <span class="panel-kicker">Track Studio</span>
            <h1>{{ pageTitle }}</h1>
            <p>把音频、封面、歌词和推荐语整理成一张可以被播放的唱片。</p>
          </div>

          <el-form label-position="top" class="track-form">
            <section class="editor-panel">
              <div class="section-title">
                <span></span>
                <strong>基本信息</strong>
              </div>
              <div class="form-grid">
                <el-form-item label="歌名">
                  <div class="title-field">
                    <el-input v-model="form.title" maxlength="120" placeholder="例如：夜に駆ける" />
                    <el-button
                      class="ai-suggest-button"
                      :loading="suggestingTrack"
                      :disabled="!form.title.trim() || suggestingTrack"
                      @click="suggestTrackInfo"
                    >
                      AI 匹配
                    </el-button>
                  </div>
                </el-form-item>
                <el-form-item label="歌手">
                  <el-input v-model="form.artist" maxlength="120" placeholder="例如：YOASOBI" />
                </el-form-item>
                <el-form-item label="专辑">
                  <el-input v-model="form.album" maxlength="120" placeholder="可选" />
                </el-form-item>
                <el-form-item label="发行年份">
                  <el-date-picker
                    v-model="releaseYearPicker"
                    type="year"
                    value-format="YYYY"
                    placeholder="选择发行年份"
                    :disabled-date="disabledReleaseYear"
                    clearable
                  />
                </el-form-item>
                <el-form-item label="语言">
                  <el-input v-model="form.language" maxlength="40" placeholder="日语 / 中文 / English" />
                </el-form-item>
                <el-form-item label="风格">
                  <el-input v-model="form.genre" maxlength="80" placeholder="City Pop / Indie / J-pop" />
                </el-form-item>
                <el-form-item label="上架状态">
                  <el-switch
                    :model-value="form.status === 'published'"
                    active-text="公开"
                    inactive-text="草稿"
                    @update:model-value="form.status = $event ? 'published' : 'draft'"
                  />
                </el-form-item>
              </div>
              <div v-if="aiSearchTouched || aiCandidates.length" class="ai-candidate-panel">
                <div class="ai-candidate-head">
                  <div>
                    <strong>AI 候选结果</strong>
                    <p>{{ aiCandidateSummary }}</p>
                  </div>
                  <el-switch v-model="overwriteExistingFields" active-text="覆盖已有内容" inactive-text="只填空字段" />
                </div>
                <div v-if="aiCandidates.length" class="ai-candidate-list">
                  <article
                    v-for="(candidate, index) in aiCandidates"
                    :key="`${candidate.title || form.title}-${candidate.artist || 'unknown'}-${index}`"
                    class="ai-candidate-item"
                  >
                    <div class="candidate-rank">{{ index + 1 }}</div>
                    <div class="candidate-main">
                      <div class="candidate-title-line">
                        <strong>{{ candidate.title || form.title }}</strong>
                        <span v-if="candidate.artist">{{ candidate.artist }}</span>
                        <em :class="`confidence-${normalizeConfidence(candidate.confidence)}`">
                          {{ confidenceLabel(candidate.confidence) }}
                        </em>
                      </div>
                      <p>{{ candidateMeta(candidate) }}</p>
                      <div class="candidate-tags">
                        <span v-for="tag in candidate.tags || []" :key="tag">{{ tag }}</span>
                      </div>
                      <small v-if="candidate.matchReason">{{ candidate.matchReason }}</small>
                    </div>
                    <el-button class="candidate-apply-button" @click="applyTrackCandidate(candidate)">
                      应用
                    </el-button>
                  </article>
                </div>
                <el-empty
                  v-else
                  :image-size="72"
                  description="还没有找到合适版本，补充歌手、专辑或年份后再试一次。"
                />
              </div>
              <el-form-item label="标签">
                <el-input v-model="tagDraft" placeholder="用逗号分隔，如 夜读, 日系, 温柔" />
              </el-form-item>
            </section>

            <section class="editor-panel">
              <div class="section-title">
                <span></span>
                <strong>媒体文件</strong>
              </div>
              <div class="media-grid">
                <el-form-item label="音频文件">
                  <div class="upload-field">
                    <div class="upload-action-row">
                      <el-upload
                        :show-file-list="false"
                        :http-request="handleAudioUpload"
                        accept=".mp3,.wav,.flac,.ogg,.aac,.m4a,audio/*"
                      >
                        <div class="media-upload-box" :class="{ 'is-uploading': uploadingAudio, 'has-value': Boolean(form.audioUrl) }">
                          <el-icon><Plus /></el-icon>
                          <span>{{ uploadingAudio ? '上传中' : '上传音频' }}</span>
                        </div>
                      </el-upload>
                    </div>
                    <div class="upload-input-stack">
                      <el-input
                        v-model="form.audioUrl"
                        clearable
                        placeholder="上传后自动填入，也可手动填写 https://..."
                        @input="handleAudioUrlInput"
                      />
                      <span class="upload-hint">{{ audioUploadHint }}</span>
                    </div>
                  </div>
                </el-form-item>
                <el-form-item label="封面图片">
                  <div class="cover-upload-row">
                    <div class="upload-action-row">
                      <el-upload
                        :show-file-list="false"
                        :http-request="handleCoverUpload"
                        accept="image/jpeg,image/png,image/webp,image/gif"
                      >
                        <div class="media-upload-box" :class="{ 'is-uploading': uploadingCover, 'has-value': Boolean(form.coverUrl) }">
                          <el-icon><Plus /></el-icon>
                          <span>{{ uploadingCover ? '上传中' : '上传封面' }}</span>
                        </div>
                      </el-upload>
                    </div>
                    <div class="upload-input-stack">
                      <el-input
                        v-model="form.coverUrl"
                        clearable
                        placeholder="上传后自动填入，也可手动填写 https://..."
                        @input="handleCoverUrlInput"
                      />
                      <span class="upload-hint">{{ coverUploadHint }}</span>
                    </div>
                  </div>
                </el-form-item>
              </div>
            </section>

            <section class="editor-panel">
              <div class="section-title">
                <span></span>
                <strong>推荐与歌词</strong>
              </div>
              <el-form-item label="推荐语">
                <el-input v-model="form.recommendation" type="textarea" :rows="3" maxlength="500" />
              </el-form-item>
              <el-form-item label="氛围短句">
                <el-input v-model="form.moodText" maxlength="160" placeholder="当推荐语为空时，列表会展示这里。" />
              </el-form-item>
              <section class="lyrics-editor">
                <div class="lyrics-editor-head">
                  <div>
                    <span class="lyrics-eyebrow">Lyrics</span>
                    <strong>歌词内容</strong>
                    <p>{{ lyricModeHint }}</p>
                  </div>
                  <el-segmented v-model="form.lyricType" :options="lyricTypeOptions" />
                </div>

                <div class="lyrics-toolbar">
                  <el-button
                    v-if="form.lyricType === 'lrc'"
                    class="lrc-upload-button"
                    :loading="readingLrcFile"
                    @click="openLrcFilePicker"
                  >
                    <el-icon><Upload /></el-icon>
                    <span>上传 .lrc</span>
                  </el-button>
                  <el-button class="lyrics-clear-button" :disabled="!form.lyrics" @click="clearLyrics">
                    清空歌词
                  </el-button>
                  <input
                    ref="lrcFileInputRef"
                    class="lrc-file-input"
                    type="file"
                    accept=".lrc,text/plain"
                    @change="handleLrcFileChange"
                  />
                </div>

                <el-form-item label="歌词">
                  <el-input
                    v-model="form.lyrics"
                    type="textarea"
                    :rows="form.lyricType === 'lrc' ? 12 : 9"
                    :placeholder="lyricsPlaceholder"
                  />
                </el-form-item>

                <div class="lyrics-status" :class="`is-${lyricsSummary.tone}`">
                  <strong>{{ lyricsSummary.title }}</strong>
                  <span>{{ lyricsSummary.detail }}</span>
                </div>
              </section>
              <el-form-item label="歌词来源">
                <el-input v-model="form.lyricSource" maxlength="160" placeholder="例如：官方歌词 / 网易云音乐 / 手动校对" />
              </el-form-item>
            </section>
          </el-form>
        </section>

        <aside class="track-preview-panel">
          <div class="preview-record" :class="{ 'has-cover': Boolean(form.coverUrl) }">
            <img v-if="form.coverUrl" :src="form.coverUrl" :alt="form.title || '歌曲封面预览'" />
            <span v-else>Sakura<br />Radio</span>
          </div>
          <div class="preview-copy">
            <span class="panel-kicker">Preview</span>
            <h2>{{ form.title || '还没有歌名' }}</h2>
            <p>{{ form.artist || '歌手待填写' }}{{ form.album ? ` · ${form.album}` : '' }}</p>
          </div>
          <div class="preview-tags">
            <span v-for="tag in previewTags" :key="tag">{{ tag }}</span>
            <span v-if="previewTags.length === 0">未设置标签</span>
          </div>
          <p class="preview-note">{{ form.recommendation || form.moodText || '写一句推荐语，让这首歌被点开前就有一点温度。' }}</p>
          <audio v-if="form.audioUrl" class="preview-audio" :src="form.audioUrl" controls />
          <section class="preview-lyrics">
            <div class="preview-lyrics-head">
              <strong>歌词预览</strong>
              <span>{{ form.lyricType === 'lrc' ? 'LRC 时间轴' : '普通歌词' }}</span>
            </div>
            <div class="preview-lyrics-window">
              <p v-if="previewLyricLines.length === 0" class="empty-lyrics">这首歌还没有写下歌词。</p>
              <p
                v-for="line in previewLyricLines"
                :key="line.key"
                :class="{ 'is-current': line.current, 'is-muted': !line.current }"
              >
                <span v-if="line.timeLabel">{{ line.timeLabel }}</span>
                {{ line.text }}
              </p>
            </div>
          </section>
          <div class="preview-checklist">
            <span :class="{ done: Boolean(form.title.trim()) }">歌名</span>
            <span :class="{ done: Boolean(form.artist.trim()) }">歌手</span>
            <span :class="{ done: Boolean(form.audioUrl.trim()) }">音频</span>
          </div>
        </aside>
      </main>

      <div class="track-edit-footer">
        <div class="footer-inner">
          <span>{{ canSaveTrack ? '准备好了就放进唱片架。' : '歌名、歌手和音频地址是必填项。' }}</span>
          <div>
            <el-button class="footer-button footer-button--neutral" @click="goBack">取消</el-button>
            <el-button
              class="footer-button footer-button--save"
              type="primary"
              :loading="saving"
              :disabled="!canSaveTrack"
              @click="saveTrack"
            >
              保存
            </el-button>
          </div>
        </div>
      </div>
  </div>
</template>

<script setup lang="ts">
import { computed, reactive, ref, watch } from 'vue'
import { ElMessage, type UploadRequestOptions } from 'element-plus'
import { ArrowLeft, Plus, Upload } from '@element-plus/icons-vue'
import { useRoute, useRouter } from 'vue-router'
import { createMusicTrack, getAdminMusicTrack, suggestMusicTrack, updateMusicTrack } from '@/api/music'
import { uploadMusicAudio, uploadMusicCover, type UploadResult } from '@/api/upload'
import type { MusicTrack, MusicTrackAiCandidate, MusicTrackUpsertCommand } from '@/types'

const route = useRoute()
const router = useRouter()
type UploadError = Parameters<UploadRequestOptions['onError']>[0]
type LyricSummaryTone = 'empty' | 'success' | 'warning'

interface ParsedLrcLine {
  key: string
  time: number
  timeLabel: string
  text: string
  current: boolean
}

interface LrcParseResult {
  lines: ParsedLrcLine[]
  metadataCount: number
  invalidCount: number
}

const loading = ref(false)
const saving = ref(false)
const suggestingTrack = ref(false)
const uploadingAudio = ref(false)
const uploadingCover = ref(false)
const aiCandidates = ref<MusicTrackAiCandidate[]>([])
const aiSearchTouched = ref(false)
const lastAiQuerySummary = ref('')
const overwriteExistingFields = ref(false)
const tagDraft = ref('')
const releaseYearPicker = ref<string>()
const audioUploadName = ref('')
const coverUploadName = ref('')
const uploadedAudioUrl = ref('')
const uploadedCoverUrl = ref('')
const readingLrcFile = ref(false)
const lrcFileInputRef = ref<HTMLInputElement>()

const editingId = computed<number | null>(() => {
  const rawId = Array.isArray(route.params.id) ? route.params.id[0] : route.params.id
  if (!rawId) return null
  const numericId = Number(rawId)
  return Number.isFinite(numericId) ? numericId : null
})
const isEditMode = computed(() => editingId.value != null)
const pageTitle = computed(() => (isEditMode.value ? '编辑歌曲' : '新增歌曲'))
const uploadInProgress = computed(() => uploadingAudio.value || uploadingCover.value)
const canSaveTrack = computed(() => {
  return !saving.value
    && !uploadInProgress.value
    && Boolean(form.title.trim())
    && Boolean(form.artist.trim())
    && Boolean(form.audioUrl.trim())
})
const previewTags = computed(() => parseTags(tagDraft.value))
const aiCandidateSummary = computed(() => {
  if (suggestingTrack.value) return '正在根据当前表单条件筛选版本。'
  if (aiCandidates.value.length) {
    return `${lastAiQuerySummary.value}，找到 ${aiCandidates.value.length} 个候选。`
  }
  return lastAiQuerySummary.value || '补充歌手、专辑、年份等信息后可以重新匹配。'
})

const audioUploadHint = computed(() => {
  if (uploadingAudio.value) return '音频正在上传，完成后再保存'
  if (form.audioFileId) return audioUploadName.value ? `已绑定：${audioUploadName.value}` : '已绑定上传音频'
  if (form.audioUrl.trim()) return '使用手动填写的音频地址'
  return '支持 MP3、WAV、FLAC、OGG、AAC、M4A'
})

const coverUploadHint = computed(() => {
  if (uploadingCover.value) return '封面正在上传，完成后会自动填入'
  if (form.coverFileId) return coverUploadName.value ? `已绑定：${coverUploadName.value}` : '已绑定上传封面'
  if (form.coverUrl?.trim()) return '使用手动填写的封面地址'
  return '可选，支持 JPG、PNG、WebP、GIF'
})

const lyricTypeOptions = [
  { label: '普通歌词', value: 'plain' },
  { label: 'LRC 时间轴', value: 'lrc' },
]

const form = reactive<MusicTrackUpsertCommand>(createEmptyTrackForm())
const lrcExampleLines = [
  `${'['}${'00'}:${'12'}.${'00'}]第一句歌词`,
  `${'['}${'00'}:${'18'}.${'50'}]第二句歌词`,
  `${'['}${'00'}:${'24'}.${'10'}]第三句歌词`,
]
const lrcExampleLine = `${'['}${'00'}:${'12'}.${'00'}]歌词`
const lrcParseResult = computed(() => parseLrc(form.lyrics || ''))
const lyricModeHint = computed(() => {
  if (form.lyricType === 'lrc') {
    return '支持粘贴 LRC，也可以上传 .lrc 文件后继续编辑。'
  }
  return '适合没有时间轴的歌词，每行一句即可。'
})
const lyricsPlaceholder = computed(() => {
  if (form.lyricType === 'lrc') {
    return lrcExampleLines.join('\n')
  }
  return '第一句歌词\n第二句歌词\n第三句歌词'
})
const lyricsSummary = computed(() => {
  const content = (form.lyrics || '').trim()
  if (!content) {
    return {
      tone: 'empty' as LyricSummaryTone,
      title: '暂未填写歌词',
      detail: form.lyricType === 'lrc' ? '可以上传 .lrc 文件，或直接粘贴 LRC 内容。' : '粘贴普通歌词后会在右侧实时预览。',
    }
  }

  if (form.lyricType !== 'lrc') {
    const lineCount = splitMeaningfulLines(content).length
    return {
      tone: 'success' as LyricSummaryTone,
      title: `已识别 ${lineCount} 行普通歌词`,
      detail: '保存后会按静态歌词展示，不跟随播放进度滚动。',
    }
  }

  const result = lrcParseResult.value
  if (result.invalidCount > 0) {
    return {
      tone: 'warning' as LyricSummaryTone,
      title: `有 ${result.invalidCount} 行未识别为 LRC`,
      detail: `时间轴行需要类似 ${lrcExampleLine}；[ti:]、[ar:] 等元信息会自动忽略。`,
    }
  }
  return {
    tone: 'success' as LyricSummaryTone,
    title: `已识别 ${result.lines.length} 行时间轴歌词`,
    detail: result.metadataCount > 0 ? `同时读取到 ${result.metadataCount} 行 LRC 元信息。` : '播放时会根据时间轴高亮当前歌词。',
  }
})
const previewLyricLines = computed(() => {
  const content = (form.lyrics || '').trim()
  if (!content) return []
  if (form.lyricType !== 'lrc') {
    return splitMeaningfulLines(content).slice(0, 6).map((text, index) => ({
      key: `plain-${index}`,
      text,
      timeLabel: '',
      current: index === 0,
    }))
  }
  return lrcParseResult.value.lines.slice(0, 6).map((line, index) => ({
    ...line,
    current: index === 0,
  }))
})

watch(
  releaseYearPicker,
  (value) => {
    form.releaseYear = value ? Number(value) : undefined
  },
)

watch(
  () => form.releaseYear,
  (value) => {
    const nextValue = value ? String(value) : undefined
    if (releaseYearPicker.value !== nextValue) {
      releaseYearPicker.value = nextValue
    }
  },
)

watch(
  editingId,
  (id) => {
    resetForm()
    if (id != null) {
      void loadTrack(id)
    }
  },
  { immediate: true },
)

async function loadTrack(id: number) {
  loading.value = true
  try {
    const track = await getAdminMusicTrack(id)
    fillFormFromTrack(track)
  } catch (error) {
    ElMessage.error(error instanceof Error ? error.message : '歌曲加载失败')
    void router.replace('/music')
  } finally {
    loading.value = false
  }
}

function fillFormFromTrack(track: MusicTrack) {
  Object.assign(form, {
    title: track.title || '',
    artist: track.artist || '',
    album: track.album || '',
    releaseYear: track.releaseYear,
    language: track.language || '',
    genre: track.genre || '',
    tags: [...(track.tags || [])],
    audioFileId: track.audioFileId,
    audioUrl: track.audioUrl || '',
    coverFileId: track.coverFileId,
    coverUrl: track.coverUrl || '',
    lyricType: track.lyricType || 'plain',
    lyrics: track.lyrics || '',
    lyricSource: track.lyricSource || '',
    recommendation: track.recommendation || '',
    moodText: track.moodText || '',
    status: track.status || 'draft',
  })
  tagDraft.value = (track.tags || []).join(', ')
  audioUploadName.value = ''
  coverUploadName.value = ''
  uploadedAudioUrl.value = track.audioUrl || ''
  uploadedCoverUrl.value = track.coverUrl || ''
}

function resetForm() {
  Object.assign(form, createEmptyTrackForm())
  tagDraft.value = ''
  audioUploadName.value = ''
  coverUploadName.value = ''
  uploadedAudioUrl.value = ''
  uploadedCoverUrl.value = ''
  uploadingAudio.value = false
  uploadingCover.value = false
  saving.value = false
  aiCandidates.value = []
  aiSearchTouched.value = false
  lastAiQuerySummary.value = ''
  overwriteExistingFields.value = false
}

async function saveTrack() {
  if (uploadInProgress.value) {
    ElMessage.warning('文件还在上传，稍等一下再保存')
    return
  }
  if (!form.title.trim() || !form.artist.trim() || !form.audioUrl.trim()) {
    ElMessage.warning('歌名、歌手和音频地址都要填写')
    return
  }
  saving.value = true
  try {
    const payload: MusicTrackUpsertCommand = {
      ...form,
      tags: previewTags.value,
    }
    if (isEditMode.value && editingId.value != null) {
      await updateMusicTrack(editingId.value, payload)
      ElMessage.success('歌曲已更新')
    } else {
      await createMusicTrack(payload)
      ElMessage.success('歌曲已创建')
    }
    void router.push('/music')
  } finally {
    saving.value = false
  }
}

async function suggestTrackInfo() {
  const title = form.title.trim()
  if (!title) {
    ElMessage.warning('先输入歌名，Lyra 才能帮你补全信息')
    return
  }

  suggestingTrack.value = true
  aiSearchTouched.value = true
  lastAiQuerySummary.value = buildAiQuerySummary()
  try {
    const response = await suggestMusicTrack({
      title,
      artist: form.artist.trim() || undefined,
      album: form.album?.trim() || undefined,
      releaseYear: form.releaseYear,
      language: form.language?.trim() || undefined,
      genre: form.genre?.trim() || undefined,
      limit: 5,
    })
    aiCandidates.value = (response.candidates || []).slice(0, 5)
    if (aiCandidates.value.length > 0) {
      ElMessage.success(`AI 找到 ${aiCandidates.value.length} 个候选版本`)
    } else {
      ElMessage.info('暂时没有找到合适版本，可以补充歌手或专辑后再匹配')
    }
  } finally {
    suggestingTrack.value = false
  }
}

function applyTrackCandidate(candidate: MusicTrackAiCandidate) {
  const appliedCount = applyTrackSuggestion(candidate, overwriteExistingFields.value)
  if (appliedCount > 0) {
    ElMessage.success(`已应用 ${appliedCount} 项候选信息`)
  } else {
    ElMessage.info('这个候选和当前表单内容差不多')
  }
}

function applyTrackSuggestion(suggestion: MusicTrackAiCandidate, overwrite = false) {
  let appliedCount = 0
  const applyText = (field: keyof MusicTrackUpsertCommand, value?: string) => {
    if (!value?.trim()) return
    if (!overwrite && String(form[field] || '').trim()) return
    ;(form[field] as string | undefined) = value.trim()
    appliedCount += 1
  }

  applyText('title', suggestion.title)
  applyText('artist', suggestion.artist)
  applyText('album', suggestion.album)
  applyText('language', suggestion.language)
  applyText('genre', suggestion.genre)
  applyText('recommendation', suggestion.recommendation)
  applyText('moodText', suggestion.moodText)
  applyText('lyricSource', suggestion.lyricSource)

  if ((overwrite || !form.releaseYear) && suggestion.releaseYear) {
    form.releaseYear = suggestion.releaseYear
    releaseYearPicker.value = String(suggestion.releaseYear)
    appliedCount += 1
  }

  if ((overwrite || !tagDraft.value.trim()) && suggestion.tags?.length) {
    tagDraft.value = suggestion.tags.filter(Boolean).join(', ')
    appliedCount += 1
  }

  return appliedCount
}

function buildAiQuerySummary() {
  const pairs = [
    ['歌名', form.title.trim()],
    ['歌手', form.artist.trim()],
    ['专辑', form.album?.trim()],
    ['年份', form.releaseYear ? String(form.releaseYear) : ''],
    ['语言', form.language?.trim()],
    ['风格', form.genre?.trim()],
  ].filter(([, value]) => Boolean(value))
  return `基于：${pairs.map(([label, value]) => `${label}=${value}`).join('，')}`
}

function candidateMeta(candidate: MusicTrackAiCandidate) {
  const parts = [
    candidate.album,
    candidate.releaseYear ? String(candidate.releaseYear) : '',
    candidate.language,
    candidate.genre,
  ].filter(Boolean)
  return parts.length ? parts.join(' / ') : '暂无更多元信息'
}

function normalizeConfidence(confidence?: string) {
  const normalized = String(confidence || '').toLowerCase()
  return ['high', 'medium', 'low'].includes(normalized) ? normalized : 'low'
}

function confidenceLabel(confidence?: string) {
  const labelMap: Record<string, string> = {
    high: '匹配度高',
    medium: '匹配度中',
    low: '待确认',
  }
  return labelMap[normalizeConfidence(confidence)]
}

async function handleAudioUpload(options: UploadRequestOptions) {
  uploadingAudio.value = true
  try {
    const result = await uploadMusicAudio(options.file)
    applyAudioUpload(result)
    options.onSuccess?.(result)
    ElMessage.success('音频已上传')
  } catch (error) {
    options.onError?.(toUploadAjaxError(error))
  } finally {
    uploadingAudio.value = false
  }
}

async function handleCoverUpload(options: UploadRequestOptions) {
  uploadingCover.value = true
  try {
    const result = await uploadMusicCover(options.file)
    applyCoverUpload(result)
    options.onSuccess?.(result)
    ElMessage.success('封面已上传')
  } catch (error) {
    options.onError?.(toUploadAjaxError(error))
  } finally {
    uploadingCover.value = false
  }
}

function applyAudioUpload(result: UploadResult) {
  form.audioFileId = result.id
  form.audioUrl = result.url
  audioUploadName.value = result.name || result.url
  uploadedAudioUrl.value = result.url
}

function applyCoverUpload(result: UploadResult) {
  form.coverFileId = result.id
  form.coverUrl = result.url
  coverUploadName.value = result.name || result.url
  uploadedCoverUrl.value = result.url
}

function handleAudioUrlInput(value: string) {
  if (value !== uploadedAudioUrl.value) {
    form.audioFileId = undefined
    audioUploadName.value = ''
  }
}

function handleCoverUrlInput(value: string) {
  if (value !== uploadedCoverUrl.value) {
    form.coverFileId = undefined
    coverUploadName.value = ''
  }
}

function openLrcFilePicker() {
  lrcFileInputRef.value?.click()
}

async function handleLrcFileChange(event: Event) {
  const input = event.target as HTMLInputElement
  const file = input.files?.[0]
  if (!file) return
  if (!file.name.toLowerCase().endsWith('.lrc')) {
    ElMessage.warning('请选择 .lrc 歌词文件')
    input.value = ''
    return
  }

  readingLrcFile.value = true
  try {
    form.lyricType = 'lrc'
    form.lyrics = await file.text()
    ElMessage.success(`已导入 ${file.name}`)
  } catch (error) {
    ElMessage.error(error instanceof Error ? error.message : 'LRC 文件读取失败')
  } finally {
    readingLrcFile.value = false
    input.value = ''
  }
}

function clearLyrics() {
  form.lyrics = ''
}

function parseTags(input: string) {
  return input.split(/[,，]/).map((tag) => tag.trim()).filter(Boolean)
}

function splitMeaningfulLines(input: string) {
  return input.split('\n').map((line) => line.trim()).filter(Boolean)
}

function parseLrc(input: string): LrcParseResult {
  const result: LrcParseResult = {
    lines: [],
    metadataCount: 0,
    invalidCount: 0,
  }
  splitMeaningfulLines(input).forEach((line, index) => {
    if (/^\[[a-zA-Z]+:.*]$/.test(line)) {
      result.metadataCount += 1
      return
    }
    const match = line.match(/^\[(\d{1,2}):(\d{2})(?:\.(\d{1,3}))?](.*)$/)
    if (!match) {
      result.invalidCount += 1
      return
    }
    const minute = Number(match[1])
    const second = Number(match[2])
    const millisecond = Number((match[3] || '0').padEnd(3, '0'))
    const text = match[4].trim()
    if (!text) {
      result.invalidCount += 1
      return
    }
    result.lines.push({
      key: `lrc-${index}`,
      time: minute * 60 + second + millisecond / 1000,
      timeLabel: `${match[1].padStart(2, '0')}:${match[2]}.${(match[3] || '00').padEnd(2, '0').slice(0, 2)}`,
      text,
      current: false,
    })
  })
  return result
}

function disabledReleaseYear(date: Date) {
  const year = date.getFullYear()
  return year < 1900 || year > new Date().getFullYear()
}

function toUploadAjaxError(error: unknown): UploadError {
  if (error instanceof Error) return error as UploadError
  return new Error(String(error || '上传失败')) as UploadError
}

function goBack() {
  void router.push('/music')
}

function createEmptyTrackForm(): MusicTrackUpsertCommand {
  return {
    title: '',
    artist: '',
    album: '',
    releaseYear: undefined,
    language: '',
    genre: '',
    tags: [],
    audioUrl: '',
    coverUrl: '',
    lyricType: 'plain',
    lyrics: '',
    lyricSource: '',
    recommendation: '',
    moodText: '',
    status: 'draft',
  }
}
</script>

<style scoped lang="scss">
.track-edit-page {
  width: min(1320px, calc(100vw - 48px));
  min-height: 100vh;
  margin: 0 auto;
  padding: calc(86px + env(safe-area-inset-top, 0)) 0 calc(88px + env(safe-area-inset-bottom, 0));
  color: #443840;
}

.track-edit-topbar {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  z-index: 285;
  padding:
    calc(11px + env(safe-area-inset-top, 0))
    calc(24px + env(safe-area-inset-right, 0))
    11px
    calc(24px + env(safe-area-inset-left, 0));
  border-bottom: 1px solid rgba(238, 226, 235, 0.9);
  background: rgba(255, 250, 253, 0.86);
  box-shadow: 0 8px 30px rgba(219, 192, 206, 0.1);
  backdrop-filter: blur(14px);
  -webkit-backdrop-filter: blur(14px);
}

.topbar-row {
  width: min(1320px, calc(100vw - 48px));
  margin: 0 auto;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
  min-height: 42px;
}

.topbar-back {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  margin: 0;
  padding: 0;
  border: 0;
  background: transparent;
  color: #7f737e;
  cursor: pointer;
  font: inherit;
  font-weight: 700;
  transition: color 0.2s ease;
}

.topbar-back:hover {
  color: #ff5e99;
}

.topbar-meta,
.section-title,
.preview-checklist,
.footer-inner,
.footer-inner > div {
  display: flex;
  align-items: center;
}

.topbar-meta {
  gap: 8px;
}

.topbar-meta span {
  min-height: 30px;
  padding: 0 12px;
  border-radius: 999px;
  border: 1px solid rgba(238, 226, 235, 0.94);
  background: rgba(255, 255, 255, 0.72);
  color: #8f8290;
  font-size: 12px;
  line-height: 30px;
}

.track-edit-layout {
  display: grid;
  grid-template-columns: minmax(0, 1fr) minmax(300px, 360px);
  gap: 16px;
  align-items: start;
}

.track-edit-main,
.track-form {
  display: grid;
  gap: 14px;
  min-width: 0;
}

.editor-panel,
.track-preview-panel {
  border: 1px solid rgba(238, 225, 234, 0.92);
  border-radius: 16px;
  background:
    linear-gradient(180deg, rgba(255, 255, 255, 0.9), rgba(255, 250, 253, 0.78)),
    radial-gradient(circle at 92% 8%, rgba(255, 206, 224, 0.2), transparent 30%);
  box-shadow:
    inset 0 1px 0 rgba(255, 255, 255, 0.86),
    0 18px 40px rgba(211, 184, 199, 0.12);
}

.editor-panel {
  display: grid;
  gap: 16px;
  padding: 18px 20px;
}

.editor-panel--title {
  gap: 6px;
  padding: 22px 24px;
}

.panel-kicker {
  color: #d984a5;
  font-size: 12px;
  font-weight: 800;
  letter-spacing: 0.16em;
  text-transform: uppercase;
}

.editor-panel h1,
.preview-copy h2 {
  margin: 0;
  color: #352b33;
  line-height: 1.16;
}

.editor-panel h1 {
  font-size: 30px;
}

.editor-panel p,
.preview-copy p,
.preview-note {
  margin: 0;
  color: #8d8089;
  line-height: 1.65;
}

.section-title {
  gap: 10px;
}

.section-title > span {
  width: 10px;
  height: 10px;
  border-radius: 999px;
  background: linear-gradient(135deg, #ff5f98, #ff9dbc);
  box-shadow: 0 0 0 5px rgba(255, 108, 161, 0.1);
}

.section-title strong {
  color: #3d333b;
  font-size: 16px;
  font-weight: 800;
}

.form-grid,
.media-grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 14px;
}

.title-field {
  display: grid;
  grid-template-columns: minmax(0, 1fr) auto;
  gap: 8px;
}

.ai-suggest-button {
  min-width: 92px;
  border: 0;
  border-radius: 999px;
  color: #fff;
  font-weight: 800;
  background:
    linear-gradient(135deg, rgba(255, 105, 156, 0.96), rgba(255, 159, 188, 0.96)),
    radial-gradient(circle at 20% 20%, rgba(255, 255, 255, 0.34), transparent 34%);
  box-shadow: 0 10px 22px rgba(255, 111, 160, 0.22);
}

.ai-candidate-panel {
  display: grid;
  gap: 12px;
  padding: 14px;
  border: 1px solid rgba(239, 220, 232, 0.95);
  border-radius: 14px;
  background: rgba(255, 252, 254, 0.76);
}

.ai-candidate-head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
}

.ai-candidate-head strong {
  color: #3d333b;
  font-size: 14px;
}

.ai-candidate-head p {
  margin-top: 3px;
  font-size: 12px;
  line-height: 1.5;
}

.ai-candidate-list {
  display: grid;
  gap: 8px;
}

.ai-candidate-item {
  display: grid;
  grid-template-columns: 30px minmax(0, 1fr) auto;
  gap: 10px;
  align-items: center;
  padding: 11px;
  border: 1px solid rgba(238, 226, 235, 0.92);
  border-radius: 12px;
  background: rgba(255, 255, 255, 0.74);
}

.candidate-rank {
  width: 30px;
  height: 30px;
  display: grid;
  place-items: center;
  border-radius: 999px;
  color: #d96290;
  font-size: 13px;
  font-weight: 800;
  background: rgba(255, 238, 246, 0.96);
}

.candidate-main {
  min-width: 0;
  display: grid;
  gap: 5px;
}

.candidate-title-line {
  display: flex;
  align-items: center;
  gap: 8px;
  min-width: 0;
  flex-wrap: wrap;
}

.candidate-title-line strong {
  color: #352b33;
  font-size: 14px;
}

.candidate-title-line span,
.candidate-main p,
.candidate-main small {
  color: #897b86;
}

.candidate-title-line span,
.candidate-main p {
  font-size: 12px;
}

.candidate-title-line em {
  padding: 4px 7px;
  border-radius: 999px;
  font-size: 11px;
  font-style: normal;
  font-weight: 800;
}

.confidence-high {
  color: #d45f8b;
  background: rgba(255, 237, 246, 0.96);
}

.confidence-medium {
  color: #9b6f2c;
  background: rgba(255, 247, 225, 0.96);
}

.confidence-low {
  color: #7d7480;
  background: rgba(245, 242, 246, 0.96);
}

.candidate-tags {
  display: flex;
  flex-wrap: wrap;
  gap: 5px;
}

.candidate-tags span {
  padding: 3px 7px;
  border-radius: 999px;
  color: #d56f95;
  font-size: 11px;
  background: rgba(255, 243, 248, 0.9);
}

.candidate-main small {
  font-size: 12px;
  line-height: 1.45;
}

.candidate-apply-button {
  border-radius: 999px;
  font-weight: 800;
}

.upload-field,
.cover-upload-row {
  width: 100%;
  display: grid;
  justify-items: center;
  gap: 12px;
}

.upload-input-stack {
  width: min(100%, 520px);
  min-width: 0;
  display: grid;
  justify-items: center;
  gap: 6px;
}

.upload-action-row {
  display: grid;
  place-items: center;
}

.upload-action-row :deep(.el-upload) {
  display: block;
}

.media-upload-box {
  width: 140px;
  height: 112px;
  display: grid;
  place-items: center;
  align-content: center;
  gap: 8px;
  border: 1.5px dashed rgba(255, 143, 184, 0.72);
  border-radius: 14px;
  background: rgba(255, 250, 253, 0.78);
  color: #ff5e99;
  cursor: pointer;
  transition:
    border-color 0.2s ease,
    background 0.2s ease,
    color 0.2s ease,
    box-shadow 0.2s ease,
    transform 0.2s ease;
}

.media-upload-box:hover {
  border-color: rgba(255, 91, 144, 0.9);
  background: rgba(255, 244, 249, 0.96);
  color: #f04486;
  box-shadow: 0 12px 24px rgba(255, 111, 160, 0.14);
  transform: translateY(-1px);
}

.media-upload-box.is-uploading {
  cursor: wait;
  opacity: 0.72;
  transform: none;
}

.media-upload-box.has-value {
  border-color: rgba(255, 119, 169, 0.74);
  background: rgba(255, 248, 251, 0.92);
}

.media-upload-box .el-icon {
  font-size: 24px;
}

.media-upload-box span {
  font-size: 13px;
  font-weight: 800;
}

.upload-hint {
  color: #9b8b96;
  font-size: 12px;
  line-height: 1.4;
  text-align: center;
}

.lyrics-editor {
  display: grid;
  gap: 12px;
  padding: 15px;
  border: 1px solid rgba(238, 226, 235, 0.92);
  border-radius: 14px;
  background:
    linear-gradient(180deg, rgba(255, 253, 254, 0.86), rgba(255, 248, 252, 0.76)),
    repeating-linear-gradient(180deg, transparent 0 34px, rgba(226, 202, 214, 0.22) 35px 36px);
}

.lyrics-editor-head,
.lyrics-toolbar,
.preview-lyrics-head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
}

.lyrics-editor-head {
  align-items: flex-start;
}

.lyrics-editor-head > div {
  display: grid;
  gap: 4px;
  min-width: 0;
}

.lyrics-eyebrow {
  color: #d984a5;
  font-size: 11px;
  font-weight: 800;
  letter-spacing: 0.12em;
  text-transform: uppercase;
}

.lyrics-editor-head strong,
.lyrics-status strong,
.preview-lyrics-head strong {
  color: #3d333b;
  font-size: 14px;
  font-weight: 800;
}

.lyrics-editor-head p {
  margin: 0;
  color: #8d8089;
  font-size: 12px;
  line-height: 1.5;
}

.lyrics-toolbar {
  justify-content: flex-start;
  flex-wrap: wrap;
}

.lrc-file-input {
  display: none;
}

:deep(.lrc-upload-button),
:deep(.lyrics-clear-button) {
  border-radius: 999px;
  font-weight: 800;
}

:deep(.lrc-upload-button) {
  border-color: rgba(255, 169, 202, 0.9);
  background: rgba(255, 241, 247, 0.9);
  color: #d95f8d;
}

.lyrics-status {
  display: grid;
  gap: 3px;
  padding: 10px 12px;
  border-radius: 12px;
  border: 1px solid rgba(238, 226, 235, 0.92);
  background: rgba(255, 255, 255, 0.68);
}

.lyrics-status span {
  color: #8d8089;
  font-size: 12px;
  line-height: 1.5;
}

.lyrics-status.is-success {
  border-color: rgba(255, 188, 213, 0.72);
  background: rgba(255, 243, 248, 0.78);
}

.lyrics-status.is-warning {
  border-color: rgba(245, 203, 124, 0.78);
  background: rgba(255, 249, 232, 0.82);
}

.lyrics-status.is-warning strong {
  color: #9b6f2c;
}

.track-preview-panel {
  position: sticky;
  top: calc(88px + env(safe-area-inset-top, 0));
  display: grid;
  gap: 16px;
  padding: 20px;
}

.preview-record {
  overflow: hidden;
  width: min(100%, 260px);
  aspect-ratio: 1;
  margin: 0 auto;
  display: grid;
  place-items: center;
  border-radius: 50%;
  background:
    radial-gradient(circle, rgba(255, 255, 255, 0.9) 0 10%, rgba(255, 180, 210, 0.44) 11% 18%, transparent 19%),
    repeating-radial-gradient(circle, rgba(255, 255, 255, 0.24) 0 2px, rgba(132, 92, 112, 0.08) 3px 5px),
    linear-gradient(135deg, #fff0f6, #efeaf7);
  box-shadow: 0 24px 42px rgba(164, 126, 148, 0.16);
}

.preview-record img {
  width: 72%;
  height: 72%;
  object-fit: cover;
  border-radius: 50%;
  box-shadow: 0 16px 30px rgba(90, 61, 77, 0.16);
}

.preview-record span {
  color: #d57398;
  font-size: 18px;
  font-weight: 800;
  line-height: 1.5;
  text-align: center;
}

.preview-copy {
  display: grid;
  gap: 6px;
}

.preview-copy h2 {
  font-size: 24px;
}

.preview-tags {
  display: flex;
  gap: 7px;
  flex-wrap: wrap;
}

.preview-tags span,
.preview-checklist span {
  border-radius: 999px;
  font-size: 12px;
}

.preview-tags span {
  padding: 6px 9px;
  color: #d56f95;
  background: rgba(255, 243, 248, 0.96);
}

.preview-audio {
  width: 100%;
}

.preview-lyrics {
  display: grid;
  gap: 10px;
  padding: 12px;
  border: 1px solid rgba(238, 226, 235, 0.92);
  border-radius: 14px;
  background: rgba(255, 255, 255, 0.64);
}

.preview-lyrics-head span {
  padding: 5px 8px;
  border-radius: 999px;
  color: #d56f95;
  font-size: 11px;
  font-weight: 800;
  background: rgba(255, 243, 248, 0.96);
}

.preview-lyrics-window {
  min-height: 132px;
  max-height: 194px;
  overflow: auto;
  padding: 14px 16px;
  border-radius: 12px;
  border: 1px solid rgba(241, 222, 230, 0.86);
  background:
    linear-gradient(180deg, rgba(255, 252, 253, 0.82), rgba(255, 247, 251, 0.68)),
    repeating-linear-gradient(180deg, transparent 0 31px, rgba(225, 197, 210, 0.24) 32px 33px);
}

.preview-lyrics-window p {
  margin: 0;
  color: #8d7b84;
  font-size: 13px;
  line-height: 1.9;
}

.preview-lyrics-window p.is-current {
  color: #e44d78;
  font-weight: 800;
}

.preview-lyrics-window p.is-muted {
  opacity: 0.68;
}

.preview-lyrics-window span {
  display: inline-block;
  min-width: 54px;
  margin-right: 8px;
  color: #b7a4af;
  font-size: 11px;
  font-variant-numeric: tabular-nums;
}

.preview-lyrics-window .empty-lyrics {
  color: #9d8d98;
}

.preview-checklist {
  gap: 8px;
  flex-wrap: wrap;
  padding-top: 2px;
}

.preview-checklist span {
  padding: 7px 10px;
  color: #9b8b96;
  background: rgba(255, 255, 255, 0.76);
  border: 1px solid rgba(238, 226, 235, 0.94);
}

.preview-checklist span.done {
  color: #d45f8b;
  background: rgba(255, 240, 247, 0.94);
  border-color: rgba(255, 188, 213, 0.84);
}

.track-edit-footer {
  position: fixed;
  left: 0;
  right: 0;
  bottom: 0;
  z-index: 30;
  padding:
    11px calc(24px + env(safe-area-inset-right, 0))
    calc(11px + env(safe-area-inset-bottom, 0))
    calc(24px + env(safe-area-inset-left, 0));
  border-top: 1px solid rgba(238, 226, 235, 0.9);
  background: rgba(255, 250, 253, 0.9);
  box-shadow: 0 -8px 30px rgba(219, 192, 206, 0.1);
  backdrop-filter: blur(14px);
  -webkit-backdrop-filter: blur(14px);
}

.footer-inner {
  width: min(1320px, calc(100vw - 48px));
  margin: 0 auto;
  justify-content: space-between;
  gap: 14px;
}

.footer-inner > span {
  color: #8d8089;
  font-size: 13px;
}

.footer-inner > div {
  gap: 10px;
}

:deep(.footer-button) {
  min-width: 118px;
  min-height: 42px;
  border-radius: 999px;
  font-weight: 800;
}

:deep(.footer-button--neutral) {
  border-color: rgba(227, 216, 225, 0.98) !important;
  background: rgba(255, 255, 255, 0.92) !important;
  color: #766a76 !important;
}

:deep(.footer-button--save) {
  border-color: rgba(255, 91, 144, 0.96) !important;
  background: linear-gradient(135deg, #ff4f91, #ff8bb4) !important;
  color: #fff !important;
  box-shadow: 0 12px 24px rgba(255, 91, 144, 0.26) !important;
}

:deep(.el-form-item) {
  margin-bottom: 0;
}

:deep(.el-form-item__label) {
  padding-bottom: 6px;
  color: #3d333b;
  font-size: 13px;
  font-weight: 800;
  line-height: 1.2;
}

:deep(.el-input__wrapper),
:deep(.el-textarea__inner),
:deep(.el-input-number),
:deep(.el-date-editor.el-input) {
  width: 100%;
  border-radius: 9px;
}

:deep(.el-input__wrapper),
:deep(.el-textarea__inner),
:deep(.el-input-number__decrease),
:deep(.el-input-number__increase) {
  background: rgba(255, 255, 255, 0.78);
  box-shadow: 0 0 0 1px rgba(224, 218, 226, 0.98) inset;
}

:deep(.el-input__wrapper) {
  min-height: 38px;
}

:deep(.el-input__wrapper.is-focus),
:deep(.el-textarea__inner:focus) {
  box-shadow:
    0 0 0 1px rgba(255, 91, 144, 0.92) inset,
    0 0 0 4px rgba(255, 191, 214, 0.22);
}

@media (max-width: 980px) {
  .track-edit-layout {
    grid-template-columns: 1fr;
  }

  .track-preview-panel {
    position: static;
  }
}

@media (max-width: 700px) {
  .track-edit-page,
  .footer-inner {
    width: min(100vw - 18px, 100%);
  }

  .track-edit-page {
    padding-top: calc(120px + env(safe-area-inset-top, 0));
  }

  .track-edit-topbar {
    padding:
      calc(9px + env(safe-area-inset-top, 0))
      calc(9px + env(safe-area-inset-right, 0))
      9px
      calc(9px + env(safe-area-inset-left, 0));
  }

  .footer-inner {
    display: grid;
  }

  .topbar-row {
    width: min(100vw - 18px, 100%);
    display: grid;
    gap: 8px;
  }

  .topbar-meta {
    justify-content: space-between;
  }

  .form-grid,
  .media-grid,
  .title-field,
  .upload-field,
  .cover-upload-row,
  .lyrics-editor-head {
    grid-template-columns: 1fr;
  }

  .lyrics-editor-head,
  .preview-lyrics-head {
    align-items: stretch;
    display: grid;
  }

  .ai-candidate-head,
  .ai-candidate-item {
    align-items: stretch;
    grid-template-columns: 1fr;
  }

  .ai-candidate-head {
    display: grid;
  }

  .candidate-rank {
    width: 26px;
    height: 26px;
  }

  .footer-inner > div {
    width: 100%;
  }

  :deep(.footer-button) {
    flex: 1;
    min-width: 0;
  }
}
</style>
