<template>
  <div class="travel-map-shell" :class="{ 'is-picker-mode': pickerMode }">
    <div
      v-if="pickerMode"
      ref="containerRef"
      class="travel-map-canvas"
    />

    <div v-else class="travel-map-stage">
      <div class="travel-map-haze travel-map-haze--left" />
      <div class="travel-map-haze travel-map-haze--right" />
      <div class="travel-map-controls">
        <button type="button" class="travel-map-control" @click="zoomIn">+</button>
        <button type="button" class="travel-map-control" @click="zoomOut">-</button>
      </div>

      <div class="travel-map-board" :style="{ transform: `scale(${displayScale})` }">
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
            @click="emit('select', point.id)"
          >
            <circle
              v-if="point.id === activeId"
              class="travel-map-marker__ripple"
              cx="0"
              cy="0"
              r="26"
              filter="url(#markerGlow)"
            />
            <circle class="travel-map-marker__outer" cx="0" cy="0" r="17" />
            <circle class="travel-map-marker__inner" cx="0" cy="0" r="10" />
            <path
              class="travel-map-marker__petal"
              d="M0 -7 C4 -11 8 -9 8 -4 C8 0 4 2 0 5 C-4 2 -8 0 -8 -4 C-8 -9 -4 -11 0 -7 Z"
            />
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

      <div class="travel-map-legend">
        <span class="travel-map-legend__flower"></span>
        <span>点亮地图上的樱花印章，查看旅途记忆</span>
      </div>
      <div class="travel-map-petals">
        <span class="petal petal--one" />
        <span class="petal petal--two" />
        <span class="petal petal--three" />
      </div>

      <div v-if="showEmptyState" class="travel-map-empty-callout">
        <strong>第一枚樱花印章正在等你点亮</strong>
        <span>先新建一个旅行地点，地图和纪念册就会一起苏醒。</span>
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
import { computed, nextTick, onBeforeUnmount, onMounted, ref, watch } from 'vue'
import chinaMapData from '@svg-maps/china'
import type { TravelMemoryLocationListItem } from '@/types'
import { getAmapUnavailableReason, loadAmap } from '@/utils/amap'

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

const containerRef = ref<HTMLDivElement | null>(null)
const loading = ref(true)
const errorText = ref('')
const displayScale = ref(0.96)

let map: any = null
let AMapRef: any = null
let markers: any[] = []
let pickerMarker: any = null
let clickHandler: ((event: any) => void) | null = null

const provincePaths = computed<SvgProvince[]>(() =>
  ((chinaMapData.locations || []) as SvgProvinceSource[]).map((province, index) => ({
    id: province.id,
    path: province.path,
    tone: index % 5 === 0 ? 'tone-soft' : index % 3 === 0 ? 'tone-blush' : 'tone-base',
  })),
)
const mapViewBox = `0 0 ${SVG_VIEWBOX.width} ${SVG_VIEWBOX.height}`

const displayPoints = computed<ProjectedPoint[]>(() =>
  props.locations
    .filter((item) => Number.isFinite(item.latitude) && Number.isFinite(item.longitude))
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
const showEmptyState = computed(
  () => !props.pickerMode && !loading.value && !errorText.value && displayPoints.value.length === 0,
)

function projectPoint(longitude: number, latitude: number) {
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

function zoomIn() {
  displayScale.value = Math.min(1.1, Number((displayScale.value + 0.05).toFixed(2)))
}

function zoomOut() {
  displayScale.value = Math.max(0.86, Number((displayScale.value - 0.05).toFixed(2)))
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
      if (Number.isFinite(lat) && Number.isFinite(lng)) {
        setPickerMarker(lat, lng)
        emit('pick', { latitude: lat, longitude: lng })
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

  const points = props.locations.filter((item) => Number.isFinite(item.latitude) && Number.isFinite(item.longitude))
  markers = points.map((item) => {
    const marker = new AMapRef.Marker({
      position: [Number(item.longitude), Number(item.latitude)],
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
  const position = [longitude, latitude]
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

onMounted(() => {
  void initMap()
})

onBeforeUnmount(() => {
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
  background: linear-gradient(180deg, rgba(255, 255, 255, 0.46), rgba(255, 250, 251, 0.32));
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
  min-height: 456px;
  padding: 14px 16px 72px;
}

.travel-map-board {
  position: relative;
  width: 94%;
  margin: 0 auto;
  transform-origin: center center;
  transition: transform 0.28s ease;
}

.travel-map-illustration {
  width: 100%;
  height: 100%;
}

.travel-map-provinces {
  opacity: 0.96;
}

.travel-map-province {
  fill-opacity: 0.98;
  stroke: rgba(232, 217, 223, 0.84);
  stroke-width: 1.1;
  transition: fill 0.24s ease, opacity 0.24s ease;
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

.travel-map-route {
  fill: none;
  stroke: url(#routeLine);
  stroke-width: 2.1;
  stroke-linecap: round;
  stroke-dasharray: 5 8;
}

.travel-map-city {
  opacity: 0.5;
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
  fill: rgba(130, 104, 113, 0.72);
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
}

.travel-map-marker__ripple {
  fill: rgba(255, 190, 211, 0.22);
}

.travel-map-marker__outer {
  fill: rgba(255, 245, 248, 0.94);
  stroke: rgba(255, 182, 201, 0.86);
  stroke-width: 2;
}

.travel-map-marker__inner {
  fill: rgba(255, 166, 191, 0.98);
}

.travel-map-marker__petal {
  fill: rgba(255, 236, 244, 0.95);
}

.travel-map-marker__label {
  fill: #725560;
  font-size: 13px;
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

.travel-map-marker.is-active .travel-map-marker__outer {
  fill: rgba(255, 245, 248, 0.98);
  stroke: rgba(255, 126, 170, 0.92);
}

.travel-map-marker.is-active .travel-map-marker__inner {
  fill: rgba(255, 117, 163, 0.98);
}

.travel-map-controls {
  position: absolute;
  left: 18px;
  bottom: 18px;
  z-index: 2;
  display: grid;
  gap: 7px;
}

.travel-map-control {
  width: 36px;
  height: 36px;
  border-radius: 12px;
  border: 1px solid rgba(236, 221, 227, 0.92);
  background: rgba(255, 255, 255, 0.96);
  color: #765662;
  font-size: 20px;
  cursor: pointer;
  box-shadow: 0 10px 20px rgba(208, 181, 190, 0.12);
}

.travel-map-legend {
  position: absolute;
  right: 18px;
  bottom: 18px;
  z-index: 2;
  display: inline-flex;
  align-items: center;
  gap: 8px;
  min-height: 34px;
  padding: 0 14px;
  border-radius: 999px;
  background: rgba(255, 255, 255, 0.9);
  border: 1px solid rgba(239, 223, 229, 0.92);
  color: #8d6a77;
  font-size: 11px;
}

.travel-map-legend__flower {
  width: 14px;
  height: 14px;
  border-radius: 999px;
  background: radial-gradient(circle at center, #fff 0 20%, #ff8fb2 22% 56%, transparent 58%);
  box-shadow: 0 0 0 4px rgba(255, 204, 220, 0.34);
}

.travel-map-haze {
  position: absolute;
  inset: 0 auto 0 0;
  width: 160px;
  pointer-events: none;
  opacity: 0.4;
  background: radial-gradient(circle at left center, rgba(255, 235, 241, 0.42), transparent 72%);
}

.travel-map-haze--right {
  inset: 0 0 0 auto;
  background: radial-gradient(circle at right center, rgba(255, 235, 241, 0.36), transparent 72%);
}

.travel-map-petals {
  position: absolute;
  inset: 0;
  pointer-events: none;
}

.travel-map-empty-callout {
  position: absolute;
  right: 18px;
  top: 18px;
  z-index: 2;
  display: grid;
  gap: 4px;
  max-width: 232px;
  padding: 10px 12px;
  border-radius: 18px;
  background: rgba(255, 255, 255, 0.92);
  border: 1px solid rgba(239, 223, 229, 0.92);
  color: #815d69;
  box-shadow: 0 12px 24px rgba(213, 183, 194, 0.12);

  strong {
    color: #5f424c;
    font-size: 13px;
  }

  span {
    font-size: 10px;
    line-height: 1.65;
  }
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
  right: 52px;
  bottom: 110px;
  transform: rotate(18deg);
}

.petal--two {
  left: 74px;
  bottom: 82px;
  width: 14px;
  height: 20px;
  transform: rotate(-28deg);
}

.petal--three {
  right: 120px;
  top: 46px;
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
    padding: 18px 16px 74px;
  }

  .travel-map-board {
    width: 100%;
  }

  .travel-map-controls {
    left: 18px;
    bottom: 22px;
  }

  .travel-map-legend {
    left: 18px;
    right: 18px;
    bottom: 18px;
    justify-content: center;
    font-size: 12px;
  }

  .travel-map-empty-callout {
    left: 18px;
    right: 18px;
    top: 18px;
    max-width: none;
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
