<script setup lang="ts">
import { ref, computed, onMounted, watch } from 'vue'
import type { Cell, Dimension, Row, Column, TableConfig, TableData, Measure, DimensionValueCombination } from '../types/table'

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

// 数据状态
const dimensions = ref<Dimension[]>([])
const measures = ref<Measure[]>([])
const tableConfig = ref<TableConfig>({
  rowDimensions: [],
  columnDimensions: [],
  measures: []
})
const cells = ref<Cell[]>([])

// API调用函数
const fetchTableData = async () => {
  loading.value = true
  error.value = null
  
  try {
    const response = await fetch(`${baseApiUrl.value}/${tableId.value}${apiPathSuffix.value}`)
    
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`)
    }
    
    const data: TableData = await response.json()
    
    // 更新组件数据（添加空值检查）
    dimensions.value = data.dimensions || []
    tableConfig.value = data.config || {
      rowDimensions: [],
      columnDimensions: [],
      measures: []
    }
    measures.value = tableConfig.value.measures || []
    cells.value = data.cells || []
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
  dimensions.value = [
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
  ]
  
  measures.value = [
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
  
  tableConfig.value = {
    rowDimensions: ['product', 'region'],
    columnDimensions: ['quarter'],
    measures: measures.value
  }
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
  fetchTableData()
})

// 监听tableId变化
watch(tableId, () => {
  fetchTableData()
})

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
    <div v-else-if="rows && rows.length > 0 && columns && columns.length > 0">
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
  }
  
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