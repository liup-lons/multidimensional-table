<template>
  <div class="table-view">
    <!-- 工具栏 -->
    <div class="table-toolbar">
      <div class="toolbar-left">
        <button class="tool-btn" @click="showFieldModal = true">
          <span>+ 字段</span>
        </button>
        <button class="tool-btn" @click="addRecord">
          <span>+ 记录</span>
        </button>
      </div>
      <div class="toolbar-right">
        <button class="tool-btn" @click="showFilterModal = true">
          <span>筛选</span>
        </button>
        <button class="tool-btn" @click="showSortModal = true">
          <span>排序</span>
        </button>
      </div>
    </div>

    <!-- 表格 -->
    <div class="table-container">
      <table class="data-table">
        <thead>
          <tr>
            <th class="select-column">
              <input
                type="checkbox"
                :checked="allSelected"
                @change="toggleSelectAll"
                class="select-all"
              />
            </th>
            <th
              v-for="field in currentFields"
              :key="field.id"
              class="table-header"
              @click="sortByField(field.fieldName)"
            >
              {{ field.fieldLabel }}
              <span v-if="sortField === field.fieldName" class="sort-icon">
                {{ sortDirection === 'asc' ? '↑' : '↓' }}
              </span>
              <span class="field-type">{{ getFieldTypeLabel(field.fieldType) }}</span>
            </th>
            <th class="actions-column">操作</th>
          </tr>
        </thead>
        <tbody>
          <tr
            v-for="record in displayData"
            :key="record.id"
            class="table-row"
            :class="{ selected: selectedRecords.includes(record.id) }"
          >
            <td class="select-column">
              <input
                type="checkbox"
                :checked="selectedRecords.includes(record.id)"
                @change="toggleSelect(record.id)"
                class="select-row"
              />
            </td>
            <td
              v-for="field in currentFields"
              :key="field.id"
              class="table-cell"
              :class="{ editable: !field.required }"
              @click="startEdit(record.id, field.fieldName)"
            >
              <template v-if="editingCell?.rowId === record.id && editingCell?.fieldName === field.fieldName">
                <component
                  :is="getEditorComponent(field.fieldType)"
                  :value="record[field.fieldName]"
                  :field="field"
                  @update="updateCell(record.id, field.fieldName, $event)"
                  @cancel="cancelEdit"
                  class="cell-editor"
                />
              </template>
              <template v-else>
                <span class="cell-value">{{ formatCellValue(record[field.fieldName], field.fieldType) }}</span>
              </template>
            </td>
            <td class="actions-column">
              <button class="action-btn" @click="copyRecord(record.id)">复制</button>
              <button class="action-btn" @click="deleteRecord(record.id)">删除</button>
            </td>
          </tr>
        </tbody>
      </table>
    </div>

    <!-- 批量操作栏 -->
    <div v-if="selectedRecords.length > 0" class="batch-bar">
      <span>已选择 {{ selectedRecords.length }} 条记录</span>
      <button class="batch-btn" @click="batchDelete">批量删除</button>
    </div>

    <!-- 添加字段弹窗 -->
    <div v-if="showFieldModal" class="modal-overlay" @click.self="showFieldModal = false">
      <div class="modal-content">
        <h3>{{ editingField ? '编辑字段' : '添加字段' }}</h3>
        <form @submit.prevent="saveField">
          <div class="form-group">
            <label>字段名称 *</label>
            <input
              type="text"
              v-model="fieldForm.name"
              required
              class="form-input"
            />
          </div>
          <div class="form-group">
            <label>字段类型 *</label>
            <select v-model="fieldForm.type" required class="form-input">
              <option value="text">文本</option>
              <option value="number">数字</option>
              <option value="date">日期</option>
              <option value="select">单选</option>
              <option value="tags">多选</option>
              <option value="boolean">布尔</option>
              <option value="person">人员</option>
              <option value="rating">评分</option>
              <option value="url">网址</option>
            </select>
          </div>
          <div v-if="fieldForm.type === 'select' || fieldForm.type === 'tags'" class="form-group">
            <label>选项（用逗号分隔）</label>
            <input
              type="text"
              v-model="fieldForm.options"
              placeholder="选项1,选项2,选项3"
              class="form-input"
            />
          </div>
          <div class="form-group">
            <label>默认值</label>
            <input
              type="text"
              v-model="fieldForm.defaultValue"
              class="form-input"
            />
          </div>
          <div class="form-group">
            <label>
              <input type="checkbox" v-model="fieldForm.required" /> 必填
            </label>
          </div>
          <div class="form-actions">
            <button type="button" class="btn-cancel" @click="closeFieldModal">取消</button>
            <button type="submit" class="btn-submit">保存</button>
          </div>
        </form>
      </div>
    </div>

    <!-- 筛选弹窗 -->
    <div v-if="showFilterModal" class="modal-overlay" @click.self="showFilterModal = false">
      <div class="modal-content">
        <h3>筛选条件</h3>
        <div class="filter-list">
          <div
            v-for="(condition, index) in filterConditions"
            :key="index"
            class="filter-row"
          >
            <select v-model="condition.fieldId" class="filter-field">
              <option value="">选择字段</option>
              <option v-for="field in currentFields" :key="field.id" :value="field.fieldName">
                {{ field.fieldLabel }}
              </option>
            </select>
            <select v-model="condition.operator" class="filter-operator">
              <option value="equals">等于</option>
              <option value="contains">包含</option>
              <option value="not_contains">不包含</option>
              <option value="greater_than">大于</option>
              <option value="less_than">小于</option>
              <option value="greater_or_equal">大于等于</option>
              <option value="less_or_equal">小于等于</option>
              <option value="is_empty">为空</option>
              <option value="is_not_empty">不为空</option>
            </select>
            <input
              v-if="condition.operator !== 'is_empty' && condition.operator !== 'is_not_empty'"
              type="text"
              v-model="condition.value"
              placeholder="筛选值"
              class="filter-value"
            />
            <button v-if="filterConditions.length > 1" @click="removeFilter(index)" class="remove-filter">×</button>
          </div>
        </div>
        <button @click="addFilter" class="add-filter-btn">+ 添加条件</button>
        <div class="form-actions">
          <button type="button" class="btn-cancel" @click="clearFilters">清除筛选</button>
          <button type="button" class="btn-submit" @click="applyFilters">应用筛选</button>
        </div>
      </div>
    </div>

    <!-- 排序弹窗 -->
    <div v-if="showSortModal" class="modal-overlay" @click.self="showSortModal = false">
      <div class="modal-content">
        <h3>排序设置</h3>
        <div class="sort-list">
          <div
            v-for="(condition, index) in sortConditions"
            :key="index"
            class="sort-row"
          >
            <select v-model="condition.fieldId" class="sort-field">
              <option value="">选择字段</option>
              <option v-for="field in currentFields" :key="field.id" :value="field.fieldName">
                {{ field.fieldLabel }}
              </option>
            </select>
            <select v-model="condition.direction" class="sort-direction">
              <option value="asc">升序</option>
              <option value="desc">降序</option>
            </select>
            <button v-if="sortConditions.length > 1" @click="removeSort(index)" class="remove-sort">×</button>
          </div>
        </div>
        <button @click="addSort" class="add-sort-btn">+ 添加排序</button>
        <div class="form-actions">
          <button type="button" class="btn-cancel" @click="clearSorts">清除排序</button>
          <button type="button" class="btn-submit" @click="applySorts">应用排序</button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, markRaw } from 'vue'
import { useTableStore } from '../store/table'
import type { FieldDefinition, FilterCondition, SortCondition } from '../types/table'

const store = useTableStore()

const showFieldModal = ref(false)
const showFilterModal = ref(false)
const showSortModal = ref(false)
const editingField = ref<FieldDefinition | null>(null)
const editingCell = ref<{ rowId: string; fieldName: string } | null>(null)
const selectedRecords = ref<string[]>([])
const sortField = ref('')
const sortDirection = ref<'asc' | 'desc'>('asc')

const fieldForm = ref({
  name: '',
  type: 'text' as string,
  options: '',
  defaultValue: '',
  required: false
})

const filterConditions = ref<FilterCondition[]>([])
const sortConditions = ref<SortCondition[]>([])

const currentFields = computed(() => {
  return store.currentTable?.fieldDefinitions || []
})

const displayData = computed(() => {
  let data = store.getFilteredTableData || []
  
  // 客户端排序（如果没有视图排序）
  if (sortField.value && !store.currentView?.sortConditions?.length) {
    data = [...data].sort((a, b) => {
      const valA = a[sortField.value]
      const valB = b[sortField.value]
      if (valA < valB) return sortDirection.value === 'asc' ? -1 : 1
      if (valA > valB) return sortDirection.value === 'asc' ? 1 : -1
      return 0
    })
  }
  
  return data
})

const allSelected = computed(() => {
  return displayData.value.length > 0 && displayData.value.every(r => selectedRecords.value.includes(r.id))
})

const toggleSelectAll = () => {
  if (allSelected.value) {
    selectedRecords.value = []
  } else {
    selectedRecords.value = displayData.value.map(r => r.id)
  }
}

const toggleSelect = (id: string) => {
  const index = selectedRecords.value.indexOf(id)
  if (index > -1) {
    selectedRecords.value.splice(index, 1)
  } else {
    selectedRecords.value.push(id)
  }
}

const addRecord = () => {
  if (!store.currentProject || !store.currentTable) return
  
  const defaultValues: Record<string, any> = {}
  currentFields.value.forEach(field => {
    if (field.defaultValue !== undefined) {
      defaultValues[field.fieldName] = field.defaultValue
    }
  })
  
  store.addRecord(store.currentProject.id, store.currentTable.id, defaultValues)
}

const deleteRecord = (recordId: string) => {
  if (!store.currentProject || !store.currentTable) return
  store.deleteRecord(store.currentProject.id, store.currentTable.id, recordId)
}

const batchDelete = () => {
  if (!store.currentProject || !store.currentTable) return
  store.batchDeleteRecords(store.currentProject.id, store.currentTable.id, selectedRecords.value)
  selectedRecords.value = []
}

const copyRecord = (recordId: string) => {
  if (!store.currentProject || !store.currentTable) return
  store.copyRecord(store.currentProject.id, store.currentTable.id, recordId)
}

const startEdit = (rowId: string, fieldName: string) => {
  editingCell.value = { rowId, fieldName }
}

const updateCell = (rowId: string, fieldName: string, value: any) => {
  if (!store.currentProject || !store.currentTable) return
  store.updateRecord(store.currentProject.id, store.currentTable.id, rowId, { [fieldName]: value })
  editingCell.value = null
}

const cancelEdit = () => {
  editingCell.value = null
}

const closeFieldModal = () => {
  showFieldModal.value = false
  editingField.value = null
  fieldForm.value = {
    name: '',
    type: 'text',
    options: '',
    defaultValue: '',
    required: false
  }
}

const saveField = () => {
  if (!store.currentProject || !store.currentTable) return
  
  const field: Omit<FieldDefinition, 'id'> = {
    fieldName: fieldForm.value.name,
    fieldType: fieldForm.value.type as any,
    fieldLabel: fieldForm.value.name,
    options: fieldForm.value.options ? fieldForm.value.options.split(',').map(o => o.trim()) : undefined,
    defaultValue: fieldForm.value.defaultValue || undefined,
    required: fieldForm.value.required
  }
  
  if (editingField.value) {
    store.updateField(store.currentProject.id, store.currentTable.id, editingField.value.id, field)
  } else {
    store.addField(store.currentProject.id, store.currentTable.id, field)
  }
  
  closeFieldModal()
}

const sortByField = (fieldName: string) => {
  if (sortField.value === fieldName) {
    sortDirection.value = sortDirection.value === 'asc' ? 'desc' : 'asc'
  } else {
    sortField.value = fieldName
    sortDirection.value = 'asc'
  }
}

const addFilter = () => {
  filterConditions.value.push({
    fieldId: '',
    operator: 'equals',
    value: '',
    logic: 'and'
  })
}

const removeFilter = (index: number) => {
  filterConditions.value.splice(index, 1)
}

const clearFilters = () => {
  filterConditions.value = []
  if (store.currentProject && store.currentTable && store.currentView) {
    store.setFilterConditions(store.currentProject.id, store.currentTable.id, store.currentView.id, [])
  }
  showFilterModal.value = false
}

const applyFilters = () => {
  if (!store.currentProject || !store.currentTable || !store.currentView) return
  store.setFilterConditions(store.currentProject.id, store.currentTable.id, store.currentView.id, filterConditions.value)
  showFilterModal.value = false
}

const addSort = () => {
  sortConditions.value.push({
    fieldId: '',
    direction: 'asc'
  })
}

const removeSort = (index: number) => {
  sortConditions.value.splice(index, 1)
}

const clearSorts = () => {
  sortConditions.value = []
  if (store.currentProject && store.currentTable && store.currentView) {
    store.setSortConditions(store.currentProject.id, store.currentTable.id, store.currentView.id, [])
  }
  showSortModal.value = false
}

const applySorts = () => {
  if (!store.currentProject || !store.currentTable || !store.currentView) return
  store.setSortConditions(store.currentProject.id, store.currentTable.id, store.currentView.id, sortConditions.value)
  showSortModal.value = false
}

const getFieldTypeLabel = (type: string) => {
  const labels: Record<string, string> = {
    text: '文本',
    number: '数字',
    date: '日期',
    select: '单选',
    tags: '多选',
    boolean: '布尔',
    person: '人员',
    rating: '评分',
    url: '网址'
  }
  return labels[type] || type
}

const formatCellValue = (value: any, type: string) => {
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
    case 'url':
      return `<a href="${value}" target="_blank">${value}</a>`
    default:
      return String(value)
  }
}

const getEditorComponent = (_type: string) => {
  // 简单实现，返回一个输入组件
  return markRaw({
    template: `
      <input 
        :value="value" 
        @input="$emit('update', $event.target.value)"
        @blur="$emit('update', $event.target.value)"
        @keydown.enter="$emit('update', $event.target.value)"
        @keydown.esc="$emit('cancel')"
        class="editor-input"
        autofocus
      />
    `,
    props: ['value', 'field']
  })
}
</script>

<style scoped>
.table-view {
  height: 100%;
  display: flex;
  flex-direction: column;
  background-color: var(--bg-white);
}

.table-toolbar {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: var(--spacing-sm) var(--spacing-md);
  background-color: var(--bg-gray);
  border-bottom: 1px solid var(--border-color);
}

.toolbar-left {
  display: flex;
  gap: var(--spacing-sm);
}

.toolbar-right {
  display: flex;
  gap: var(--spacing-sm);
}

.tool-btn {
  display: inline-flex;
  align-items: center;
  padding: var(--spacing-xs) var(--spacing-sm);
  font-size: var(--font-size-sm);
  font-weight: var(--font-weight-medium);
  color: var(--text-secondary);
  background-color: var(--bg-white);
  border: 1px solid var(--border-color);
  border-radius: var(--radius-sm);
  cursor: pointer;
  transition: all var(--transition-fast);
}

.tool-btn:hover {
  background-color: var(--bg-gray);
  border-color: var(--primary-color);
  color: var(--primary-color);
}

.tool-btn:active {
  transform: scale(0.98);
}

.table-container {
  flex: 1;
  overflow: auto;
  background-color: var(--bg-white);
}

.data-table {
  width: 100%;
  border-collapse: collapse;
}

.table-header {
  position: sticky;
  top: 0;
  z-index: 10;
  background-color: var(--bg-gray);
  padding: var(--spacing-sm) var(--spacing-md);
  text-align: left;
  font-weight: var(--font-weight-semibold);
  font-size: var(--font-size-sm);
  color: var(--text-primary);
  border-bottom: 2px solid var(--border-color);
  white-space: nowrap;
  cursor: pointer;
  transition: background-color var(--transition-fast);
}

.table-header:hover {
  background-color: rgba(22, 93, 255, 0.08);
}

.sort-icon {
  margin-left: var(--spacing-xs);
  font-size: var(--font-size-xs);
  color: var(--text-placeholder);
  opacity: 0;
  transition: opacity var(--transition-fast);
}

.table-header:hover .sort-icon,
.table-header:has(.sort-icon) {
  opacity: 1;
}

.field-type {
  margin-left: var(--spacing-sm);
  font-size: var(--font-size-xs);
  color: var(--text-placeholder);
  font-weight: var(--font-weight-normal);
}

.table-row {
  border-bottom: 1px solid var(--border-color);
  transition: background-color var(--transition-fast);
}

.table-row:nth-child(even) {
  background-color: #FAFAFB;
}

.table-row:nth-child(odd) {
  background-color: var(--bg-white);
}

.table-row:hover {
  background-color: rgba(22, 93, 255, 0.05);
}

.table-row.selected {
  background-color: var(--primary-light);
  outline: 1px solid var(--primary-color);
}

.table-cell {
  padding: var(--spacing-sm) var(--spacing-md);
  font-size: var(--font-size-sm);
  color: var(--text-primary);
  white-space: nowrap;
  cursor: pointer;
  transition: background-color var(--transition-fast);
}

.table-cell.editable:hover {
  background-color: rgba(251, 189, 35, 0.1);
}

.cell-value {
  display: inline-block;
  max-width: 200px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.cell-editor {
  width: 100%;
}

.editor-input {
  width: 100%;
  padding: var(--spacing-xs) var(--spacing-sm);
  border: 2px solid var(--primary-color);
  border-radius: var(--radius-sm);
  font-size: var(--font-size-sm);
  background-color: var(--bg-white);
  outline: none;
}

.select-column {
  width: 48px;
  padding: var(--spacing-sm);
}

.select-all,
.select-row {
  width: 18px;
  height: 18px;
  cursor: pointer;
  accent-color: var(--primary-color);
}

.actions-column {
  width: 110px;
  padding: var(--spacing-sm);
}

.action-btn {
  padding: var(--spacing-xs) var(--spacing-sm);
  font-size: var(--font-size-xs);
  color: var(--text-secondary);
  background-color: transparent;
  border: none;
  cursor: pointer;
  border-radius: var(--radius-sm);
  transition: all var(--transition-fast);
}

.action-btn:hover {
  color: var(--primary-color);
  background-color: var(--primary-light);
}

.batch-bar {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: var(--spacing-sm) var(--spacing-md);
  background-color: rgba(251, 189, 35, 0.1);
  border-top: 1px solid rgba(251, 189, 35, 0.3);
}

.batch-bar span {
  font-size: var(--font-size-sm);
  color: var(--text-secondary);
}

.batch-btn {
  padding: var(--spacing-xs) var(--spacing-md);
  font-size: var(--font-size-sm);
  font-weight: var(--font-weight-medium);
  color: white;
  background-color: var(--danger-color);
  border: none;
  border-radius: var(--radius-sm);
  cursor: pointer;
  transition: all var(--transition-fast);
}

.batch-btn:hover {
  background-color: #EF4444;
}

.batch-btn:active {
  transform: scale(0.98);
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
  max-height: 85vh;
  overflow-y: auto;
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

.btn-submit:active {
  transform: scale(0.98);
}

/* 筛选弹窗样式 */
.filter-list,
.sort-list {
  margin-bottom: var(--spacing-md);
}

.filter-row,
.sort-row {
  display: flex;
  gap: var(--spacing-sm);
  align-items: center;
  margin-bottom: var(--spacing-sm);
}

.filter-field,
.filter-operator,
.sort-field,
.sort-direction {
  padding: var(--spacing-xs) var(--spacing-sm);
  font-size: var(--font-size-xs);
  background-color: var(--bg-white);
  border: 1px solid var(--border-color);
  border-radius: var(--radius-sm);
  outline: none;
  transition: border-color var(--transition-fast);
}

.filter-field:focus,
.filter-operator:focus,
.sort-field:focus,
.sort-direction:focus {
  border-color: var(--primary-color);
}

.filter-value {
  flex: 1;
  padding: var(--spacing-xs) var(--spacing-sm);
  font-size: var(--font-size-xs);
  background-color: var(--bg-white);
  border: 1px solid var(--border-color);
  border-radius: var(--radius-sm);
  outline: none;
  transition: border-color var(--transition-fast);
}

.filter-value:focus {
  border-color: var(--primary-color);
}

.remove-filter,
.remove-sort {
  width: 24px;
  height: 24px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: var(--font-size-lg);
  color: var(--text-placeholder);
  background-color: transparent;
  border: none;
  border-radius: var(--radius-sm);
  cursor: pointer;
  transition: all var(--transition-fast);
}

.remove-filter:hover,
.remove-sort:hover {
  color: var(--danger-color);
  background-color: rgba(248, 113, 113, 0.1);
}

.add-filter-btn,
.add-sort-btn {
  display: inline-flex;
  align-items: center;
  padding: var(--spacing-xs) var(--spacing-md);
  font-size: var(--font-size-xs);
  font-weight: var(--font-weight-medium);
  color: var(--primary-color);
  background-color: transparent;
  border: 1px dashed var(--primary-color);
  border-radius: var(--radius-md);
  cursor: pointer;
  transition: all var(--transition-fast);
  margin-bottom: var(--spacing-md);
}

.add-filter-btn:hover,
.add-sort-btn:hover {
  background-color: var(--primary-light);
}

/* 响应式设计 */
@media (max-width: 768px) {
  .table-toolbar {
    flex-wrap: wrap;
    gap: var(--spacing-xs);
  }
  
  .table-container {
    overflow-x: auto;
  }
  
  .modal-content {
    width: 95vw;
    padding: var(--spacing-md);
  }
}
</style>