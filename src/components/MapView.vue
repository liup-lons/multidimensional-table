<script setup lang="ts">
import { ref, onMounted, onUnmounted, watch } from 'vue'
import { MapService } from '@/services/MapService'
import { mapProviders } from '@/config/map'
import type { MapMarker, LayerConfig, MapViewState } from '@/types/geo'

// Props
const props = defineProps<{
  modelValue?: MapViewState
  markers?: MapMarker[]
  layers?: LayerConfig[]
}>()

// Emits
const emit = defineEmits<{
  (e: 'update:modelValue', value: MapViewState): void
  (e: 'marker-click', marker: MapMarker): void
  (e: 'map-click', coordinates: [number, number]): void
}>()

// 状态
const mapContainer = ref<HTMLElement | null>(null)
const isLoading = ref(true)
const selectedProvider = ref(0)
const showControls = ref(true)
const zoom = ref(12)
const center = ref<[number, number]>([116.4074, 39.9042])

// 地图服务实例
const mapService = new MapService()

// 初始化地图
async function initMap() {
  if (!mapContainer.value) return
  
  try {
    await mapService.init(mapContainer.value, {
      center: props.modelValue?.center || center.value,
      zoom: props.modelValue?.zoom || zoom.value
    })
    
    // 添加事件监听
    mapService.on('click', handleMapClick)
    
    // 监听视图变化
    mapService.on('move', updateViewState)
    mapService.on('zoom', updateViewState)
    
    isLoading.value = false
  } catch (error) {
    console.error('地图初始化失败:', error)
    isLoading.value = false
  }
}

// 处理地图点击
function handleMapClick(event: any) {
  const coordinates = [event.lngLat.lng, event.lngLat.lat] as [number, number]
  emit('map-click', coordinates)
}

// 更新视图状态
function updateViewState() {
  const state = mapService.getViewState()
  center.value = state.center
  zoom.value = state.zoom
  emit('update:modelValue', state)
}

// 切换地图提供商
function switchProvider(index: number) {
  selectedProvider.value = index
  mapService.switchProvider(index)
}

// 定位到当前位置
async function locate() {
  try {
    const coordinates = await mapService.locate()
    center.value = coordinates
    emit('update:modelValue', mapService.getViewState())
  } catch (error) {
    console.error('定位失败:', error)
  }
}

// 缩放控制
function zoomIn() {
  mapService.setViewState({
    center: center.value,
    zoom: zoom.value + 1
  })
}

function zoomOut() {
  mapService.setViewState({
    center: center.value,
    zoom: zoom.value - 1
  })
}

// 添加标记
function addMarker(marker: MapMarker) {
  mapService.addMarker(marker)
}

// 移除标记
function removeMarker(id: string) {
  mapService.removeMarker(id)
}

// 添加图层
function addLayer(config: LayerConfig) {
  mapService.addLayer(config)
}

// 切换图层可见性
function toggleLayer(id: string) {
  mapService.toggleLayerVisibility(id)
}

// 导出图片
async function exportImage() {
  try {
    const dataUrl = await mapService.exportImage()
    // 创建下载链接
    const link = document.createElement('a')
    link.href = dataUrl
    link.download = `map-${Date.now()}.png`
    link.click()
  } catch (error) {
    console.error('导出失败:', error)
  }
}

// 监听 markers 变化
watch(() => props.markers, (newMarkers) => {
  if (newMarkers) {
    mapService.clearMarkers()
    newMarkers.forEach(marker => {
      mapService.addMarker(marker)
    })
  }
}, { deep: true })

// 监听 layers 变化
watch(() => props.layers, (newLayers) => {
  if (newLayers) {
    newLayers.forEach(layer => {
      mapService.addLayer(layer)
    })
  }
}, { deep: true })

// 生命周期
onMounted(() => {
  initMap()
})

onUnmounted(() => {
  mapService.destroy()
})

// 暴露方法给父组件
defineExpose({
  addMarker,
  removeMarker,
  addLayer,
  toggleLayer,
  locate,
  exportImage,
  flyTo: mapService.flyTo.bind(mapService)
})
</script>

<template>
  <div class="map-view">
    <!-- 加载遮罩 -->
    <div v-if="isLoading" class="map-loading">
      <div class="spinner"></div>
      <span>加载地图中...</span>
    </div>

    <!-- 地图容器 -->
    <div ref="mapContainer" class="map-container"></div>

    <!-- 控制栏 -->
    <div v-if="showControls" class="map-controls">
      <!-- 缩放控制 -->
      <div class="control-group">
        <button class="control-btn" @click="zoomIn" title="放大">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <line x1="12" y1="5" x2="12" y2="19"/>
            <line x1="5" y1="12" x2="19" y2="12"/>
          </svg>
        </button>
        <span class="zoom-level">{{ Math.round(zoom) }}</span>
        <button class="control-btn" @click="zoomOut" title="缩小">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <line x1="5" y1="12" x2="19" y2="12"/>
          </svg>
        </button>
      </div>

      <!-- 定位按钮 -->
      <button class="control-btn location-btn" @click="locate" title="定位到当前位置">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <circle cx="12" cy="12" r="10"/>
          <path d="M12 2a14.5 14.5 0 0 0 0 20 14.5 14.5 0 0 0 0-20"/>
          <circle cx="12" cy="12" r="3"/>
        </svg>
      </button>

      <!-- 地图提供商选择 -->
      <select class="provider-select" :value="selectedProvider" @change="switchProvider(Number(($event.target as HTMLSelectElement).value))">
        <option v-for="(provider, index) in mapProviders" :key="index" :value="index">
          {{ provider.name }}
        </option>
      </select>

      <!-- 导出按钮 -->
      <button class="control-btn export-btn" @click="exportImage" title="导出图片">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
          <polyline points="7 10 12 15 17 10"/>
          <line x1="12" y1="15" x2="12" y2="3"/>
        </svg>
      </button>
    </div>

    <!-- 坐标显示 -->
    <div class="coordinates-display">
      {{ center[1].toFixed(6) }}, {{ center[0].toFixed(6) }}
    </div>
  </div>
</template>

<style scoped>
.map-view {
  position: relative;
  width: 100%;
  height: 100%;
  min-height: 400px;
  background: #f5f5f5;
  border-radius: 8px;
  overflow: hidden;
}

.map-container {
  width: 100%;
  height: 100%;
}

.map-loading {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  background: rgba(255, 255, 255, 0.9);
  z-index: 100;
}

.spinner {
  width: 40px;
  height: 40px;
  border: 4px solid #f3f3f3;
  border-top: 4px solid #3B82F6;
  border-radius: 50%;
  animation: spin 1s linear infinite;
}

@keyframes spin {
  0% { transform: rotate(0deg); }
  100% { transform: rotate(360deg); }
}

.map-loading span {
  margin-top: 12px;
  color: #666;
  font-size: 14px;
}

.map-controls {
  position: absolute;
  top: 16px;
  right: 16px;
  display: flex;
  flex-direction: column;
  gap: 8px;
  z-index: 50;
}

.control-group {
  display: flex;
  flex-direction: column;
  background: white;
  border-radius: 8px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.15);
  overflow: hidden;
}

.control-btn {
  width: 36px;
  height: 36px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: white;
  border: none;
  cursor: pointer;
  color: #333;
  transition: background-color 0.2s;
}

.control-btn:hover {
  background: #f0f0f0;
}

.control-btn svg {
  width: 18px;
  height: 18px;
}

.zoom-level {
  text-align: center;
  font-size: 12px;
  color: #666;
  padding: 4px 0;
  background: #f8f9fa;
}

.location-btn {
  background: white;
  border-radius: 8px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.15);
  color: #EF4444;
}

.location-btn:hover {
  background: #fff5f5;
}

.provider-select {
  padding: 8px 12px;
  background: white;
  border: none;
  border-radius: 8px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.15);
  font-size: 12px;
  cursor: pointer;
  color: #333;
}

.export-btn {
  background: #3B82F6;
  border-radius: 8px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.2);
  color: white;
}

.export-btn:hover {
  background: #2563EB;
}

.coordinates-display {
  position: absolute;
  bottom: 16px;
  left: 16px;
  background: rgba(255, 255, 255, 0.9);
  padding: 8px 12px;
  border-radius: 4px;
  font-size: 12px;
  color: #333;
  font-family: monospace;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
}
</style>