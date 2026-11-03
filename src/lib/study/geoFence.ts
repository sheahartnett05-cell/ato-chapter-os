import type { StudyLocation } from '../../types/chapterOps'
import {
  locationDeniedHelp,
  locationSupported,
  readLocationPrefs,
} from '../location/locationPrefs'

export const DEFAULT_GEOFENCE_RADIUS_M = 150

export type GeoCoords = {
  lat: number
  lng: number
  accuracyM?: number
}

const EARTH_RADIUS_M = 6_371_000

/** Great-circle distance in meters (Haversine). */
export function distanceMeters(
  a: { lat: number; lng: number },
  b: { lat: number; lng: number }
): number {
  const toRad = (d: number) => (d * Math.PI) / 180
  const dLat = toRad(b.lat - a.lat)
  const dLng = toRad(b.lng - a.lng)
  const lat1 = toRad(a.lat)
  const lat2 = toRad(b.lat)
  const h =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(lat1) * Math.cos(lat2) * Math.sin(dLng / 2) ** 2
  return 2 * EARTH_RADIUS_M * Math.asin(Math.min(1, Math.sqrt(h)))
}

export function locationHasGeofence(
  loc: Pick<StudyLocation, 'lat' | 'lng'>
): loc is StudyLocation & { lat: number; lng: number } {
  return (
    typeof loc.lat === 'number' &&
    Number.isFinite(loc.lat) &&
    typeof loc.lng === 'number' &&
    Number.isFinite(loc.lng)
  )
}

export function geofenceRadius(loc: Pick<StudyLocation, 'radiusMeters'>): number {
  const r = loc.radiusMeters
  if (typeof r === 'number' && Number.isFinite(r) && r > 0) return r
  return DEFAULT_GEOFENCE_RADIUS_M
}

export function isWithinGeofence(
  loc: Pick<StudyLocation, 'lat' | 'lng' | 'radiusMeters'>,
  coords: GeoCoords
): boolean {
  if (!locationHasGeofence(loc)) return false
  return distanceMeters(loc, coords) <= geofenceRadius(loc)
}

export function getCurrentPosition(
  options?: PositionOptions
): Promise<GeoCoords> {
  return new Promise((resolve, reject) => {
    if (!readLocationPrefs().enabled) {
      reject(
        new Error(
          'Location is turned off in Chaptera Settings. Enable Location services there, then try again.'
        )
      )
      return
    }
    if (!locationSupported()) {
      reject(new Error('Geolocation is not available on this device.'))
      return
    }
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        resolve({
          lat: pos.coords.latitude,
          lng: pos.coords.longitude,
          accuracyM:
            typeof pos.coords.accuracy === 'number' ? pos.coords.accuracy : undefined,
        })
      },
      (err) => {
        if (err.code === err.PERMISSION_DENIED) {
          reject(new Error(`Location permission denied. ${locationDeniedHelp()}`))
          return
        }
        reject(new Error(err.message || 'Unable to read GPS location.'))
      },
      {
        enableHighAccuracy: true,
        timeout: 15_000,
        maximumAge: 10_000,
        ...options,
      }
    )
  })
}
