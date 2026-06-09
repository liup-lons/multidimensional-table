<script setup lang="ts">import { ref, onMounted, computed } from 'vue';
import { MapView, GeoField, AddressField, RegionField, mapProviders, mapStyles, type GeoPoint, type MapMarker, type LayerConfig } from '@/components/gis';
import { cityMarkers, poiMarkers, heatmapData, addressData, getAllMarkers } from '@/data/gis-test-data';
// 地图视图引用
const mapViewRef = ref<InstanceType<typeof MapView> | null>(null);
// 地理坐标字段值
const geoValue = ref<GeoPoint | null>(null);
// 地址字段值
const addressValue = ref('');
const geocodeValue = ref<GeoPoint | null>(null);
// 区域字段值
const regionValue = ref({
 province: '',
 city: '',
 district: ''
});
// 当前显示的标记类型
const markerType = ref<'all' | 'city' | 'poi'>('all');
// 根据类型筛选标记
const markers = computed<MapMarker[]>(() => {
 if (markerType.value === 'city') {
 return cityMarkers;
 }
 else if (markerType.value === 'poi') {
 return poiMarkers;
 }
 return getAllMarkers();
});
// 图层配置
const layers = ref<LayerConfig[]>([]);
// 当前选中的地图提供商
const selectedProvider = ref(0);
// 是否显示热力图
const showHeatmap = ref(false);
// 处理地理坐标选择
function handleGeoSelect(coordinates: [number, number]) {
 console.log('选中坐标:', coordinates);
 // 在地图上标记选中位置
 if (mapViewRef.value) {
 mapViewRef.value.flyTo(coordinates, 16);
 }
}
// 处理地址地理编码
function handleGeocode(result: {
 address: string;
 coordinates: GeoPoint;
}) {
 console.log('地理编码结果:', result);
 geoValue.value = result.coordinates;
 if (mapViewRef.value) {
 mapViewRef.value.flyTo(result.coordinates.coordinates, 16);
 }
}
// 处理区域选择
function handleRegionChange(value: {
 province: string;
 city: string;
 district: string;
}) {
 console.log('区域选择:', value);
}
// 切换热力图
function toggleHeatmap() {
 showHeatmap.value = !showHeatmap.value;
 if (showHeatmap.value) {
 // 添加热力图图层（使用测试数据）
 const heatmapLayer: LayerConfig = {
 id: 'heatmap-layer',
 type: 'heatmap',
 data: heatmapData,
 visible: true,
 style: {
 radius: 30,
 blur: 20,
 opacity: 0.8,
 gradient: mapStyles.heatmap.gradient
 }
 };
 if (mapViewRef.value) {
 mapViewRef.value.addLayer(heatmapLayer);
 }
 }
 else {
 // 移除热力图图层
 if (mapViewRef.value) {
 mapViewRef.value.toggleLayer('heatmap-layer');
 }
 }
}

// 切换标记类型
function switchMarkerType(type: 'all' | 'city' | 'poi') {
 markerType.value = type;
 // 重新加载标记
 if (mapViewRef.value) {
 // 先清除所有标记，再重新添加
 // MapView组件会自动处理markers变化
 }
}

// 点击地址跳转到对应位置
function handleAddressClick(addr: { id: string; address: string; coordinates: [number, number] }) {
 addressValue.value = addr.address;
 const coordinates: GeoPoint = {
 type: 'Point',
 coordinates: addr.coordinates
 };
 geocodeValue.value = coordinates;
 if (mapViewRef.value) {
 mapViewRef.value.flyTo(addr.coordinates, 15);
 }
}
// 导出地图图片
function exportMap() {
 if (mapViewRef.value) {
 mapViewRef.value.exportImage();
 }
}
// 定位到当前位置
function locate() {
 if (mapViewRef.value) {
 mapViewRef.value.locate();
 }
}
// 初始化
onMounted(() => {
 // 添加标记到地图
 markers.value.forEach(marker => {
 if (mapViewRef.value) {
 mapViewRef.value.addMarker(marker);
 }
 });
});
</script>

<template>
  <div class="gis-view">
    <div class="view-header">
      <h1>GIS 地理信息功能展示</h1>
      <p class="subtitle">多维表格地理信息模块演示</p>
    </div>

    <div class="view-content">
      <!-- 左侧控制面板 -->
      <div class="control-panel">
        <div class="panel-section">
          <h3>📍 地理坐标字段</h3>
          <GeoField
            v-model="geoValue"
            @select="handleGeoSelect"
          />
          <div v-if="geoValue" class="field-result">
            坐标值: {{ geoValue.coordinates[1].toFixed(6) }}, {{ geoValue.coordinates[0].toFixed(6) }}
          </div>
        </div>

        <div class="panel-section">
          <h3>🏠 地址字段</h3>
          <AddressField
            v-model="addressValue"
            v-model:geocode-value="geocodeValue"
            @geocode="handleGeocode"
          />
        </div>

        <div class="panel-section">
          <h3>📌 区域字段</h3>
          <RegionField
            v-model="regionValue"
            @update:model-value="handleRegionChange"
          />
        </div>

        <div class="panel-section">
          <h3>🎛️ 地图操作</h3>
          <div class="button-group">
            <button @click="locate" class="btn btn-primary">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <circle cx="12" cy="12" r="10"/>
                <path d="M12 2a14.5 14.5 0 0 0 0 20 14.5 14.5 0 0 0 0-20"/>
                <circle cx="12" cy="12" r="3"/>
              </svg>
              定位
            </button>
            <button @click="toggleHeatmap" class="btn" :class="{ 'btn-active': showHeatmap }">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <circle cx="12" cy="12" r="10"/>
                <circle cx="12" cy="12" r="6"/>
                <circle cx="12" cy="12" r="2"/>
              </svg>
              热力图
            </button>
            <button @click="exportMap" class="btn btn-secondary">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
                <polyline points="7 10 12 15 17 10"/>
                <line x1="12" y1="15" x2="12" y2="3"/>
              </svg>
              导出
            </button>
          </div>
        </div>

        <div class="panel-section">
          <h3>📍 标记列表</h3>
          <!-- 标记类型切换 -->
          <div class="type-tabs">
            <button
              v-for="type in [{ value: 'all', label: '全部' }, { value: 'city', label: '城市' }, { value: 'poi', label: '兴趣点' }]"
              :key="type.value"
              :class="{ active: markerType === type.value }"
              @click="switchMarkerType(type.value as 'all' | 'city' | 'poi')"
              class="type-tab"
            >
              {{ type.label }}
            </button>
          </div>
          <div class="marker-list">
            <div
              v-for="marker in markers"
              :key="marker.id"
              class="marker-item"
              @click="mapViewRef?.flyTo(marker.coordinates, 15)"
            >
              <span class="marker-color" :style="{ backgroundColor: marker.color }"></span>
              <div class="marker-info">
                <span class="marker-name">{{ marker.properties.name }}</span>
                <span v-if="marker.properties.type" class="marker-type">{{ marker.properties.type }}</span>
              </div>
            </div>
          </div>
        </div>

        <!-- 示例地址列表 -->
        <div class="panel-section">
          <h3>🏠 示例地址</h3>
          <div class="address-list">
            <div
              v-for="addr in addressData"
              :key="addr.id"
              class="address-item"
              @click="handleAddressClick(addr)"
            >
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/>
                <circle cx="12" cy="10" r="3"/>
              </svg>
              <span class="address-text">{{ addr.address }}</span>
            </div>
          </div>
        </div>
      </div>

      <!-- 右侧地图区域 -->
      <div class="map-section">
        <div class="map-header">
          <select
            :value="selectedProvider"
            @change="selectedProvider = Number(($event.target as HTMLSelectElement).value)"
            class="provider-select"
          >
            <option v-for="(provider, index) in mapProviders" :key="index" :value="index">
              {{ provider.name }}
            </option>
          </select>
        </div>
        <MapView
          ref="mapViewRef"
          :markers="markers"
        />
      </div>
    </div>
  </div>
</template>

<style scoped>
.gis-view {
  display: flex;
  flex-direction: column;
  height: 100%;
  background: #f5f7fa;
}

.view-header {
  padding: 16px 20px;
  background: white;
  border-bottom: 1px solid #e5e7eb;
}

.view-header h1 {
  margin: 0;
  font-size: 20px;
  font-weight: 600;
  color: #1f2937;
}

.subtitle {
  margin: 4px 0 0;
  font-size: 13px;
  color: #6b7280;
}

.view-content {
  flex: 1;
  display: flex;
  padding: 16px;
  gap: 16px;
  overflow: hidden;
}

.control-panel {
  width: 320px;
  flex-shrink: 0;
  background: white;
  border-radius: 12px;
  padding: 20px;
  overflow-y: auto;
}

.panel-section {
  margin-bottom: 24px;
}

.panel-section:last-child {
  margin-bottom: 0;
}

.panel-section h3 {
  margin: 0 0 12px;
  font-size: 14px;
  font-weight: 600;
  color: #374151;
}

.field-result {
  margin-top: 8px;
  padding: 8px 12px;
  background: #eff6ff;
  border-radius: 4px;
  font-size: 13px;
  font-family: monospace;
  color: #1f2937;
}

.button-group {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.btn {
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 10px 16px;
  border: 1px solid #e5e7eb;
  border-radius: 8px;
  background: white;
  cursor: pointer;
  font-size: 14px;
  color: #374151;
  transition: all 0.2s;
}

.btn:hover {
  background: #f9fafb;
  border-color: #d1d5db;
}

.btn svg {
  width: 16px;
  height: 16px;
  margin-right: 8px;
}

.btn-primary {
  background: #3B82F6;
  border-color: #3B82F6;
  color: white;
}

.btn-primary:hover {
  background: #2563EB;
  border-color: #2563EB;
}

.btn-secondary {
  background: #f3f4f6;
  border-color: #d1d5db;
}

.btn-active {
  background: #FEF3C7;
  border-color: #F59E0B;
  color: #D97706;
}

.marker-list {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.marker-item {
  display: flex;
  align-items: center;
  padding: 10px 12px;
  background: #f9fafb;
  border-radius: 8px;
  cursor: pointer;
  transition: background-color 0.2s;
}

.marker-item:hover {
  background: #f3f4f6;
}

.marker-color {
  width: 12px;
  height: 12px;
  border-radius: 50%;
  margin-right: 10px;
}

.marker-name {
  font-size: 14px;
  color: #374151;
}

.marker-type {
  font-size: 11px;
  color: #9ca3af;
  margin-left: 8px;
  padding: 2px 6px;
  background: #f3f4f6;
  border-radius: 4px;
}

.marker-info {
  display: flex;
  align-items: center;
}

.type-tabs {
  display: flex;
  gap: 4px;
  margin-bottom: 12px;
}

.type-tab {
  padding: 4px 12px;
  font-size: 12px;
  background: #f3f4f6;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  color: #6b7280;
  transition: all 0.2s;
}

.type-tab:hover {
  background: #e5e7eb;
}

.type-tab.active {
  background: #3B82F6;
  color: white;
}

.address-list {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.address-item {
  display: flex;
  align-items: flex-start;
  padding: 10px 12px;
  background: #f9fafb;
  border-radius: 8px;
  cursor: pointer;
  transition: background-color 0.2s;
}

.address-item:hover {
  background: #f3f4f6;
}

.address-item svg {
  width: 14px;
  height: 14px;
  color: #3B82F6;
  margin-right: 10px;
  flex-shrink: 0;
  margin-top: 2px;
}

.address-text {
  font-size: 13px;
  color: #374151;
  line-height: 1.4;
}

.map-section {
  flex: 1;
  display: flex;
  flex-direction: column;
  background: white;
  border-radius: 12px;
  overflow: hidden;
}

.map-header {
  padding: 12px 20px;
  border-bottom: 1px solid #e5e7eb;
}

.provider-select {
  padding: 6px 12px;
  border: 1px solid #e5e7eb;
  border-radius: 6px;
  font-size: 14px;
  background: white;
  cursor: pointer;
}
</style>