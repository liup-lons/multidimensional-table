// GIS 地理信息类型定义

// 地理坐标类型
export interface GeoPoint {
  type: 'Point'
  coordinates: [number, number] // [longitude, latitude]
}

export interface GeoLineString {
  type: 'LineString'
  coordinates: [number, number][]
}

export interface GeoPolygon {
  type: 'Polygon'
  coordinates: [number, number][][]
}

export type Geometry = GeoPoint | GeoLineString | GeoPolygon

// 地理字段定义
export interface GeoFieldDefinition {
  id: string
  fieldName: string
  fieldType: 'geo' | 'address' | 'region' | 'geometry'
  fieldLabel: string
  required?: boolean
  defaultValue?: any
}

// 地图标记数据
export interface MapMarker {
  id: string
  coordinates: [number, number]
  properties: Record<string, any>
  icon?: string
  color?: string
}

// 地图图层类型
export type LayerType = 'marker' | 'heatmap' | 'line' | 'fill' | 'cluster'

// 图层配置
export interface LayerConfig {
  id: string
  type: LayerType
  data: any[]
  visible?: boolean
  style?: Record<string, any>
}

// 地图视图状态
export interface MapViewState {
  center: [number, number]
  zoom: number
  bearing?: number
  pitch?: number
}

// 地图服务配置
export interface MapProviderConfig {
  name: string
  url: string
  attribution?: string
  accessToken?: string
}

// 地理围栏
export interface GeoFence {
  id: string
  name: string
  geometry: GeoPolygon
  alertOnEnter?: boolean
  alertOnExit?: boolean
  createdAt: string
}

// 位置追踪记录
export interface LocationTrack {
  id: string
  recordId: string
  coordinates: [number, number]
  timestamp: string
  speed?: number
  accuracy?: number
}

// 测量结果
export interface MeasureResult {
  type: 'distance' | 'area' | 'angle'
  value: number
  unit: string
  geometry?: Geometry
}

// GeoJSON Feature
export interface GeoJsonFeature {
  type: 'Feature'
  geometry: Geometry
  properties: Record<string, any>
}

export interface GeoJsonFeatureCollection {
  type: 'FeatureCollection'
  features: GeoJsonFeature[]
}