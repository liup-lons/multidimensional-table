// 多维表的核心类型定义

// 字段类型
export type FieldType = 'text' | 'number' | 'date' | 'select' | 'tags' | 'boolean' | 'person' | 'rating' | 'url'

// 字段定义接口
export interface FieldDefinition {
  id: string
  fieldName: string
  fieldType: FieldType
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

// 度量值接口
export interface Measure {
  id: string
  name: string
  type: 'number' | 'string' | 'date'
  aggregation?: 'sum' | 'avg' | 'count' | 'min' | 'max' // 聚合方式
}

// 多维表配置接口
export interface TableConfig {
  rowDimensions: string[] // 作为行的维度ID列表
  columnDimensions: string[] // 作为列的维度ID列表
  measures: Measure[] // 度量值配置
}

// 视图类型
export type ViewType = 'table' | 'kanban' | 'calendar' | 'gantt'

// 视图接口
export interface View {
  id: string
  name: string
  type: ViewType
  tableId: string
  filterConditions?: FilterCondition[]
  sortConditions?: SortCondition[]
  groupFieldId?: string // 看板视图分组字段
  dateFieldId?: string // 日历/甘特视图日期字段
  startDateFieldId?: string // 甘特视图开始日期字段
  endDateFieldId?: string // 甘特视图结束日期字段
  visibleFieldIds?: string[] // 可见字段
  isDefault?: boolean
}

// 筛选条件接口
export interface FilterCondition {
  fieldId: string
  operator: 'equals' | 'contains' | 'not_contains' | 'greater_than' | 'less_than' | 'greater_or_equal' | 'less_or_equal' | 'is_empty' | 'is_not_empty'
  value: any
  logic?: 'and' | 'or'
}

// 排序条件接口
export interface SortCondition {
  fieldId: string
  direction: 'asc' | 'desc'
}

// 自动化触发类型
export type AutomationTriggerType = 'record_created' | 'record_modified' | 'record_deleted' | 'time_scheduled'

// 自动化动作类型
export type AutomationActionType = 'update_field' | 'send_notification' | 'add_comment' | 'mark_complete'

// 自动化规则接口
export interface AutomationRule {
  id: string
  name: string
  tableId: string
  triggerType: AutomationTriggerType
  triggerConfig?: {
    scheduledTime?: string // 定时触发时间
  }
  actionType: AutomationActionType
  actionConfig: {
    targetFieldId?: string
    targetValue?: any
    notificationMessage?: string
    commentContent?: string
    completeFieldId?: string
  }
  enabled: boolean
  createdAt: string
  lastExecutedAt?: string
}

// 评论接口
export interface Comment {
  id: string
  recordId: string
  tableId: string
  userId: string
  userName: string
  content: string
  mentions?: string[] // @提及的用户ID
  createdAt: string
}

// 用户接口
export interface User {
  id: string
  name: string
  isOnline?: boolean
}

// 表格数据接口
export interface Table {
  id: string
  name: string
  fieldDefinitions: FieldDefinition[]
  data: Record<string, any>[]
  views: View[]
  comments: Comment[]
  createdAt: string
  updatedAt: string
}

// 项目接口
export interface Project {
  id: string
  name: string
  description?: string
  tables: Table[]
  createdAt: string
  updatedAt: string
}

// 多维表数据接口（兼容旧版）
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

// 备份数据接口
export interface BackupData {
  projects: Project[]
  users: User[]
  exportedAt: string
  version: string
}