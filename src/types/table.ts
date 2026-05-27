// 多维表的核心类型定义

// 字段定义接口
export interface FieldDefinition {
  id: string
  fieldName: string
  fieldType: 'text' | 'number' | 'date' | 'select' | 'tags' | 'boolean' | 'person' | 'rating' | 'url'
  fieldLabel: string
  description?: string
  options?: string[] // 用于select类型
  defaultValue?: any
  required?: boolean
  validation?: {
    min?: number
    max?: number
    regex?: string
    message?: string
  }
}

// 单元格接口
export interface Cell {
  id: string
  value: any
  rowId: string
  columnId: string
  dimensionValues: Record<string, string> // 存储该单元格在各个维度上的值
}

// 维度接口
export interface Dimension {
  id: string
  name: string
  values: string[] // 该维度的所有可能值
}

// 行接口
export interface Row {
  id: string
  dimensionValues: Record<string, string> // 该行在各个维度上的值
}

// 列接口
export interface Column {
  id: string
  dimensionValues: Record<string, string> // 该列在各个维度上的值
}

// 多维表配置接口
export interface TableConfig {
  rowDimensions: string[] // 作为行的维度ID列表
  columnDimensions: string[] // 作为列的维度ID列表
  measures: Measure[] // 度量值配置
}

// 度量值接口
export interface Measure {
  id: string
  name: string
  type: 'number' | 'string' | 'date'
  aggregation?: 'sum' | 'avg' | 'count' | 'min' | 'max' // 聚合方式
}

// 多维表数据接口
export interface TableData {
  id: string
  name: string
  fieldDefinitions: FieldDefinition[]
  data: any[]
  dimensions?: Dimension[]
  rows?: Row[]
  columns?: Column[]
  cells?: Cell[]
  config?: TableConfig
}

// 维度值组合接口
export interface DimensionValueCombination {
  [dimensionId: string]: string
}

// 用于生成行和列的维度组合
export type DimensionCombination = Record<string, string>

export interface FilterCondition {
  fieldId: string
  operator: 'equals' | 'contains' | 'not_contains' | 'greater_than' | 'less_than' | 'greater_or_equal' | 'less_or_equal' | 'is_empty' | 'is_not_empty'
  value?: any
  logic?: 'and' | 'or'
}

export interface SortCondition {
  fieldId: string
  direction: 'asc' | 'desc'
}

export interface View {
  id: string
  name: string
  type: 'table' | 'kanban' | 'calendar' | 'gantt'
  tableId: string
  isDefault?: boolean
  filterConditions: FilterCondition[]
  sortConditions: SortCondition[]
  visibleFieldIds: string[]
  groupFieldId?: string
  titleFieldId?: string
  displayFieldIds?: string[]
  dateFieldId?: string
  startDateFieldId?: string
  endDateFieldId?: string
}

export interface Comment {
  id: string
  recordId: string
  tableId: string
  userId: string
  userName: string
  content: string
  createdAt: string
}

export interface AutomationRule {
  id: string
  name: string
  trigger: string
  action: string
  enabled: boolean
  createdAt: string
}

export interface Table {
  id: string
  name: string
  fieldDefinitions: FieldDefinition[]
  data: any[]
  views: View[]
  comments: Comment[]
  createdAt: string
  updatedAt: string
}

export interface Project {
  id: string
  name: string
  description?: string
  tables: Table[]
  createdAt: string
  updatedAt: string
}
