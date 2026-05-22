export interface CoordinatePoint {
  latitude: number
  longitude: number
}

const EARTH_RADIUS = 6378245.0
const EE = 0.00669342162296594323

function outOfChina(latitude: number, longitude: number) {
  return longitude < 72.004 || longitude > 137.8347 || latitude < 0.8293 || latitude > 55.8271
}

function transformLatitude(x: number, y: number) {
  let ret = -100.0 + 2.0 * x + 3.0 * y + 0.2 * y * y + 0.1 * x * y + 0.2 * Math.sqrt(Math.abs(x))
  ret += ((20.0 * Math.sin(6.0 * x * Math.PI) + 20.0 * Math.sin(2.0 * x * Math.PI)) * 2.0) / 3.0
  ret += ((20.0 * Math.sin(y * Math.PI) + 40.0 * Math.sin((y / 3.0) * Math.PI)) * 2.0) / 3.0
  ret += ((160.0 * Math.sin((y / 12.0) * Math.PI) + 320 * Math.sin((y * Math.PI) / 30.0)) * 2.0) / 3.0
  return ret
}

function transformLongitude(x: number, y: number) {
  let ret = 300.0 + x + 2.0 * y + 0.1 * x * x + 0.1 * x * y + 0.1 * Math.sqrt(Math.abs(x))
  ret += ((20.0 * Math.sin(6.0 * x * Math.PI) + 20.0 * Math.sin(2.0 * x * Math.PI)) * 2.0) / 3.0
  ret += ((20.0 * Math.sin(x * Math.PI) + 40.0 * Math.sin((x / 3.0) * Math.PI)) * 2.0) / 3.0
  ret += ((150.0 * Math.sin((x / 12.0) * Math.PI) + 300.0 * Math.sin((x / 30.0) * Math.PI)) * 2.0) / 3.0
  return ret
}

function transformOffset(latitude: number, longitude: number) {
  let dLat = transformLatitude(longitude - 105.0, latitude - 35.0)
  let dLng = transformLongitude(longitude - 105.0, latitude - 35.0)
  const radLat = (latitude / 180.0) * Math.PI
  let magic = Math.sin(radLat)
  magic = 1 - EE * magic * magic
  const sqrtMagic = Math.sqrt(magic)
  dLat = (dLat * 180.0) / (((EARTH_RADIUS * (1 - EE)) / (magic * sqrtMagic)) * Math.PI)
  dLng = (dLng * 180.0) / ((EARTH_RADIUS / sqrtMagic) * Math.cos(radLat) * Math.PI)
  return { dLat, dLng }
}

export function isValidCoordinate(latitude?: number | null, longitude?: number | null) {
  return Number.isFinite(latitude) && Number.isFinite(longitude)
}

export function normalizeCoordinate(latitude: number, longitude: number): CoordinatePoint {
  return {
    latitude: Number(latitude.toFixed(6)),
    longitude: Number(longitude.toFixed(6)),
  }
}

export function wgs84ToGcj02(latitude: number, longitude: number): CoordinatePoint {
  if (!isValidCoordinate(latitude, longitude) || outOfChina(latitude, longitude)) {
    return normalizeCoordinate(latitude, longitude)
  }

  const { dLat, dLng } = transformOffset(latitude, longitude)
  return normalizeCoordinate(latitude + dLat, longitude + dLng)
}

export function gcj02ToWgs84(latitude: number, longitude: number): CoordinatePoint {
  if (!isValidCoordinate(latitude, longitude) || outOfChina(latitude, longitude)) {
    return normalizeCoordinate(latitude, longitude)
  }

  const gcj = wgs84ToGcj02(latitude, longitude)
  return normalizeCoordinate(latitude * 2 - gcj.latitude, longitude * 2 - gcj.longitude)
}
