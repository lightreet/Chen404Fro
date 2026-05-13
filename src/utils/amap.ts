let loadingPromise: Promise<any> | null = null

const AMAP_SCRIPT_ID = 'chen404-amap-script'

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
    if (existing) {
      existing.addEventListener('load', () => resolve((window as any).AMap))
      existing.addEventListener('error', () => reject(new Error('高德地图脚本加载失败')))
      return
    }

    const script = document.createElement('script')
    script.id = AMAP_SCRIPT_ID
    script.async = true
    script.src = `https://webapi.amap.com/maps?v=2.0&key=${encodeURIComponent(key)}`
    script.onload = () => resolve((window as any).AMap)
    script.onerror = () => reject(new Error('高德地图脚本加载失败'))
    document.head.appendChild(script)
  }).finally(() => {
    loadingPromise = null
  })

  return loadingPromise
}
