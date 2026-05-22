import axios from 'axios'

export interface ChinaCityMapManifest {
  id: string
  version: string
  source: {
    package: string
    version: string
    repository?: string
    license: string
  }
  coordinateSystem: 'WGS84'
  files: {
    cityGeoJson: string
    provinceGeoJson?: string
  }
  featureCount: number
  provinceFeatureCount?: number
  byteSize: number
  provinceByteSize?: number
  sha256: string
  provinceSha256?: string
  generatedBy: string
}

export interface ChinaCityMapFeature {
  type: 'Feature'
  id: string
  properties: {
    adcode: string
    name: string
    center?: [number, number]
    provinceKey: string
    provinceName: string
  }
  geometry: {
    type: string
    coordinates: unknown
  }
}

export interface ChinaCityMapGeoJson {
  type: 'FeatureCollection'
  name: string
  features: ChinaCityMapFeature[]
}

export interface ChinaProvinceMapFeature {
  type: 'Feature'
  id: string
  properties: {
    adcode: string
    name: string
    center?: [number, number]
  }
  geometry: {
    type: string
    coordinates: unknown
  }
}

export interface ChinaProvinceMapGeoJson {
  type: 'FeatureCollection'
  name: string
  features: ChinaProvinceMapFeature[]
}

export interface ChinaCityMapBundle {
  manifest: ChinaCityMapManifest
  geoJson: ChinaCityMapGeoJson
  provinceGeoJson: ChinaProvinceMapGeoJson | null
}

function toPublicAssetUrl(path: string) {
  const base = import.meta.env.BASE_URL.replace(/\/$/, '')
  const normalizedPath = path.startsWith('/') ? path : `/${path}`
  return `${base}${normalizedPath}`
}

async function fetchJson<T>(path: string): Promise<T> {
  const response = await axios.get<T>(toPublicAssetUrl(path), {
    responseType: 'json',
  })

  if (response.status < 200 || response.status >= 300) {
    throw new Error(`Failed to load ${path}: ${response.status}`)
  }

  return response.data
}

export async function loadChinaCityMap(): Promise<ChinaCityMapBundle> {
  const manifest = await fetchJson<ChinaCityMapManifest>('/maps/china-city.manifest.json')
  const geoJson = await fetchJson<ChinaCityMapGeoJson>(manifest.files.cityGeoJson)
  const provinceGeoJson = manifest.files.provinceGeoJson
    ? await fetchJson<ChinaProvinceMapGeoJson>(manifest.files.provinceGeoJson)
    : null

  return {
    manifest,
    geoJson,
    provinceGeoJson,
  }
}
