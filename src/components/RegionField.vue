<script setup lang="ts">import { ref, watch, computed } from 'vue';
import { regionData } from '@/config/map';
// Props
const props = defineProps<{
 modelValue?: {
 province: string;
 city: string;
 district: string;
 };
 disabled?: boolean;
}>();
// Emits
const emit = defineEmits<{
 (e: 'update:modelValue', value: {
 province: string;
 city: string;
 district: string;
 }): void;
}>();
// 状态
const province = ref('');
const city = ref('');
const district = ref('');
// 模拟城市数据
const cityData: Record<string, Array<{
 code: string;
 name: string;
}>> = {
 '110000': [
 { code: '110100', name: '北京市' }
 ],
 '310000': [
 { code: '310100', name: '上海市' }
 ],
 '440000': [
 { code: '440100', name: '广州市' },
 { code: '440300', name: '深圳市' },
 { code: '440200', name: '韶关市' },
 { code: '440300', name: '深圳市' }
 ],
 '320000': [
 { code: '320100', name: '南京市' },
 { code: '320500', name: '苏州市' },
 { code: '320200', name: '无锡市' },
 { code: '320600', name: '南通市' }
 ],
 '330000': [
 { code: '330100', name: '杭州市' },
 { code: '330200', name: '宁波市' },
 { code: '330300', name: '温州市' },
 { code: '330400', name: '嘉兴市' }
 ]
};
// 模拟区县数据
const districtData: Record<string, Array<{
 code: string;
 name: string;
}>> = {
 '110100': [
 { code: '110101', name: '东城区' },
 { code: '110102', name: '西城区' },
 { code: '110105', name: '朝阳区' },
 { code: '110106', name: '丰台区' },
 { code: '110107', name: '石景山区' },
 { code: '110108', name: '海淀区' }
 ],
 '310100': [
 { code: '310101', name: '黄浦区' },
 { code: '310104', name: '徐汇区' },
 { code: '310105', name: '长宁区' },
 { code: '310106', name: '静安区' },
 { code: '310107', name: '普陀区' },
 { code: '310109', name: '虹口区' }
 ],
 '440100': [
 { code: '440103', name: '荔湾区' },
 { code: '440104', name: '越秀区' },
 { code: '440105', name: '海珠区' },
 { code: '440106', name: '天河区' },
 { code: '440111', name: '白云区' },
 { code: '440112', name: '黄埔区' }
 ],
 '440300': [
 { code: '440303', name: '罗湖区' },
 { code: '440304', name: '福田区' },
 { code: '440305', name: '南山区' },
 { code: '440306', name: '宝安区' },
 { code: '440307', name: '龙岗区' },
 { code: '440308', name: '盐田区' }
 ],
 '320100': [
 { code: '320102', name: '玄武区' },
 { code: '320104', name: '秦淮区' },
 { code: '320105', name: '建邺区' },
 { code: '320106', name: '鼓楼区' },
 { code: '320111', name: '浦口区' },
 { code: '320113', name: '栖霞区' }
 ],
 '330100': [
 { code: '330102', name: '上城区' },
 { code: '330105', name: '拱墅区' },
 { code: '330106', name: '西湖区' },
 { code: '330108', name: '滨江区' },
 { code: '330109', name: '萧山区' },
 { code: '330110', name: '余杭区' }
 ]
};
// 获取城市列表
const cities = computed(() => {
 if (!province.value)
 return [];
 return cityData[province.value] || [];
});
// 获取区县列表
const districts = computed(() => {
 if (!city.value)
 return [];
 return districtData[city.value] || [];
});
// 监听 modelValue 变化
watch(() => props.modelValue, (newValue) => {
 if (newValue) {
 province.value = newValue.province;
 city.value = newValue.city;
 district.value = newValue.district;
 }
}, { immediate: true });
// 更新值
function updateValue() {
 emit('update:modelValue', {
 province: province.value,
 city: city.value,
 district: district.value
 });
}
// 选择省份
function selectProvince(event: Event) {
 province.value = (event.target as HTMLSelectElement).value;
 city.value = '';
 district.value = '';
 updateValue();
}
// 选择城市
function selectCity(event: Event) {
 city.value = (event.target as HTMLSelectElement).value;
 district.value = '';
 updateValue();
}
// 选择区县
function selectDistrict(event: Event) {
 district.value = (event.target as HTMLSelectElement).value;
 updateValue();
}
// 清除值
function clearValue() {
 province.value = '';
 city.value = '';
 district.value = '';
 updateValue();
}
</script>

<template>
  <div class="region-field">
    <div class="select-group">
      <!-- 省份选择 -->
      <div class="select-wrapper">
        <select
          :value="province"
          @change="selectProvince"
          :disabled="disabled"
          class="region-select"
        >
          <option value="">请选择省</option>
          <option v-for="p in regionData.provinces" :key="p.code" :value="p.code">
            {{ p.name }}
          </option>
        </select>
        <span class="select-label">省</span>
      </div>

      <!-- 城市选择 -->
      <div class="select-wrapper">
        <select
          :value="city"
          @change="selectCity"
          :disabled="disabled || !province"
          class="region-select"
        >
          <option value="">请选择市</option>
          <option v-for="c in cities" :key="c.code" :value="c.code">
            {{ c.name }}
          </option>
        </select>
        <span class="select-label">市</span>
      </div>

      <!-- 区县选择 -->
      <div class="select-wrapper">
        <select
          :value="district"
          @change="selectDistrict"
          :disabled="disabled || !city"
          class="region-select"
        >
          <option value="">请选择区/县</option>
          <option v-for="d in districts" :key="d.code" :value="d.code">
            {{ d.name }}
          </option>
        </select>
        <span class="select-label">区</span>
      </div>

      <!-- 清除按钮 -->
      <button
        v-if="province || city || district"
        @click="clearValue"
        :disabled="disabled"
        class="clear-btn"
        title="清除"
      >
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <line x1="18" y1="6" x2="6" y2="18"/>
          <line x1="6" y1="6" x2="18" y2="18"/>
        </svg>
      </button>
    </div>

    <!-- 选中结果显示 -->
    <div v-if="province || city || district" class="selected-info">
      <span class="info-label">已选择：</span>
      <span class="info-value">
        {{ regionData.provinces.find(p => p.code === province)?.name || '' }}
        {{ cities.find(c => c.code === city)?.name || '' }}
        {{ districts.find(d => d.code === district)?.name || '' }}
      </span>
    </div>
  </div>
</template>

<style scoped>
.region-field {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.select-group {
  display: flex;
  align-items: center;
  gap: 4px;
  flex-wrap: wrap;
}

.select-wrapper {
  position: relative;
  flex: 1;
  min-width: 120px;
}

.region-select {
  width: 100%;
  padding: 8px 28px 8px 12px;
  border: 1px solid #e5e7eb;
  border-radius: 6px;
  font-size: 14px;
  background: white;
  cursor: pointer;
  appearance: none;
  outline: none;
  transition: border-color 0.2s;
}

.region-select:focus {
  border-color: #3B82F6;
  outline: 2px solid rgba(59, 130, 246, 0.2);
}

.region-select:disabled {
  background: #f9fafb;
  color: #9ca3af;
  cursor: not-allowed;
}

.region-select option {
  padding: 8px;
}

.select-label {
  position: absolute;
  right: 8px;
  top: 50%;
  transform: translateY(-50%);
  font-size: 12px;
  color: #9ca3af;
  pointer-events: none;
  pointer-events: none;
}

.clear-btn {
  width: 32px;
  height: 32px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: white;
  border: 1px solid #e5e7eb;
  border-radius: 6px;
  cursor: pointer;
  color: #6b7280;
  transition: background-color 0.2s, color 0.2s;
}

.clear-btn:hover:not(:disabled) {
  background: #fef2f2;
  color: #EF4444;
  border-color: #fecaca;
}

.clear-btn:disabled {
  cursor: not-allowed;
  opacity: 0.5;
}

.clear-btn svg {
  width: 14px;
  height: 14px;
}

.selected-info {
  padding: 6px 12px;
  background: #f3f4f6;
  border-radius: 4px;
  font-size: 13px;
}

.info-label {
  color: #6b7280;
  margin-right: 4px;
}

.info-value {
  color: #1f2937;
}
</style>