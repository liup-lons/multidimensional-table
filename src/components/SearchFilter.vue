<script setup lang="ts">
import { ref, defineProps, defineEmits } from 'vue'

interface FilterField {
  fieldName: string
  fieldLabel: string
  fieldType: 'text' | 'number' | 'date' | 'select' | 'boolean'
  options?: string[]
  defaultValue?: any
}

const props = defineProps<{
  fields: FilterField[]
  showAdvanced?: boolean
}>()

const emit = defineEmits<{
  (e: 'filter', filters: Record<string, any>): void
  (e: 'reset'): void
}>()

const filters = ref<Record<string, any>>({})
const showAdvancedFilter = ref(props.showAdvanced || false)

// 初始化过滤器
for (const field of props.fields) {
  filters.value[field.fieldName] = field.defaultValue || ''
}

const handleFilter = () => {
  emit('filter', filters.value)
}

const handleReset = () => {
  for (const field of props.fields) {
    filters.value[field.fieldName] = field.defaultValue || ''
  }
  emit('reset')
}

const toggleAdvancedFilter = () => {
  showAdvancedFilter.value = !showAdvancedFilter.value
}
</script>

<template>
  <div class="search-filter">
    <div class="filter-header">
      <h3 class="filter-title">筛选条件</h3>
      <button 
        v-if="fields.length > 3" 
        @click="toggleAdvancedFilter" 
        class="advanced-toggle"
      >
        {{ showAdvancedFilter ? '收起高级筛选' : '展开高级筛选' }}
      </button>
    </div>
    
    <div class="filter-form">
      <div 
        v-for="(field, index) in fields" 
        :key="field.fieldName"
        class="filter-item"
        :class="{ 'advanced': index >= 3 && !showAdvancedFilter }"
      >
        <label :for="field.fieldName" class="filter-label">{{ field.fieldLabel }}</label>
        <div class="filter-control">
          <input
            v-if="field.fieldType === 'text'"
            :id="field.fieldName"
            v-model="filters[field.fieldName]"
            type="text"
            class="filter-input"
            :placeholder="`输入${field.fieldLabel}`"
          />
          <input
            v-else-if="field.fieldType === 'number'"
            :id="field.fieldName"
            v-model.number="filters[field.fieldName]"
            type="number"
            class="filter-input"
            :placeholder="`输入${field.fieldLabel}`"
          />
          <input
            v-else-if="field.fieldType === 'date'"
            :id="field.fieldName"
            v-model="filters[field.fieldName]"
            type="date"
            class="filter-input"
          />
          <select
            v-else-if="field.fieldType === 'select'"
            :id="field.fieldName"
            v-model="filters[field.fieldName]"
            class="filter-select"
          >
            <option value="">请选择</option>
            <option
              v-for="option in field.options"
              :key="option"
              :value="option"
            >
              {{ option }}
            </option>
          </select>
          <input
            v-else-if="field.fieldType === 'boolean'"
            :id="field.fieldName"
            v-model="filters[field.fieldName]"
            type="checkbox"
            class="filter-checkbox"
          />
        </div>
      </div>
    </div>
    
    <div class="filter-actions">
      <button @click="handleFilter" class="filter-button primary">
        应用筛选
      </button>
      <button @click="handleReset" class="filter-button secondary">
        重置
      </button>
    </div>
  </div>
</template>

<style scoped>
.search-filter {
  background-color: white;
  border: 1px solid #e0e0e0;
  border-radius: 8px;
  padding: 20px;
  margin-bottom: 20px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
}

.filter-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 15px;
}

.filter-title {
  font-size: 16px;
  font-weight: bold;
  color: #303133;
  margin: 0;
}

.advanced-toggle {
  background: none;
  border: none;
  color: #409eff;
  cursor: pointer;
  font-size: 14px;
  padding: 0;
  transition: color 0.3s;
}

.advanced-toggle:hover {
  color: #66b1ff;
  text-decoration: underline;
}

.filter-form {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
  gap: 15px;
  margin-bottom: 20px;
}

.filter-item {
  display: flex;
  flex-direction: column;
  gap: 5px;
}

.filter-item.advanced {
  display: none;
}

.filter-item:not(.advanced) {
  display: flex;
  flex-direction: column;
  gap: 5px;
}

.showAdvancedFilter .filter-item.advanced {
  display: flex;
}

.filter-label {
  font-size: 14px;
  font-weight: 500;
  color: #606266;
}

.filter-control {
  position: relative;
}

.filter-input,
.filter-select {
  width: 100%;
  padding: 8px 12px;
  border: 1px solid #dcdfe6;
  border-radius: 4px;
  font-size: 14px;
  transition: border-color 0.3s;
}

.filter-input:focus,
.filter-select:focus {
  outline: none;
  border-color: #409eff;
}

.filter-checkbox {
  margin-top: 5px;
}

.filter-actions {
  display: flex;
  gap: 10px;
  justify-content: flex-end;
}

.filter-button {
  padding: 8px 16px;
  border: 1px solid #dcdfe6;
  border-radius: 4px;
  font-size: 14px;
  cursor: pointer;
  transition: all 0.3s;
}

.filter-button.primary {
  background-color: #409eff;
  color: white;
  border-color: #409eff;
}

.filter-button.primary:hover {
  background-color: #66b1ff;
  border-color: #66b1ff;
}

.filter-button.secondary {
  background-color: white;
  color: #606266;
}

.filter-button.secondary:hover {
  border-color: #c6e2ff;
  color: #409eff;
}

/* 响应式设计 */
@media (max-width: 768px) {
  .filter-form {
    grid-template-columns: 1fr;
  }
  
  .filter-actions {
    flex-direction: column;
  }
  
  .filter-button {
    width: 100%;
  }
}
</style>