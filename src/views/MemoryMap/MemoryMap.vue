<template>
  <DefaultLayout :wide-content="true" :mobile-title="mobileDetail ? '旅行详情' : '旅行游记'" mobile-back-to="/memory-map">
    <template #hero>
      <PageHero
        title="旅行纪念地图"
        eyebrow="Memory Map"
        subtitle="途经的城市，留下的故事"
        :bg-image="heroBgImage"
        :bg-position="heroBgPosition"
        min-height="64vh"
        compact
        scroll-target="#memory-map-content"
        :show-scroll-text="false"
      />
    </template>

    <div id="memory-map-content" class="memory-map-page" :class="{ 'is-mobile-detail': mobileDetail }">
      <div v-if="authReady && canManage && !mobileDetail" class="memory-topline">
        <UiButton
          variant="primary"
          size="sm"
          icon="add"
          @click="openCreateDialog"
        >
          新增旅行游记
        </UiButton>
      </div>
      <section
        v-if="!authReady"
        class="memory-state memory-surface"
        role="status"
      >
        <UiIcon name="loading" spin />
        <p>正在确认旅行地图访问权限...</p>
      </section>

      <div v-else class="memory-layout">
        <aside v-show="!mobileDetail" class="memory-rail" aria-label="旅行索引与地图">
          <section class="memory-index memory-surface">
            <div class="memory-index__heading">
              <p class="memory-eyebrow">TRAVEL INDEX</p>
              <h2>旅行索引</h2>
              <p class="memory-index__count">
                {{ locations.length }} 篇游记 <span>·</span>
                {{ totalPhotoCount }} 张照片
              </p>
            </div>
            <div
              v-if="loading && !locations.length"
              class="memory-rail__state"
              role="status"
            >
              旅行地点加载中...
            </div>
            <div v-else-if="!locations.length" class="memory-rail__state">
              {{ memoryLoadError ? '暂时无法获取旅行地点' : '等待下一段旅途' }}
            </div>
            <div v-else ref="indexListRef" class="memory-index__list">
              <button
                v-for="location in locations"
                :key="location.id"
                :ref="(element) => setIndexCardRef(location.id, element)"
                type="button"
                class="memory-trip"
                :class="{ 'is-active': activeId === location.id }"
                :aria-label="`查看 ${location.title}`"
                :aria-pressed="activeId === location.id"
                @click="selectLocation(location.id)"
              >
                <img
                  v-if="location.coverImage"
                  :src="location.coverImage"
                  alt=""
                  loading="lazy"
                />
                <span v-else class="memory-trip__placeholder"
                  ><UiIcon name="image"
                /></span>
                <span class="memory-trip__copy">
                  <strong>{{ location.title }}</strong>
                  <span>{{ formatLocation(location) }}</span>
                  <small>{{
                    formatDateRange(
                      location.visitedAt,
                      location.visitedEndAt,
                    ) || '日期待补充'
                  }}</small>
                </span>
                <span
                  v-if="activeId === location.id"
                  class="memory-trip__dot"
                  aria-hidden="true"
                />
              </button>
            </div>
          </section>

          <section class="memory-locator memory-surface">
            <div class="memory-section-heading">
              <h3><UiIcon name="location" /> 旅行足迹</h3>
              <button
                type="button"
                class="memory-link"
                aria-haspopup="dialog"
                @click="openExpandedMap"
              >
                展开地图 <UiIcon name="external" />
              </button>
            </div>
            <div class="memory-locator__map">
              <TravelMemoryMap
                compact
                :locations="locations"
                :active-id="activeId"
                :display-max-zoom="9"
                @select="selectLocation"
              />
            </div>
            <p class="memory-locator__caption">
              <strong>{{ currentLocationName }}</strong
              ><span>点击标记，翻阅游记</span>
            </p>
          </section>
        </aside>

        <article
          v-show="!isPhone || mobileDetail || memoryLoadError || (!loading && !locations.length)"
          ref="journalRef"
          class="travel-journal memory-surface"
          :aria-busy="loading || loadingDetail"
          tabindex="-1"
        >
          <div v-if="memoryLoadError" class="memory-state" role="status">
            <UiIcon name="warning" />
            <h2>旅行地点加载失败</h2>
            <p>{{ memoryLoadError }}</p>
            <UiButton variant="secondary" @click="retryMemoryList"
              >重新加载</UiButton
            >
          </div>
          <div
            v-else-if="loading && !activeDetail"
            class="memory-state"
            role="status"
          >
            <UiIcon name="loading" spin />
            <h2>正在翻开旅行游记</h2>
            <p>照片和故事马上就来。</p>
          </div>
          <div
            v-else-if="showPublicEmptyNotice"
            class="memory-state"
            role="status"
          >
            <span class="memory-state__flower" aria-hidden="true">✿</span>
            <h2>{{ publicEmptyNoticeTitle }}</h2>
            <p>{{ publicEmptyNoticeText }}</p>
            <UiButton v-if="!isLoggedIn" variant="primary" @click="goToLogin"
              >登录查看更多</UiButton
            >
            <UiButton
              v-else-if="!canViewFriendMemoryMap"
              variant="primary"
              @click="goToTrustRequest"
              >申请知友访问</UiButton
            >
            <UiButton
              v-else-if="canManage"
              variant="primary"
              icon="add"
              @click="openCreateDialog"
              >新增旅行游记</UiButton
            >
          </div>
          <template v-else-if="activeDetail">
            <header class="travel-journal__head">
              <div class="travel-journal__copy">
                <p class="memory-eyebrow">TRAVEL JOURNAL</p>
                <h2>{{ journalTitle }}</h2>
                <div class="travel-journal__facts">
                  <span v-if="journalLocationText"
                    ><UiIcon name="location" />{{ journalLocationText }}</span
                  >
                  <span v-if="journalDateRange"
                    ><UiIcon name="calendar" />{{ journalDateRange }}</span
                  >
                </div>
              </div>
              <UiDropdown
                v-if="canManageActiveMemory"
                trigger="click"
                @command="handleJournalCommand"
              >
                <button
                  type="button"
                  class="memory-menu-button"
                  aria-label="游记操作"
                >
                  <UiIcon name="more" />
                </button>
                <template #dropdown>
                  <UiDropdownMenu>
                    <UiDropdownItem command="edit"
                      ><UiIcon name="edit" /> 编辑游记</UiDropdownItem
                    >
                    <UiDropdownItem command="delete"
                      ><UiIcon name="delete" /> 删除游记</UiDropdownItem
                    >
                  </UiDropdownMenu>
                </template>
              </UiDropdown>
            </header>

            <div
              v-if="detailLoadError"
              class="travel-journal__error"
              role="status"
            >
              <div>
                <strong>地点详情加载失败</strong>
                <p>{{ detailLoadError }}</p>
              </div>
              <UiButton variant="secondary" size="sm" @click="retryActiveDetail"
                >重新加载</UiButton
              >
            </div>
            <div
              v-else-if="loadingDetail"
              class="travel-journal__pending"
              role="status"
            >
              <UiIcon name="loading" spin /> 正在加载旅行片段...
            </div>
            <template v-else>
              <nav
                v-if="journalStops.length"
                class="travel-journal__tabs"
                role="tablist"
                aria-label="旅行片段"
              >
                <button
                  v-for="(stop, index) in journalStops"
                  :id="stopTabId(index)"
                  :key="stop.key"
                  type="button"
                  class="stop-tab"
                  :class="{ 'is-active': index === activeStopIndex }"
                  role="tab"
                  :aria-controls="stopPanelId(index)"
                  :aria-selected="index === activeStopIndex"
                  :tabindex="index === activeStopIndex ? 0 : -1"
                  @click="selectStop(index)"
                  @keydown.left.prevent="moveStopSelection(index, -1)"
                  @keydown.right.prevent="moveStopSelection(index, 1)"
                  @keydown.home.prevent="focusStop(0)"
                  @keydown.end.prevent="focusStop(journalStops.length - 1)"
                >
                  <span class="stop-tab__index">{{
                    String(index + 1).padStart(2, '0')
                  }}</span>
                  {{ stop.title }}
                  <span class="stop-tab__count">{{ stop.entries.length }}</span>
                </button>
              </nav>
              <section
                v-if="activeStop"
                :id="stopPanelId(activeStopIndex)"
                :key="`${activeId}-${activeStop.key}`"
                class="travel-journal__stop"
                role="tabpanel"
                :aria-labelledby="stopTabId(activeStopIndex)"
                tabindex="0"
              >
                <div class="travel-journal__stop-meta">
                  <p v-if="activeStop.storyNote" class="travel-journal__story">
                    {{ activeStop.storyNote }}
                  </p>
                  <span class="travel-journal__photo-count"
                    ><UiIcon name="image" />
                    {{ activeStop.entries.length }} 张照片</span
                  >
                </div>
                <TravelPhotoGallery
                  :entries="activeStop.entries"
                  :title="activeStop.title"
                  @open="openStopPhoto"
                />
              </section>
              <div v-else class="travel-journal__pending">
                这个地点还没有旅行片段
              </div>
            </template>
            <blockquote
              v-if="journalQuote && !loadingDetail"
              class="travel-journal__quote"
            >
              <span aria-hidden="true">“</span>
              <p>{{ journalQuote }}</p>
            </blockquote>
            <footer class="travel-journal__footer">
              <span
                >{{ journalStops.length }} 个片段 ·
                {{
                  activeDetail.entryCount ?? activeDetail.entries.length
                }}
                张照片</span
              >
              <button
                type="button"
                class="memory-link"
                aria-haspopup="dialog"
                @click="openExpandedMap"
              >
                在地图上查看 <UiIcon name="arrow-right" />
              </button>
            </footer>
          </template>
          <div v-else class="memory-state">
            <h2>选择一段旅途</h2>
            <p>从旅行索引或地图中打开一篇游记。</p>
          </div>
        </article>
      </div>
    </div>

    <UiDialog
      v-model="mapExpanded"
      title="旅行足迹"
      width="1120px"
      panel-class="memory-map-dialog"
      :lock-scroll="false"
    >
      <div class="memory-expanded-layout">
        <TravelMemoryMap
          v-if="mapExpanded"
          :locations="locations"
          :active-id="activeId"
          :display-max-zoom="9"
          @select="selectLocation"
        />
        <aside class="memory-expanded-index">
          <p class="memory-eyebrow">EXPLORE THE MAP</p>
          <h3>{{ currentLocationName }}</h3>
          <p class="memory-expanded-index__hint">
            选择地点，翻阅相应的旅行故事。
          </p>
          <div class="memory-expanded-index__list">
            <button
              v-for="location in locations"
              :key="location.id"
              type="button"
              class="memory-trip"
              :class="{ 'is-active': activeId === location.id }"
              :aria-pressed="activeId === location.id"
              @click="selectLocation(location.id)"
            >
              <img
                v-if="location.coverImage"
                :src="location.coverImage"
                alt=""
                loading="lazy"
              />
              <span class="memory-trip__copy"
                ><strong>{{ location.title }}</strong
                ><span>{{ formatLocation(location) }}</span></span
              >
            </button>
            <p v-if="!locations.length" class="memory-expanded-index__hint">
              暂无可展示的旅行地点
            </p>
          </div>
          <UiButton
            v-if="activeDetail"
            variant="primary"
            block
            @click="readSelectedJournal"
            >阅读这篇游记 <UiIcon name="arrow-right"
          /></UiButton>
        </aside>
      </div>
    </UiDialog>
    <UiImageViewer
      v-model="photoViewerVisible"
      :urls="stopPhotoUrls"
      :initial-index="photoViewerIndex"
    />
  </DefaultLayout>
</template>

<script setup lang="ts">
import { computed, nextTick, onBeforeUnmount, onMounted, ref, watch } from 'vue'
import { useMobileViewport } from '@/composables/useMobileViewport'
import { useRoute, useRouter } from 'vue-router'
import dayjs from 'dayjs'
import { storeToRefs } from 'pinia'
import { notify, confirmDelete } from '@/lib/feedback'
import DefaultLayout from '@/layouts/DefaultLayout.vue'
import PageHero from '@/components/PageHero/PageHero.vue'
import TravelMemoryMap from '@/components/TravelMemoryMap/TravelMemoryMap.vue'
import TravelPhotoGallery from '@/components/TravelMemoryMap/TravelPhotoGallery.vue'
import {
  UiButton,
  UiDialog,
  UiDropdown,
  UiDropdownMenu,
  UiDropdownItem,
  UiIcon,
  UiImageViewer,
} from '@/components/ui'
import {
  deleteTravelMemory,
  getTravelMemories,
  getTravelMemoryDetail,
} from '@/api/travel-memory'
import { useSiteConfig } from '@/composables/useSiteConfig'
import { resolveFeatureHero } from '@/modules/feature-access/constants'
import { useUserStore } from '@/stores/user'
import type {
  TravelMemoryEntry,
  TravelMemoryLocationDetail,
  TravelMemoryLocationListItem,
} from '@/types'
import { hasCapability, isAdminUser, isFriendUser } from '@/utils/permission'

const { siteConfig, loadSiteConfig } = useSiteConfig()
const userStore = useUserStore()
userStore.initUser()
const { user, isLoggedIn } = storeToRefs(userStore)
const route = useRoute()
const router = useRouter()
const { isMobile: isPhone } = useMobileViewport()
const mobileDetail = computed(() => isPhone.value && Boolean(route.query.focus))

const defaultHero = resolveFeatureHero(null, 'memory-map')
const heroBgImage = ref(defaultHero.bgImage)
const heroBgPosition = ref(defaultHero.bgPosition)
const loading = ref(false)
const loadingDetail = ref(false)
const authReady = ref(false)
const locations = ref<TravelMemoryLocationListItem[]>([])
const indexListRef = ref<HTMLElement | null>(null)
const journalRef = ref<HTMLElement | null>(null)
const activeId = ref<number | null>(null)
const activeDetail = ref<TravelMemoryLocationDetail | null>(null)
const detailCache = ref<Record<number, TravelMemoryLocationDetail>>({})
const detailLoadError = ref('')
const memoryLoadError = ref('')
const indexCardRefs = new Map<number, HTMLElement>()
let detailRequestVersion = 0
let memoryLoadVersion = 0
let hasInitializedAccessState = false
let isDisposed = false
const canManage = computed(
  () => isLoggedIn.value && hasCapability(user.value, 'travel:create'),
)
const canManageActiveMemory = computed(
  () => isLoggedIn.value && (isAdminUser(user.value) || Boolean(activeDetail.value?.canEdit)),
)
const canViewFriendMemoryMap = computed(
  () => isLoggedIn.value && (isAdminUser(user.value) || isFriendUser(user.value)),
)
const showPublicEmptyNotice = computed(
  () =>
    authReady.value &&
    !loading.value &&
    !memoryLoadError.value &&
    !locations.value.length,
)
const publicEmptyNoticeTitle = computed(() => {
  if (canViewFriendMemoryMap.value) {
    return '还没有可展示的旅行地点'
  }
  return '当前没有公开旅行地点'
})
const publicEmptyNoticeText = computed(() => {
  if (canViewFriendMemoryMap.value) {
    return '你已经可以查看知友可见内容。等新的旅行地点发布后，这张地图会直接显示地点、照片和路线。'
  }
  if (isLoggedIn.value) {
    return '你已经进入旅行地图，公开内容暂时为空。通过好友申请后，可以看到知友可见的私人旅途。'
  }
  return '你已经进入旅行地图，公开内容暂时为空。登录并通过好友申请后，可以看到更多私人旅途。'
})
interface JournalStopView {
  key: string
  title: string
  storyNote: string
  entries: TravelMemoryEntry[]
}

const activeStopIndex = ref(0)

const journalStops = computed<JournalStopView[]>(() => {
  const detail = activeDetail.value
  if (!detail) return []

  const stops = (detail.stops || [])
    .filter((stop) => stop.entries?.length || stop.storyNote?.trim())
    .slice()
    .sort((a, b) => (a.sortOrder ?? 0) - (b.sortOrder ?? 0))

  if (stops.length) {
    return stops.map((stop, index) => ({
      key: `stop-${stop.id ?? index}`,
      title: stop.title?.trim() || `第 ${index + 1} 站`,
      storyNote: stop.storyNote?.trim() || '',
      entries: (stop.entries || [])
        .slice()
        .sort((a, b) => (a.displayOrder ?? 0) - (b.displayOrder ?? 0)),
    }))
  }

  // 没有划分片段的地点：把散照片合成一个默认片段，菜单栏始终可用
  const flatEntries = (detail.entries || [])
    .slice()
    .sort((a, b) => (a.displayOrder ?? 0) - (b.displayOrder ?? 0))
  if (!flatEntries.length) return []
  return [
    {
      key: 'stop-all',
      title: '全部照片',
      storyNote: '',
      entries: flatEntries,
    },
  ]
})

const activeStop = computed<JournalStopView | null>(() => {
  const stops = journalStops.value
  if (!stops.length) return null
  return stops[Math.min(activeStopIndex.value, stops.length - 1)]
})

/** 当前片段的全部可预览图片，供大图查看器左右切换 */
const stopPhotoUrls = computed<string[]>(() =>
  (activeStop.value?.entries || [])
    .map((entry) => entry.imageUrl)
    .filter((url): url is string => Boolean(url)),
)

const photoViewerVisible = ref(false)
const photoViewerIndex = ref(0)

/** 打开大图查看器，并定位到被点击的那张照片 */
function openStopPhoto(imageUrl?: string | null) {
  if (!imageUrl) return
  const index = stopPhotoUrls.value.indexOf(imageUrl)
  if (index < 0) return
  photoViewerIndex.value = index
  photoViewerVisible.value = true
}

function selectStop(index: number) {
  const lastIndex = Math.max(0, journalStops.value.length - 1)
  activeStopIndex.value = Math.min(Math.max(index, 0), lastIndex)
}

function stopTabId(index: number) {
  return `travel-stop-tab-${activeId.value ?? 'none'}-${index}`
}

function stopPanelId(index: number) {
  return `travel-stop-panel-${activeId.value ?? 'none'}-${index}`
}

function focusStop(index: number) {
  if (!journalStops.value.length) return
  selectStop(index)
  void nextTick(() =>
    document.getElementById(stopTabId(activeStopIndex.value))?.focus(),
  )
}

function moveStopSelection(index: number, offset: number) {
  const stopCount = journalStops.value.length
  if (!stopCount) return
  focusStop((index + offset + stopCount) % stopCount)
}
const totalPhotoCount = computed(() =>
  locations.value.reduce(
    (sum, location) => sum + Number(location.entryCount || 0),
    0,
  ),
)
const currentLocationName = computed(
  () =>
    activeDetail.value?.city ||
    activeDetail.value?.province ||
    activeDetail.value?.title ||
    '未选择',
)
const journalTitle = computed(
  () => activeDetail.value?.title?.trim() || '旅行详情',
)
const journalLocationText = computed(() => {
  if (!activeDetail.value) return ''
  const value = formatLocation(activeDetail.value)
  return value === '未标注地点' ? '' : value
})
const journalDateRange = computed(() =>
  formatDateRange(
    activeDetail.value?.visitedAt,
    activeDetail.value?.visitedEndAt,
  ),
)
const journalQuote = computed(
  () => activeDetail.value?.summaryNote?.trim() || '',
)

async function loadMemories(preferredId?: number | null) {
  const requestVersion = ++memoryLoadVersion
  loading.value = true
  detailLoadError.value = ''
  memoryLoadError.value = ''
  try {
    const list = await getTravelMemories(resolveRouteCreatorId())
    if (requestVersion !== memoryLoadVersion) return
    if (list?.length) {
      locations.value = list
      const nextId = resolveDefaultLocationId(
        locations.value,
        preferredId,
        activeId.value,
      )

      if (nextId != null) {
        await handleSelectLocation(nextId)
      } else {
        activeId.value = null
        activeDetail.value = null
        loadingDetail.value = false
      }
      return
    }
    resetMemoryState()
  } catch {
    if (requestVersion !== memoryLoadVersion) return
    resetMemoryState()
    memoryLoadError.value = '请检查接口连通性，或稍后再试。'
    notify.error('旅行地点加载失败')
  } finally {
    if (requestVersion === memoryLoadVersion) {
      loading.value = false
    }
  }
}

async function handleSelectLocation(
  id: number,
  options: { revealIndex?: boolean } = {},
) {
  const summary = locations.value.find((location) => location.id === id)
  if (!summary) return
  const requestVersion = ++detailRequestVersion
  const cachedDetail = detailCache.value[id]
  if (activeId.value !== id) {
    activeStopIndex.value = 0
  }
  activeId.value = id
  detailLoadError.value = ''
  activeDetail.value = cachedDetail || buildPendingDetail(summary)
  await nextTick()
  if (requestVersion !== detailRequestVersion || activeId.value !== id) return
  if (options.revealIndex !== false) {
    scrollIndexCardIntoView(id)
  }

  if (cachedDetail) {
    loadingDetail.value = false
    return
  }

  loadingDetail.value = true
  try {
    const detail = await getTravelMemoryDetail(id)
    if (requestVersion !== detailRequestVersion || activeId.value !== id) {
      return
    }
    detailCache.value[id] = detail
    activeDetail.value = detail
  } catch {
    if (requestVersion === detailRequestVersion && activeId.value === id) {
      detailLoadError.value = '当前先展示基础摘要，你可以稍后重新加载完整游记。'
      notify.error('地点详情加载失败')
    }
  } finally {
    if (requestVersion === detailRequestVersion) {
      loadingDetail.value = false
    }
  }
}

function handleJournalCommand(command: string | number | object) {
  if (!activeDetail.value || !canManageActiveMemory.value) return
  if (command === 'edit') editMemory(activeDetail.value.id)
  if (command === 'delete') void deleteMemory(activeDetail.value)
}

const mapExpanded = ref(false)
let mapTrigger: HTMLElement | null = null
let previousBodyOverflow = ''

function openExpandedMap() {
  mapExpanded.value = true
}

async function readSelectedJournal() {
  mapTrigger = document.getElementById(stopTabId(activeStopIndex.value)) || journalRef.value
  mapExpanded.value = false
  await nextTick()
  journalRef.value?.scrollIntoView({ block: 'start' })
}

// 地图弹窗统一管理滚动锁定、键盘关闭和焦点归还，避免与 UiDialog 重复写入 body 状态。
function handleMapDialogKeydown(event: KeyboardEvent) {
  if (!mapExpanded.value) return
  if (event.key === 'Escape') {
    event.preventDefault()
    mapExpanded.value = false
    return
  }
  if (event.key !== 'Tab') return
  const dialog = document.querySelector<HTMLElement>('.memory-map-dialog')
  const focusable = Array.from(
    dialog?.querySelectorAll<HTMLElement>(
      'button:not([disabled]), a[href], input:not([disabled]), [tabindex]:not([tabindex="-1"])',
    ) || [],
  ).filter((element) => element.getClientRects().length > 0)
  const first = focusable[0]
  const last = focusable[focusable.length - 1]
  if (
    event.shiftKey &&
    (document.activeElement === first ||
      !dialog?.contains(document.activeElement))
  ) {
    event.preventDefault()
    last?.focus()
  } else if (
    !event.shiftKey &&
    (document.activeElement === last ||
      !dialog?.contains(document.activeElement))
  ) {
    event.preventDefault()
    first?.focus()
  }
}

watch(mapExpanded, async (open) => {
  if (open) {
    mapTrigger =
      document.activeElement instanceof HTMLElement
        ? document.activeElement
        : null
    previousBodyOverflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    document.addEventListener('keydown', handleMapDialogKeydown)
    await nextTick()
    if (!isDisposed && mapExpanded.value)
      document
        .querySelector<HTMLElement>('.memory-map-dialog .ui-dialog__close')
        ?.focus()
  } else {
    document.removeEventListener('keydown', handleMapDialogKeydown)
    await nextTick()
    if (isDisposed || mapExpanded.value) return
    document.body.style.overflow = previousBodyOverflow
    mapTrigger?.focus({ preventScroll: true })
  }
})

watch([activeId, activeStopIndex], () => {
  photoViewerVisible.value = false
})

onBeforeUnmount(() => {
  isDisposed = true
  memoryLoadVersion += 1
  detailRequestVersion += 1
  document.removeEventListener('keydown', handleMapDialogKeydown)
  if (mapExpanded.value) document.body.style.overflow = previousBodyOverflow
})

function openCreateDialog() {
  router.push({ name: 'TravelMemoryCreate' })
}

function goToLogin() {
  router.push({ path: '/login', query: { redirect: '/memory-map' } })
}

function goToTrustRequest() {
  router.push({ path: '/profile', query: { tab: 'trust' } })
}

function retryActiveDetail() {
  if (activeId.value == null) return
  void handleSelectLocation(activeId.value, { revealIndex: false })
}

function retryMemoryList() {
  void loadMemories(resolveRouteFocusId())
}

function editMemory(id: number) {
  router.push({ name: 'TravelMemoryEdit', params: { id } })
}

async function deleteMemory(
  location: Pick<TravelMemoryLocationListItem, 'id' | 'title'>,
) {
  const confirmed = await confirmDelete(
    `确定要删除“${location.title}”吗？删除后将无法恢复。`,
    {
      title: '删除旅行地点',
    },
  )
  if (!confirmed) return
  try {
    await deleteTravelMemory(location.id)
    notify.success('地点已删除')
    detailCache.value = {}
    await loadMemories(resolveRouteFocusId())
  } catch {
    notify.error('删除地点失败')
  }
}

function formatDate(value?: string) {
  return value ? dayjs(value).format('YYYY.MM.DD') : ''
}

function formatDateRange(start?: string, end?: string) {
  const startText = formatDate(start)
  const endText = formatDate(end)
  if (!startText) return endText
  if (!endText || endText === startText) return startText
  return `${startText} - ${endText}`
}

function formatLocation(location?: { province?: string; city?: string }) {
  if (!location) return '未标注地点'
  return (
    [location.province, location.city].filter(Boolean).join(' · ') ||
    '未标注地点'
  )
}

function selectLocation(id: number) {
  void handleSelectLocation(id)
  if (isPhone.value && !mobileDetail.value) {
    void router.push({ query: { ...route.query, focus: String(id) } }).then(() => window.scrollTo({ top: 0, behavior: 'instant' }))
  } else syncRouteFocus(id)
}

function syncRouteFocus(id: number) {
  if (resolveRouteFocusId() === id) return
  void router.replace({
    query: {
      ...route.query,
      focus: String(id),
    },
  })
}

function buildPendingDetail(
  location: TravelMemoryLocationListItem,
): TravelMemoryLocationDetail {
  return {
    ...location,
    entries: [],
    stops: [],
  }
}

function resetMemoryState() {
  memoryLoadVersion += 1
  detailRequestVersion += 1
  detailCache.value = {}
  locations.value = []
  activeId.value = null
  activeDetail.value = null
  loading.value = false
  loadingDetail.value = false
  detailLoadError.value = ''
  memoryLoadError.value = ''
}

function setIndexCardRef(id: number, element: unknown) {
  if (element instanceof HTMLElement) {
    indexCardRefs.set(id, element)
    return
  }
  indexCardRefs.delete(id)
}

function scrollIndexCardIntoView(id: number) {
  const list = indexListRef.value
  const card = indexCardRefs.get(id)
  if (!list || !card) return

  const listBounds = list.getBoundingClientRect()
  const cardBounds = card.getBoundingClientRect()
  const top = listBounds.top + list.clientTop
  const left = listBounds.left + list.clientLeft
  const bottom = top + list.clientHeight
  const right = left + list.clientWidth
  const offsetY = cardBounds.top < top
    ? cardBounds.top - top
    : Math.max(0, cardBounds.bottom - bottom)
  const offsetX = cardBounds.left < left
    ? cardBounds.left - left
    : Math.max(0, cardBounds.right - right)
  if (!offsetX && !offsetY) return

  // 只移动索引自身；scrollIntoView 会同时滚动外层页面，导致切换时画面跳动。
  list.scrollBy({
    top: offsetY,
    left: offsetX,
    behavior: window.matchMedia('(prefers-reduced-motion: reduce)').matches
      ? 'instant'
      : 'smooth',
  })
}

function resolveDefaultLocationId(
  list: TravelMemoryLocationListItem[],
  preferredId?: number | null,
  currentId?: number | null,
) {
  if (preferredId != null && list.some((item) => item.id === preferredId)) {
    return preferredId
  }
  if (currentId != null && list.some((item) => item.id === currentId)) {
    return currentId
  }

  return list[0]?.id ?? null
}

function resolveRouteFocusId() {
  const rawValue = Array.isArray(route.query.focus)
    ? route.query.focus[0]
    : route.query.focus
  const numericId = Number(rawValue)
  return Number.isFinite(numericId) ? numericId : null
}

function resolveRouteCreatorId() {
  const rawValue = Array.isArray(route.query.creatorId)
    ? route.query.creatorId[0]
    : route.query.creatorId
  const creatorId = String(rawValue || '').trim()
  return /^\d+$/.test(creatorId) && creatorId !== '0' ? creatorId : undefined
}

onMounted(async () => {
  await Promise.all([
    userStore.syncAuthState().catch(() => false),
    loadSiteConfig().catch(() => null),
  ])
  if (isDisposed) return

  const hero = resolveFeatureHero(siteConfig.value, 'memory-map')
  heroBgImage.value = hero.bgImage
  heroBgPosition.value = hero.bgPosition
  authReady.value = true
  hasInitializedAccessState = true
  await syncMemoryContent()
})

async function syncMemoryContent() {
  // 身份或作者范围变化时立即清空缓存，并使旧列表、旧详情请求失效。
  resetMemoryState()
  await loadMemories(resolveRouteFocusId())
}

watch(
  () => route.query.focus,
  (focus) => {
    if (!hasInitializedAccessState) return
    const targetId = Array.isArray(focus) ? Number(focus[0]) : Number(focus)
    if (!Number.isFinite(targetId) || targetId === activeId.value) return
    void handleSelectLocation(targetId)
  },
)

watch(
  [() => route.query.creatorId, () => user.value?.id, canViewFriendMemoryMap],
  () => {
    if (!authReady.value || !hasInitializedAccessState) return
    void syncMemoryContent()
  },
)
</script>

<style scoped lang="scss">
.memory-map-page {
  width: min(88vw, 1320px);
  max-width: 100%;
  margin: 0 auto;
  padding: 8px 0 40px;
  color: var(--color-text-primary);
  scroll-margin-top: 72px;
}
.memory-topline {
  display: flex;
  align-items: center;
  justify-content: flex-end;
  flex-wrap: wrap;
  gap: 12px;
  min-height: 36px;
  padding: 0 4px 12px;
  color: var(--color-text-secondary);
  font-size: var(--font-size-sm);
}
.memory-layout {
  display: grid;
  grid-template-columns: 288px minmax(0, 1fr);
  gap: 24px;
  align-items: stretch;
}
.memory-surface {
  background: var(--color-surface);
  border: 1px solid var(--color-border-light);
  border-radius: 20px;
  box-shadow: 0 8px 30px rgb(50 30 45 / 3%);
}
.memory-eyebrow {
  margin: 0 0 8px;
  color: var(--color-accent-readable);
  font-size: var(--font-size-xs);
  letter-spacing: 1.8px;
  font-weight: 600;
  line-height: 1.4;
}
.memory-rail {
  display: grid;
  grid-template-columns: minmax(0, 1fr);
  grid-template-rows: auto auto;
  align-self: start;
  gap: 18px;
  min-width: 0;
}
.memory-index {
  display: flex;
  flex-direction: column;
  height: 440px;
  padding: 20px 12px 12px;
}
.memory-index__heading {
  flex-shrink: 0;
  padding: 0 10px;
  h2 {
    font-size: 21px;
    margin: 0;
    line-height: 1.4;
  }
}
.memory-index__count {
  display: flex;
  align-items: center;
  gap: 9px;
  margin: 8px 0;
  color: var(--color-text-secondary);
  font-size: var(--font-size-xs);
}
.memory-index__list {
  display: grid;
  align-content: start;
  flex: 1;
  min-height: 0;
  gap: 6px;
  overflow-y: auto;
  overflow-x: hidden;
  overscroll-behavior-y: contain;
  scrollbar-gutter: stable;
  scrollbar-width: thin;
  scrollbar-color: color-mix(in srgb, var(--color-accent-readable) 45%, transparent)
    var(--color-surface-muted);
  padding: 3px;
}
.memory-trip {
  position: relative;
  display: flex;
  align-items: center;
  gap: 10px;
  min-width: 0;
  width: 100%;
  padding: 6px 8px;
  border: 1px solid transparent;
  border-radius: 13px;
  background: transparent;
  color: var(--color-text-primary);
  font: inherit;
  text-align: left;
  cursor: pointer;
  transition: background-color var(--motion-duration-fast);
  &:hover {
    background: var(--color-surface-muted);
  }
  &.is-active {
    background: var(--color-accent-soft);
    border-color: color-mix(in srgb, var(--color-accent) 20%, transparent);
  }
  &.is-active strong {
    color: var(--color-accent-readable);
  }
  > img,
  &__placeholder {
    width: 48px;
    height: 58px;
    border-radius: 10px;
    object-fit: cover;
    flex-shrink: 0;
  }
  &__placeholder {
    display: grid;
    place-items: center;
    color: var(--color-text-secondary);
    background: var(--color-surface-muted);
  }
}
.memory-trip__copy {
  display: grid;
  gap: 3px;
  min-width: 0;
  strong {
    font-size: var(--font-size-base);
    line-height: 1.5;
    overflow-wrap: anywhere;
  }
  > span {
    font-size: var(--font-size-xs);
    color: var(--color-text-secondary);
    line-height: 1.4;
  }
  small {
    font-size: var(--font-size-xs);
    color: var(--color-text-secondary);
    line-height: 1.4;
  }
}
.memory-trip__dot {
  position: absolute;
  width: 5px;
  height: 5px;
  border-radius: 50%;
  background: var(--color-accent-readable);
  top: 9px;
  right: 9px;
}
.memory-rail__state {
  padding: 20px 10px;
  color: var(--color-text-secondary);
  font-size: var(--font-size-sm);
}
.memory-locator {
  --travel-compact-map-height: 240px;
  padding: 16px 16px 0;
  overflow: hidden;
}
.memory-section-heading {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 12px;
  h3 {
    display: flex;
    align-items: center;
    gap: 6px;
    font-size: var(--font-size-base);
    line-height: 1.5;
    margin: 0;
  }
}
.memory-link {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 6px;
  min-height: 36px;
  padding: 4px 0;
  border: 0;
  background: none;
  color: var(--color-accent-readable);
  font: inherit;
  font-size: var(--font-size-xs);
  cursor: pointer;
  white-space: nowrap;
  &:hover {
    text-decoration: underline;
    text-underline-offset: 4px;
  }
}
.memory-locator__map {
  margin-top: 8px;
}
.memory-locator__caption {
  display: flex;
  align-items: center;
  justify-content: space-between;
  flex-wrap: wrap;
  gap: 8px;
  padding: 8px 0 10px;
  margin: 0;
  font-size: var(--font-size-xs);
  span {
    color: var(--color-text-secondary);
  }
}
.travel-journal {
  display: flex;
  flex-direction: column;
  scroll-margin-top: 96px;
  padding: 28px 28px 0;
  min-width: 0;
  overflow: hidden;
}
.travel-journal__head {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  gap: 16px;
}
.travel-journal__stop {
  flex: 1;
}
.travel-journal__copy {
  min-width: 0;
  h2 {
    margin: 0;
    font-size: clamp(24px, 2vw, 28px);
    line-height: 1.4;
    letter-spacing: -0.6px;
    overflow-wrap: anywhere;
  }
}
.travel-journal__facts {
  display: flex;
  flex-wrap: wrap;
  gap: 6px 18px;
  margin-top: 8px;
  color: var(--color-text-secondary);
  font-size: var(--font-size-sm);
  > span {
    display: inline-flex;
    align-items: center;
    gap: 6px;
  }
}
.memory-menu-button {
  display: grid;
  place-items: center;
  width: 40px;
  height: 40px;
  border: 0;
  border-radius: 10px;
  background: var(--color-surface-muted);
  color: var(--color-text-secondary);
  cursor: pointer;
  font-size: 20px;
}
.travel-journal__tabs {
  display: flex;
  gap: 20px;
  margin-top: 20px;
  overflow-x: auto;
  border-bottom: 1px solid var(--color-border-light);
  scrollbar-width: thin;
}
.stop-tab {
  display: flex;
  align-items: center;
  gap: 8px;
  flex-shrink: 0;
  min-height: 44px;
  padding: 8px 2px 12px;
  border: 0;
  border-bottom: 2px solid transparent;
  background: none;
  color: var(--color-text-secondary);
  font: inherit;
  font-size: var(--font-size-sm);
  font-weight: 600;
  cursor: pointer;
  &.is-active {
    color: var(--color-accent-readable);
    border-bottom-color: var(--color-accent);
  }
  &:hover {
    color: var(--color-accent-readable);
  }
}
.stop-tab__index {
  font-size: var(--font-size-xs);
  font-weight: 400;
}
.stop-tab__count {
  min-width: 22px;
  padding: 0 5px;
  border-radius: 5px;
  background: var(--color-surface-muted);
  font-size: var(--font-size-xs);
  text-align: center;
  font-weight: 400;
}
.stop-tab.is-active .stop-tab__count {
  background: var(--color-accent-soft);
}
.travel-journal__stop-meta {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 12px;
  padding: 16px 0 12px;
}
.travel-journal__photo-count {
  display: flex;
  align-items: center;
  gap: 5px;
  color: var(--color-text-secondary);
  font-size: var(--font-size-xs);
  white-space: nowrap;
  margin-left: auto;
  padding-top: 3px;
}
.travel-journal__story {
  min-width: 0;
  margin: 0;
  font-size: var(--font-size-base);
  line-height: 1.8;
  color: var(--color-text-secondary);
  white-space: pre-wrap;
  overflow-wrap: anywhere;
}
.travel-journal__quote {
  display: flex;
  gap: 10px;
  margin: 12px 0 0;
  padding: 10px 14px;
  border-left: 2px solid var(--color-accent);
  border-radius: 0 10px 10px 0;
  background: var(--color-surface-muted);
  > span {
    font-family: Georgia, serif;
    font-size: 28px;
    line-height: 1;
    color: var(--color-accent-readable);
  }
  p {
    margin: 0;
    white-space: pre-wrap;
    overflow-wrap: anywhere;
    color: var(--color-text-secondary);
    font-size: var(--font-size-base);
    line-height: 1.9;
  }
}
.travel-journal__footer {
  display: flex;
  justify-content: space-between;
  align-items: center;
  flex-wrap: wrap;
  gap: 10px;
  margin-top: 12px;
  padding: 8px 0;
  border-top: 1px solid var(--color-border-light);
  color: var(--color-text-secondary);
  font-size: var(--font-size-xs);
}
.travel-journal__error {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
  margin: 24px 0;
  padding: 20px;
  border-radius: 12px;
  background: var(--color-surface-muted);
  font-size: var(--font-size-sm);
  p {
    margin: 8px 0 0;
    color: var(--color-text-secondary);
  }
}
.travel-journal__pending {
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 10px;
  min-height: 380px;
  color: var(--color-text-secondary);
}
.memory-state {
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 18px;
  min-height: 620px;
  padding: 36px 24px;
  text-align: center;
  h2 {
    margin: 0;
    font-size: 24px;
    line-height: 1.5;
  }
  p {
    max-width: 420px;
    margin: 0;
    line-height: 1.8;
    color: var(--color-text-secondary);
    font-size: var(--font-size-base);
  }
  > .ui-icon {
    font-size: 30px;
    color: var(--color-accent-readable);
  }
}
.memory-state__flower {
  font-size: 48px;
  color: var(--color-accent);
}
.memory-expanded-layout {
  display: grid;
  grid-template-columns: minmax(0, 1fr) 280px;
  gap: 24px;
}
.memory-expanded-index {
  display: flex;
  flex-direction: column;
  min-width: 0;
  padding-top: 14px;
  h3 {
    margin: 0;
    font-size: 20px;
  }
}
.memory-expanded-index__hint {
  margin: 12px 0 20px;
  font-size: var(--font-size-sm);
  line-height: 1.8;
  color: var(--color-text-secondary);
}
.memory-expanded-index__list {
  display: grid;
  align-content: start;
  gap: 8px;
  max-height: 330px;
  overflow-y: auto;
  margin-bottom: 20px;
  padding: 3px;
}
.memory-map-page button:focus-visible,
.memory-expanded-layout button:focus-visible,
.travel-journal__stop:focus-visible {
  outline: 2px solid var(--color-accent-readable);
  outline-offset: 2px;
}
.stop-tab:focus-visible {
  outline-offset: -3px !important;
}
@media (max-width: 1100px) {
  .memory-map-page {
    padding-inline: 0;
  }
  .memory-layout {
    grid-template-columns: 248px minmax(0, 1fr);
    gap: 18px;
  }
  .memory-index {
    padding-inline: 10px;
  }
  .memory-trip {
    gap: 9px;
    padding-inline: 8px;
    > img,
    &__placeholder {
      width: 46px;
      height: 58px;
    }
  }
  .travel-journal {
    padding: 22px 20px 0;
  }
  .travel-journal__tabs {
    gap: 18px;
  }
  .memory-expanded-layout {
    grid-template-columns: minmax(0, 1fr) 250px;
    gap: 16px;
  }
}
@media (max-width: 760px) {
  .memory-map-page {
    width: 100%;
    padding-bottom: 32px;
  }
  .memory-topline {
    padding-bottom: 16px;
    min-height: 38px;
  }
  .memory-layout {
    grid-template-columns: minmax(0, 1fr);
    gap: 18px;
  }
  .memory-rail {
    grid-template-rows: auto auto;
    gap: 12px;
  }
  .memory-index {
    height: auto;
    padding: 18px 12px 12px;
    border-radius: 18px;
  }
  .memory-index__heading {
    padding: 0 5px;
    h2 {
      font-size: 20px;
    }
  }
  .memory-index__count {
    margin: 9px 0 12px;
  }
  .memory-index__list {
    display: flex;
    gap: 8px;
    flex: none;
    overflow-x: auto;
    overflow-y: hidden;
    overscroll-behavior-x: contain;
    overscroll-behavior-y: auto;
    scrollbar-gutter: auto;
    scroll-snap-type: x proximity;
  }
  .memory-index__list .memory-trip {
    width: 245px;
    flex-shrink: 0;
    padding: 11px;
    scroll-snap-align: start;
  }
  .memory-locator {
    padding: 12px 16px;
    border-radius: 16px;
  }
  .memory-locator__map,
  .memory-locator__caption {
    display: none;
  }
  .memory-link {
    min-height: 44px;
  }
  .travel-journal {
    display: block;
    padding: 24px 18px 0;
    border-radius: 18px;
  }
  .travel-journal__facts {
    display: grid;
    gap: 10px;
  }
  .travel-journal__tabs {
    margin-top: 22px;
    gap: 20px;
  }
  .travel-journal__quote {
    padding: 14px;
    gap: 5px;
  }
  .travel-journal__footer {
    gap: 5px;
    padding-block: 10px;
  }
  .travel-journal__error {
    flex-direction: column;
    align-items: flex-start;
  }
  .memory-menu-button {
    width: 44px;
    height: 44px;
  }
  .memory-state {
    min-height: 400px;
    padding: 30px 10px;
  }
  .memory-expanded-layout {
    grid-template-columns: minmax(0, 1fr);
    gap: 0;
  }
  .memory-expanded-index {
    padding-top: 18px;
  }
  .memory-expanded-index__list {
    max-height: 220px;
  }
  .memory-expanded-index__hint {
    margin-block: 8px 14px;
  }
}
@media (prefers-reduced-motion: reduce) {
  .memory-trip {
    transition: none;
  }
}
</style>

<style scoped lang="scss">
@media (max-width: 767px) {
  .memory-map-page { width: 100%; padding: 12px 0 0; }
  .memory-layout { display: block; min-height: 0; }
  .memory-rail { gap: 20px; }
  .memory-index { height: auto; min-height: 0; padding: 0; background: none; box-shadow: none; border: 0; }
  .memory-index__heading { padding: 0 0 16px; }
  .memory-index__heading h2, .memory-eyebrow { display: none; }
  .memory-index__count { margin: 0; font-size: 13px; }
  .memory-index__list { display: grid; grid-template-columns: minmax(0, 1fr); height: auto; max-height: none; padding: 0; gap: 12px; overflow: visible; }
  .memory-index__list .memory-trip { width: 100%; padding: 16px; }
  .memory-trip { border: 0; border-radius: var(--mobile-card-radius); padding: 16px; gap: 14px; min-height: 112px; background: var(--color-surface); }
  .memory-trip.is-active { background: var(--color-surface); }
  .memory-trip img, .memory-trip__placeholder { width: 80px; height: 80px; border-radius: 12px; }
  .memory-trip__copy strong { color: var(--color-text-primary); font-size: 17px; line-height: 1.5; }
  .memory-trip__copy > span, .memory-trip__copy small { font-size: 12px; line-height: 1.7; }
  .memory-trip__dot { display: none; }
  .memory-locator { padding: 16px; border-radius: var(--mobile-card-radius); min-height: 0; background: var(--color-surface); }
  .memory-locator__map { display: block; height: 220px; min-height: 220px; }
  .memory-locator__caption { display: flex; }
  .travel-journal { min-height: 0; padding: 0; border: 0; box-shadow: none; background: transparent; }
  .travel-journal__head { gap: 12px; margin-bottom: 20px; }
  .travel-journal__head h2 { font-size: 24px; line-height: 1.45; }
  .travel-journal__facts { margin-top: 12px; gap: 8px; font-size: 13px; }
  .travel-journal__tabs { margin-bottom: 16px; gap: 16px; }
  .stop-tab { min-height: 48px; padding: 12px 0; font-size: 14px; }
  .stop-tab__index { display: none; }
  .travel-journal__story { font-size: 15px; }
  .travel-journal__footer { flex-wrap: wrap; gap: 12px; padding-top: 20px; }
  .memory-link { min-height: 44px; display: inline-flex; align-items: center; }
  .memory-expanded-layout { display: flex; flex-direction: column; }
  .memory-expanded-layout > :first-child { min-height: 48dvh; }
  .memory-expanded-index { padding: 12px 0 0; }
  .memory-expanded-index__list { max-height: 180px; }
}
</style>

<style lang="scss">
.memory-map-dialog .travel-map-stage {
  padding: 0;
}
.memory-map-dialog .travel-map-haze,
.memory-map-dialog .travel-map-petals,
.memory-map-dialog .travel-map-legend {
  display: none;
}
.memory-map-dialog .ui-dialog__close:focus-visible {
  outline: 2px solid var(--color-accent-readable);
  outline-offset: 2px;
}
@media (max-width: 760px) {
  .memory-map-dialog .travel-map-shell,
  .memory-map-dialog .travel-map-stage,
  .memory-map-dialog .travel-map-canvas,
  .memory-map-dialog .travel-map-viewport {
    min-height: 320px;
    height: 320px;
  }
}
</style>
