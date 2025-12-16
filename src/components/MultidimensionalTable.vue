<script setup lang="ts">
import { ref, computed } from 'vue'
import type { Cell, Dimension, Row, Column, TableConfig, TableData, Measure, DimensionValueCombination } from '../types/table'

// 示例数据
const dimensions = ref<Dimension[]>([
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
])

// 度量值配置
const measures = ref<Measure[]>([
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
])

// 表配置
const tableConfig = ref<TableConfig>({
  rowDimensions: ['product', 'region'],
  columnDimensions: ['quarter'],
  measures: measures.value
})

// 生成维度组合的所有可能排列
const generateCombinations = (dimensionsToUse: string[]): DimensionValueCombination[] => {
  if (dimensionsToUse.length === 0) {
    return [{}]
  }

  const result: DimensionValueCombination[] = []
  const currentDimensionId = dimensionsToUse[0]
  const currentDimension = dimensions.value.find(d => d.id === currentDimensionId)
  
  if (!currentDimension) {
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

// 初始化单元格数据
const cells = ref<Cell[]>([])

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
}
</style>