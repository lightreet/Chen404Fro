import { wgs84ToGcj02 } from '@/utils/coordinate'

let loadingPromise: Promise<any> | null = null
let geocoderPromise: Promise<any> | null = null
let geocoderInstance: any = null

const AMAP_SCRIPT_ID = 'chen404-amap-script'
const AMAP_LOAD_TIMEOUT_MS = 12000

export interface AmapReverseGeocodeResult {
  province: string
  city: string
  district: string
  formattedAddress: string
}

function getAmapKey() {
  return (import.meta.env.VITE_AMAP_KEY || '').trim()
}

function getAmapSecurityCode() {
  return (import.meta.env.VITE_AMAP_SECURITY_CODE || '').trim()
}

export function getAmapUnavailableReason() {
  return getAmapKey() ? '' : '未配置 VITE_AMAP_KEY，地图能力暂不可用。'
}

export function loadAmap(): Promise<any> {
  if (typeof window === 'undefined') {
    return Promise.reject(new Error('AMap 只能在浏览器环境使用'))
  }

  const key = getAmapKey()
  if (!key) {
    return Promise.reject(new Error('未配置 VITE_AMAP_KEY'))
  }

  const current = (window as any).AMap
  if (current) {
    return Promise.resolve(current)
  }

  if (loadingPromise) {
    return loadingPromise
  }

  const securityCode = getAmapSecurityCode()
  if (securityCode) {
    ;(window as any)._AMapSecurityConfig = {
      securityJsCode: securityCode,
    }
  }

  loadingPromise = new Promise((resolve, reject) => {
    const existing = document.getElementById(AMAP_SCRIPT_ID) as HTMLScriptElement | null
    const script = existing?.dataset.amapStatus === 'error' ? null : existing ?? document.createElement('script')
    if (existing?.dataset.amapStatus === 'error') {
      existing.remove()
    }

    const targetScript = script ?? document.createElement('script')
    let settled = false
    const rejectLoad = (message: string) => {
      if (settled) return
      settled = true
      window.clearTimeout(timeout)
      targetScript.dataset.amapStatus = 'error'
      targetScript.remove()
      reject(new Error(message))
    }
    const timeout = window.setTimeout(() => rejectLoad('高德地图脚本加载超时'), AMAP_LOAD_TIMEOUT_MS)

    const completeLoad = () => {
      if (settled) return
      const AMap = (window as any).AMap
      if (!AMap) {
        rejectLoad('高德地图脚本加载完成但未初始化')
        return
      }
      settled = true
      window.clearTimeout(timeout)
      targetScript.dataset.amapStatus = 'loaded'
      resolve(AMap)
    }

    const failLoad = () => {
      rejectLoad('高德地图脚本加载失败')
    }

    targetScript.addEventListener('load', completeLoad, { once: true })
    targetScript.addEventListener('error', failLoad, { once: true })

    if (targetScript !== existing) {
      targetScript.id = AMAP_SCRIPT_ID
      targetScript.async = true
      targetScript.dataset.amapStatus = 'loading'
      targetScript.src = `https://webapi.amap.com/maps?v=2.0&key=${encodeURIComponent(key)}`
      document.head.appendChild(targetScript)
      return
    }

    if ((window as any).AMap) {
      completeLoad()
    }
  }).finally(() => {
    loadingPromise = null
  })

  return loadingPromise
}

async function loadAmapGeocoder() {
  const AMap = await loadAmap()
  if (geocoderInstance) {
    return geocoderInstance
  }
  if (geocoderPromise) {
    return geocoderPromise
  }

  geocoderPromise = new Promise((resolve, reject) => {
    AMap.plugin(['AMap.Geocoder'], () => {
      try {
        geocoderInstance = new AMap.Geocoder({
          extensions: 'base',
        })
        resolve(geocoderInstance)
      } catch (error) {
        reject(error)
      }
    })
  }).finally(() => {
    geocoderPromise = null
  })

  return geocoderPromise
}

export async function reverseGeocodeLocation(
  latitude: number,
  longitude: number,
): Promise<AmapReverseGeocodeResult> {
  const geocoder = await loadAmapGeocoder()
  const amapCoordinate = wgs84ToGcj02(latitude, longitude)

  return new Promise((resolve, reject) => {
    geocoder.getAddress([amapCoordinate.longitude, amapCoordinate.latitude], (status: string, result: any) => {
      const addressComponent = result?.regeocode?.addressComponent
      if (status !== 'complete' || !addressComponent) {
        reject(new Error('AMap reverse geocode failed'))
        return
      }

      const province = String(addressComponent.province || '').trim()
      const rawCity = addressComponent.city
      const city = Array.isArray(rawCity)
        ? String(rawCity[0] || '').trim()
        : String(rawCity || '').trim()
      const district = String(addressComponent.district || '').trim()
      const formattedAddress = String(result?.regeocode?.formattedAddress || '').trim()

      resolve({
        province,
        city: city || district,
        district,
        formattedAddress,
      })
    })
  })
}
