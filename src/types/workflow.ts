// 工作流类型定义

export type WorkflowTriggerType = 'create' | 'update' | 'delete' | 'schedule' | 'field_change'

export type WorkflowActionType = 'update_field' | 'create_record' | 'send_notification' | 'webhook' | 'email'

export interface WorkflowCondition {
  fieldId: string
  operator: 'equals' | 'not_equals' | 'contains' | 'not_contains' | 'greater_than' | 'less_than' | 'greater_or_equal' | 'less_or_equal' | 'is_empty' | 'is_not_empty'
  value: any
}

export interface WorkflowTrigger {
  type: WorkflowTriggerType
  fieldId?: string // 用于field_change触发器
  schedule?: string // 用于schedule触发器，cron表达式
  conditions?: WorkflowCondition[]
}

export interface WorkflowAction {
  type: WorkflowActionType
  fieldId?: string
  value?: any
  targetTableId?: string
  template?: string
  url?: string
  method?: 'GET' | 'POST' | 'PUT' | 'DELETE'
  headers?: Record<string, string>
}

export interface Workflow {
  id: string
  name: string
  description: string
  tableId: string
  trigger: WorkflowTrigger
  actions: WorkflowAction[]
  enabled: boolean
  createdAt: string
  updatedAt: string
}

export interface WorkflowExecution {
  id: string
  workflowId: string
  recordId?: string
  status: 'pending' | 'running' | 'completed' | 'failed'
  error?: string
  createdAt: string
  completedAt?: string
}

export interface WorkflowLog {
  id: string
  workflowId: string
  executionId: string
  level: 'info' | 'warning' | 'error'
  message: string
  timestamp: string
}