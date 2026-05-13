<template>
  <div class="travel-map-shell">
    <div ref="containerRef" class="travel-map-canvas" />
    <div v-if="loading" class="travel-map-state travel-map-state--loading">地图加载中...</div>
    <div v-else-if="showEmptyState" class="travel-map-state">
      <p>还没有可展示的旅行地点</p>
      <span>先在后台新增地点并保存为“展示”状态，前台地图上才会出现可点击的标记。</span>
    </div>
    <div v-else-if="errorText" class="travel-map-state">
      <p>{{ errorText }}</p>
      <span v-if="!locations.length">先保存地点后，这里就会出现纪念坐标。</span>
    </div>
  </div>
</template>

<script setup lang="ts">
import { nextTick, onBeforeUnmount, onMounted, ref, watch } from 'vue'
import type { TravelMemoryLocationListItem } from '@/types'
import { getAmapUnavailableReason, loadAmap } from '@/utils/amap'

interface Props {
  locations?: TravelMemoryLocationListItem[]
  activeId?: number | null
  pickerMode?: boolean
  pickerLatitude?: number | null
  pickerLongitude?: number | null
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
const showEmptyState = ref(false)

let map: any = null
let AMapRef: any = null
let markers: any[] = []
let pickerMarker: any = null
let clickHandler: ((event: any) => void) | null = null

async function initMap() {
  loading.value = true
  errorText.value = ''
  showEmptyState.value = false
  try {
    AMapRef = await loadAmap()
    if (!containerRef.value) return
    map = new AMapRef.Map(containerRef.value, {
      resizeEnable: true,
      zoom: 4.3,
      center: [104.0, 35.0],
      mapStyle: 'amap://styles/whitesmoke',
      viewMode: '2D',
    })

    if (props.pickerMode) {
      clickHandler = (event: any) => {
        const lng = Number(event?.lnglat?.getLng?.())
        const lat = Number(event?.lnglat?.getLat?.())
        if (Number.isFinite(lat) && Number.isFinite(lng)) {
          setPickerMarker(lat, lng)
          emit('pick', { latitude: lat, longitude: lng })
        }
      }
      map.on('click', clickHandler)
    }

    refreshMarkers()
    syncPickerMarker()
  } catch (error) {
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
  if (!map || !AMapRef) return
  clearMarkers()

  const points = props.locations.filter((item) => Number.isFinite(item.latitude) && Number.isFinite(item.longitude))
  showEmptyState.value = !props.pickerMode && points.length === 0
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
  min-height: 420px;
  border-radius: 24px;
  overflow: hidden;
  background:
    linear-gradient(180deg, rgba(255, 252, 253, 0.96), rgba(249, 245, 248, 0.88)),
    radial-gradient(circle at top right, rgba(255, 221, 232, 0.28), transparent 38%);
  border: 1px solid rgba(236, 220, 228, 0.8);
}

.travel-map-canvas {
  width: 100%;
  height: 100%;
  min-height: 420px;
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
  background: rgba(255, 250, 252, 0.72);
  backdrop-filter: blur(10px);

  p {
    font-size: 15px;
    color: var(--text-primary);
  }

  span {
    font-size: 13px;
  }
}

.travel-map-state--loading {
  color: var(--text-primary);
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
