// 地图服务类
import mapboxgl from 'mapbox-gl'
import { mapProviders, defaultMapConfig, mapStyles } from '@/config/map'
import type { MapMarker, LayerConfig, MapViewState, Geometry, GeoJsonFeatureCollection } from '@/types/geo'

export class MapService {
  private map: mapboxgl.Map | null = null
  private container: HTMLElement | null = null
  private layers: Map<string, LayerConfig> = new Map()
  private markers: Map<string, mapboxgl.Marker> = new Map()
  private currentProviderIndex: number = defaultMapConfig.defaultProviderIndex

  // 初始化地图
  init(container: HTMLElement, options?: Partial<MapViewState>): Promise<void> {
    return new Promise((resolve, reject) => {
      try {
        this.container = container
        
        // 设置地图容器样式
        container.style.width = '100%'
        container.style.height = '100%'
        
        const provider = mapProviders[this.currentProviderIndex]
        
        this.map = new mapboxgl.Map({
          container,
          style: {
            version: 8,
            sources: {
              'raster-tiles': {
                type: 'raster',
                tiles: [provider.url],
                tileSize: 256,
                attribution: provider.attribution
              }
            },
            layers: [
              {
                id: 'raster-layer',
                type: 'raster',
                source: 'raster-tiles',
                minzoom: defaultMapConfig.minZoom,
                maxzoom: defaultMapConfig.maxZoom
              }
            ]
          },
          center: options?.center || defaultMapConfig.defaultCenter,
          zoom: options?.zoom || defaultMapConfig.defaultZoom,
          bearing: options?.bearing || 0,
          pitch: options?.pitch || (defaultMapConfig.enable3d ? 60 : 0),
          antialias: true
        })

        // 添加导航控件
        this.map.addControl(new mapboxgl.NavigationControl(), 'top-right')
        
        // 添加比例尺控件
        this.map.addControl(new mapboxgl.ScaleControl({ maxWidth: 100 }), 'bottom-left')

        this.map.on('load', () => {
          resolve()
        })

        this.map.on('error', (error) => {
          reject(error)
        })
      } catch (error) {
        reject(error)
      }
    })
  }

  // 销毁地图
  destroy(): void {
    if (this.map) {
      this.map.remove()
      this.map = null
    }
    this.layers.clear()
    this.markers.clear()
  }

  // 获取地图实例
  getMap(): mapboxgl.Map | null {
    return this.map
  }

  // 设置视图状态
  setViewState(state: MapViewState): void {
    if (this.map) {
      this.map.jumpTo({
        center: state.center,
        zoom: state.zoom,
        bearing: state.bearing,
        pitch: state.pitch
      })
    }
  }

  // 获取当前视图状态
  getViewState(): MapViewState {
    if (!this.map) {
      return {
        center: defaultMapConfig.defaultCenter,
        zoom: defaultMapConfig.defaultZoom
      }
    }
    const center = this.map.getCenter()
    return {
      center: [center.lng, center.lat] as [number, number],
      zoom: this.map.getZoom(),
      bearing: this.map.getBearing(),
      pitch: this.map.getPitch()
    }
  }

  // 切换地图提供商
  switchProvider(index: number): void {
    if (index < 0 || index >= mapProviders.length) {
      return
    }
    this.currentProviderIndex = index
    const provider = mapProviders[index]
    
    if (this.map && this.map.isStyleLoaded()) {
      this.map.getStyle().sources['raster-tiles'] = {
        type: 'raster',
        tiles: [provider.url],
        tileSize: 256,
        attribution: provider.attribution
      } as any
      this.map.reload()
    }
  }

  // 获取当前地图提供商
  getCurrentProvider() {
    return mapProviders[this.currentProviderIndex]
  }

  // 添加标记
  addMarker(marker: MapMarker): void {
    if (!this.map) return

    const el = document.createElement('div')
    el.className = 'map-marker'
    el.style.width = `${mapStyles.marker.radius * 2}px`
    el.style.height = `${mapStyles.marker.radius * 2}px`
    el.style.borderRadius = '50%'
    el.style.backgroundColor = marker.color || mapStyles.marker.defaultColor
    el.style.border = `${mapStyles.marker.strokeWidth}px solid ${mapStyles.marker.strokeColor}`
    el.style.cursor = 'pointer'
    el.style.boxShadow = '0 2px 8px rgba(0, 0, 0, 0.3)'

    const mapboxMarker = new mapboxgl.Marker(el)
      .setLngLat(marker.coordinates)
      .addTo(this.map)

    // 存储标记引用
    this.markers.set(marker.id, mapboxMarker)
  }

  // 移除标记
  removeMarker(id: string): void {
    const marker = this.markers.get(id)
    if (marker) {
      marker.remove()
      this.markers.delete(id)
    }
  }

  // 清除所有标记
  clearMarkers(): void {
    this.markers.forEach(marker => marker.remove())
    this.markers.clear()
  }

  // 添加图层
  addLayer(config: LayerConfig): void {
    if (!this.map || !this.map.isStyleLoaded()) return

    this.layers.set(config.id, config)

    switch (config.type) {
      case 'marker':
        this.addMarkerLayer(config)
        break
      case 'heatmap':
        this.addHeatmapLayer(config)
        break
      case 'line':
        this.addLineLayer(config)
        break
      case 'fill':
        this.addFillLayer(config)
        break
    }
  }

  // 添加标记图层
  private addMarkerLayer(config: LayerConfig): void {
    if (!this.map) return

    const sourceId = `source-${config.id}`
    const layerId = `layer-${config.id}`

    // 移除已存在的图层和数据源
    this.removeLayer(config.id)

    // 添加数据源
    this.map.addSource(sourceId, {
      type: 'geojson',
      data: {
        type: 'FeatureCollection',
        features: config.data.map((item: MapMarker) => ({
          type: 'Feature',
          geometry: {
            type: 'Point',
            coordinates: item.coordinates
          },
          properties: item.properties
        }))
      }
    })

    // 添加图层
    this.map.addLayer({
      id: layerId,
      type: 'circle',
      source: sourceId,
      paint: {
        'circle-radius': config.style?.radius || mapStyles.marker.radius,
        'circle-color': config.style?.color || mapStyles.marker.defaultColor,
        'circle-stroke-color': mapStyles.marker.strokeColor,
        'circle-stroke-width': mapStyles.marker.strokeWidth
      }
    })
  }

  // 添加热力图图层
  private addHeatmapLayer(config: LayerConfig): void {
    if (!this.map) return

    const sourceId = `source-${config.id}`
    const layerId = `layer-${config.id}`

    this.removeLayer(config.id)

    this.map.addSource(sourceId, {
      type: 'geojson',
      data: {
        type: 'FeatureCollection',
        features: config.data.map((item: MapMarker) => ({
          type: 'Feature',
          geometry: {
            type: 'Point',
            coordinates: item.coordinates
          },
          properties: item.properties
        }))
      }
    })

    this.map.addLayer({
      id: layerId,
      type: 'heatmap',
      source: sourceId,
      paint: {
        'heatmap-radius': config.style?.radius || mapStyles.heatmap.radius,
        'heatmap-blur': config.style?.blur || mapStyles.heatmap.blur,
        'heatmap-opacity': config.style?.opacity || mapStyles.heatmap.opacity,
        'heatmap-color': config.style?.gradient || mapStyles.heatmap.gradient
      }
    })
  }

  // 添加路径图层
  private addLineLayer(config: LayerConfig): void {
    if (!this.map) return

    const sourceId = `source-${config.id}`
    const layerId = `layer-${config.id}`

    this.removeLayer(config.id)

    this.map.addSource(sourceId, {
      type: 'geojson',
      data: {
        type: 'FeatureCollection',
        features: config.data.map((item: { coordinates: [number, number][] }) => ({
          type: 'Feature',
          geometry: {
            type: 'LineString',
            coordinates: item.coordinates
          },
          properties: {}
        }))
      }
    })

    this.map.addLayer({
      id: layerId,
      type: 'line',
      source: sourceId,
      paint: {
        'line-color': config.style?.color || mapStyles.line.color,
        'line-width': config.style?.width || mapStyles.line.width,
        'line-opacity': config.style?.opacity || mapStyles.line.opacity
      }
    })
  }

  // 添加填充图层
  private addFillLayer(config: LayerConfig): void {
    if (!this.map) return

    const sourceId = `source-${config.id}`
    const layerId = `layer-${config.id}`

    this.removeLayer(config.id)

    this.map.addSource(sourceId, {
      type: 'geojson',
      data: {
        type: 'FeatureCollection',
        features: config.data.map((item: { coordinates: [number, number][][] }) => ({
          type: 'Feature',
          geometry: {
            type: 'Polygon',
            coordinates: item.coordinates
          },
          properties: {}
        }))
      }
    })

    this.map.addLayer({
      id: layerId,
      type: 'fill',
      source: sourceId,
      paint: {
        'fill-color': config.style?.color || mapStyles.fill.strokeColor,
        'fill-opacity': config.style?.opacity || mapStyles.fill.opacity,
        'fill-outline-color': config.style?.strokeColor || mapStyles.fill.strokeColor
      }
    })
  }

  // 移除图层
  removeLayer(id: string): void {
    const config = this.layers.get(id)
    if (!config || !this.map) return

    const sourceId = `source-${id}`
    const layerId = `layer-${id}`

    if (this.map.getLayer(layerId)) {
      this.map.removeLayer(layerId)
    }
    if (this.map.getSource(sourceId)) {
      this.map.removeSource(sourceId)
    }

    this.layers.delete(id)
  }

  // 切换图层可见性
  toggleLayerVisibility(id: string): void {
    const config = this.layers.get(id)
    if (!config || !this.map) return

    const layerId = `layer-${id}`
    const visibility = this.map.getLayoutProperty(layerId, 'visibility')
    
    this.map.setLayoutProperty(layerId, 'visibility', visibility === 'visible' ? 'none' : 'visible')
    config.visible = visibility !== 'visible'
  }

  // 定位到当前位置
  locate(): Promise<[number, number]> {
    return new Promise((resolve, reject) => {
      if (!this.map) {
        reject(new Error('地图未初始化'))
        return
      }

      this.map.locate({
        setView: true,
        maxZoom: 16,
        enableHighAccuracy: true
      })

      this.map.once('locationfound', (event) => {
        const coordinates = [event.lngLat.lng, event.lngLat.lat] as [number, number]
        resolve(coordinates)
      })

      this.map.once('locationerror', (event) => {
        reject(event.error)
      })
    })
  }

  // 飞跳到指定位置
  flyTo(coordinates: [number, number], zoom?: number): void {
    if (this.map) {
      this.map.flyTo({
        center: coordinates,
        zoom: zoom || this.map.getZoom(),
        duration: 1000
      })
    }
  }

  // 导出地图为图片
  exportImage(options?: { format?: 'png' | 'jpeg'; quality?: number; width?: number; height?: number }): Promise<string> {
    return new Promise((resolve, reject) => {
      if (!this.map) {
        reject(new Error('地图未初始化'))
        return
      }

      const format = options?.format || 'png'
      const quality = options?.quality || 1
      const width = options?.width || this.container?.clientWidth || 800
      const height = options?.height || this.container?.clientHeight || 600

      this.map.once('render', () => {
        const canvas = this.map.getCanvas()
        const dataUrl = canvas.toDataURL(`image/${format}`, quality)
        resolve(dataUrl)
      })

      // 强制重绘
      this.map.triggerRepaint()
    })
  }

  // 导出数据为 GeoJSON
  exportGeoJson(): GeoJsonFeatureCollection {
    const features: any[] = []

    // 导出标记
    this.markers.forEach((marker, id) => {
      const lngLat = marker.getLngLat()
      features.push({
        type: 'Feature',
        geometry: {
          type: 'Point',
          coordinates: [lngLat.lng, lngLat.lat]
        },
        properties: { id }
      })
    })

    // 导出图层数据
    this.layers.forEach((config) => {
      if (config.data) {
        config.data.forEach((item: any) => {
          features.push({
            type: 'Feature',
            geometry: {
              type: config.type === 'marker' ? 'Point' : 
                     config.type === 'line' ? 'LineString' : 'Polygon',
              coordinates: item.coordinates
            },
            properties: item.properties || {}
          })
        })
      }
    })

    return {
      type: 'FeatureCollection',
      features
    }
  }

  // 添加点击事件监听
  on(event: string, handler: (event: any) => void): void {
    if (this.map) {
      this.map.on(event, handler)
    }
  }

  // 移除事件监听
  off(event: string, handler: (event: any) => void): void {
    if (this.map) {
      this.map.off(event, handler)
    }
  }
}