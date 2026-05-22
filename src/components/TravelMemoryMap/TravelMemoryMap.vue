<template>
  <div
    class="travel-map-shell"
    :class="{ 'is-picker-mode': pickerMode }"
    :data-city-map-status="cityMapStatus"
    :data-city-boundary-count="cityBoundaryCount || undefined"
  >
    <div
      v-if="pickerMode"
      ref="containerRef"
      class="travel-map-canvas"
    />

    <div v-else class="travel-map-stage">
      <div class="travel-map-haze travel-map-haze--left" />
      <div class="travel-map-haze travel-map-haze--right" />
      <div class="travel-map-controls">
        <button type="button" class="travel-map-control" title="放大地图" @click="zoomIn">
          <el-icon><Plus /></el-icon>
        </button>
        <button type="button" class="travel-map-control" title="缩小地图" @click="zoomOut">
          <el-icon><Minus /></el-icon>
        </button>
        <button type="button" class="travel-map-control travel-map-control--reset" title="恢复初始比例" @click="resetZoom">
          <el-icon><Refresh /></el-icon>
        </button>
      </div>

      <div
        ref="viewportRef"
        class="travel-map-viewport"
        :class="{ 'is-dragging': isDragging }"
        @wheel.prevent="handleWheelZoom"
        @pointerdown="handlePointerDown"
        @pointermove="handlePointerMove"
        @pointerup="handlePointerUp"
        @pointercancel="handlePointerUp"
        @pointerleave="handlePointerUp"
      >
        <div ref="boardRef" class="travel-map-board" :style="mapBoardStyle">
          <svg class="travel-map-illustration" :viewBox="mapViewBox" aria-label="旅行纪念地图">
            <defs>
              <filter id="paperShadow" x="-20%" y="-20%" width="140%" height="140%">
                <feDropShadow dx="0" dy="20" stdDeviation="20" flood-color="rgba(176, 149, 160, 0.24)" />
              </filter>
              <filter id="markerGlow" x="-120%" y="-120%" width="340%" height="340%">
                <feGaussianBlur stdDeviation="10" result="blur" />
                <feMerge>
                  <feMergeNode in="blur" />
                  <feMergeNode in="SourceGraphic" />
                </feMerge>
              </filter>
              <linearGradient id="paperFill" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stop-color="#fffdfb" />
                <stop offset="55%" stop-color="#fef4ef" />
                <stop offset="100%" stop-color="#fff9f6" />
              </linearGradient>
              <linearGradient id="routeLine" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stop-color="rgba(243, 166, 188, 0.72)" />
                <stop offset="100%" stop-color="rgba(233, 145, 174, 0.48)" />
              </linearGradient>
              <filter id="provinceShadow" x="-6%" y="-6%" width="112%" height="112%">
                <feDropShadow dx="0" dy="10" stdDeviation="7" flood-color="rgba(214, 185, 195, 0.16)" />
              </filter>
            </defs>

            <g class="travel-map-provinces" filter="url(#provinceShadow)">
              <path
                v-for="province in provincePaths"
                :key="province.id"
                :d="province.path"
                class="travel-map-province"
                :class="province.tone"
                fill="url(#paperFill)"
              />
            </g>
            <g class="travel-map-city-boundaries">
              <path
                v-for="cityBoundary in cityBoundaryPaths"
                :key="cityBoundary.id"
                :d="cityBoundary.path"
                class="travel-map-city-boundary"
                :class="getBoundaryStateClass(cityBoundary.id)"
                @click.stop="handleBoundaryClick(cityBoundary.id)"
              />
            </g>
            <path
              v-if="routePath"
              :d="routePath"
              class="travel-map-route"
            />

            <g
              v-for="city in decorativeCities"
              :key="city.name"
              class="travel-map-city"
              :transform="`translate(${city.x}, ${city.y})`"
            >
              <circle class="travel-map-city__dot" cx="0" cy="0" r="6" />
              <path
                class="travel-map-city__petal"
                d="M0 -5 C3 -8 6 -7 6 -3 C6 0 3 1 0 4 C-3 1 -6 0 -6 -3 C-6 -7 -3 -8 0 -5 Z"
              />
              <text
                class="travel-map-city__label"
                :x="city.labelDx"
                :y="city.labelDy"
              >
                {{ city.name }}
              </text>
            </g>

            <g
              v-for="point in displayPoints"
              :key="point.id"
              class="travel-map-marker"
              :class="{ 'is-active': point.id === activeId }"
              :transform="`translate(${point.x}, ${point.y})`"
              @click.stop="handleMarkerClick(point.id)"
            >
              <circle
                v-if="point.id === activeId"
                class="travel-map-marker__ripple"
                cx="0"
                cy="0"
                r="30"
                filter="url(#markerGlow)"
              />
              <path
                class="travel-map-marker__pin"
                :d="point.id === activeId ? ACTIVE_PIN_PATH : PIN_PATH"
              />
              <circle class="travel-map-marker__core" :cy="point.id === activeId ? -7 : -6" :r="point.id === activeId ? 5.4 : 4.2" />
              <text
                class="travel-map-marker__label"
                :class="{ 'travel-map-marker__label--left': getMarkerLabelOffset(point).align === 'left' }"
                :x="getMarkerLabelOffset(point).x"
                :y="getMarkerLabelOffset(point).y"
              >
                {{ point.city || point.province || point.title }}
              </text>
            </g>
          </svg>
        </div>
      </div>

      <div class="travel-map-legend">
        <span class="travel-map-legend__flower"></span>
        <span>滚轮缩放，按住左键拖动地图</span>
      </div>
      <div v-if="cityMapFallbackText" class="travel-map-data-note">{{ cityMapFallbackText }}</div>

      <div class="travel-map-petals">
        <span class="petal petal--one" />
        <span class="petal petal--two" />
        <span class="petal petal--three" />
      </div>

    </div>

    <div v-if="loading" class="travel-map-state travel-map-state--loading">地图加载中...</div>
    <div v-else-if="errorText" class="travel-map-state">
      <p>{{ errorText }}</p>
      <span v-if="!locations.length">先保存地点后，这里就会出现纪念坐标。</span>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, nextTick, onBeforeUnmount, onMounted, ref, shallowRef, watch } from 'vue'
import { Minus, Plus, Refresh } from '@element-plus/icons-vue'
import { geoContains, geoMercator, geoPath } from 'd3-geo'
import chinaMapData from '@svg-maps/china'
import type { TravelMemoryLocationListItem } from '@/types'
import { getAmapUnavailableReason, loadAmap } from '@/utils/amap'
import { getCityNameCandidates, hasCityNameIntersection } from '@/utils/cityName'
import { gcj02ToWgs84, isValidCoordinate, wgs84ToGcj02 } from '@/utils/coordinate'
import {
  loadChinaCityMap,
  type ChinaCityMapFeature,
  type ChinaCityMapGeoJson,
  type ChinaProvinceMapGeoJson,
} from '@/utils/mapData'

interface Props {
  locations?: TravelMemoryLocationListItem[]
  activeId?: number | null
  pickerMode?: boolean
  pickerLatitude?: number | null
  pickerLongitude?: number | null
}

type ProjectedPoint = TravelMemoryLocationListItem & {
  x: number
  y: number
}

type DecorativeCity = {
  name: string
  longitude: number
  latitude: number
  labelDx: number
  labelDy: number
  x: number
  y: number
}

type SvgProvince = {
  id: string
  path: string
  tone: string
  name?: string
}

type SvgProvinceSource = {
  id: string
  path: string
}

const MAP_BOUNDS = {
  minLng: 73,
  maxLng: 135,
  minLat: 18,
  maxLat: 54,
}
const SVG_VIEWBOX = {
  width: 774,
  height: 569,
}
const BASE_SCALE = 1.02
const MIN_SCALE = 0.9
const MAX_SCALE = 2.8
const ZOOM_STEP = 0.14
const DRAG_THRESHOLD = 4
const DRAG_SUPPRESS_DURATION = 180
const CITY_MAP_PADDING = 38
const PIN_PATH = 'M0 -18 C9 -18 16 -11 16 -2 C16 7 8 16 0 27 C-8 16 -16 7 -16 -2 C-16 -11 -9 -18 0 -18 Z'
const ACTIVE_PIN_PATH = 'M0 -22 C11 -22 19 -14 19 -3 C19 9 10 19 0 33 C-10 19 -19 9 -19 -3 C-19 -14 -11 -22 0 -22 Z'

const props = withDefaults(defineProps<Props>(), {
  locations: () => [],
  activeId: null,
  pickerMode: false,
  pickerLatitude: null,
  pickerLongitude: null,
})

const emit = defineEmits<{
  (e: 'select', id: number): void
  (e: 'pick', payload: { latitude: number; longitude: number }): void
}>()

const viewportRef = ref<HTMLDivElement | null>(null)
const boardRef = ref<HTMLDivElement | null>(null)
const containerRef = ref<HTMLDivElement | null>(null)
const loading = ref(true)
const errorText = ref('')
const cityMapData = shallowRef<ChinaCityMapGeoJson | null>(null)
const provinceMapData = shallowRef<ChinaProvinceMapGeoJson | null>(null)
const cityMapStatus = ref<'idle' | 'loading' | 'ready' | 'fallback'>(props.pickerMode ? 'idle' : 'loading')
const cityMapFallbackText = ref('')
const displayScale = ref(BASE_SCALE)
const mapPan = ref({ x: 0, y: 0 })
const isDragging = ref(false)

let map: any = null
let AMapRef: any = null
let markers: any[] = []
let pickerMarker: any = null
let clickHandler: ((event: any) => void) | null = null
let dragStart:
  | {
      pointerId: number
      x: number
      y: number
      panX: number
      panY: number
      moved: boolean
    }
  | null = null
let lastDragEndedAt = 0

const cityProjection = computed(() => {
  const projectionSource = provinceMapData.value?.features.length
    ? provinceMapData.value
    : cityMapData.value
  if (!projectionSource?.features.length) return null

  return geoMercator().fitExtent(
    [
      [CITY_MAP_PADDING, CITY_MAP_PADDING],
      [SVG_VIEWBOX.width - CITY_MAP_PADDING, SVG_VIEWBOX.height - CITY_MAP_PADDING],
    ],
    projectionSource as any,
  )
})
const cityPathGenerator = computed(() => {
  if (!cityProjection.value) return null
  return geoPath(cityProjection.value)
})
const provincePaths = computed<SvgProvince[]>(() => {
  const pathGenerator = cityPathGenerator.value
  const provinceFeatures = provinceMapData.value?.features
  if (pathGenerator && provinceFeatures?.length) {
    return provinceFeatures
      .map((feature, index) => ({
        id: feature.id,
        path: pathGenerator(feature as any) ?? '',
        tone: index % 5 === 0 ? 'tone-soft' : index % 3 === 0 ? 'tone-blush' : 'tone-base',
        name: feature.properties.name,
      }))
      .filter((shape) => shape.path)
  }

  return ((chinaMapData.locations || []) as SvgProvinceSource[]).map((province, index) => ({
    id: province.id,
    path: province.path,
    tone: index % 5 === 0 ? 'tone-soft' : index % 3 === 0 ? 'tone-blush' : 'tone-base',
  }))
})
const cityBoundaryPaths = computed<SvgProvince[]>(() => {
  const pathGenerator = cityPathGenerator.value
  const cityFeatures = cityMapData.value?.features
  if (!pathGenerator || !cityFeatures?.length) return []

  return cityFeatures
    .map((feature, index) => ({
      id: feature.id,
      path: pathGenerator(feature as any) ?? '',
      tone: index % 7 === 0 ? 'tone-soft' : index % 4 === 0 ? 'tone-blush' : 'tone-base',
      name: feature.properties.name,
    }))
    .filter((shape) => shape.path)
})
const mapViewBox = `0 0 ${SVG_VIEWBOX.width} ${SVG_VIEWBOX.height}`
const cityBoundaryCount = computed(() => cityMapData.value?.features.length ?? 0)
const locationBoundaryMap = computed(() => {
  const features = cityMapData.value?.features ?? []
  if (!features.length) return new Map<number, string>()

  const result = new Map<number, string>()
  props.locations.forEach((location) => {
    const matchedFeature = findBoundaryFeature(location, features)
    if (matchedFeature) {
      result.set(location.id, matchedFeature.id)
    }
  })
  return result
})
const visitedBoundaryIds = computed(() => new Set(locationBoundaryMap.value.values()))
const activeBoundaryId = computed(() =>
  props.activeId != null ? locationBoundaryMap.value.get(props.activeId) ?? null : null,
)
const mapBoardStyle = computed(() => ({
  transform: `translate3d(${mapPan.value.x}px, ${mapPan.value.y}px, 0) scale(${displayScale.value})`,
}))

const displayPoints = computed<ProjectedPoint[]>(() =>
  props.locations
    .filter((item) => isValidCoordinate(item.latitude, item.longitude))
    .map((item) => {
      const { x, y } = projectPoint(Number(item.longitude), Number(item.latitude))
      return {
        ...item,
        x,
        y,
      }
    }),
)

const decorativeCities = computed<DecorativeCity[]>(() =>
  [
    { name: '北京', longitude: 116.4074, latitude: 39.9042, labelDx: 12, labelDy: 2 },
    { name: '西安', longitude: 108.9398, latitude: 34.3416, labelDx: 12, labelDy: 4 },
    { name: '成都', longitude: 104.0665, latitude: 30.5728, labelDx: -12, labelDy: 4 },
    { name: '厦门', longitude: 118.0894, latitude: 24.4798, labelDx: 12, labelDy: 5 },
    { name: '三亚', longitude: 109.5121, latitude: 18.2528, labelDx: -10, labelDy: 18 },
    { name: '喀什', longitude: 75.9898, latitude: 39.4677, labelDx: 12, labelDy: 6 },
  ].map((city) => ({
    ...city,
    ...projectPoint(city.longitude, city.latitude),
  })),
)
const routePath = computed(() =>
  displayPoints.value.length >= 2
    ? buildSmoothRoute(displayPoints.value)
    : buildSmoothRoute(
        decorativeCities.value.filter((city) => ['喀什', '成都', '西安', '北京', '厦门', '三亚'].includes(city.name)),
      ),
)
function projectPoint(longitude: number, latitude: number) {
  const projectedPoint = cityProjection.value?.([longitude, latitude])
  if (projectedPoint) {
    return {
      x: projectedPoint[0],
      y: projectedPoint[1],
    }
  }

  const normalizedX = (longitude - MAP_BOUNDS.minLng) / (MAP_BOUNDS.maxLng - MAP_BOUNDS.minLng)
  const normalizedY = (MAP_BOUNDS.maxLat - latitude) / (MAP_BOUNDS.maxLat - MAP_BOUNDS.minLat)

  let x = 74 + normalizedX * 596
  let y = 68 + normalizedY * 394

  if (longitude < 92) {
    x -= 14
    y += 8
  }
  if (longitude > 118) {
    x += 10
    y += 6
  }
  if (latitude < 25) {
    y += 14
  }
  if (longitude > 106 && latitude > 38) {
    y -= 8
  }

  return {
    x,
    y,
  }
}

function buildSmoothRoute(points: Array<{ x: number; y: number; visitedAt?: string; id?: number }>) {
  if (points.length < 2) return ''
  const sorted = [...points].sort((left, right) => {
    if (left.visitedAt && right.visitedAt) {
      return new Date(left.visitedAt).getTime() - new Date(right.visitedAt).getTime()
    }
    if (left.visitedAt) return -1
    if (right.visitedAt) return 1
    return (left.id ?? 0) - (right.id ?? 0)
  })

  let path = `M ${sorted[0].x} ${sorted[0].y}`
  for (let index = 1; index < sorted.length; index += 1) {
    const previous = sorted[index - 1]
    const current = sorted[index]
    const midX = (previous.x + current.x) / 2
    path += ` C ${midX} ${previous.y}, ${midX} ${current.y}, ${current.x} ${current.y}`
  }
  return path
}

function getMarkerLabelOffset(point: ProjectedPoint) {
  const active = point.id === props.activeId
  if (point.x > 560) {
    return {
      x: active ? -18 : -14,
      y: active ? 5 : 4,
      align: 'left' as const,
    }
  }
  if (point.y > 410) {
    return {
      x: active ? 0 : 0,
      y: active ? 28 : 24,
      align: 'center' as const,
    }
  }
  return {
    x: active ? 18 : 14,
    y: active ? 5 : 4,
    align: 'right' as const,
  }
}

function getBoundaryStateClass(id: string) {
  return {
    'is-visited': visitedBoundaryIds.value.has(id),
    'is-active': activeBoundaryId.value === id,
    'is-clickable': visitedBoundaryIds.value.has(id),
  }
}

function findBoundaryFeature(
  location: TravelMemoryLocationListItem,
  features: ChinaCityMapFeature[],
) {
  if (isValidCoordinate(location.latitude, location.longitude)) {
    const coordinate: [number, number] = [Number(location.longitude), Number(location.latitude)]
    const matchedFeature = features.find((feature) => geoContains(feature as any, coordinate))
    if (matchedFeature) {
      return matchedFeature
    }
  }

  return findBoundaryFeatureByName(location, features)
}

function findBoundaryFeatureByName(
  location: TravelMemoryLocationListItem,
  features: ChinaCityMapFeature[],
) {
  const cityCandidates = getCityNameCandidates(location.city)
  if (cityCandidates.size) {
    return features.find((feature) =>
      hasCityNameIntersection(
        cityCandidates,
        getCityNameCandidates(feature.properties.name, feature.properties.provinceName),
      ),
    )
  }

  const titleCandidates = getCityNameCandidates(location.title)
  if (!titleCandidates.size) return undefined

  return features.find((feature) =>
    hasCityNameIntersection(titleCandidates, getCityNameCandidates(feature.properties.name)),
  )
}

function handleBoundaryClick(id: string) {
  if (Date.now() - lastDragEndedAt < DRAG_SUPPRESS_DURATION) {
    return
  }

  const target = props.locations.find((location) => locationBoundaryMap.value.get(location.id) === id)
  if (target) {
    emit('select', target.id)
  }
}

function zoomIn() {
  updateScale(displayScale.value + ZOOM_STEP)
}

function zoomOut() {
  updateScale(displayScale.value - ZOOM_STEP)
}

function resetZoom() {
  displayScale.value = BASE_SCALE
  mapPan.value = { x: 0, y: 0 }
}

function updateScale(value: number) {
  displayScale.value = clampScale(value)
  if (displayScale.value <= BASE_SCALE) {
    mapPan.value = { x: 0, y: 0 }
    return
  }
  mapPan.value = clampPan(mapPan.value)
}

function clampScale(value: number) {
  return Math.min(MAX_SCALE, Math.max(MIN_SCALE, Number(value.toFixed(2))))
}

function clampPan(pan = mapPan.value) {
  if (displayScale.value <= BASE_SCALE) {
    return { x: 0, y: 0 }
  }

  const viewport = viewportRef.value
  const board = boardRef.value
  if (!viewport || !board) {
    return pan
  }

  const boardWidth = board.offsetWidth
  const boardHeight = board.offsetHeight || (boardWidth * SVG_VIEWBOX.height) / SVG_VIEWBOX.width
  const extraX = Math.max(0, (boardWidth * displayScale.value - viewport.clientWidth) / 2)
  const extraY = Math.max(0, (boardHeight * displayScale.value - viewport.clientHeight) / 2)
  const cushion = 36

  return {
    x: Math.min(extraX + cushion, Math.max(-extraX - cushion, pan.x)),
    y: Math.min(extraY + cushion, Math.max(-extraY - cushion, pan.y)),
  }
}

function handleWheelZoom(event: WheelEvent) {
  const nextScale = displayScale.value + (event.deltaY < 0 ? ZOOM_STEP : -ZOOM_STEP)
  updateScale(nextScale)
}

function handlePointerDown(event: PointerEvent) {
  if (event.button !== 0) return
  const target = event.target as HTMLElement | SVGElement | null
  if (target?.closest?.('.travel-map-controls, .travel-map-legend')) return

  dragStart = {
    pointerId: event.pointerId,
    x: event.clientX,
    y: event.clientY,
    panX: mapPan.value.x,
    panY: mapPan.value.y,
    moved: false,
  }
  ;(event.currentTarget as HTMLElement).setPointerCapture?.(event.pointerId)
}

function handlePointerMove(event: PointerEvent) {
  if (!dragStart || dragStart.pointerId !== event.pointerId) return
  const deltaX = event.clientX - dragStart.x
  const deltaY = event.clientY - dragStart.y

  if (!dragStart.moved && Math.hypot(deltaX, deltaY) < DRAG_THRESHOLD) {
    return
  }

  dragStart.moved = true
  isDragging.value = true
  mapPan.value = clampPan({
    x: dragStart.panX + deltaX,
    y: dragStart.panY + deltaY,
  })
}

function handlePointerUp(event: PointerEvent) {
  if (!dragStart || dragStart.pointerId !== event.pointerId) return
  ;(event.currentTarget as HTMLElement).releasePointerCapture?.(event.pointerId)
  if (dragStart.moved) {
    lastDragEndedAt = Date.now()
  }
  dragStart = null
  isDragging.value = false
}

function handleMarkerClick(id: number) {
  if (Date.now() - lastDragEndedAt < DRAG_SUPPRESS_DURATION) {
    return
  }
  emit('select', id)
}

async function initCityMapData() {
  if (props.pickerMode) return

  cityMapStatus.value = 'loading'
  cityMapFallbackText.value = ''
  try {
    const bundle = await loadChinaCityMap()
    cityMapData.value = bundle.geoJson
    provinceMapData.value = bundle.provinceGeoJson
    cityMapStatus.value = 'ready'
  } catch {
    cityMapData.value = null
    provinceMapData.value = null
    cityMapStatus.value = 'fallback'
    cityMapFallbackText.value = '地图数据暂未加载，已切换基础地图'
  }
}

async function initMap() {
  if (!props.pickerMode) {
    loading.value = false
    return
  }

  loading.value = true
  errorText.value = ''
  try {
    AMapRef = await loadAmap()
    if (!containerRef.value) return
    map = new AMapRef.Map(containerRef.value, {
      resizeEnable: true,
      zoom: 4.4,
      center: [104.0, 35.0],
      mapStyle: 'amap://styles/whitesmoke',
      viewMode: '2D',
    })

    clickHandler = (event: any) => {
      const lng = Number(event?.lnglat?.getLng?.())
      const lat = Number(event?.lnglat?.getLat?.())
      if (isValidCoordinate(lat, lng)) {
        const coordinate = gcj02ToWgs84(lat, lng)
        setPickerMarker(coordinate.latitude, coordinate.longitude)
        emit('pick', coordinate)
      }
    }
    map.on('click', clickHandler)
    refreshMarkers()
    syncPickerMarker()
  } catch {
    errorText.value = getAmapUnavailableReason() || '地图加载失败，请检查本地网络或 Key 配置。'
  } finally {
    loading.value = false
  }
}

function clearMarkers() {
  if (!map || !markers.length) return
  map.remove(markers)
  markers = []
}

function refreshMarkers() {
  if (!props.pickerMode || !map || !AMapRef) return
  clearMarkers()

  const points = props.locations.filter((item) => isValidCoordinate(item.latitude, item.longitude))
  markers = points.map((item) => {
    const coordinate = wgs84ToGcj02(Number(item.latitude), Number(item.longitude))
    const marker = new AMapRef.Marker({
      position: [coordinate.longitude, coordinate.latitude],
      title: item.title,
      offset: new AMapRef.Pixel(-12, -12),
      content: buildMarkerHtml(item.id === props.activeId),
    })
    marker.on('click', () => emit('select', item.id))
    return marker
  })

  if (markers.length) {
    map.add(markers)
    map.setFitView(markers, false, [70, 70, 70, 70], 4)
  }
}

function buildMarkerHtml(active: boolean) {
  const glow = active ? 'travel-map-pin travel-map-pin--active' : 'travel-map-pin'
  return `<div class="${glow}"><span></span></div>`
}

function setPickerMarker(latitude: number, longitude: number) {
  if (!map || !AMapRef) return
  const coordinate = wgs84ToGcj02(latitude, longitude)
  const position = [coordinate.longitude, coordinate.latitude]
  if (!pickerMarker) {
    pickerMarker = new AMapRef.Marker({
      position,
      offset: new AMapRef.Pixel(-12, -12),
      content: '<div class="travel-map-picker"><span></span></div>',
    })
    map.add(pickerMarker)
  } else {
    pickerMarker.setPosition(position)
  }
}

function syncPickerMarker() {
  if (!props.pickerMode || props.pickerLatitude == null || props.pickerLongitude == null) return
  setPickerMarker(props.pickerLatitude, props.pickerLongitude)
}

watch(
  () => [props.locations, props.activeId] as const,
  async () => {
    if (!props.pickerMode) return
    await nextTick()
    refreshMarkers()
  },
  { deep: true },
)

watch(
  () => [props.pickerLatitude, props.pickerLongitude] as const,
  () => {
    syncPickerMarker()
  },
)

function handleResize() {
  mapPan.value = clampPan(mapPan.value)
}

onMounted(() => {
  window.addEventListener('resize', handleResize)
  void initCityMapData()
  void initMap()
})

onBeforeUnmount(() => {
  window.removeEventListener('resize', handleResize)
  if (map && clickHandler) {
    map.off('click', clickHandler)
  }
  if (map) {
    map.destroy()
  }
  map = null
  markers = []
  pickerMarker = null
})
</script>

<style scoped lang="scss">
.travel-map-shell {
  position: relative;
  width: 100%;
  min-height: 472px;
  border-radius: 20px;
  overflow: hidden;
  background: linear-gradient(180deg, rgba(255, 255, 255, 0.18), rgba(255, 250, 251, 0.08));
}

.travel-map-shell.is-picker-mode {
  min-height: 392px;
  border-radius: 20px;
}

.travel-map-canvas {
  width: 100%;
  height: 100%;
  min-height: 392px;
}

.travel-map-stage {
  position: relative;
  display: flex;
  align-items: center;
  justify-content: center;
  min-height: 500px;
  padding: 8px 8px 76px;
}

.travel-map-viewport {
  position: relative;
  z-index: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  width: 100%;
  min-height: 424px;
  overflow: hidden;
  cursor: grab;
  touch-action: none;
  user-select: none;
}

.travel-map-viewport.is-dragging {
  cursor: grabbing;
}

.travel-map-viewport.is-dragging .travel-map-board {
  transition: none;
}

.travel-map-board {
  position: relative;
  width: 98%;
  margin: 0 auto;
  transform-origin: center center;
  transition: transform 0.28s ease;
}

.travel-map-illustration {
  width: 100%;
  height: 100%;
  display: block;
  pointer-events: auto;
}

.travel-map-provinces {
  opacity: 0.96;
}

.travel-map-province {
  fill-opacity: 0.98;
  stroke: rgba(226, 197, 208, 0.92);
  stroke-width: 1.35;
  transition: fill 0.24s ease, opacity 0.24s ease, stroke 0.24s ease;
}

.travel-map-province.tone-base {
  fill: rgba(252, 248, 247, 0.98);
}

.travel-map-province.tone-soft {
  fill: rgba(251, 245, 247, 0.98);
}

.travel-map-province.tone-blush {
  fill: rgba(250, 244, 245, 0.98);
}

.travel-map-city-boundaries {
  pointer-events: none;
}

.travel-map-city-boundary {
  fill: transparent;
  stroke: rgba(224, 196, 207, 0.32);
  stroke-width: 0.55;
  transition: fill 0.24s ease, opacity 0.24s ease, stroke 0.24s ease;
  pointer-events: none;
}

.travel-map-city-boundary.is-visited {
  fill: rgba(255, 232, 241, 0.98);
  stroke: rgba(235, 157, 185, 0.78);
  stroke-width: 1.25;
  pointer-events: auto;
}

.travel-map-city-boundary.is-clickable {
  cursor: pointer;
  pointer-events: auto;
}

.travel-map-city-boundary.is-clickable:hover {
  fill: rgba(255, 224, 236, 0.98);
  stroke: rgba(236, 135, 171, 0.86);
}

.travel-map-city-boundary.is-active {
  fill: rgba(255, 211, 228, 0.98);
  stroke: rgba(240, 111, 157, 0.92);
  stroke-width: 1.75;
  pointer-events: auto;
}

.travel-map-route {
  fill: none;
  stroke: url(#routeLine);
  stroke-width: 2.4;
  stroke-linecap: round;
  stroke-dasharray: 6 7;
  opacity: 0.92;
}

.travel-map-city {
  opacity: 0.42;
}

.travel-map-city__dot {
  fill: rgba(255, 237, 243, 0.9);
  stroke: rgba(225, 173, 191, 0.58);
  stroke-width: 1.2;
}

.travel-map-city__petal {
  fill: rgba(255, 247, 250, 0.66);
}

.travel-map-city__label {
  fill: rgba(119, 94, 103, 0.68);
  font-size: 11px;
  font-family:
    'Microsoft YaHei UI',
    'PingFang SC',
    'Hiragino Sans GB',
    'Noto Sans CJK SC',
    sans-serif;
  font-weight: 500;
  paint-order: stroke;
  stroke: rgba(255, 255, 255, 0.92);
  stroke-width: 4;
  stroke-linejoin: round;
}

.travel-map-marker {
  cursor: pointer;
  pointer-events: auto;
}

.travel-map-marker__ripple {
  fill: rgba(255, 167, 196, 0.2);
}

.travel-map-marker__pin {
  fill: rgba(255, 133, 175, 0.96);
  stroke: rgba(255, 255, 255, 0.96);
  stroke-width: 2.2;
  filter: drop-shadow(0 10px 18px rgba(246, 136, 173, 0.24));
}

.travel-map-marker__core {
  fill: rgba(255, 255, 255, 0.98);
}

.travel-map-marker__label {
  fill: #6b4f59;
  font-size: 12.5px;
  font-family:
    'Microsoft YaHei UI',
    'PingFang SC',
    'Hiragino Sans GB',
    'Noto Sans CJK SC',
    sans-serif;
  font-weight: 600;
  paint-order: stroke;
  stroke: rgba(255, 255, 255, 0.92);
  stroke-width: 6;
  stroke-linejoin: round;
}

.travel-map-marker__label--left {
  text-anchor: end;
}

.travel-map-marker.is-active .travel-map-marker__pin {
  fill: rgba(255, 104, 156, 0.98);
  stroke: rgba(255, 248, 251, 0.98);
  filter: drop-shadow(0 14px 24px rgba(246, 112, 158, 0.36));
}

.travel-map-controls {
  position: absolute;
  left: 12px;
  bottom: 14px;
  z-index: 3;
  display: grid;
  gap: 10px;
}

.travel-map-control {
  width: 42px;
  height: 42px;
  border-radius: 14px;
  border: 1px solid rgba(238, 221, 227, 0.94);
  background: rgba(255, 255, 255, 0.94);
  color: #765662;
  font-size: 22px;
  cursor: pointer;
  box-shadow: 0 12px 24px rgba(208, 181, 190, 0.14);
  transition: transform 0.2s ease, box-shadow 0.2s ease, border-color 0.2s ease;
}

.travel-map-control .el-icon {
  font-size: 18px;
  pointer-events: none;
}

.travel-map-control--reset {
  color: #8a6672;
}

.travel-map-control:hover {
  transform: translateY(-1px);
  border-color: rgba(233, 180, 198, 0.96);
  box-shadow: 0 14px 28px rgba(231, 177, 194, 0.18);
}

.travel-map-legend {
  position: absolute;
  right: 8px;
  bottom: 12px;
  z-index: 2;
  display: inline-flex;
  align-items: center;
  gap: 9px;
  min-height: 38px;
  padding: 0 16px;
  border-radius: 999px;
  background: rgba(255, 255, 255, 0.92);
  border: 1px solid rgba(239, 223, 229, 0.92);
  color: #8d6a77;
  font-size: 12px;
  box-shadow: 0 10px 20px rgba(217, 188, 197, 0.1);
}

.travel-map-legend__flower {
  width: 14px;
  height: 14px;
  border-radius: 999px;
  background: radial-gradient(
    circle at center,
    #fff 0%,
    #fff 20%,
    #ff8fb2 22%,
    #ff8fb2 56%,
    transparent 58%,
    transparent 100%
  );
  box-shadow: 0 0 0 4px rgba(255, 204, 220, 0.34);
}

.travel-map-data-note {
  position: absolute;
  right: 8px;
  bottom: 62px;
  z-index: 2;
  max-width: min(360px, calc(100% - 24px));
  padding: 9px 14px;
  border-radius: 999px;
  border: 1px solid rgba(239, 223, 229, 0.92);
  background: rgba(255, 255, 255, 0.94);
  color: #8d6a77;
  font-size: 12px;
  line-height: 1.4;
  box-shadow: 0 10px 20px rgba(217, 188, 197, 0.1);
}

.travel-map-haze {
  position: absolute;
  inset: 0 auto 0 0;
  width: 120px;
  pointer-events: none;
  opacity: 0.26;
  background: radial-gradient(circle at left center, rgba(255, 235, 241, 0.32), transparent 72%);
}

.travel-map-haze--right {
  inset: 0 0 0 auto;
  background: radial-gradient(circle at right center, rgba(255, 235, 241, 0.26), transparent 72%);
}

.travel-map-petals {
  position: absolute;
  inset: 0;
  pointer-events: none;
}

.petal {
  position: absolute;
  width: 16px;
  height: 24px;
  border-radius: 65% 35% 70% 30%;
  background: linear-gradient(180deg, rgba(255, 183, 207, 0.8), rgba(255, 214, 226, 0.22));
  box-shadow: 0 6px 18px rgba(227, 177, 194, 0.18);
}

.petal--one {
  right: 44px;
  bottom: 104px;
  transform: rotate(18deg);
}

.petal--two {
  left: 58px;
  bottom: 76px;
  width: 14px;
  height: 20px;
  transform: rotate(-28deg);
}

.petal--three {
  right: 104px;
  top: 58px;
  width: 12px;
  height: 18px;
  transform: rotate(32deg);
}

.travel-map-state {
  position: absolute;
  inset: 0;
  display: grid;
  place-items: center;
  gap: 10px;
  padding: 24px;
  text-align: center;
  color: var(--text-secondary);
  background: rgba(255, 252, 253, 0.9);

  p {
    font-size: 16px;
    color: var(--text-primary);
  }

  span {
    font-size: 13px;
  }
}

.travel-map-state--loading {
  color: var(--text-primary);
}

@media (max-width: 768px) {
  .travel-map-stage {
    min-height: 420px;
    padding: 10px 0 74px;
  }

  .travel-map-viewport {
    min-height: 336px;
  }

  .travel-map-board {
    width: 100%;
  }

  .travel-map-controls {
    left: 10px;
    bottom: 22px;
  }

  .travel-map-legend {
    left: 18px;
    right: 18px;
    bottom: 18px;
    justify-content: center;
    font-size: 12px;
  }

}
</style>

<style lang="scss">
.travel-map-pin,
.travel-map-picker {
  position: relative;
  width: 24px;
  height: 24px;
  border-radius: 999px;
  display: grid;
  place-items: center;
  background: rgba(255, 255, 255, 0.16);
}

.travel-map-pin span,
.travel-map-picker span {
  width: 14px;
  height: 14px;
  border-radius: 999px;
  background: linear-gradient(135deg, #fb7299, #ff9bb8);
  box-shadow:
    0 0 0 6px rgba(251, 114, 153, 0.16),
    0 12px 18px rgba(251, 114, 153, 0.22);
}

.travel-map-pin--active span {
  background: linear-gradient(135deg, #ff557f, #ff87aa);
  box-shadow:
    0 0 0 8px rgba(251, 114, 153, 0.2),
    0 16px 24px rgba(251, 114, 153, 0.28);
}

.travel-map-picker span {
  background: linear-gradient(135deg, #4b7bec, #6aa1ff);
  box-shadow:
    0 0 0 6px rgba(75, 123, 236, 0.16),
    0 12px 18px rgba(75, 123, 236, 0.22);
}
</style>
