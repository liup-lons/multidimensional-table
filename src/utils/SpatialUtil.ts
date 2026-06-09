// 空间计算工具类
import * as turf from 'turf'
import type { GeoPoint, GeoPolygon, GeoLineString, Geometry } from '@/types/geo'

// 两点距离计算（单位：米）
export function calculateDistance(point1: GeoPoint, point2: GeoPoint): number {
  const pt1 = turf.point(point1.coordinates)
  const pt2 = turf.point(point2.coordinates)
  return turf.distance(pt1, pt2, { units: 'meters' })
}

// 多边形面积计算（单位：平方米）
export function calculateArea(polygon: GeoPolygon): number {
  const poly = turf.polygon(polygon.coordinates)
  return turf.area(poly)
}

// 点到线的距离（单位：米）
export function distanceToLine(point: GeoPoint, line: GeoLineString): number {
  const pt = turf.point(point.coordinates)
  const ln = turf.lineString(line.coordinates)
  const nearest = turf.nearestPointOnLine(ln, pt)
  return turf.distance(pt, nearest, { units: 'meters' })
}

// 计算方位角（单位：度）
export function calculateBearing(point1: GeoPoint, point2: GeoPoint): number {
  const pt1 = turf.point(point1.coordinates)
  const pt2 = turf.point(point2.coordinates)
  return turf.bearing(pt1, pt2)
}

// 判断点是否在多边形内
export function isPointInPolygon(point: GeoPoint, polygon: GeoPolygon): boolean {
  const pt = turf.point(point.coordinates)
  const poly = turf.polygon(polygon.coordinates)
  return turf.booleanPointInPolygon(pt, poly)
}

// 圆形范围查询
export function queryByRadius(
  points: GeoPoint[],
  center: GeoPoint,
  radius: number
): GeoPoint[] {
  const centerPt = turf.point(center.coordinates)
  const circle = turf.circle(centerPt, radius, { units: 'meters' })
  return points.filter(point => {
    const pt = turf.point(point.coordinates)
    return turf.booleanPointInPolygon(pt, circle)
  })
}

// 矩形范围查询
export function queryByBounds(
  points: GeoPoint[],
  bounds: [number, number, number, number] // [minLng, minLat, maxLng, maxLat]
): GeoPoint[] {
  const bbox = turf.bboxPolygon(bounds)
  return points.filter(point => {
    const pt = turf.point(point.coordinates)
    return turf.booleanPointInPolygon(pt, bbox)
  })
}

// 多边形范围查询
export function queryByPolygon(
  points: GeoPoint[],
  polygon: GeoPolygon
): GeoPoint[] {
  const poly = turf.polygon(polygon.coordinates)
  return points.filter(point => {
    const pt = turf.point(point.coordinates)
    return turf.booleanPointInPolygon(pt, poly)
  })
}

// KNN 邻近查询
export function queryNearest(
  points: GeoPoint[],
  target: GeoPoint,
  k: number = 10
): { point: GeoPoint; distance: number }[] {
  const targetPt = turf.point(target.coordinates)
  const features = points.map(p => turf.point(p.coordinates))
  
  const nearest = turf.nearestPoint(targetPt, features)
  const distances = points.map(point => ({
    point,
    distance: calculateDistance(point, target)
  }))
  
  return distances.sort((a, b) => a.distance - b.distance).slice(0, k)
}

// 计算中心点
export function calculateCenter(points: GeoPoint[]): GeoPoint {
  if (points.length === 0) {
    return { type: 'Point', coordinates: [0, 0] }
  }
  if (points.length === 1) {
    return points[0]
  }
  const features = points.map(p => turf.point(p.coordinates))
  const collection = turf.featureCollection(features)
  const center = turf.center(collection)
  return { type: 'Point', coordinates: center.geometry.coordinates as [number, number] }
}

// 计算边界框
export function calculateBounds(points: GeoPoint[]): [number, number, number, number] {
  if (points.length === 0) {
    return [0, 0, 0, 0]
  }
  const features = points.map(p => turf.point(p.coordinates))
  const collection = turf.featureCollection(features)
  return turf.bbox(collection) as [number, number, number, number]
}

// 生成缓冲区
export function createBuffer(
  geometry: Geometry,
  radius: number,
  units: 'meters' | 'kilometers' | 'miles' = 'meters'
): GeoPolygon {
  const feature = turf.feature(geometry)
  const buffered = turf.buffer(feature, radius, { units })
  return buffered.geometry as GeoPolygon
}

// 计算两个多边形的交集
export function intersectPolygons(
  polygon1: GeoPolygon,
  polygon2: GeoPolygon
): GeoPolygon | null {
  const poly1 = turf.polygon(polygon1.coordinates)
  const poly2 = turf.polygon(polygon2.coordinates)
  const intersection = turf.intersect(poly1, poly2)
  return intersection ? (intersection.geometry as GeoPolygon) : null
}

// 计算两个多边形的并集
export function unionPolygons(
  polygon1: GeoPolygon,
  polygon2: GeoPolygon
): GeoPolygon | null {
  const poly1 = turf.polygon(polygon1.coordinates)
  const poly2 = turf.polygon(polygon2.coordinates)
  const union = turf.union(poly1, poly2)
  return union ? (union.geometry as GeoPolygon) : null
}

// 简化几何图形
export function simplifyGeometry(
  geometry: Geometry,
  tolerance: number = 0.001
): Geometry {
  const feature = turf.feature(geometry)
  const simplified = turf.simplify(feature, { tolerance })
  return simplified.geometry as Geometry
}

// 坐标格式化
export function formatCoordinates(coordinates: [number, number]): string {
  const [lng, lat] = coordinates
  return `${lat.toFixed(6)}, ${lng.toFixed(6)}`
}

// 距离格式化
export function formatDistance(meters: number): string {
  if (meters < 1000) {
    return `${meters.toFixed(1)}米`
  } else {
    return `${(meters / 1000).toFixed(2)}公里`
  }
}

// 面积格式化
export function formatArea(squareMeters: number): string {
  if (squareMeters < 10000) {
    return `${squareMeters.toFixed(1)}平方米`
  } else if (squareMeters < 1000000) {
    return `${(squareMeters / 10000).toFixed(2)}公顷`
  } else {
    return `${(squareMeters / 1000000).toFixed(2)}平方公里`
  }
}