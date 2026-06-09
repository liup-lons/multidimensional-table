<script setup lang="ts">
import { ref, computed, watch } from 'vue'
import type { GeoPoint } from '@/types/geo'

// Props
const props = defineProps<{
  modelValue?: GeoPoint | null
  fieldType?: 'geo' | 'address' | 'region'
  disabled?: boolean
  placeholder?: string
}>()

// Emits
const emit = defineEmits<{
  (e: 'update:modelValue', value: GeoPoint | null): void
  (e: 'select', coordinates: [number, number]): void
}>()

// 状态
const inputValue = ref('')
const showMapPicker = ref(false)
const selectedCoordinates = ref<[number, number] | null>(null)

// 计算属性
const displayValue = computed(() => {
  if (props.modelValue) {
    return `${props.modelValue.coordinates[1].toFixed(6)}, ${props.modelValue.coordinates[0].toFixed(6)}`
  }
  return ''
})

// 监听 modelValue 变化
watch(() => props.modelValue, (newValue) => {
  if (newValue) {
    inputValue.value = displayValue.value
    selectedCoordinates.value = newValue.coordinates
  } else {
    inputValue.value = ''
    selectedCoordinates.value = null
  }
}, { immediate: true })

// 处理输入变化
function handleInput(event: Event) {
  const value = (event.target as HTMLInputElement).value
  inputValue.value = value
  
  // 尝试解析坐标
  const match = value.match(/^\s*(-?\d+\.?\d*)\s*[,，]\s*(-?\d+\.?\d*)\s*$/)
  if (match) {
    const lat = parseFloat(match[1])
    const lng = parseFloat(match[2])
    if (!isNaN(lat) && !isNaN(lng) && lat >= -90 && lat <= 90 && lng >= -180 && lng <= 180) {
      const newValue: GeoPoint = {
        type: 'Point',
        coordinates: [lng, lat]
      }
      selectedCoordinates.value = [lng, lat]
      emit('update:modelValue', newValue)
      emit('select', [lng, lat])
    }
  }
}

// 从地图选择坐标
function handleMapSelect(coordinates: [number, number]) {
  selectedCoordinates.value = coordinates
  const newValue: GeoPoint = {
    type: 'Point',
    coordinates
  }
  inputValue.value = `${coordinates[1].toFixed(6)}, ${coordinates[0].toFixed(6)}`
  emit('update:modelValue', newValue)
  emit('select', coordinates)
  showMapPicker.value = false
}

// 清除值
function clearValue() {
  inputValue.value = ''
  selectedCoordinates.value = null
  emit('update:modelValue', null)
}

// 切换地图选择器
function toggleMapPicker() {
  showMapPicker.value = !showMapPicker.value
}
</script>

<template>
  <div class="geo-field">
    <div class="input-group">
      <input
        :value="inputValue"
        :disabled="disabled"
        :placeholder="placeholder || '输入经纬度（如：39.9042, 116.4074）'"
        @input="handleInput"
        class="geo-input"
      />
      <div class="input-actions">
        <button
          v-if="inputValue"
          @click="clearValue"
          class="action-btn clear-btn"
          :disabled="disabled"
          title="清除"
        >
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <line x1="18" y1="6" x2="6" y2="18"/>
            <line x1="6" y1="6" x2="18" y2="18"/>
          </svg>
        </button>
        <button
          @click="toggleMapPicker"
          class="action-btn map-btn"
          :disabled="disabled"
          title="在地图上选择"
        >
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <polygon points="1 6 1 22 8 18 16 22 23 18 23 2 16 6 8 2 1 6"/>
            <line x1="8" y1="2" x2="8" y2="18"/>
            <line x1="16" y1="6" x2="16" y2="22"/>
          </svg>
        </button>
      </div>
    </div>

    <!-- 地图选择器弹窗 -->
    <Transition name="fade">
      <div v-if="showMapPicker" class="map-picker-overlay" @click.self="showMapPicker = false">
        <div class="map-picker">
          <div class="map-picker-header">
            <h3>在地图上选择位置</h3>
            <button @click="showMapPicker = false" class="close-btn">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <line x1="18" y1="6" x2="6" y2="18"/>
                <line x1="6" y1="6" x2="18" y2="18"/>
              </svg>
            </button>
          </div>
          <div class="map-picker-content">
            <MapView
              v-if="selectedCoordinates"
              :model-value="{ center: selectedCoordinates, zoom: 16 }"
              @map-click="handleMapSelect"
            />
            <MapView
              v-else
              @map-click="handleMapSelect"
            />
          </div>
          <div class="map-picker-footer">
            <span>点击地图上的位置来选择坐标</span>
          </div>
        </div>
      </div>
    </Transition>
  </div>
</template>

<style scoped>
.geo-field {
  position: relative;
}

.input-group {
  display: flex;
  align-items: center;
  border: 1px solid #e5e7eb;
  border-radius: 6px;
  overflow: hidden;
  transition: border-color 0.2s;
}

.input-group:focus-within {
  border-color: #3B82F6;
  outline: 2px solid rgba(59, 130, 246, 0.2);
}

.geo-input {
  flex: 1;
  padding: 8px 12px;
  border: none;
  outline: none;
  font-size: 14px;
  background: white;
}

.geo-input:disabled {
  background: #f9fafb;
  color: #9ca3af;
}

.geo-input::placeholder {
  color: #9ca3af;
}

.input-actions {
  display: flex;
  border-left: 1px solid #e5e7eb;
}

.action-btn {
  width: 36px;
  height: 36px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: white;
  border: none;
  cursor: pointer;
  color: #6b7280;
  transition: background-color 0.2s, color 0.2s;
}

.action-btn:hover:not(:disabled) {
  background: #f3f4f6;
}

.action-btn:disabled {
  cursor: not-allowed;
  opacity: 0.5;
}

.action-btn svg {
  width: 16px;
  height: 16px;
}

.clear-btn:hover:not(:disabled) {
  color: #EF4444;
}

.map-btn:hover:not(:disabled) {
  color: #3B82F6;
}

.map-picker-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
  padding: 20px;
}

.map-picker {
  width: 100%;
  max-width: 800px;
  max-height: 600px;
  background: white;
  border-radius: 12px;
  overflow: hidden;
  box-shadow: 0 20px 40px rgba(0, 0, 0, 0.2);
}

.map-picker-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 16px 20px;
  border-bottom: 1px solid #e5e7eb;
}

.map-picker-header h3 {
  margin: 0;
  font-size: 16px;
  font-weight: 600;
  color: #1f2937;
}

.close-btn {
  width: 28px;
  height: 28px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: transparent;
  border: none;
  cursor: pointer;
  color: #6b7280;
  border-radius: 6px;
  transition: background-color 0.2s;
}

.close-btn:hover {
  background: #f3f4f6;
}

.close-btn svg {
  width: 16px;
  height: 16px;
}

.map-picker-content {
  height: 480px;
}

.map-picker-footer {
  padding: 12px 20px;
  border-top: 1px solid #e5e7eb;
  background: #f9fafb;
}

.map-picker-footer span {
  font-size: 12px;
  color: #6b7280;
}

.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.2s;
}

.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}
</style>