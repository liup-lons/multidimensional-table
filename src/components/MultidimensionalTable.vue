<script setup lang="ts">
import { ref, computed, onMounted, watch } from 'vue'
import { useTableStore } from '../store/table'
import { VueDraggableNext } from 'vue-draggable-next'
import TableController from './TableController.vue'
import SearchFilter from './SearchFilter.vue'
import ContextMenu from './ContextMenu.vue'
import DataExporter from './DataExporter.vue'
import { dataUtils, exportUtils } from '../utils'
import type { Cell, Dimension, Row, Column, TableConfig, TableData, Measure, DimensionValueCombination, FieldDefinition } from '../types/table'

// 使用Pinia store
const tableStore = useTableStore()

// 组件属性
const props = defineProps<{
  tableId?: string
  apiUrl?: string
  apiPathSuffix?: string
}>()

// 默认配置
const tableId = ref(props.tableId || '8d2dfda3b49e699cf0dba2c5457cccd8')
const baseApiUrl = ref(props.apiUrl || '/api/matrix-tables')
const apiPathSuffix = ref(props.apiPathSuffix || '/simple')

// 加载状态
const loading = ref(false)
// 错误信息
const error = ref<string | null>(null)

// 数据状态 - 从store获取
const tableData = computed(() => tableStore.currentTable)
const fieldDefinitions = computed(() => tableData.value?.fieldDefinitions || [])
const data = computed(() => tableData.value?.data || [])
const dimensions = computed(() => tableData.value?.dimensions || [])
const measures = computed(() => tableData.value?.config?.measures || [])
const tableConfig = computed(() => tableData.value?.config || { rowDimensions: [], columnDimensions: [], measures: [] })
const cells = ref<Cell[]>([])

// 编辑状态
const editingCell = ref<{ rowId: string; fieldName: string } | null>(null)
const editedValue = ref('')

// 右键菜单状态
const contextMenu = ref({
  visible: false,
  x: 0,
  y: 0,
  items: [
    { id: 'copy', label: '复制' },
    { id: 'paste', label: '粘贴' },
    { id: 'delete', label: '删除' },
    { id: 'export', label: '导出', children: [
      { id: 'export-csv', label: '导出为CSV' },
      { id: 'export-excel', label: '导出为Excel' }
    ]}
  ]
})

// 搜索筛选状态
const searchKeyword = ref('')
const filters = ref<any>({})

// 导出状态
const showExportModal = ref(false)

// 拖拽配置
const dragOptions = {
  animation: 200,
  ghostClass: 'ghost',
  chosenClass: 'chosen'
}

// API调用函数
const fetchTableData = async () => {
  loading.value = true
  error.value = null
  
  try {
    // 使用store方法获取表格数据
    await tableStore.fetchTable(tableId.value)
    cells.value = tableData.value?.cells || []
  } catch (err) {
    console.error('Failed to fetch table data:', err)
    error.value = err instanceof Error ? err.message : 'Failed to fetch table data'
    
    // 加载失败时使用示例数据
    loadSampleData()
  } finally {
    loading.value = false
  }
}

// 示例数据加载函数
const loadSampleData = () => {
  const sampleData: TableData = {
    id: tableId.value,
    name: '示例表格',
    fieldDefinitions: [
      { fieldName: 'name', fieldType: 'text', fieldLabel: '姓名', required: true },
      { fieldName: 'age', fieldType: 'number', fieldLabel: '年龄', validation: { min: 0, max: 150 } },
      { fieldName: 'gender', fieldType: 'select', fieldLabel: '性别', options: ['男', '女'] },
      { fieldName: 'skills', fieldType: 'tags', fieldLabel: '技能' },
      { fieldName: 'joinDate', fieldType: 'date', fieldLabel: '入职日期' },
      { fieldName: 'active', fieldType: 'boolean', fieldLabel: '是否在职' }
    ],
    data: [
      {
        id: '1',
        name: '张三',
        age: 25,
        gender: '男',
        skills: 'JavaScript,TypeScript,Vue',
        joinDate: '2023-01-15',
        active: true
      },
      {
        id: '2',
        name: '李四',
        age: 30,
        gender: '女',
        skills: 'Python,Java,SQL',
        joinDate: '2022-06-10',
        active: true
      },
      {
        id: '3',
        name: '王五',
        age: 28,
        gender: '男',
        skills: 'React,Node.js,Express',
        joinDate: '2023-03-20',
        active: false
      }
    ],
    dimensions: [
      {
        id: 'product',
        name: '产品',
        values: ['产品A', '产品B', '产品C']
      },
      {
        id: 'region',
        name: '地区',
        values: ['华东', '华南', '华北']
      },
      {
        id: 'quarter',
        name: '季度',
        values: ['Q1', 'Q2', 'Q3', 'Q4']
      }
    ],
    config: {
      rowDimensions: ['product', 'region'],
      columnDimensions: ['quarter'],
      measures: [
        {
          id: 'sales',
          name: '销售额',
          type: 'number',
          aggregation: 'sum'
        },
        {
          id: 'quantity',
          name: '销量',
          type: 'number',
          aggregation: 'sum'
        }
      ]
    },
    cells: [],
    rows: [],
    columns: []
  }
  
  // 更新store数据
  tableStore.updateTable(sampleData)
  cells.value = []
}

// 生成维度组合的所有可能排列
const generateCombinations = (dimensionsToUse: string[]): DimensionValueCombination[] => {
  if (!dimensionsToUse || dimensionsToUse.length === 0) {
    return [{}]
  }

  const result: DimensionValueCombination[] = []
  const currentDimensionId = dimensionsToUse[0]
  const currentDimension = dimensions.value.find(d => d.id === currentDimensionId)
  
  if (!currentDimension || !currentDimension.values || currentDimension.values.length === 0) {
    return result
  }

  const remainingDimensions = dimensionsToUse.slice(1)
  const remainingCombinations = generateCombinations(remainingDimensions)

  currentDimension.values.forEach(value => {
    remainingCombinations.forEach(combination => {
      result.push({
        ...combination,
        [currentDimensionId]: value
      })
    })
  })

  return result
}

// 生成行和列
const rows = computed(() => {
  const combinations = generateCombinations(tableConfig.value.rowDimensions)
  return combinations.map(combination => {
    const id = Object.values(combination).join('-')
    return {
      id,
      dimensionValues: combination
    }
  })
})

const columns = computed(() => {
  const combinations = generateCombinations(tableConfig.value.columnDimensions)
  return combinations.map(combination => {
    const id = Object.values(combination).join('-')
    return {
      id,
      dimensionValues: combination
    }
  })
})

// 生命周期钩子 - 组件挂载时获取数据
onMounted(() => {
  initialLoadData()
})

// 监听tableId变化
watch(tableId, () => {
  currentPage.value = 1
  initialLoadData()
})

// 开始编辑单元格
const startEditing = (rowId: string, fieldName: string, currentValue: any) => {
  editingCell.value = { rowId, fieldName }
  editedValue.value = currentValue
}

// 保存编辑
const saveEditing = (rowId: string, fieldName: string) => {
  const fieldDef = fieldDefinitions.value.find(fd => fd.fieldName === fieldName)
  if (!fieldDef) return
  
  // 数据校验
  const validationError = validateValue(editedValue.value, fieldDef)
  if (validationError) {
    alert(validationError)
    return
  }
  
  // 更新数据
  tableStore.updateRow(tableId.value, rowId, { [fieldName]: editedValue.value })
  editingCell.value = null
}

// 取消编辑
const cancelEditing = () => {
  editingCell.value = null
}

// 数据校验
const validateValue = (value: any, fieldDef: FieldDefinition): string | null => {
  // 必填校验
  if (fieldDef.required && (!value || value === '')) {
    return `${fieldDef.fieldLabel}是必填项`
  }
  
  // 类型校验
  switch (fieldDef.fieldType) {
    case 'number':
      if (value !== '' && isNaN(Number(value))) {
        return `${fieldDef.fieldLabel}必须是数字`
      }
      break
    case 'date':
      if (value && isNaN(Date.parse(value))) {
        return `${fieldDef.fieldLabel}必须是有效的日期`
      }
      break
  }
  
  // 范围校验
  if (fieldDef.validation) {
    const numValue = Number(value)
    if (fieldDef.validation.min !== undefined && numValue < fieldDef.validation.min) {
      return `${fieldDef.fieldLabel}不能小于${fieldDef.validation.min}`
    }
    if (fieldDef.validation.max !== undefined && numValue > fieldDef.validation.max) {
      return `${fieldDef.fieldLabel}不能大于${fieldDef.validation.max}`
    }
    if (fieldDef.validation.regex) {
      const regex = new RegExp(fieldDef.validation.regex)
      if (!regex.test(String(value))) {
        return fieldDef.validation.message || `${fieldDef.fieldLabel}格式不正确`
      }
    }
  }
  
  return null
}

// 渲染字段类型对应的编辑控件
const renderFieldEditor = (row: any, fieldDef: FieldDefinition) => {
  const isEditing = editingCell.value?.rowId === row.id && editingCell.value?.fieldName === fieldDef.fieldName
  const value = isEditing ? editedValue.value : row[fieldDef.fieldName]
  
  if (isEditing) {
    switch (fieldDef.fieldType) {
      case 'text':
        return `<input type="text" value="${value || ''}" @input="editedValue = $event.target.value" @blur="saveEditing('${row.id}', '${fieldDef.fieldName}')" @keyup.enter="saveEditing('${row.id}', '${fieldDef.fieldName}')" @keyup.esc="cancelEditing()" />`
      case 'number':
        return `<input type="number" value="${value || ''}" @input="editedValue = $event.target.value" @blur="saveEditing('${row.id}', '${fieldDef.fieldName}')" @keyup.enter="saveEditing('${row.id}', '${fieldDef.fieldName}')" @keyup.esc="cancelEditing()" />`
      case 'date':
        return `<input type="date" value="${value || ''}" @input="editedValue = $event.target.value" @blur="saveEditing('${row.id}', '${fieldDef.fieldName}')" @keyup.enter="saveEditing('${row.id}', '${fieldDef.fieldName}')" @keyup.esc="cancelEditing()" />`
      case 'select':
        return `<select @change="editedValue = $event.target.value" @blur="saveEditing('${row.id}', '${fieldDef.fieldName}')">
          ${fieldDef.options?.map(option => `<option value="${option}" ${value === option ? 'selected' : ''}>${option}</option>`).join('')}
        </select>`
      case 'boolean':
        return `<input type="checkbox" ${value ? 'checked' : ''} @change="editedValue = $event.target.checked; saveEditing('${row.id}', '${fieldDef.fieldName}')" />`
      default:
        return `<input type="text" value="${value || ''}" @input="editedValue = $event.target.value" @blur="saveEditing('${row.id}', '${fieldDef.fieldName}')" @keyup.enter="saveEditing('${row.id}', '${fieldDef.fieldName}')" @keyup.esc="cancelEditing()" />`
    }
  } else {
    switch (fieldDef.fieldType) {
      case 'tags':
        return value ? value.split(',').map((tag: string) => `<span class="tag">${tag}</span>`).join('') : ''
      case 'boolean':
        return value ? '是' : '否'
      default:
        return value || ''
    }
  }
}

// 计算单元格值
const getCellValue = (row: Row, column: Column, measureId: string) => {
  const cellId = `${row.id}-${column.id}-${measureId}`
  const cell = cells.value.find(c => c.id === cellId)
  return cell?.value || 0
}

// 更新单元格值
const updateCellValue = (row: Row, column: Column, measureId: string, value: any) => {
  const cellId = `${row.id}-${column.id}-${measureId}`
  const existingCell = cells.value.find(c => c.id === cellId)
  
  if (existingCell) {
    existingCell.value = value
  } else {
    cells.value.push({
      id: cellId,
      value,
      rowId: row.id,
      columnId: column.id,
      dimensionValues: {
        ...row.dimensionValues,
        ...column.dimensionValues,
        measure: measureId
      }
    })
  }
}

// 虚拟滚动相关
const visibleRows = ref(20) // 可见行数
const bufferRows = ref(5) // 缓冲区行数
const startIndex = ref(0) // 开始索引
const rowHeight = ref(48) // 行高度
const pageSize = ref(100) // 每页加载数量
const currentPage = ref(1) // 当前页码

// 防抖函数
const debounce = (func: Function, wait: number) => {
  let timeout: number | null = null
  return function(...args: any[]) {
    if (timeout) clearTimeout(timeout)
    timeout = window.setTimeout(() => {
      func.apply(this, args)
    }, wait)
  }
}

// 节流函数
const throttle = (func: Function, limit: number) => {
  let inThrottle = false
  return function(...args: any[]) {
    if (!inThrottle) {
      func.apply(this, args)
      inThrottle = true
      setTimeout(() => inThrottle = false, limit)
    }
  }
}

// 滚动处理 - 使用节流优化
const handleScroll = throttle((event: Event) => {
  const target = event.target as HTMLElement
  const scrollTop = target.scrollTop
  const newStartIndex = Math.floor(scrollTop / rowHeight.value)
  
  // 只有当索引变化超过一定阈值时才更新，减少渲染次数
  if (Math.abs(newStartIndex - startIndex.value) > 2) {
    startIndex.value = newStartIndex
    
    // 检查是否需要加载更多数据
    const totalLoaded = currentPage.value * pageSize.value
    if (newStartIndex + visibleRows.value > totalLoaded - pageSize.value) {
      loadMoreData()
    }
  }
}, 16) // 约60fps

// 计算可见数据 - 使用computed缓存
const visibleData = computed(() => {
  const start = Math.max(0, startIndex.value - bufferRows.value)
  const end = startIndex.value + visibleRows.value + bufferRows.value
  return data.value.slice(start, end)
})

// 预计算总高度
const totalHeight = computed(() => {
  return data.value.length * rowHeight.value
})

// 加载更多数据
const loadMoreData = async () => {
  if (loading.value) return
  
  currentPage.value++
  // 这里可以添加实际的分页加载逻辑
  // 例如：await tableStore.fetchTableData(tableId.value, currentPage.value, pageSize.value)
  console.log(`加载第${currentPage.value}页数据`)
}

// 初始加载数据
const initialLoadData = async () => {
  await fetchTableData()
  // 这里可以添加初始分页加载逻辑
}

// 搜索处理
const handleSearch = (keyword: string) => {
  searchKeyword.value = keyword
  // 这里可以添加搜索逻辑
  console.log('搜索关键词:', keyword)
}

// 筛选处理
const handleFilter = (filterData: any) => {
  filters.value = filterData
  // 这里可以添加筛选逻辑
  console.log('筛选条件:', filterData)
}

// 刷新处理
const handleRefresh = () => {
  fetchTableData()
}

// 导出处理
const handleExport = (format: 'csv' | 'excel') => {
  if (data.value.length === 0) {
    alert('没有数据可导出')
    return
  }

  try {
    const filename = `table_${tableId.value}_${new Date().toISOString().slice(0, 10)}`
    if (format === 'csv') {
      exportUtils.exportToCSV(data.value, `${filename}.csv`)
    } else if (format === 'excel') {
      exportUtils.exportToExcel(data.value, `${filename}.xlsx`)
    }
  } catch (error) {
    console.error('导出失败:', error)
  }
}

// 右键菜单处理
const handleContextMenu = (event: MouseEvent, row: any) => {
  event.preventDefault()
  contextMenu.value = {
    ...contextMenu.value,
    visible: true,
    x: event.clientX,
    y: event.clientY
  }
}

const handleContextMenuSelect = (itemId: string) => {
  console.log('右键菜单选择:', itemId)
  // 这里可以添加右键菜单操作逻辑
  switch (itemId) {
    case 'copy':
      // 复制逻辑
      break
    case 'paste':
      // 粘贴逻辑
      break
    case 'delete':
      // 删除逻辑
      break
    case 'export-csv':
      handleExport('csv')
      break
    case 'export-excel':
      handleExport('excel')
      break
  }
}

const handleContextMenuClose = () => {
  contextMenu.value.visible = false
}

// 设置处理
const handleSettings = () => {
  // 这里可以添加设置逻辑
  console.log('打开设置')
}
</script>

<template>
  <div class="multidimensional-table-container">
    <!-- 加载状态 -->
    <div v-if="loading" class="loading-container">
      <div class="loading-spinner"></div>
      <p>加载多维表数据中...</p>
    </div>

    <!-- 错误信息 -->
    <div v-else-if="error" class="error-container">
      <div class="error-icon">⚠️</div>
      <p class="error-message">{{ error }}</p>
      <button @click="fetchTableData" class="retry-button">重试</button>
    </div>

    <!-- 表格内容 -->
    <div v-else-if="tableData">
      <!-- 表格控制器 -->
      <TableController
        :title="tableData.name"
        :show-export="true"
        :show-search="true"
        :show-refresh="true"
        :show-settings="true"
        :loading="loading"
        @search="handleSearch"
        @refresh="handleRefresh"
        @export="handleExport"
        @settings="handleSettings"
      />

      <!-- 搜索筛选 -->
      <SearchFilter
        :fields="fieldDefinitions"
        :show-advanced="true"
        @filter="handleFilter"
        @reset="() => { filters = {} }"
      />

      <!-- 数据导出 -->
      <DataExporter
        :data="data"
        :filename="`table_${tableId}`"
        :show-modal="showExportModal"
        @close="showExportModal = false"
      />

      <!-- 右键菜单 -->
      <ContextMenu
        :items="contextMenu.items"
        :x="contextMenu.x"
        :y="contextMenu.y"
        :visible="contextMenu.visible"
        @select="handleContextMenuSelect"
        @close="handleContextMenuClose"
      />

      <!-- 字段定义展示 -->
      <div class="field-definitions-section">
        <h3>字段定义</h3>
        <div class="field-grid">
          <div v-for="field in fieldDefinitions" :key="field.fieldName" class="field-card">
            <div class="field-header">
              <span class="field-label">{{ field.fieldLabel }}</span>
              <span class="field-type">{{ field.fieldType }}</span>
            </div>
            <div class="field-description" v-if="field.description">{{ field.description }}</div>
            <div class="field-validation" v-if="field.required">必填</div>
          </div>
        </div>
      </div>

      <!-- 数据表格 -->
      <div class="data-table-section">
        <h3>数据表格</h3>
        <div class="table-wrapper" @scroll="handleScroll">
          <table class="data-table">
            <thead>
              <tr>
                <th>ID</th>
                <th v-for="field in fieldDefinitions" :key="field.fieldName">
                  {{ field.fieldLabel }}
                </th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="row in visibleData" :key="row.id" @contextmenu="handleContextMenu($event, row)">
                <td class="row-id">{{ row.id }}</td>
                <td v-for="field in fieldDefinitions" :key="field.fieldName" 
                    class="data-cell" 
                    @click="startEditing(row.id, field.fieldName, row[field.fieldName])">
                  <template v-if="editingCell?.rowId === row.id && editingCell?.fieldName === field.fieldName">
                    <input v-if="field.fieldType === 'text'" 
                           type="text" 
                           v-model="editedValue" 
                           @blur="saveEditing(row.id, field.fieldName)" 
                           @keyup.enter="saveEditing(row.id, field.fieldName)" 
                           @keyup.esc="cancelEditing()" 
                           autofocus />
                    <input v-else-if="field.fieldType === 'number'" 
                           type="number" 
                           v-model="editedValue" 
                           @blur="saveEditing(row.id, field.fieldName)" 
                           @keyup.enter="saveEditing(row.id, field.fieldName)" 
                           @keyup.esc="cancelEditing()" 
                           autofocus />
                    <input v-else-if="field.fieldType === 'date'" 
                           type="date" 
                           v-model="editedValue" 
                           @blur="saveEditing(row.id, field.fieldName)" 
                           @keyup.enter="saveEditing(row.id, field.fieldName)" 
                           @keyup.esc="cancelEditing()" 
                           autofocus />
                    <select v-else-if="field.fieldType === 'select'" 
                            v-model="editedValue" 
                            @change="saveEditing(row.id, field.fieldName)" 
                            @blur="saveEditing(row.id, field.fieldName)" 
                            autofocus>
                      <option v-for="option in field.options" :key="option" :value="option">
                        {{ option }}
                      </option>
                    </select>
                    <input v-else-if="field.fieldType === 'boolean'" 
                           type="checkbox" 
                           v-model="editedValue" 
                           @change="saveEditing(row.id, field.fieldName)" />
                    <input v-else 
                           type="text" 
                           v-model="editedValue" 
                           @blur="saveEditing(row.id, field.fieldName)" 
                           @keyup.enter="saveEditing(row.id, field.fieldName)" 
                           @keyup.esc="cancelEditing()" 
                           autofocus />
                  </template>
                  <template v-else>
                    <span v-if="field.fieldType === 'tags'" class="tags">
                      <span v-for="tag in (row[field.fieldName] || '').split(',')" :key="tag" class="tag">
                        {{ tag }}
                      </span>
                    </span>
                    <span v-else-if="field.fieldType === 'boolean'">
                      {{ row[field.fieldName] ? '是' : '否' }}
                    </span>
                    <span v-else>
                      {{ row[field.fieldName] || '' }}
                    </span>
                  </template>
                </td>
              </tr>
            </tbody>
          </table>
          <!-- 虚拟滚动占位符 -->
          <div class="virtual-placeholder" :style="{ height: `${totalHeight}px` }"></div>
        </div>
      </div>

      <!-- 多维表视图 -->
      <div v-if="rows.length > 0 && columns.length > 0" class="multidimensional-view-section">
        <h3>多维表视图</h3>
        <table class="multidimensional-table">
          <thead>
            <!-- 维度表头行 -->
            <tr>
              <th v-for="i in tableConfig.rowDimensions.length" :key="`row-header-${i}`" class="row-dimension-header">
                {{ dimensions.find(d => d.id === tableConfig.rowDimensions[i - 1])?.name }}
              </th>
              <th v-for="column in columns" :key="`column-${column.id}`" :colspan="tableConfig.measures.length" class="column-header">
                {{ Object.values(column.dimensionValues).join(' ') }}
              </th>
            </tr>
            <!-- 度量值表头行 -->
            <tr>
              <th v-for="i in tableConfig.rowDimensions.length" :key="`row-empty-${i}`" class="row-dimension-empty"></th>
              <template v-for="column in columns" :key="`column-${column.id}`">
                <th v-for="measure in tableConfig.measures" :key="`measure-${column.id}-${measure.id}`" class="measure-header">
                  {{ measure.name }}
                </th>
              </template>
            </tr>
          </thead>
          <tbody>
            <tr v-for="row in rows" :key="row.id">
              <!-- 行维度值 -->
              <td v-for="dimensionId in tableConfig.rowDimensions" :key="`row-value-${dimensionId}`" class="row-dimension">
                {{ row.dimensionValues[dimensionId] }}
              </td>
              <!-- 数据单元格 -->
              <template v-for="column in columns" :key="`column-${column.id}`">
                <td v-for="measure in tableConfig.measures" :key="`cell-${row.id}-${column.id}-${measure.id}`" class="cell">
                  <input 
                    type="number" 
                    :value="getCellValue(row, column, measure.id)" 
                    @input="updateCellValue(row, column, measure.id, Number(($event.target as HTMLInputElement).value))"
                  />
                </td>
              </template>
            </tr>
          </tbody>
        </table>
      </div>
    </div>

    <!-- 空数据状态 -->
    <div v-else class="empty-container">
      <div class="empty-icon">📊</div>
      <p>暂无数据</p>
    </div>
  </div>
</template>

<style scoped>
.multidimensional-table-container {
  overflow-x: auto;
  border: 1px solid #e0e0e0;
  border-radius: 8px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  background-color: white;
  padding: 20px;
}

/* 字段定义部分 */
.field-definitions-section {
  margin-bottom: 30px;
}

.field-definitions-section h3 {
  color: #303133;
  font-size: 18px;
  margin-bottom: 15px;
  font-weight: bold;
}

.field-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
  gap: 15px;
}

.field-card {
  background-color: #f5f7fa;
  padding: 15px;
  border-radius: 8px;
  border: 1px solid #e0e0e0;
  transition: transform 0.3s, box-shadow 0.3s;
}

.field-card:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
}

.field-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 10px;
}

.field-label {
  font-weight: 600;
  color: #303133;
}

.field-type {
  font-size: 12px;
  padding: 2px 8px;
  background-color: #e6f7ff;
  color: #1890ff;
  border-radius: 10px;
}

.field-description {
  font-size: 14px;
  color: #606266;
  margin-bottom: 10px;
}

.field-validation {
  font-size: 12px;
  color: #f5222d;
}

/* 数据表格部分 */
.data-table-section {
  margin-bottom: 30px;
}

.data-table-section h3 {
  color: #303133;
  font-size: 18px;
  margin-bottom: 15px;
  font-weight: bold;
}

.table-wrapper {
  max-height: 500px;
  overflow-y: auto;
  border: 1px solid #e0e0e0;
  border-radius: 8px;
  position: relative;
}

.data-table {
  border-collapse: collapse;
  width: 100%;
  min-width: 800px;
  position: absolute;
  top: 0;
  left: 0;
  z-index: 1;
}

.data-table th,
.data-table td {
  border: 1px solid #e0e0e0;
  padding: 12px;
  text-align: left;
  white-space: nowrap;
  height: 46px;
}

.data-table th {
  background-color: #f8f9fa;
  font-weight: 600;
  color: #333;
  position: sticky;
  top: 0;
  z-index: 10;
}

.row-id {
  background-color: #f8f9fa;
  font-weight: 600;
  color: #555;
  position: sticky;
  left: 0;
  z-index: 5;
}

.data-cell {
  background-color: white;
  transition: background-color 0.2s;
  cursor: pointer;
}

.data-cell:hover {
  background-color: #f5f5f5;
}

.data-cell input,
.data-cell select {
  width: 100%;
  padding: 6px 8px;
  border: 1px solid #2196f3;
  border-radius: 4px;
  font-size: 0.9rem;
  transition: border-color 0.2s, box-shadow 0.2s;
}

.data-cell input:focus,
.data-cell select:focus {
  outline: none;
  border-color: #2196f3;
  box-shadow: 0 0 0 2px rgba(33, 150, 243, 0.2);
}

.tags {
  display: flex;
  flex-wrap: wrap;
  gap: 5px;
}

.tag {
  background-color: #e6f7ff;
  color: #1890ff;
  padding: 2px 8px;
  border-radius: 10px;
  font-size: 12px;
}

.virtual-placeholder {
  position: relative;
  z-index: 0;
}

/* 多维表视图部分 */
.multidimensional-view-section {
  margin-bottom: 20px;
}

.multidimensional-view-section h3 {
  color: #303133;
  font-size: 18px;
  margin-bottom: 15px;
  font-weight: bold;
}

.multidimensional-table {
  border-collapse: collapse;
  width: 100%;
  min-width: 800px;
}

.multidimensional-table th,
.multidimensional-table td {
  border: 1px solid #e0e0e0;
  padding: 10px;
  text-align: center;
  white-space: nowrap;
}

.multidimensional-table th {
  background-color: #f8f9fa;
  font-weight: 600;
  color: #333;
  position: sticky;
  top: 0;
  z-index: 10;
}

.row-dimension-header {
  background-color: #e9ecef;
  font-weight: 700;
}

.row-dimension {
  background-color: #f8f9fa;
  font-weight: 600;
  color: #555;
  position: sticky;
  left: 0;
  z-index: 5;
}

.column-header {
  background-color: #e3f2fd;
  color: #1565c0;
  font-weight: 700;
}

.measure-header {
  background-color: #bbdefb;
  color: #0d47a1;
  font-weight: 600;
  font-size: 0.9rem;
}

.cell {
  background-color: white;
  transition: background-color 0.2s;
}

.cell:hover {
  background-color: #f5f5f5;
}

.cell input {
  width: 100px;
  padding: 6px 8px;
  text-align: center;
  border: 1px solid #ccc;
  border-radius: 4px;
  font-size: 0.9rem;
  transition: border-color 0.2s, box-shadow 0.2s;
}

.cell input:focus {
  outline: none;
  border-color: #2196f3;
  box-shadow: 0 0 0 2px rgba(33, 150, 243, 0.2);
}

/* 加载状态样式 */
.loading-container {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 60px 20px;
  text-align: center;
  color: #666;
}

.loading-spinner {
  width: 40px;
  height: 40px;
  border: 4px solid #f3f3f3;
  border-top: 4px solid #2196f3;
  border-radius: 50%;
  animation: spin 1s linear infinite;
  margin-bottom: 16px;
}

@keyframes spin {
  0% { transform: rotate(0deg); }
  100% { transform: rotate(360deg); }
}

/* 错误信息样式 */
.error-container {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 60px 20px;
  text-align: center;
  background-color: #fff3f3;
  border: 1px solid #ffdddd;
  border-radius: 8px;
}

.error-icon {
  font-size: 48px;
  margin-bottom: 16px;
}

.error-message {
  color: #d32f2f;
  margin-bottom: 24px;
  max-width: 600px;
}

.retry-button {
  padding: 8px 16px;
  background-color: #2196f3;
  color: white;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  font-size: 14px;
  transition: background-color 0.2s;
}

.retry-button:hover {
  background-color: #1976d2;
}

/* 空数据状态样式 */
.empty-container {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 60px 20px;
  text-align: center;
  color: #999;
}

.empty-icon {
  font-size: 64px;
  margin-bottom: 16px;
  opacity: 0.5;
}

/* 响应式设计 */
@media (max-width: 768px) {
  .multidimensional-table-container {
    border-radius: 4px;
    padding: 10px;
  }
  
  .field-grid {
    grid-template-columns: 1fr;
  }
  
  .data-table th,
  .data-table td,
  .multidimensional-table th,
  .multidimensional-table td {
    padding: 6px;
    font-size: 0.85rem;
  }
  
  .cell input {
    width: 80px;
    padding: 4px;
    font-size: 0.8rem;
  }
  
  .loading-container,
  .error-container,
  .empty-container {
    padding: 40px 16px;
  }
  
  .loading-spinner {
    width: 30px;
    height: 30px;
  }
  
  .error-icon {
    font-size: 36px;
  }
  
  .empty-icon {
    font-size: 48px;
  }
}
</style>