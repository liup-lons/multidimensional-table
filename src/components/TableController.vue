<script setup lang="ts">
import { ref, defineProps, defineEmits } from 'vue'
import { exportUtils } from '../utils'

const props = defineProps<{
  title?: string
  showExport?: boolean
  showSearch?: boolean
  showRefresh?: boolean
  showSettings?: boolean
  loading?: boolean
}>()

const emit = defineEmits<{
  (e: 'search', keyword: string): void
  (e: 'refresh'): void
  (e: 'export', format: 'csv' | 'excel'): void
  (e: 'settings'): void
}>()

const searchKeyword = ref('')
const showExportMenu = ref(false)

const handleSearch = () => {
  emit('search', searchKeyword.value)
}

const handleRefresh = () => {
  emit('refresh')
}

const handleExport = (format: 'csv' | 'excel') => {
  emit('export', format)
  showExportMenu.value = false
}

const handleSettings = () => {
  emit('settings')
}
</script>

<template>
  <div class="table-controller">
    <div class="controller-header">
      <h2 v-if="title" class="controller-title">{{ title }}</h2>
      <div class="controller-actions">
        <div v-if="showSearch" class="search-container">
          <input
            v-model="searchKeyword"
            type="text"
            placeholder="搜索..."
            class="search-input"
            @keyup.enter="handleSearch"
          />
          <button @click="handleSearch" class="search-button">搜索</button>
        </div>
        
        <button
          v-if="showRefresh"
          @click="handleRefresh"
          class="action-button refresh-button"
          :disabled="loading"
        >
          <span v-if="loading" class="loading-spinner"></span>
          刷新
        </button>
        
        <div v-if="showExport" class="export-container">
          <button @click="showExportMenu = !showExportMenu" class="action-button export-button">
            导出
          </button>
          <div v-if="showExportMenu" class="export-menu">
            <button @click="handleExport('csv')" class="export-option">导出为CSV</button>
            <button @click="handleExport('excel')" class="export-option">导出为Excel</button>
          </div>
        </div>
        
        <button
          v-if="showSettings"
          @click="handleSettings"
          class="action-button settings-button"
        >
          设置
        </button>
      </div>
    </div>
  </div>
</template>

<style scoped>
.table-controller {
  margin-bottom: 20px;
}

.controller-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  flex-wrap: wrap;
  gap: 15px;
}

.controller-title {
  font-size: 20px;
  font-weight: bold;
  color: #303133;
  margin: 0;
}

.controller-actions {
  display: flex;
  align-items: center;
  gap: 10px;
  flex-wrap: wrap;
}

.search-container {
  display: flex;
  align-items: center;
  gap: 5px;
}

.search-input {
  padding: 8px 12px;
  border: 1px solid #dcdfe6;
  border-radius: 4px;
  font-size: 14px;
  width: 200px;
  transition: border-color 0.3s;
}

.search-input:focus {
  outline: none;
  border-color: #409eff;
}

.action-button {
  padding: 8px 16px;
  border: 1px solid #dcdfe6;
  border-radius: 4px;
  background-color: white;
  font-size: 14px;
  cursor: pointer;
  transition: all 0.3s;
  display: flex;
  align-items: center;
  gap: 5px;
}

.action-button:hover {
  border-color: #409eff;
  color: #409eff;
}

.action-button:disabled {
  cursor: not-allowed;
  opacity: 0.6;
}

.refresh-button {
  border-color: #67c23a;
  color: #67c23a;
}

.refresh-button:hover {
  background-color: #f0f9eb;
  border-color: #85ce61;
  color: #67c23a;
}

.export-button {
  border-color: #e6a23c;
  color: #e6a23c;
}

.export-button:hover {
  background-color: #fdf6ec;
  border-color: #ebb563;
  color: #e6a23c;
}

.settings-button {
  border-color: #909399;
  color: #909399;
}

.settings-button:hover {
  background-color: #f5f7fa;
  border-color: #c0c4cc;
  color: #606266;
}

.export-container {
  position: relative;
}

.export-menu {
  position: absolute;
  top: 100%;
  right: 0;
  margin-top: 5px;
  background-color: white;
  border: 1px solid #dcdfe6;
  border-radius: 4px;
  box-shadow: 0 2px 12px 0 rgba(0, 0, 0, 0.1);
  z-index: 100;
  min-width: 120px;
}

.export-option {
  display: block;
  width: 100%;
  padding: 8px 16px;
  text-align: left;
  border: none;
  background: none;
  font-size: 14px;
  cursor: pointer;
  transition: background-color 0.3s;
}

.export-option:hover {
  background-color: #f5f7fa;
}

.loading-spinner {
  width: 14px;
  height: 14px;
  border: 2px solid #67c23a;
  border-top: 2px solid transparent;
  border-radius: 50%;
  animation: spin 1s linear infinite;
}

@keyframes spin {
  0% { transform: rotate(0deg); }
  100% { transform: rotate(360deg); }
}

/* 响应式设计 */
@media (max-width: 768px) {
  .controller-header {
    flex-direction: column;
    align-items: stretch;
  }
  
  .controller-actions {
    justify-content: space-between;
  }
  
  .search-input {
    width: 150px;
  }
  
  .action-button {
    padding: 6px 12px;
    font-size: 12px;
  }
}
</style>