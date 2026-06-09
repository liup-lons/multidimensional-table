import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import type { Workflow, WorkflowExecution, WorkflowLog } from '../types/workflow'

const STORAGE_KEY = 'multidimensional-table-workflows'

export const useWorkflowStore = defineStore('workflow', () => {
  const workflows = ref<Workflow[]>([])
  const executions = ref<WorkflowExecution[]>([])
  const logs = ref<WorkflowLog[]>([])

  // 加载工作流数据
  const loadWorkflows = () => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY)
      if (stored) {
        workflows.value = JSON.parse(stored)
      }
    } catch {
      workflows.value = []
    }
  }

  // 保存工作流数据
  const saveWorkflows = () => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(workflows.value))
  }

  // 获取表格的工作流
  const getWorkflowsByTable = (tableId: string) => {
    return computed(() => workflows.value.filter(w => w.tableId === tableId))
  }

  // 获取工作流详情
  const getWorkflowById = (workflowId: string) => {
    return workflows.value.find(w => w.id === workflowId)
  }

  // 创建工作流
  const createWorkflow = (workflow: Omit<Workflow, 'id' | 'createdAt' | 'updatedAt'>) => {
    const newWorkflow: Workflow = {
      ...workflow,
      id: `workflow_${Date.now()}`,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    }
    workflows.value.push(newWorkflow)
    saveWorkflows()
    return newWorkflow
  }

  // 更新工作流
  const updateWorkflow = (workflowId: string, updates: Partial<Workflow>) => {
    const index = workflows.value.findIndex(w => w.id === workflowId)
    if (index !== -1) {
      workflows.value[index] = {
        ...workflows.value[index],
        ...updates,
        updatedAt: new Date().toISOString()
      }
      saveWorkflows()
      return workflows.value[index]
    }
    return null
  }

  // 删除工作流
  const deleteWorkflow = (workflowId: string) => {
    const index = workflows.value.findIndex(w => w.id === workflowId)
    if (index !== -1) {
      workflows.value.splice(index, 1)
      saveWorkflows()
      return true
    }
    return false
  }

  // 启用/禁用工作流
  const toggleWorkflow = (workflowId: string) => {
    const workflow = workflows.value.find(w => w.id === workflowId)
    if (workflow) {
      workflow.enabled = !workflow.enabled
      workflow.updatedAt = new Date().toISOString()
      saveWorkflows()
      return workflow
    }
    return null
  }

  // 创建执行记录
  const createExecution = (workflowId: string, recordId?: string): WorkflowExecution => {
    const execution: WorkflowExecution = {
      id: `exec_${Date.now()}`,
      workflowId,
      recordId,
      status: 'pending',
      createdAt: new Date().toISOString()
    }
    executions.value.push(execution)
    return execution
  }

  // 更新执行状态
  const updateExecution = (executionId: string, updates: Partial<WorkflowExecution>) => {
    const index = executions.value.findIndex(e => e.id === executionId)
    if (index !== -1) {
      executions.value[index] = { ...executions.value[index], ...updates }
      return executions.value[index]
    }
    return null
  }

  // 添加日志
  const addLog = (workflowId: string, executionId: string, level: 'info' | 'warning' | 'error', message: string) => {
    const log: WorkflowLog = {
      id: `log_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      workflowId,
      executionId,
      level,
      message,
      timestamp: new Date().toISOString()
    }
    logs.value.push(log)
    return log
  }

  // 执行工作流
  const executeWorkflow = async (workflowId: string, recordId?: string, record?: Record<string, any>) => {
    const workflow = getWorkflowById(workflowId)
    if (!workflow || !workflow.enabled) {
      return { success: false, error: '工作流未启用或不存在' }
    }

    const execution = createExecution(workflowId, recordId)
    updateExecution(execution.id, { status: 'running' })
    addLog(workflowId, execution.id, 'info', `工作流开始执行: ${workflow.name}`)

    try {
      // 检查触发条件
      if (workflow.trigger.conditions && workflow.trigger.conditions.length > 0) {
        const conditionsMet = workflow.trigger.conditions.every(condition => {
          return evaluateCondition(record, condition)
        })
        if (!conditionsMet) {
          addLog(workflowId, execution.id, 'info', '条件不满足，跳过执行')
          updateExecution(execution.id, { status: 'completed', completedAt: new Date().toISOString() })
          return { success: true, message: '条件不满足，已跳过' }
        }
      }

      // 执行所有动作
      for (const action of workflow.actions) {
        await executeAction(action, record)
        addLog(workflowId, execution.id, 'info', `执行动作: ${action.type}`)
      }

      updateExecution(execution.id, { status: 'completed', completedAt: new Date().toISOString() })
      addLog(workflowId, execution.id, 'info', '工作流执行完成')
      return { success: true, message: '工作流执行成功' }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : '执行失败'
      updateExecution(execution.id, { status: 'failed', error: errorMessage, completedAt: new Date().toISOString() })
      addLog(workflowId, execution.id, 'error', `执行失败: ${errorMessage}`)
      return { success: false, error: errorMessage }
    }
  }

  // 评估条件
  const evaluateCondition = (record: Record<string, any> | undefined, condition: { fieldId: string; operator: string; value: any }) => {
    if (!record) return false
    
    const fieldValue = record[condition.fieldId]
    
    switch (condition.operator) {
      case 'equals':
        return fieldValue == condition.value
      case 'not_equals':
        return fieldValue != condition.value
      case 'contains':
        return String(fieldValue || '').includes(String(condition.value))
      case 'not_contains':
        return !String(fieldValue || '').includes(String(condition.value))
      case 'greater_than':
        return Number(fieldValue) > Number(condition.value)
      case 'less_than':
        return Number(fieldValue) < Number(condition.value)
      case 'greater_or_equal':
        return Number(fieldValue) >= Number(condition.value)
      case 'less_or_equal':
        return Number(fieldValue) <= Number(condition.value)
      case 'is_empty':
        return fieldValue === undefined || fieldValue === null || fieldValue === ''
      case 'is_not_empty':
        return fieldValue !== undefined && fieldValue !== null && fieldValue !== ''
      default:
        return true
    }
  }

  // 执行动作
  const executeAction = async (action: { type: string; fieldId?: string; value?: any; url?: string; method?: string; headers?: Record<string, string> }, record?: Record<string, any>) => {
    switch (action.type) {
      case 'update_field':
        if (record && action.fieldId) {
          record[action.fieldId] = action.value
        }
        break
      case 'send_notification':
        console.log('发送通知:', action.template)
        break
      case 'webhook':
        if (action.url) {
          const method = action.method || 'POST'
          const headers = action.headers || {}
          await fetch(action.url, {
            method,
            headers: {
              'Content-Type': 'application/json',
              ...headers
            },
            body: JSON.stringify(record)
          })
        }
        break
      case 'email':
        console.log('发送邮件:', action.template)
        break
      default:
        break
    }
  }

  // 获取工作流执行记录
  const getExecutionsByWorkflow = (workflowId: string) => {
    return executions.value.filter(e => e.workflowId === workflowId)
  }

  // 获取工作流日志
  const getLogsByExecution = (executionId: string) => {
    return logs.value.filter(l => l.executionId === executionId)
  }

  // 初始化
  loadWorkflows()

  return {
    workflows,
    executions,
    logs,
    loadWorkflows,
    saveWorkflows,
    getWorkflowsByTable,
    getWorkflowById,
    createWorkflow,
    updateWorkflow,
    deleteWorkflow,
    toggleWorkflow,
    executeWorkflow,
    getExecutionsByWorkflow,
    getLogsByExecution
  }
})