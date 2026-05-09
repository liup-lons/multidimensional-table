<template>
  <div class="kanban-view">
    <!-- 视图设置 -->
    <div class="kanban-header">
      <button class="settings-btn" @click="showSettings = true">
        视图设置
      </button>
    </div>

    <!-- 看板列 -->
    <div class="kanban-container">
      <div
        v-for="column in columns"
        :key="column.value"
        class="kanban-column"
      >
        <div class="column-header">
          <h3>{{ column.label }}</h3>
          <span class="column-count">{{ getColumnRecords(column.value).length }}</span>
        </div>
        <div class="column-content">
          <div
            v-for="record in getColumnRecords(column.value)"
            :key="record.id"
            class="kanban-card"
            draggable="true"
            @dragstart="handleDragStart($event, record)"
            @dragover.prevent
            @drop="handleDrop($event, column.value)"
            @click="openCardDetail(record)"
          >
            <div class="card-title">{{ record[titleField] || '无标题' }}</div>
            <div class="card-fields">
              <div
                v-for="field in displayFields"
                :key="field.fieldName"
                class="card-field"
              >
                <span class="field-label">{{ field.fieldLabel }}:</span>
                <span class="field-value">{{ formatValue(record[field.fieldName], field.fieldType) }}</span>
              </div>
            </div>
          </div>
          <button class="add-card-btn" @click="addCard(column.value)">+ 添加卡片</button>
        </div>
      </div>
    </div>

    <!-- 视图设置弹窗 -->
    <div v-if="showSettings" class="modal-overlay" @click.self="showSettings = false">
      <div class="modal-content">
        <h3>看板视图设置</h3>
        <div class="form-group">
          <label>分组字段 *</label>
          <select v-model="settings.groupField" class="form-input">
            <option value="">选择字段</option>
            <option v-for="field in currentFields" :key="field.id" :value="field.fieldName">
              {{ field.fieldLabel }}
            </option>
          </select>
        </div>
        <div class="form-group">
          <label>标题字段 *</label>
          <select v-model="settings.titleField" class="form-input">
            <option value="">选择字段</option>
            <option v-for="field in currentFields" :key="field.id" :value="field.fieldName">
              {{ field.fieldLabel }}
            </option>
          </select>
        </div>
        <div class="form-group">
          <label>显示字段</label>
          <div class="checkbox-group">
            <label v-for="field in currentFields" :key="field.id" class="checkbox-item">
              <input
                type="checkbox"
                :checked="settings.displayFields.includes(field.fieldName)"
                @change="toggleDisplayField(field.fieldName)"
              />
              {{ field.fieldLabel }}
            </label>
          </div>
        </div>
        <div class="form-actions">
          <button type="button" class="btn-cancel" @click="showSettings = false">取消</button>
          <button type="button" class="btn-submit" @click="saveSettings">保存</button>
        </div>
      </div>
    </div>

    <!-- 卡片详情弹窗 -->
    <div v-if="selectedRecord" class="modal-overlay" @click.self="selectedRecord = null">
      <div class="modal-content card-detail-modal">
        <h3>记录详情</h3>
        <div class="detail-fields">
          <div
            v-for="field in currentFields"
            :key="field.id"
            class="detail-field"
          >
            <label>{{ field.fieldLabel }}</label>
            <span>{{ formatValue(selectedRecord[field.fieldName], field.fieldType) }}</span>
          </div>
        </div>
        <div class="form-actions">
          <button type="button" class="btn-cancel" @click="selectedRecord = null">关闭</button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch } from 'vue'
import { useTableStore } from '../store/table'

const store = useTableStore()

const showSettings = ref(false)
const selectedRecord = ref<Record<string, any> | null>(null)
const draggingRecord = ref<Record<string, any> | null>(null)

const settings = ref({
  groupField: '',
  titleField: '',
  displayFields: [] as string[]
})

const currentFields = computed(() => {
  return store.currentTable?.fieldDefinitions || []
})

const groupField = computed(() => {
  if (settings.value.groupField) {
    return settings.value.groupField
  }
  // 默认选择第一个单选或多选字段
  const selectField = currentFields.value.find(f => f.fieldType === 'select' || f.fieldType === 'tags')
  if (selectField) {
    settings.value.groupField = selectField.fieldName
    return selectField.fieldName
  }
  return ''
})

const titleField = computed(() => {
  if (settings.value.titleField) {
    return settings.value.titleField
  }
  // 默认选择标题字段或第一个文本字段
  const titleField = currentFields.value.find(f => f.fieldName === 'title' || f.fieldType === 'text')
  if (titleField) {
    settings.value.titleField = titleField.fieldName
    return titleField.fieldName
  }
  return ''
})

const displayFields = computed(() => {
  if (settings.value.displayFields.length > 0) {
    return currentFields.value.filter(f => settings.value.displayFields.includes(f.fieldName))
  }
  // 默认显示前3个字段（排除标题字段）
  return currentFields.value.filter(f => f.fieldName !== titleField.value).slice(0, 3)
})

const columns = computed(() => {
  if (!groupField.value) {
    return [{ value: 'default', label: '未分组' }]
  }
  
  const field = currentFields.value.find(f => f.fieldName === groupField.value)
  if (field?.options) {
    return field.options.map(opt => ({ value: opt, label: opt }))
  }
  
  // 从数据中提取唯一值
  const values = new Set<string>()
  const data = store.getFilteredTableData || []
  data.forEach(record => {
    const val = record[groupField.value]
    if (val) {
      if (Array.isArray(val)) {
        val.forEach(v => values.add(v))
      } else {
        values.add(String(val))
      }
    }
  })
  
  return Array.from(values).map(v => ({ value: v, label: v }))
})

const getColumnRecords = (columnValue: string) => {
  const data = store.getFilteredTableData || []
  return data.filter(record => {
    const val = record[groupField.value]
    if (!val) return columnValue === 'default'
    if (Array.isArray(val)) return val.includes(columnValue)
    return String(val) === columnValue
  })
}

const toggleDisplayField = (fieldName: string) => {
  const index = settings.value.displayFields.indexOf(fieldName)
  if (index > -1) {
    settings.value.displayFields.splice(index, 1)
  } else {
    settings.value.displayFields.push(fieldName)
  }
}

const saveSettings = () => {
  // 保存设置到视图配置
  if (store.currentProject && store.currentTable && store.currentView) {
    store.updateView(store.currentProject.id, store.currentTable.id, store.currentView.id, {
      groupFieldId: settings.value.groupField
    })
  }
  showSettings.value = false
}

const openCardDetail = (record: Record<string, any>) => {
  selectedRecord.value = record
}

const addCard = (columnValue: string) => {
  if (!store.currentProject || !store.currentTable) return
  
  const record: Record<string, any> = {
    [groupField.value]: columnValue
  }
  
  store.addRecord(store.currentProject.id, store.currentTable.id, record)
}

const handleDragStart = (event: DragEvent, record: Record<string, any>) => {
  draggingRecord.value = record
  event.dataTransfer!.effectAllowed = 'move'
}

const handleDrop = (_event: DragEvent, columnValue: string) => {
  if (!draggingRecord.value || !store.currentProject || !store.currentTable) return
  
  store.updateRecord(
    store.currentProject.id,
    store.currentTable.id,
    draggingRecord.value.id,
    { [groupField.value]: columnValue }
  )
  
  draggingRecord.value = null
}

const formatValue = (value: any, type: string) => {
  if (value == null || value === '') return '-'
  
  switch (type) {
    case 'date':
      return new Date(value).toLocaleDateString('zh-CN')
    case 'boolean':
      return value ? '是' : '否'
    case 'tags':
      return Array.isArray(value) ? value.join(', ') : value
    case 'rating':
      return '★'.repeat(value) + '☆'.repeat(5 - value)
    default:
      return String(value)
  }
}

// 初始化设置
watch(() => store.currentTable, () => {
  const selectField = currentFields.value.find(f => f.fieldType === 'select' || f.fieldType === 'tags')
  if (selectField) {
    settings.value.groupField = selectField.fieldName
  }
  
  const titleField = currentFields.value.find(f => f.fieldName === 'title' || f.fieldType === 'text')
  if (titleField) {
    settings.value.titleField = titleField.fieldName
  }
}, { immediate: true })
</script>

<style scoped>
.kanban-view {
  height: 100%;
  display: flex;
  flex-direction: column;
  background-color: var(--bg-gray);
}

.kanban-header {
  display: flex;
  justify-content: flex-end;
  padding: var(--spacing-sm) var(--spacing-md);
  background-color: var(--bg-white);
  border-bottom: 1px solid var(--border-color);
}

.settings-btn {
  display: inline-flex;
  align-items: center;
  padding: var(--spacing-xs) var(--spacing-md);
  font-size: var(--font-size-sm);
  font-weight: var(--font-weight-medium);
  color: var(--text-secondary);
  background-color: var(--bg-gray);
  border: none;
  border-radius: var(--radius-md);
  cursor: pointer;
  transition: all var(--transition-fast);
}

.settings-btn:hover {
  background-color: rgba(22, 93, 255, 0.1);
  color: var(--primary-color);
}

.kanban-container {
  flex: 1;
  display: flex;
  gap: var(--spacing-md);
  padding: var(--spacing-md);
  overflow-x: auto;
}

.kanban-column {
  min-width: 280px;
  max-width: 320px;
  flex-shrink: 0;
  background-color: var(--bg-white);
  border-radius: var(--radius-md);
  box-shadow: var(--shadow-sm);
  display: flex;
  flex-direction: column;
  transition: all var(--transition-normal);
}

.kanban-column:hover {
  box-shadow: var(--shadow-md);
}

.column-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: var(--spacing-sm);
  border-bottom: 1px solid var(--border-color);
}

.column-header h3 {
  margin: 0;
  font-size: var(--font-size-sm);
  font-weight: var(--font-weight-semibold);
  color: var(--text-primary);
}

.column-count {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  min-width: 24px;
  height: 24px;
  padding: 0 var(--spacing-sm);
  font-size: var(--font-size-xs);
  font-weight: var(--font-weight-medium);
  color: var(--text-secondary);
  background-color: var(--bg-gray);
  border-radius: var(--radius-lg);
}

.column-content {
  flex: 1;
  padding: var(--spacing-sm);
  overflow-y: auto;
}

.kanban-card {
  background-color: var(--bg-white);
  border-radius: var(--radius-md);
  padding: var(--spacing-md);
  margin-bottom: var(--spacing-sm);
  cursor: pointer;
  transition: all var(--transition-normal);
  border: 1px solid var(--border-color);
  box-shadow: var(--shadow-sm);
}

.kanban-card:hover {
  box-shadow: var(--shadow-lg);
  transform: translateY(-2px);
  border-color: var(--primary-color);
}

.kanban-card:active {
  cursor: grabbing;
  transform: translateY(0);
}

.card-title {
  font-size: var(--font-size-sm);
  font-weight: var(--font-weight-semibold);
  margin-bottom: var(--spacing-sm);
  color: var(--text-primary);
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.card-fields {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-xs);
}

.card-field {
  display: flex;
  font-size: var(--font-size-xs);
  color: var(--text-secondary);
}

.field-label {
  font-weight: var(--font-weight-medium);
  margin-right: var(--spacing-xs);
  color: var(--text-placeholder);
  flex-shrink: 0;
}

.field-value {
  flex: 1;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.add-card-btn {
  width: 100%;
  padding: var(--spacing-sm);
  font-size: var(--font-size-sm);
  font-weight: var(--font-weight-medium);
  color: var(--text-placeholder);
  background-color: transparent;
  border: 1px dashed var(--border-color);
  border-radius: var(--radius-md);
  cursor: pointer;
  margin-top: var(--spacing-xs);
  transition: all var(--transition-fast);
}

.add-card-btn:hover {
  background-color: var(--primary-light);
  border-color: var(--primary-color);
  color: var(--primary-color);
}

/* 弹窗样式 */
.modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background-color: rgba(0, 0, 0, 0.5);
  backdrop-filter: blur(2px);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: var(--z-modal);
  animation: fadeIn var(--transition-fast);
}

@keyframes fadeIn {
  from { opacity: 0; }
  to { opacity: 1; }
}

.modal-content {
  background-color: var(--bg-white);
  border-radius: var(--radius-lg);
  box-shadow: var(--shadow-lg);
  padding: var(--spacing-lg);
  width: 480px;
  max-width: 95vw;
  animation: slideUp var(--transition-normal);
}

@keyframes slideUp {
  from {
    opacity: 0;
    transform: translateY(20px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

.modal-content h3 {
  margin: 0 0 var(--spacing-md) 0;
  font-size: var(--font-size-xl);
  font-weight: var(--font-weight-semibold);
  color: var(--text-primary);
}

.form-group {
  margin-bottom: var(--spacing-md);
}

.form-group label {
  display: block;
  font-size: var(--font-size-sm);
  font-weight: var(--font-weight-medium);
  color: var(--text-primary);
  margin-bottom: var(--spacing-xs);
}

.form-input {
  width: 100%;
  padding: var(--spacing-xs) var(--spacing-sm);
  font-size: var(--font-size-sm);
  font-family: inherit;
  background-color: var(--bg-white);
  border: 1px solid var(--border-color);
  border-radius: var(--radius-md);
  transition: all var(--transition-fast);
  outline: none;
}

.form-input:focus {
  border-color: var(--primary-color);
  box-shadow: 0 0 0 3px var(--primary-light);
}

.checkbox-group {
  display: flex;
  flex-wrap: wrap;
  gap: var(--spacing-md);
}

.checkbox-item {
  display: flex;
  align-items: center;
  gap: var(--spacing-xs);
  font-size: var(--font-size-sm);
  color: var(--text-secondary);
  cursor: pointer;
}

.checkbox-item input[type="checkbox"] {
  width: 16px;
  height: 16px;
  accent-color: var(--primary-color);
}

.form-actions {
  display: flex;
  justify-content: flex-end;
  gap: var(--spacing-sm);
  margin-top: var(--spacing-lg);
  padding-top: var(--spacing-md);
  border-top: 1px solid var(--border-color);
}

.btn-cancel {
  padding: var(--spacing-xs) var(--spacing-md);
  font-size: var(--font-size-sm);
  font-weight: var(--font-weight-medium);
  color: var(--text-secondary);
  background-color: var(--bg-gray);
  border: none;
  border-radius: var(--radius-md);
  cursor: pointer;
  transition: all var(--transition-fast);
}

.btn-cancel:hover {
  background-color: rgba(0, 0, 0, 0.05);
}

.btn-submit {
  padding: var(--spacing-xs) var(--spacing-md);
  font-size: var(--font-size-sm);
  font-weight: var(--font-weight-medium);
  color: white;
  background-color: var(--primary-color);
  border: none;
  border-radius: var(--radius-md);
  cursor: pointer;
  transition: all var(--transition-fast);
}

.btn-submit:hover {
  background-color: var(--primary-dark);
}

.card-detail-modal {
  width: 520px;
}

.detail-fields {
  max-height: 400px;
  overflow-y: auto;
}

.detail-field {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: var(--spacing-sm) 0;
  border-bottom: 1px solid var(--border-color);
}

.detail-field label {
  font-weight: var(--font-weight-medium);
  color: var(--text-placeholder);
  font-size: var(--font-size-sm);
}

.detail-field span {
  color: var(--text-primary);
  font-size: var(--font-size-sm);
}

/* 拖拽状态 */
.kanban-card.dragging {
  opacity: 0.5;
  transform: scale(0.98);
}

.column-content.drag-over {
  background-color: var(--primary-light);
  border-radius: var(--radius-md);
}

/* 响应式设计 */
@media (max-width: 768px) {
  .kanban-container {
    padding: var(--spacing-sm);
    gap: var(--spacing-sm);
  }
  
  .kanban-column {
    min-width: 260px;
  }
  
  .modal-content {
    width: 95vw;
    padding: var(--spacing-md);
  }
  
  .card-detail-modal {
    width: 95vw;
  }
}
</style>