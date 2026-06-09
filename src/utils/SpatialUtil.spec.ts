import { describe, expect, it } from 'vitest'
import {
  calculateArea,
  calculateCenter,
  calculateBounds,
  formatCoordinates,
  formatDistance,
  formatArea
} from './SpatialUtil'
import type { GeoPoint, GeoPolygon } from '@/types/geo'

describe('SpatialUtil', () => {
  describe('calculateArea', () => {
    it('should calculate polygon area', () => {
      const polygon: GeoPolygon = {
        type: 'Polygon',
        coordinates: [[
          [116.3, 39.8],
          [116.5, 39.8],
          [116.5, 40.0],
          [116.3, 40.0],
          [116.3, 39.8]
        ]]
      }
      const area = calculateArea(polygon)
      expect(area).toBeGreaterThan(0)
    })

    it('should return 0 for empty polygon', () => {
      const polygon: GeoPolygon = {
        type: 'Polygon',
        coordinates: [[[0, 0], [0, 0], [0, 0], [0, 0]]]
      }
      const area = calculateArea(polygon)
      expect(area).toBe(0)
    })
  })

  describe('calculateCenter', () => {
    it('should calculate center of multiple points', () => {
      const points: GeoPoint[] = [
        { type: 'Point', coordinates: [116.4074, 39.9042] },
        { type: 'Point', coordinates: [121.4737, 31.2304] },
        { type: 'Point', coordinates: [113.2644, 23.1291] }
      ]
      const center = calculateCenter(points)
      expect(center.type).toBe('Point')
      expect(center.coordinates[0]).toBeGreaterThan(110)
      expect(center.coordinates[0]).toBeLessThan(125)
      expect(center.coordinates[1]).toBeGreaterThan(20)
      expect(center.coordinates[1]).toBeLessThan(45)
    })

    it('should return the same point for single point', () => {
      const points: GeoPoint[] = [
        { type: 'Point', coordinates: [116.4074, 39.9042] }
      ]
      const center = calculateCenter(points)
      expect(center.coordinates).toEqual([116.4074, 39.9042])
    })

    it('should return origin for empty array', () => {
      const points: GeoPoint[] = []
      const center = calculateCenter(points)
      expect(center.coordinates).toEqual([0, 0])
    })
  })

  describe('calculateBounds', () => {
    it('should calculate bounds of points', () => {
      const points: GeoPoint[] = [
        { type: 'Point', coordinates: [116.4074, 39.9042] },
        { type: 'Point', coordinates: [121.4737, 31.2304] },
        { type: 'Point', coordinates: [113.2644, 23.1291] }
      ]
      const bounds = calculateBounds(points)
      expect(bounds.length).toBe(4)
      expect(bounds[0]).toBeLessThan(bounds[2]) // minLng < maxLng
      expect(bounds[1]).toBeLessThan(bounds[3]) // minLat < maxLat
    })

    it('should return [0,0,0,0] for empty array', () => {
      const points: GeoPoint[] = []
      const bounds = calculateBounds(points)
      expect(bounds).toEqual([0, 0, 0, 0])
    })
  })

  describe('formatCoordinates', () => {
    it('should format coordinates correctly', () => {
      const coordinates: [number, number] = [116.4074, 39.9042]
      const result = formatCoordinates(coordinates)
      expect(result).toBe('39.904200, 116.407400')
    })
  })

  describe('formatDistance', () => {
    it('should format meters correctly', () => {
      expect(formatDistance(500)).toBe('500.0米')
    })

    it('should format kilometers correctly', () => {
      expect(formatDistance(2500)).toBe('2.50公里')
    })

    it('should format zero correctly', () => {
      expect(formatDistance(0)).toBe('0.0米')
    })
  })

  describe('formatArea', () => {
    it('should format square meters correctly', () => {
      expect(formatArea(5000)).toBe('5000.0平方米')
    })

    it('should format hectares correctly', () => {
      expect(formatArea(50000)).toBe('5.00公顷')
    })

    it('should format square kilometers correctly', () => {
      expect(formatArea(5000000)).toBe('5.00平方公里')
    })
  })
})