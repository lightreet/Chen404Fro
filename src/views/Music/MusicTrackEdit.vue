<template>
  <div class="track-edit-page">
      <div class="track-edit-topbar">
        <el-button text class="topbar-back" @click="goBack">
          <el-icon><ArrowLeft /></el-icon>
          返回音乐馆
        </el-button>
        <div class="topbar-meta">
          <span>{{ pageTitle }}</span>
          <span>{{ form.status === 'published' ? '公开' : '草稿' }}</span>
        </div>
      </div>

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
                      AI 补全
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
                <el-form-item label="排序">
                  <el-input-number v-model="form.sortOrder" :min="0" :max="9999" controls-position="right" />
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
                    <el-upload
                      :show-file-list="false"
                      :http-request="handleAudioUpload"
                      accept=".mp3,.wav,.flac,.ogg,.aac,.m4a,audio/*"
                    >
                      <el-button :loading="uploadingAudio" :disabled="uploadingAudio">上传音频</el-button>
                    </el-upload>
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
                    <el-upload
                      class="cover-uploader"
                      :show-file-list="false"
                      :http-request="handleCoverUpload"
                      accept="image/jpeg,image/png,image/webp,image/gif"
                    >
                      <div class="cover-drop">
                        <img v-if="form.coverUrl" :src="form.coverUrl" :alt="form.title || '歌曲封面'" />
                        <div v-else>
                          <el-icon><Plus /></el-icon>
                          <span>上传封面</span>
                        </div>
                      </div>
                    </el-upload>
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
              <div class="lyrics-row">
                <el-form-item label="歌词类型">
                  <el-segmented v-model="form.lyricType" :options="lyricTypeOptions" />
                </el-form-item>
                <el-form-item label="歌词来源">
                  <el-input v-model="form.lyricSource" maxlength="160" placeholder="可选" />
                </el-form-item>
              </div>
              <el-form-item label="歌词">
                <el-input v-model="form.lyrics" type="textarea" :rows="10" placeholder="00:12.000 LRC 或普通歌词都可以放在这里" />
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
import { ArrowLeft, Plus } from '@element-plus/icons-vue'
import { useRoute, useRouter } from 'vue-router'
import { createMusicTrack, getAdminMusicTrack, suggestMusicTrack, updateMusicTrack } from '@/api/music'
import { uploadMusicAudio, uploadMusicCover, type UploadResult } from '@/api/upload'
import type { MusicTrack, MusicTrackAiSuggestResponse, MusicTrackUpsertCommand } from '@/types'

const route = useRoute()
const router = useRouter()
type UploadError = Parameters<UploadRequestOptions['onError']>[0]

const loading = ref(false)
const saving = ref(false)
const suggestingTrack = ref(false)
const uploadingAudio = ref(false)
const uploadingCover = ref(false)
const tagDraft = ref('')
const releaseYearPicker = ref<string>()
const audioUploadName = ref('')
const coverUploadName = ref('')
const uploadedAudioUrl = ref('')
const uploadedCoverUrl = ref('')

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
  { label: '纯文本', value: 'plain' },
  { label: 'LRC', value: 'lrc' },
]

const form = reactive<MusicTrackUpsertCommand>(createEmptyTrackForm())

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
    sortOrder: track.sortOrder,
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
  try {
    const suggestion = await suggestMusicTrack({
      title,
      artist: form.artist.trim() || undefined,
    })
    const appliedCount = applyTrackSuggestion(suggestion)
    if (appliedCount > 0) {
      ElMessage.success(`AI 已补全 ${appliedCount} 项信息`)
    } else {
      ElMessage.info('AI 找到的建议和当前内容差不多，暂时没有覆盖')
    }
  } finally {
    suggestingTrack.value = false
  }
}

function applyTrackSuggestion(suggestion: MusicTrackAiSuggestResponse) {
  let appliedCount = 0
  const applyText = (field: keyof MusicTrackUpsertCommand, value?: string) => {
    if (!value?.trim() || String(form[field] || '').trim()) return
    ;(form[field] as string | undefined) = value.trim()
    appliedCount += 1
  }

  applyText('artist', suggestion.artist)
  applyText('album', suggestion.album)
  applyText('language', suggestion.language)
  applyText('genre', suggestion.genre)
  applyText('recommendation', suggestion.recommendation)
  applyText('moodText', suggestion.moodText)
  applyText('lyricSource', suggestion.lyricSource)

  if (!form.releaseYear && suggestion.releaseYear) {
    form.releaseYear = suggestion.releaseYear
    releaseYearPicker.value = String(suggestion.releaseYear)
    appliedCount += 1
  }

  if (!tagDraft.value.trim() && suggestion.tags?.length) {
    tagDraft.value = suggestion.tags.filter(Boolean).join(', ')
    appliedCount += 1
  }

  return appliedCount
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

function parseTags(input: string) {
  return input.split(/[,，]/).map((tag) => tag.trim()).filter(Boolean)
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
    sortOrder: 0,
  }
}
</script>

<style scoped lang="scss">
.track-edit-page {
  width: min(1320px, calc(100vw - 48px));
  min-height: 100vh;
  margin: 0 auto;
  padding: calc(74px + env(safe-area-inset-top, 0)) 0 calc(88px + env(safe-area-inset-bottom, 0));
  color: #443840;
}

.track-edit-topbar {
  position: fixed;
  top: calc(14px + env(safe-area-inset-top, 0));
  left: 50%;
  z-index: 285;
  width: min(1320px, calc(100vw - 48px));
  transform: translateX(-50%);
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
  min-height: 48px;
  margin-bottom: 14px;
  padding: 8px 12px;
  border: 1px solid rgba(238, 226, 235, 0.84);
  border-radius: 16px;
  background: rgba(255, 250, 253, 0.86);
  box-shadow: 0 12px 32px rgba(219, 192, 206, 0.12);
  backdrop-filter: blur(14px);
  -webkit-backdrop-filter: blur(14px);
}

.topbar-back {
  color: #7f737e;
  font-weight: 700;
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
.media-grid,
.lyrics-row {
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

.upload-field,
.cover-upload-row {
  width: 100%;
  display: grid;
  gap: 10px;
}

.upload-field {
  grid-template-columns: auto minmax(0, 1fr);
  align-items: center;
}

.cover-upload-row {
  grid-template-columns: 112px minmax(0, 1fr);
  align-items: stretch;
}

.upload-input-stack {
  min-width: 0;
  display: grid;
  gap: 6px;
}

.upload-hint {
  color: #9b8b96;
  font-size: 12px;
  line-height: 1.4;
}

.cover-uploader,
.cover-uploader :deep(.el-upload) {
  width: 112px;
  height: 112px;
}

.cover-drop {
  overflow: hidden;
  width: 112px;
  height: 112px;
  display: grid;
  place-items: center;
  border: 1.5px dashed rgba(255, 143, 184, 0.72);
  border-radius: 14px;
  background: rgba(255, 250, 253, 0.78);
  color: #ff5e99;
}

.cover-drop img {
  width: 100%;
  height: 100%;
  display: block;
  object-fit: cover;
}

.cover-drop div {
  display: grid;
  place-items: center;
  gap: 8px;
  color: #ff5e99;
  font-size: 13px;
  font-weight: 800;
}

.cover-drop .el-icon {
  font-size: 24px;
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
    padding-top: calc(104px + env(safe-area-inset-top, 0));
  }

  .track-edit-topbar {
    top: calc(10px + env(safe-area-inset-top, 0));
    width: min(100vw - 18px, 100%);
  }

  .track-edit-topbar,
  .footer-inner {
    display: grid;
  }

  .form-grid,
  .media-grid,
  .lyrics-row,
  .title-field,
  .upload-field,
  .cover-upload-row {
    grid-template-columns: 1fr;
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
