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
              <line
                v-if="point.label.connectorVisible"
                class="travel-map-marker__connector"
                :x1="point.label.connectorStartX"
                :y1="point.label.connectorStartY"
                :x2="point.label.connectorEndX"
                :y2="point.label.connectorEndY"
              />
              <g
                class="travel-map-marker__label-bubble"
                :class="{
                  'is-active': point.id === activeId,
                  'is-left': point.label.side === 'left',
                }"
                :transform="`translate(${point.label.left}, ${point.label.top})`"
              >
                <rect
                  class="travel-map-marker__label-bg"
                  x="0"
                  y="0"
                  :width="point.label.width"
                  :height="point.label.height"
                  rx="11"
                  ry="11"
                />
                <text
                  class="travel-map-marker__label"
                  :x="point.label.textX"
                  :y="point.label.textY"
                  :text-anchor="point.label.textAnchor"
                >
                  {{ point.labelText }}
                </text>
              </g>
              <circle
                v-if="point.id === activeId"
                class="travel-map-marker__ripple"
                cx="0"
                cy="-13.5"
                r="15"
                filter="url(#markerGlow)"
              />
              <path
                class="travel-map-marker__pin"
                :d="point.id === activeId ? ACTIVE_PIN_PATH : PIN_PATH"
              />
              <circle class="travel-map-marker__core" :cy="point.id === activeId ? -16.8 : -14.8" :r="point.id === activeId ? 3.8 : 3" />
            </g>
          </svg>

          <div v-if="boundaryChoiceLocations.length" class="travel-map-choice-card">
            <div class="travel-map-choice-card__head">
              <strong>这个城市有多段旅行</strong>
              <button type="button" aria-label="关闭地点选择" @click="closeBoundaryChoice">×</button>
            </div>
            <button
              v-for="location in boundaryChoiceLocations"
              :key="location.id"
              type="button"
              class="travel-map-choice-card__item"
              @click="selectBoundaryChoice(location.id)"
            >
              <span>{{ location.title }}</span>
              <small>{{ [location.province, location.city].filter(Boolean).join(' · ') || '查看这段旅行' }}</small>
            </button>
          </div>
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
  searchKeyword?: string
  searchRequest?: number
}

type ProjectedPoint = TravelMemoryLocationListItem & {
  x: number
  y: number
}

type LabelPlacement = {
  left: number
  top: number
  width: number
  height: number
  textX: number
  textY: number
  textAnchor: 'start' | 'middle'
  side: 'left' | 'right' | 'top'
  connectorStartX: number
  connectorStartY: number
  connectorEndX: number
  connectorEndY: number
  connectorVisible: boolean
}

type MarkerDisplayPoint = ProjectedPoint & {
  label: LabelPlacement
  labelText: string
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

type LayoutRect = {
  left: number
  top: number
  right: number
  bottom: number
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
const MARKER_OVERLAP_RADIUS = 26
const MARKER_SPREAD_BASE = 7
const MARKER_SPREAD_STEP = 3
const LABEL_BOX_HEIGHT = 22
const LABEL_BOX_PADDING_X = 8
const LABEL_GAP = 10
const LABEL_SAFE_MARGIN = 10
const PIN_PATH = 'M0 0 C-5.4 -6.8 -10.4 -12.6 -10.4 -19.8 C-10.4 -26.2 -5.8 -31 0 -31 C5.8 -31 10.4 -26.2 10.4 -19.8 C10.4 -12.6 5.4 -6.8 0 0 Z'
const ACTIVE_PIN_PATH = 'M0 0 C-6.2 -7.8 -12 -14.2 -12 -22.2 C-12 -29.3 -6.7 -34.8 0 -34.8 C6.7 -34.8 12 -29.3 12 -22.2 C12 -14.2 6.2 -7.8 0 0 Z'

const props = withDefaults(defineProps<Props>(), {
  locations: () => [],
  activeId: null,
  pickerMode: false,
  pickerLatitude: null,
  pickerLongitude: null,
  searchKeyword: '',
  searchRequest: 0,
})

const emit = defineEmits<{
  (e: 'select', id: number): void
  (e: 'pick', payload: { latitude: number; longitude: number }): void
  (e: 'search-error', message: string): void
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
const boundaryChoiceId = ref<string | null>(null)

let map: any = null
let AMapRef: any = null
let markers: any[] = []
let pickerMarker: any = null
let clickHandler: ((event: any) => void) | null = null
let geocoder: any = null
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

const baseProjectedPoints = computed<ProjectedPoint[]>(() =>
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

const displayPoints = computed<MarkerDisplayPoint[]>(() =>
  layoutMarkerPoints(spreadOverlappingPoints(baseProjectedPoints.value, props.activeId), props.activeId),
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
const boundaryLocationsMap = computed(() => {
  const result = new Map<string, TravelMemoryLocationListItem[]>()
  props.locations.forEach((location) => {
    const boundaryId = locationBoundaryMap.value.get(location.id)
    if (!boundaryId) return
    const locations = result.get(boundaryId) ?? []
    locations.push(location)
    result.set(boundaryId, locations)
  })

  return result
})
const boundaryChoiceLocations = computed(() =>
  boundaryChoiceId.value
    ? (boundaryLocationsMap.value.get(boundaryChoiceId.value) ?? [])
    : [],
)
const routePath = computed(() =>
  baseProjectedPoints.value.length >= 2 ? buildSmoothRoute(baseProjectedPoints.value) : '',
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

function spreadOverlappingPoints(points: ProjectedPoint[], activeId: number | null) {
  if (points.length < 2) return points

  const groups = collectNearbyPointGroups(points)
  if (!groups.length) return points

  const adjustedPoints = points.map((point) => ({ ...point }))

  groups.forEach((group) => {
    const radius = MARKER_SPREAD_BASE + Math.max(0, group.length - 2) * MARKER_SPREAD_STEP
    const centerX = group.reduce((sum, point) => sum + point.x, 0) / group.length
    const centerY = group.reduce((sum, point) => sum + point.y, 0) / group.length

    group.forEach((point, index) => {
      const vector = getSpreadVectorForPoint(group, point, index, centerX, centerY)
      const distance = point.id === activeId ? radius + 2 : radius
      const targetIndex = adjustedPoints.findIndex((item) => item.id === point.id)
      if (targetIndex === -1) return
      adjustedPoints[targetIndex] = {
        ...adjustedPoints[targetIndex],
        x: adjustedPoints[targetIndex].x + vector.x * distance,
        y: adjustedPoints[targetIndex].y + vector.y * distance,
      }
    })
  })

  return adjustedPoints
}

function layoutMarkerPoints(points: ProjectedPoint[], activeId: number | null) {
  const markerRects = points.map((point) => ({
    id: point.id,
    rect: getMarkerRect(point, point.id === activeId),
  }))
  const placedRects: LayoutRect[] = []
  const labels = new Map<number, { text: string; placement: LabelPlacement }>()

  const orderedPoints = [...points].sort((left, right) => {
    if (left.id === activeId) return -1
    if (right.id === activeId) return 1
    const densityDiff = getPointDensity(right, points) - getPointDensity(left, points)
    if (densityDiff !== 0) return densityDiff
    if (right.y !== left.y) return right.y - left.y
    return right.x - left.x
  })

  orderedPoints.forEach((point) => {
    const labelText = getMarkerLabelText(point)
    const placement = chooseLabelPlacement(
      point,
      labelText,
      point.id === activeId,
      placedRects,
      markerRects,
    )
    labels.set(point.id, { text: labelText, placement })
    placedRects.push(toGlobalLabelRect(point, placement))
  })

  return points.map((point) => {
    const labelInfo = labels.get(point.id)
    return {
      ...point,
      label: labelInfo?.placement ?? buildFallbackLabelPlacement(getMarkerLabelText(point), point.id === activeId),
      labelText: labelInfo?.text ?? getMarkerLabelText(point),
    }
  })
}

function chooseLabelPlacement(
  point: ProjectedPoint,
  labelText: string,
  active: boolean,
  placedRects: LayoutRect[],
  markerRects: Array<{ id: number; rect: LayoutRect }>,
) {
  const fallbackPlacement = buildFallbackLabelPlacement(labelText, active)
  const labelWidth = estimateLabelWidth(labelText, active)
  const labelHeight = active ? LABEL_BOX_HEIGHT + 2 : LABEL_BOX_HEIGHT
  const candidates = getLabelCandidates(point, labelWidth, labelHeight)

  let bestPlacement = fallbackPlacement
  let bestScore = Number.POSITIVE_INFINITY

  candidates.forEach((candidate, index) => {
    const placement = buildLabelPlacement(candidate, labelWidth, labelHeight)
    const labelRect = toGlobalLabelRect(point, placement)
    let score = index * 18

    score += getViewportPenalty(labelRect)

    placedRects.forEach((rect) => {
      if (intersectsRect(labelRect, rect)) {
        score += 2400
      }
    })

    markerRects.forEach((marker) => {
      if (marker.id === point.id) return
      if (intersectsRect(labelRect, expandRect(marker.rect, 6))) {
        score += 1700
      }
    })

    if (point.x > SVG_VIEWBOX.width * 0.66 && placement.side === 'right') {
      score += 180
    }
    if (point.x < SVG_VIEWBOX.width * 0.24 && placement.side === 'left') {
      score += 180
    }
    if (point.y > SVG_VIEWBOX.height * 0.72 && placement.top > -28) {
      score += 220
    }
    if (point.y < SVG_VIEWBOX.height * 0.24 && placement.side === 'top') {
      score += 120
    }

    if (score < bestScore) {
      bestScore = score
      bestPlacement = placement
    }
  })

  return bestPlacement
}

function getLabelCandidates(point: ProjectedPoint, labelWidth: number, labelHeight: number) {
  const candidates = {
    right: { left: LABEL_GAP, top: -31, side: 'right' as const, textAnchor: 'start' as const },
    left: { left: -(labelWidth + LABEL_GAP), top: -31, side: 'left' as const, textAnchor: 'start' as const },
    top: { left: -labelWidth / 2, top: -(labelHeight + 18), side: 'top' as const, textAnchor: 'middle' as const },
    topRight: { left: 8, top: -(labelHeight + 20), side: 'right' as const, textAnchor: 'start' as const },
    topLeft: { left: -(labelWidth + 8), top: -(labelHeight + 20), side: 'left' as const, textAnchor: 'start' as const },
    bottomRight: { left: 8, top: -15, side: 'right' as const, textAnchor: 'start' as const },
    bottomLeft: { left: -(labelWidth + 8), top: -15, side: 'left' as const, textAnchor: 'start' as const },
  }

  if (point.x > SVG_VIEWBOX.width * 0.66 && point.y > SVG_VIEWBOX.height * 0.68) {
    return [candidates.topLeft, candidates.left, candidates.top, candidates.topRight, candidates.right]
  }
  if (point.x > SVG_VIEWBOX.width * 0.66) {
    return [candidates.left, candidates.topLeft, candidates.top, candidates.topRight, candidates.right, candidates.bottomLeft]
  }
  if (point.y > SVG_VIEWBOX.height * 0.72) {
    return [candidates.topRight, candidates.topLeft, candidates.right, candidates.left, candidates.top]
  }
  if (point.x < SVG_VIEWBOX.width * 0.24) {
    return [candidates.right, candidates.topRight, candidates.top, candidates.topLeft, candidates.left]
  }

  return [candidates.right, candidates.topRight, candidates.top, candidates.left, candidates.topLeft, candidates.bottomRight]
}

function buildLabelPlacement(
  candidate: { left: number; top: number; side: 'left' | 'right' | 'top'; textAnchor: 'start' | 'middle' },
  width: number,
  height: number,
): LabelPlacement {
  const connectorStartX = 0
  const connectorStartY = -16
  const localRect = {
    left: candidate.left,
    top: candidate.top,
    right: candidate.left + width,
    bottom: candidate.top + height,
  }
  const connectorEnd = getNearestPointOnRect(localRect, connectorStartX, connectorStartY)

  return {
    left: candidate.left,
    top: candidate.top,
    width,
    height,
    textX: candidate.textAnchor === 'middle' ? width / 2 : LABEL_BOX_PADDING_X,
    textY: height / 2 + 0.5,
    textAnchor: candidate.textAnchor,
    side: candidate.side,
    connectorStartX,
    connectorStartY,
    connectorEndX: connectorEnd.x,
    connectorEndY: connectorEnd.y,
    connectorVisible: Math.hypot(connectorEnd.x - connectorStartX, connectorEnd.y - connectorStartY) > 6,
  }
}

function buildFallbackLabelPlacement(labelText: string, active: boolean) {
  return buildLabelPlacement(
    {
      left: LABEL_GAP,
      top: -31,
      side: 'right',
      textAnchor: 'start',
    },
    estimateLabelWidth(labelText, active),
    active ? LABEL_BOX_HEIGHT + 2 : LABEL_BOX_HEIGHT,
  )
}

function getMarkerLabelText(point: ProjectedPoint) {
  return point.city || point.province || point.title
}

function estimateLabelWidth(text: string, active: boolean) {
  const textWidth = Array.from(text).reduce((sum, character) => {
    if (/[A-Za-z0-9]/.test(character)) return sum + 6.6
    return sum + 10.4
  }, 0)
  return Math.max(44, Math.round(textWidth + LABEL_BOX_PADDING_X * 2 + (active ? 2 : 0)))
}

function getPointDensity(point: ProjectedPoint, points: ProjectedPoint[]) {
  return points.filter((candidate) => candidate.id !== point.id && getProjectedDistance(point, candidate) < 44).length
}

function getMarkerRect(point: ProjectedPoint, active: boolean): LayoutRect {
  return {
    left: point.x - (active ? 13 : 11.5),
    top: point.y - (active ? 36 : 32),
    right: point.x + (active ? 13 : 11.5),
    bottom: point.y + 2,
  }
}

function toGlobalLabelRect(point: ProjectedPoint, placement: LabelPlacement): LayoutRect {
  return {
    left: point.x + placement.left,
    top: point.y + placement.top,
    right: point.x + placement.left + placement.width,
    bottom: point.y + placement.top + placement.height,
  }
}

function getViewportPenalty(rect: LayoutRect) {
  const overflowLeft = Math.max(0, LABEL_SAFE_MARGIN - rect.left)
  const overflowTop = Math.max(0, LABEL_SAFE_MARGIN - rect.top)
  const overflowRight = Math.max(0, rect.right - (SVG_VIEWBOX.width - LABEL_SAFE_MARGIN))
  const overflowBottom = Math.max(0, rect.bottom - (SVG_VIEWBOX.height - LABEL_SAFE_MARGIN))
  return (overflowLeft + overflowTop + overflowRight + overflowBottom) * 24
}

function expandRect(rect: LayoutRect, amount: number): LayoutRect {
  return {
    left: rect.left - amount,
    top: rect.top - amount,
    right: rect.right + amount,
    bottom: rect.bottom + amount,
  }
}

function intersectsRect(left: LayoutRect, right: LayoutRect) {
  return !(
    left.right <= right.left ||
    left.left >= right.right ||
    left.bottom <= right.top ||
    left.top >= right.bottom
  )
}

function getNearestPointOnRect(rect: LayoutRect, x: number, y: number) {
  return {
    x: clamp(x, rect.left, rect.right),
    y: clamp(y, rect.top, rect.bottom),
  }
}

function clamp(value: number, min: number, max: number) {
  return Math.min(max, Math.max(min, value))
}

function getSpreadVectorForPoint(
  group: ProjectedPoint[],
  point: ProjectedPoint,
  index: number,
  centerX: number,
  centerY: number,
) {
  if (group.length === 2) {
    return getPairSpreadVector(group, point, centerX, centerY)
  }

  const fallbackAngle = -Math.PI / 2 + (Math.PI * 2 * index) / group.length
  const deltaX = point.x - centerX
  const deltaY = point.y - centerY
  const angle =
    Math.abs(deltaX) < 0.001 && Math.abs(deltaY) < 0.001
      ? fallbackAngle
      : Math.atan2(deltaY, deltaX)

  return normalizeSpreadVector(Math.cos(angle), Math.sin(angle), point)
}

function getPairSpreadVector(
  group: ProjectedPoint[],
  point: ProjectedPoint,
  centerX: number,
  centerY: number,
) {
  const ordered = [...group].sort((left, right) => {
    if (Math.abs(left.x - right.x) > 1) return left.x - right.x
    return left.y - right.y
  })
  const pointOrderIndex = ordered.findIndex((item) => item.id === point.id)

  if (centerY > SVG_VIEWBOX.height * 0.72) {
    return pointOrderIndex === 0
      ? normalizeSpreadVector(-0.9, -0.42, point)
      : normalizeSpreadVector(0.78, -0.5, point)
  }

  if (centerX > SVG_VIEWBOX.width * 0.68) {
    return pointOrderIndex === 0
      ? normalizeSpreadVector(-0.92, -0.24, point)
      : normalizeSpreadVector(-0.86, 0.2, point)
  }

  const otherPoint = group.find((item) => item.id !== point.id)
  if (!otherPoint) {
    return normalizeSpreadVector(point.x - centerX, point.y - centerY, point)
  }

  const deltaX = otherPoint.x - point.x
  const deltaY = otherPoint.y - point.y
  const perpendicularX = -deltaY
  const perpendicularY = deltaX

  return pointOrderIndex === 0
    ? normalizeSpreadVector(-perpendicularX, -perpendicularY, point)
    : normalizeSpreadVector(perpendicularX, perpendicularY, point)
}

function normalizeSpreadVector(deltaX: number, deltaY: number, point: ProjectedPoint) {
  let vectorX = deltaX
  let vectorY = deltaY

  if (point.y > SVG_VIEWBOX.height * 0.72 && vectorY > 0) {
    vectorY *= -0.45
  }
  if (point.x > SVG_VIEWBOX.width * 0.66 && vectorX > 0) {
    vectorX *= -0.5
  }
  if (point.x < SVG_VIEWBOX.width * 0.22 && vectorX < 0) {
    vectorX *= -0.5
  }

  const length = Math.hypot(vectorX, vectorY) || 1
  return {
    x: vectorX / length,
    y: vectorY / length,
  }
}

function collectNearbyPointGroups(points: ProjectedPoint[]) {
  const visited = new Set<number>()
  const groups: ProjectedPoint[][] = []

  for (let startIndex = 0; startIndex < points.length; startIndex += 1) {
    if (visited.has(startIndex)) continue

    const queue = [startIndex]
    const groupIndexes: number[] = []
    visited.add(startIndex)

    while (queue.length) {
      const currentIndex = queue.shift()
      if (currentIndex == null) continue
      groupIndexes.push(currentIndex)

      for (let nextIndex = 0; nextIndex < points.length; nextIndex += 1) {
        if (visited.has(nextIndex)) continue
        if (getProjectedDistance(points[currentIndex], points[nextIndex]) > MARKER_OVERLAP_RADIUS) continue
        visited.add(nextIndex)
        queue.push(nextIndex)
      }
    }

    if (groupIndexes.length > 1) {
      groups.push(groupIndexes.map((index) => points[index]))
    }
  }

  return groups
}

function getProjectedDistance(left: { x: number; y: number }, right: { x: number; y: number }) {
  const deltaX = left.x - right.x
  const deltaY = left.y - right.y
  return Math.hypot(deltaX, deltaY)
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

  const targets = boundaryLocationsMap.value.get(id) ?? []
  if (targets.length === 1) {
    closeBoundaryChoice()
    emit('select', targets[0].id)
    return
  }

  boundaryChoiceId.value = targets.length > 1 ? id : null
}

function closeBoundaryChoice() {
  boundaryChoiceId.value = null
}

function selectBoundaryChoice(id: number) {
  closeBoundaryChoice()
  emit('select', id)
}

function zoomIn() {
  if (props.pickerMode && map?.zoomIn) {
    map.zoomIn()
    return
  }
  updateScale(displayScale.value + ZOOM_STEP)
}

function zoomOut() {
  if (props.pickerMode && map?.zoomOut) {
    map.zoomOut()
    return
  }
  updateScale(displayScale.value - ZOOM_STEP)
}

function resetZoom() {
  displayScale.value = BASE_SCALE
  mapPan.value = { x: 0, y: 0 }
}

function resetPickerView() {
  if (!props.pickerMode || !map) {
    resetZoom()
    return
  }
  if (markers.length) {
    map.setFitView(markers, false, [70, 70, 70, 70], 4)
    return
  }
  map.setZoomAndCenter(4.4, [104.0, 35.0])
}

function focusPickerLocation(latitude?: number, longitude?: number) {
  if (!props.pickerMode || !map) return

  const targetLatitude = latitude ?? props.pickerLatitude
  const targetLongitude = longitude ?? props.pickerLongitude
  if (targetLatitude != null && targetLongitude != null && isValidCoordinate(targetLatitude, targetLongitude)) {
    const coordinate = wgs84ToGcj02(Number(targetLatitude), Number(targetLongitude))
    setPickerMarker(Number(targetLatitude), Number(targetLongitude))
    map.setZoomAndCenter(11, [coordinate.longitude, coordinate.latitude])
    return
  }

  resetPickerView()
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
  closeBoundaryChoice()
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

function getPickerGeocoder() {
  if (!AMapRef) {
    return Promise.reject(new Error('地图还没有加载完成。'))
  }
  if (geocoder) {
    return Promise.resolve(geocoder)
  }

  return new Promise((resolve, reject) => {
    AMapRef.plugin(['AMap.Geocoder'], () => {
      try {
        geocoder = new AMapRef.Geocoder({
          extensions: 'base',
          city: '全国',
        })
        resolve(geocoder)
      } catch (error) {
        reject(error)
      }
    })
  })
}

async function searchPickerLocation(keyword: string) {
  const trimmedKeyword = keyword.trim()
  if (!props.pickerMode || !trimmedKeyword) return
  if (!map || !AMapRef) {
    emit('search-error', '地图还没有加载完成，请稍后再试。')
    return
  }

  try {
    const pickerGeocoder = await getPickerGeocoder()
    const result = await new Promise<any>((resolve, reject) => {
      pickerGeocoder.getLocation(trimmedKeyword, (status: string, response: any) => {
        const firstGeocode = response?.geocodes?.[0]
        if (status !== 'complete' || !firstGeocode?.location) {
          reject(new Error('没有找到匹配地点。'))
          return
        }
        resolve(firstGeocode)
      })
    })
    const lng = Number(result.location?.lng ?? result.location?.getLng?.())
    const lat = Number(result.location?.lat ?? result.location?.getLat?.())
    if (!isValidCoordinate(lat, lng)) {
      emit('search-error', '没有找到可用坐标，请换个关键词。')
      return
    }

    const coordinate = gcj02ToWgs84(lat, lng)
    setPickerMarker(coordinate.latitude, coordinate.longitude)
    map.setZoomAndCenter(8, [lng, lat])
    emit('pick', coordinate)
  } catch {
    emit('search-error', '没有找到匹配地点，请换个城市、景点或国家试试。')
  }
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

watch(
  () => props.searchRequest,
  () => {
    void searchPickerLocation(props.searchKeyword)
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
  geocoder = null
})

defineExpose({
  zoomIn,
  zoomOut,
  focusPickerLocation,
  resetPickerView,
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

.travel-map-choice-card {
  position: absolute;
  left: 24px;
  bottom: 24px;
  z-index: 4;
  width: min(280px, calc(100% - 48px));
  max-height: min(320px, calc(100% - 48px));
  overflow: auto;
  padding: 12px;
  border-radius: 20px;
  border: 1px solid rgba(239, 206, 218, 0.92);
  background:
    linear-gradient(180deg, rgba(255, 255, 255, 0.96), rgba(255, 249, 252, 0.92)),
    radial-gradient(circle at 14% 8%, rgba(255, 205, 224, 0.36), transparent 34%);
  box-shadow: 0 18px 38px rgba(184, 126, 148, 0.18);
  backdrop-filter: blur(14px);
}

.travel-map-choice-card__head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  margin-bottom: 8px;
  color: #5d4650;
}

.travel-map-choice-card__head strong {
  font-size: 14px;
  font-weight: 700;
}

.travel-map-choice-card__head button {
  width: 26px;
  height: 26px;
  border: 0;
  border-radius: 999px;
  background: rgba(255, 233, 241, 0.92);
  color: #9b6a7a;
  cursor: pointer;
}

.travel-map-choice-card__item {
  width: 100%;
  display: grid;
  gap: 3px;
  margin-top: 7px;
  padding: 10px 12px;
  text-align: left;
  border: 1px solid rgba(239, 218, 226, 0.86);
  border-radius: 14px;
  background: rgba(255, 255, 255, 0.72);
  color: #5b4650;
  cursor: pointer;
  transition:
    transform 0.18s ease,
    border-color 0.18s ease,
    box-shadow 0.18s ease;
}

.travel-map-choice-card__item:hover {
  transform: translateY(-1px);
  border-color: rgba(239, 151, 181, 0.72);
  box-shadow: 0 10px 22px rgba(220, 150, 174, 0.14);
}

.travel-map-choice-card__item span {
  font-size: 13px;
  font-weight: 700;
}

.travel-map-choice-card__item small {
  color: rgba(93, 70, 80, 0.62);
  font-size: 11px;
}

.travel-map-marker {
  cursor: pointer;
  pointer-events: auto;
}

.travel-map-marker__ripple {
  fill: rgba(255, 167, 196, 0.12);
}

.travel-map-marker__connector {
  stroke: rgba(206, 145, 168, 0.72);
  stroke-width: 1.4;
  stroke-linecap: round;
}

.travel-map-marker__label-bubble {
  pointer-events: none;
}

.travel-map-marker__label-bg {
  fill: rgba(255, 252, 254, 0.96);
  stroke: rgba(239, 199, 214, 0.96);
  stroke-width: 1;
  filter: drop-shadow(0 5px 10px rgba(207, 156, 176, 0.14));
}

.travel-map-marker__label-bubble.is-active .travel-map-marker__label-bg {
  fill: rgba(255, 250, 252, 0.98);
  stroke: rgba(242, 173, 199, 0.98);
}

.travel-map-marker__pin {
  fill: rgba(255, 133, 175, 0.96);
  stroke: rgba(255, 255, 255, 0.96);
  stroke-width: 1.8;
  filter: drop-shadow(0 6px 12px rgba(246, 136, 173, 0.16));
}

.travel-map-marker__core {
  fill: rgba(255, 255, 255, 0.98);
}

.travel-map-marker__label {
  fill: #6b4f59;
  font-size: 10.5px;
  font-family:
    'Microsoft YaHei UI',
    'PingFang SC',
    'Hiragino Sans GB',
    'Noto Sans CJK SC',
    sans-serif;
  font-weight: 600;
  dominant-baseline: middle;
}

.travel-map-marker.is-active .travel-map-marker__pin {
  fill: rgba(255, 104, 156, 0.98);
  stroke: rgba(255, 248, 251, 0.98);
  filter: drop-shadow(0 8px 14px rgba(246, 112, 158, 0.22));
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
