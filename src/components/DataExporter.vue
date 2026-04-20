<script setup lang="ts">
import { ref, defineProps, defineEmits } from 'vue'
import { exportUtils } from '../utils'

const props = defineProps<{
  data: any[]
  filename?: string
  showModal?: boolean
}>()

const emit = defineEmits<{
  (e: 'export-start'): void
  (e: 'export-success'): void
  (e: 'export-error', error: Error): void
  (e: 'close'): void
}>()

const isExporting = ref(false)
const exportFormat = ref<'csv' | 'excel'>('csv')
const showExportModal = ref(props.showModal || false)

const handleExport = async () => {
  if (isExporting.value) return
  if (!props.data || props.data.length === 0) {
    alert('没有数据可导出')
    return
  }

  emit('export-start')
  isExporting.value = true

  try {
    const filename = props.filename || `data_${new Date().toISOString().slice(0, 10)}`
    
    if (exportFormat.value === 'csv') {
      exportUtils.exportToCSV(props.data, `${filename}.csv`)
    } else if (exportFormat.value === 'excel') {
      await exportUtils.exportToExcel(props.data, `${filename}.xlsx`)
    }

    emit('export-success')
    if (showExportModal.value) {
      showExportModal.value = false
    }
  } catch (error) {
    console.error('导出失败:', error)
    emit('export-error', error as Error)
  } finally {
    isExporting.value = false
  }
}

const openExportModal = () => {
  showExportModal.value = true
}

const closeExportModal = () => {
  showExportModal.value = false
  emit('close')
}
</script>

<template>
  <div class="data-exporter">
    <!-- 导出按钮 -->
    <button 
      v-if="!showModal" 
      @click="openExportModal" 
      class="export-button"
    >
      导出数据
    </button>

    <!-- 导出模态框 -->
    <div v-if="showExportModal" class="export-modal-overlay" @click="closeExportModal">
      <div class="export-modal" @click.stop>
        <div class="export-modal-header">
          <h3>导出数据</h3>
          <button @click="closeExportModal" class="modal-close">×</button>
        </div>
        <div class="export-modal-body">
          <div class="export-option">
            <label class="export-label">
              <input 
                v-model="exportFormat" 
                type="radio" 
                value="csv" 
                class="export-radio"
              />
              导出为CSV
            </label>
          </div>
          <div class="export-option">
            <label class="export-label">
              <input 
                v-model="exportFormat" 
                type="radio" 
                value="excel" 
                class="export-radio"
              />
              导出为Excel
            </label>
          </div>
          <div class="export-info">
            <p>当前数据量: {{ data.length }} 条</p>
            <p v-if="exportFormat === 'excel'" class="excel-note">
              提示: 导出Excel需要安装xlsx库
            </p>
          </div>
        </div>
        <div class="export-modal-footer">
          <button 
            @click="closeExportModal" 
            class="modal-button secondary"
          >
            取消
          </button>
          <button 
            @click="handleExport" 
            class="modal-button primary"
            :disabled="isExporting"
          >
            <span v-if="isExporting" class="loading-spinner"></span>
            {{ isExporting ? '导出中...' : '导出' }}
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.data-exporter {
  position: relative;
}

.export-button {
  padding: 8px 16px;
  border: 1px solid #e6a23c;
  border-radius: 4px;
  background-color: white;
  color: #e6a23c;
  font-size: 14px;
  cursor: pointer;
  transition: all 0.3s;
}

.export-button:hover {
  background-color: #fdf6ec;
  border-color: #ebb563;
  color: #e6a23c;
}

.export-modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background-color: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
}

.export-modal {
  background-color: white;
  border-radius: 8px;
  width: 400px;
  max-width: 90%;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
  overflow: hidden;
}

.export-modal-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 16px 20px;
  border-bottom: 1px solid #e0e0e0;
  background-color: #f5f7fa;
}

.export-modal-header h3 {
  margin: 0;
  font-size: 16px;
  font-weight: bold;
  color: #303133;
}

.modal-close {
  background: none;
  border: none;
  font-size: 20px;
  cursor: pointer;
  color: #909399;
  padding: 0;
  width: 24px;
  height: 24px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 4px;
  transition: all 0.3s;
}

.modal-close:hover {
  background-color: #e0e0e0;
  color: #606266;
}

.export-modal-body {
  padding: 20px;
}

.export-option {
  margin-bottom: 15px;
}

.export-label {
  display: flex;
  align-items: center;
  gap: 8px;
  cursor: pointer;
  font-size: 14px;
  color: #303133;
}

.export-radio {
  cursor: pointer;
}

.export-info {
  margin-top: 20px;
  padding-top: 15px;
  border-top: 1px solid #e0e0e0;
  font-size: 14px;
  color: #606266;
}

.excel-note {
  color: #e6a23c;
  font-size: 12px;
  margin-top: 5px;
}

.export-modal-footer {
  display: flex;
  justify-content: flex-end;
  gap: 10px;
  padding: 16px 20px;
  border-top: 1px solid #e0e0e0;
  background-color: #f5f7fa;
}

.modal-button {
  padding: 8px 16px;
  border: 1px solid #dcdfe6;
  border-radius: 4px;
  font-size: 14px;
  cursor: pointer;
  transition: all 0.3s;
  display: flex;
  align-items: center;
  gap: 5px;
}

.modal-button.primary {
  background-color: #409eff;
  color: white;
  border-color: #409eff;
}

.modal-button.primary:hover:not(:disabled) {
  background-color: #66b1ff;
  border-color: #66b1ff;
}

.modal-button.secondary {
  background-color: white;
  color: #606266;
}

.modal-button.secondary:hover {
  border-color: #c6e2ff;
  color: #409eff;
}

.modal-button:disabled {
  cursor: not-allowed;
  opacity: 0.6;
}

.loading-spinner {
  width: 14px;
  height: 14px;
  border: 2px solid rgba(255, 255, 255, 0.3);
  border-top: 2px solid white;
  border-radius: 50%;
  animation: spin 1s linear infinite;
}

@keyframes spin {
  0% { transform: rotate(0deg); }
  100% { transform: rotate(360deg); }
}

/* 响应式设计 */
@media (max-width: 768px) {
  .export-modal {
    width: 95%;
  }
  
  .export-modal-header,
  .export-modal-body,
  .export-modal-footer {
    padding: 12px 16px;
  }
  
  .export-button {
    padding: 6px 12px;
    font-size: 12px;
  }
}
</style>