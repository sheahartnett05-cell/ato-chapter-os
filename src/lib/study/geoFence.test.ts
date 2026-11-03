import { describe, expect, it } from 'vitest'
import {
  DEFAULT_GEOFENCE_RADIUS_M,
  distanceMeters,
  geofenceRadius,
  isWithinGeofence,
  locationHasGeofence,
} from './geoFence'

describe('geoFence', () => {
  it('computes short Haversine distances', () => {
    // ~111m north from equator-ish point
    const a = { lat: 30.4213, lng: -87.2169 }
    const b = { lat: 30.4223, lng: -87.2169 }
    const d = distanceMeters(a, b)
    expect(d).toBeGreaterThan(100)
    expect(d).toBeLessThan(130)
  })

  it('requires lat/lng for a geofence', () => {
    expect(locationHasGeofence({ name: 'x', active: true } as never)).toBe(false)
    expect(locationHasGeofence({ lat: 1, lng: 2 })).toBe(true)
  })

  it('uses default radius when unset', () => {
    expect(geofenceRadius({})).toBe(DEFAULT_GEOFENCE_RADIUS_M)
    expect(geofenceRadius({ radiusMeters: 80 })).toBe(80)
  })

  it('accepts points inside radius and rejects outside', () => {
    const loc = { lat: 30.4213, lng: -87.2169, radiusMeters: 120 }
    expect(isWithinGeofence(loc, { lat: 30.4213, lng: -87.2169 })).toBe(true)
    expect(isWithinGeofence(loc, { lat: 30.425, lng: -87.2169 })).toBe(false)
  })
})
