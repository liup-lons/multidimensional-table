<script setup lang="ts">import { ref, watch } from 'vue';
import type { GeoPoint } from '@/types/geo';
// Props
const props = defineProps<{
 modelValue?: string;
 geocodeValue?: GeoPoint | null;
 disabled?: boolean;
 placeholder?: string;
}>();
// Emits
const emit = defineEmits<{
 (e: 'update:modelValue', value: string): void;
 (e: 'update:geocodeValue', value: GeoPoint | null): void;
 (e: 'geocode', result: {
 address: string;
 coordinates: GeoPoint;
 }): void;
}>();
// 状态
const inputValue = ref('');
const suggestions = ref<string[]>([]);
const isLoading = ref(false);
const showSuggestions = ref(false);
// 模拟地理编码数据（实际项目中应调用真实的地理编码API）
const mockAddresses = [
 '北京市朝阳区建国路88号',
 '北京市海淀区中关村大街1号',
 '北京市西城区西单北大街120号',
 '北京市东城区王府井大街138号',
 '北京市丰台区方庄南路18号'
];
// 监听 modelValue 变化
watch(() => props.modelValue, (newValue) => {
 inputValue.value = newValue || '';
}, { immediate: true });
// 处理输入变化
function handleInput(event: Event) {
 const value = (event.target as HTMLInputElement).value;
 inputValue.value = value;
 emit('update:modelValue', value);
 // 提供地址建议
 if (value.length >= 2) {
 suggestions.value = mockAddresses.filter(addr => addr.includes(value));
 showSuggestions.value = suggestions.value.length > 0;
 }
 else {
 suggestions.value = [];
 showSuggestions.value = false;
 }
}
// 选择建议
function selectSuggestion(address: string) {
 inputValue.value = address;
 emit('update:modelValue', address);
 // 模拟地理编码
 geocodeAddress(address);
 suggestions.value = [];
 showSuggestions.value = false;
}
// 地理编码（模拟）
async function geocodeAddress(address: string) {
 isLoading.value = true;
 // 模拟API延迟
 await new Promise(resolve => setTimeout(resolve, 500));
 // 模拟返回坐标（北京中心点附近随机偏移）
 const baseLng = 116.4074;
 const baseLat = 39.9042;
 const offsetLng = (Math.random() - 0.5) * 0.1;
 const offsetLat = (Math.random() - 0.5) * 0.1;
 const coordinates: GeoPoint = {
 type: 'Point',
 coordinates: [baseLng + offsetLng, baseLat + offsetLat]
 };
 emit('update:geocodeValue', coordinates);
 emit('geocode', { address, coordinates });
 isLoading.value = false;
}
// 手动触发地理编码
async function handleGeocode() {
 if (inputValue.value.trim()) {
 await geocodeAddress(inputValue.value.trim());
 }
}
// 清除值
function clearValue() {
 inputValue.value = '';
 emit('update:modelValue', '');
 emit('update:geocodeValue', null);
 suggestions.value = [];
 showSuggestions.value = false;
}
// 点击外部关闭建议
function handleClickOutside() {
 showSuggestions.value = false;
}
</script>

<template>
  <div class="address-field" ref="fieldRef">
    <div class="input-group">
      <input
        :value="inputValue"
        :disabled="disabled || isLoading"
        :placeholder="placeholder || '输入地址'"
        @input="handleInput"
        @focus="showSuggestions = suggestions.length > 0"
        @blur="setTimeout(handleClickOutside, 200)"
        class="address-input"
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
          @click="handleGeocode"
          :disabled="disabled || !inputValue || isLoading"
          class="action-btn geocode-btn"
          title="解析地址"
        >
          <svg v-if="!isLoading" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <circle cx="12" cy="12" r="10"/>
            <polygon points="16.24 7.76 14.12 14.12 7.76 16.24 9.88 9.88 16.24 7.76"/>
          </svg>
          <svg v-else class="spinner" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <circle cx="12" cy="12" r="10"/>
          </svg>
        </button>
      </div>
    </div>

    <!-- 地址建议列表 -->
    <Transition name="dropdown">
      <div v-if="showSuggestions && suggestions.length > 0" class="suggestions-list">
        <button
          v-for="(address, index) in suggestions"
          :key="index"
          @click="selectSuggestion(address)"
          class="suggestion-item"
        >
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/>
            <circle cx="12" cy="10" r="3"/>
          </svg>
          <span>{{ address }}</span>
        </button>
      </div>
    </Transition>

    <!-- 地理编码结果显示 -->
    <div v-if="geocodeValue" class="geocode-result">
      <span class="result-label">解析结果：</span>
      <span class="result-coordinates">
        {{ geocodeValue.coordinates[1].toFixed(6) }}, {{ geocodeValue.coordinates[0].toFixed(6) }}
      </span>
    </div>
  </div>
</template>

<style scoped>
.address-field {
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

.address-input {
  flex: 1;
  padding: 8px 12px;
  border: none;
  outline: none;
  font-size: 14px;
  background: white;
}

.address-input:disabled {
  background: #f9fafb;
  color: #9ca3af;
}

.address-input::placeholder {
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

.geocode-btn:hover:not(:disabled) {
  color: #3B82F6;
}

.geocode-btn svg.spinner {
  animation: spin 1s linear infinite;
}

@keyframes spin {
  from { transform: rotate(0deg); }
  to { transform: rotate(360deg); }
}

.suggestions-list {
  position: absolute;
  top: calc(100% + 4px);
  left: 0;
  right: 0;
  background: white;
  border: 1px solid #e5e7eb;
  border-radius: 6px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
  z-index: 100;
  max-height: 200px;
  overflow-y: auto;
}

.suggestion-item {
  display: flex;
  align-items: center;
  padding: 10px 12px;
  border: none;
  background: transparent;
  cursor: pointer;
  width: 100%;
  text-align: left;
  transition: background-color 0.2s;
}

.suggestion-item:hover {
  background: #f3f4f6;
}

.suggestion-item svg {
  width: 14px;
  height: 14px;
  color: #3B82F6;
  margin-right: 8px;
  flex-shrink: 0;
}

.suggestion-item span {
  font-size: 14px;
  color: #374151;
}

.geocode-result {
  margin-top: 8px;
  padding: 8px 12px;
  background: #eff6ff;
  border-radius: 4px;
  font-size: 13px;
}

.result-label {
  color: #6b7280;
  margin-right: 8px;
}

.result-coordinates {
  color: #1f2937;
  font-family: monospace;
}

.dropdown-enter-active,
.dropdown-leave-active {
  transition: all 0.2s;
}

.dropdown-enter-from,
.dropdown-leave-to {
  opacity: 0;
  transform: translateY(-8px);
}
</style>