import { defineStore } from 'pinia'
import type { Project, Table, FieldDefinition, View, FilterCondition, SortCondition, AutomationRule, Comment } from '../types/table'
import { createTestProject } from '../utils/mockData'

// 生成唯一ID
const generateId = () => {
  return Date.now().toString(36) + Math.random().toString(36).substr(2)
}

// 本地存储键名
const STORAGE_KEY = 'multidimensional-table-data'

export const useTableStore = defineStore('table', {
  state: () => ({
    projects: [] as Project[],
    currentProject: null as Project | null,
    currentTable: null as Table | null,
    currentView: null as View | null,
    loading: false,
    error: null as string | null,
    onlineUsers: [] as { id: string; name: string }[]
  }),
  getters: {
    getProjectById: (state) => (id: string) => {
      return state.projects.find(project => project.id === id) || null
    },
    getTableById: (state) => (projectId: string, tableId: string) => {
      const project = state.projects.find((p: Project) => p.id === projectId)
      return project?.tables.find((table: Table) => table.id === tableId) || null
    },
    getCurrentTableViews: (state) => {
      if (!state.currentTable) return []
      return state.currentTable.views || []
    },
    getFilteredTableData: (state) => {
      if (!state.currentTable || !state.currentView) return []
      
      let data = [...state.currentTable.data]
      const { filterConditions, sortConditions } = state.currentView
      
      // 筛选
      if (filterConditions && filterConditions.length > 0) {
        data = data.filter(record => {
          return filterConditions.every(condition => {
            const fieldValue = record[condition.fieldId]
            return applyFilter(fieldValue, condition)
          })
        })
      }
      
      // 排序
      if (sortConditions && sortConditions.length > 0) {
        data.sort((a, b) => {
          for (const condition of sortConditions) {
            const valA = a[condition.fieldId]
            const valB = b[condition.fieldId]
            if (valA < valB) return condition.direction === 'asc' ? -1 : 1
            if (valA > valB) return condition.direction === 'asc' ? 1 : -1
          }
          return 0
        })
      }
      
      return data
    }
  },
  actions: {
    // 初始化加载数据
    initStore() {
      this.loadFromStorage()
      // 如果没有项目，创建测试项目
      if (this.projects.length === 0) {
        const testProject = createTestProject()
        this.projects.push(testProject)
        this.currentProject = testProject
        this.currentTable = testProject.tables[0] || null
        this.currentView = this.currentTable?.views[0] || null
        this.saveToStorage()
      }
    },
    
    // 从本地存储加载数据
    loadFromStorage() {
      try {
        const stored = localStorage.getItem(STORAGE_KEY)
        if (stored) {
          const data = JSON.parse(stored)
          this.projects = data.projects || []
          this.onlineUsers = data.onlineUsers || []
        }
      } catch (error) {
        console.error('加载本地存储失败:', error)
        this.projects = []
      }
    },
    
    // 保存到本地存储
    saveToStorage() {
      try {
        const data = {
          projects: this.projects,
          onlineUsers: this.onlineUsers
        }
        localStorage.setItem(STORAGE_KEY, JSON.stringify(data))
      } catch (error) {
        console.error('保存到本地存储失败:', error)
      }
    },
    
    // 创建项目
    createProject(name: string, description?: string) {
      const now = new Date().toISOString()
      const project: Project = {
        id: generateId(),
        name,
        description,
        tables: [],
        createdAt: now,
        updatedAt: now
      }
      this.projects.push(project)
      this.currentProject = project
      this.saveToStorage()
      return project
    },
    
    // 更新项目
    updateProject(projectId: string, updates: Partial<Pick<Project, 'name' | 'description'>>) {
      const project = this.getProjectById(projectId)
      if (project) {
        Object.assign(project, updates)
        project.updatedAt = new Date().toISOString()
        this.saveToStorage()
      }
    },
    
    // 删除项目
    deleteProject(projectId: string) {
      const index = this.projects.findIndex(p => p.id === projectId)
      if (index !== -1) {
        this.projects.splice(index, 1)
        if (this.currentProject?.id === projectId) {
          this.currentProject = this.projects[0] || null
          this.currentTable = null
          this.currentView = null
        }
        this.saveToStorage()
      }
    },
    
    // 复制项目
    copyProject(projectId: string, newName?: string) {
      const project = this.getProjectById(projectId)
      if (!project) return null
      
      const now = new Date().toISOString()
      const copiedProject: Project = {
        id: generateId(),
        name: newName || `${project.name} (副本)`,
        description: project.description,
        tables: project.tables.map(table => ({
          ...table,
          id: generateId(),
          views: table.views.map(view => ({
            ...view,
            id: generateId(),
            tableId: generateId()
          })),
          comments: table.comments.map(comment => ({
            ...comment,
            id: generateId(),
            tableId: generateId()
          }))
        })),
        createdAt: now,
        updatedAt: now
      }
      
      this.projects.push(copiedProject)
      this.saveToStorage()
      return copiedProject
    },
    
    // 切换项目
    switchProject(projectId: string) {
      const project = this.getProjectById(projectId)
      if (project) {
        this.currentProject = project
        this.currentTable = null
        this.currentView = null
      }
    },
    
    // 创建表格
    createTable(projectId: string, name: string) {
      const project = this.getProjectById(projectId)
      if (!project) return null
      
      const now = new Date().toISOString()
      const defaultFields: FieldDefinition[] = [
        {
          id: generateId(),
          fieldName: 'title',
          fieldType: 'text',
          fieldLabel: '标题',
          required: true
        },
        {
          id: generateId(),
          fieldName: 'status',
          fieldType: 'select',
          fieldLabel: '状态',
          options: ['未开始', '进行中', '已完成', '已暂停']
        },
        {
          id: generateId(),
          fieldName: 'priority',
          fieldType: 'select',
          fieldLabel: '优先级',
          options: ['高', '中', '低']
        },
        {
          id: generateId(),
          fieldName: 'assignee',
          fieldType: 'text',
          fieldLabel: '负责人'
        },
        {
          id: generateId(),
          fieldName: 'progress',
          fieldType: 'number',
          fieldLabel: '进度(%)',
          validation: { min: 0, max: 100 }
        },
        {
          id: generateId(),
          fieldName: 'startDate',
          fieldType: 'date',
          fieldLabel: '开始日期'
        },
        {
          id: generateId(),
          fieldName: 'endDate',
          fieldType: 'date',
          fieldLabel: '结束日期'
        },
        {
          id: generateId(),
          fieldName: 'completed',
          fieldType: 'boolean',
          fieldLabel: '是否完成'
        }
      ]
      
      const defaultViews: View[] = [
        {
          id: generateId(),
          name: '表格视图',
          type: 'table',
          tableId: generateId(),
          isDefault: true,
          filterConditions: [],
          sortConditions: [],
          visibleFieldIds: defaultFields.slice(0, 6).map(f => f.id)
        }
      ]
      
      const table: Table = {
        id: generateId(),
        name,
        fieldDefinitions: defaultFields,
        data: [],
        views: defaultViews,
        comments: [],
        createdAt: now,
        updatedAt: now
      }
      
      // 更新视图的tableId
      table.views.forEach(view => {
        view.tableId = table.id
      })
      
      project.tables.push(table)
      project.updatedAt = now
      this.currentTable = table
      this.currentView = table.views[0]
      this.saveToStorage()
      return table
    },
    
    // 更新表格
    updateTable(projectId: string, tableId: string, updates: Partial<Pick<Table, 'name'>>) {
      const table = this.getTableById(projectId, tableId)
      if (table) {
        Object.assign(table, updates)
        table.updatedAt = new Date().toISOString()
        const project = this.getProjectById(projectId)
        if (project) project.updatedAt = table.updatedAt
        this.saveToStorage()
      }
    },
    
    // 删除表格
    deleteTable(projectId: string, tableId: string) {
      const project = this.getProjectById(projectId)
      if (project) {
        const index = project.tables.findIndex(t => t.id === tableId)
        if (index !== -1) {
          project.tables.splice(index, 1)
          project.updatedAt = new Date().toISOString()
          if (this.currentTable?.id === tableId) {
            this.currentTable = project.tables[0] || null
            this.currentView = this.currentTable?.views[0] || null
          }
          this.saveToStorage()
        }
      }
    },
    
    // 切换表格
    switchTable(projectId: string, tableId: string) {
      const table = this.getTableById(projectId, tableId)
      if (table) {
        this.currentTable = table
        this.currentView = table.views.find((v: View) => v.isDefault) || table.views[0] || null
      }
    },
    
    // 添加字段
    addField(projectId: string, tableId: string, field: Omit<FieldDefinition, 'id'>) {
      const table = this.getTableById(projectId, tableId)
      if (table) {
        const newField: FieldDefinition = {
          ...field,
          id: generateId()
        }
        table.fieldDefinitions.push(newField)
        table.updatedAt = new Date().toISOString()
        const project = this.getProjectById(projectId)
        if (project) project.updatedAt = table.updatedAt
        this.saveToStorage()
        return newField
      }
      return null
    },
    
    // 更新字段
    updateField(projectId: string, tableId: string, fieldId: string, updates: Partial<FieldDefinition>) {
      const table = this.getTableById(projectId, tableId)
      if (table) {
        const field = table.fieldDefinitions.find((f: FieldDefinition) => f.id === fieldId)
        if (field) {
          Object.assign(field, updates)
          table.updatedAt = new Date().toISOString()
          const project = this.getProjectById(projectId)
          if (project) project.updatedAt = table.updatedAt
          this.saveToStorage()
        }
      }
    },
    
    // 删除字段
    deleteField(projectId: string, tableId: string, fieldId: string) {
      const table = this.getTableById(projectId, tableId)
      if (table) {
        const index = table.fieldDefinitions.findIndex((f: FieldDefinition) => f.id === fieldId)
        if (index !== -1) {
          const fieldName = table.fieldDefinitions[index].fieldName
          table.fieldDefinitions.splice(index, 1)
          // 删除所有记录中的该字段
          table.data.forEach(record => {
            delete record[fieldName]
          })
          table.updatedAt = new Date().toISOString()
          const project = this.getProjectById(projectId)
          if (project) project.updatedAt = table.updatedAt
          this.saveToStorage()
        }
      }
    },
    
    // 添加记录
    addRecord(projectId: string, tableId: string, record: Record<string, unknown>) {
      const table = this.getTableById(projectId, tableId)
      if (table) {
        const newRecord = {
          id: generateId(),
          ...record
        }
        table.data.push(newRecord)
        table.updatedAt = new Date().toISOString()
        const project = this.getProjectById(projectId)
        if (project) project.updatedAt = table.updatedAt
        this.saveToStorage()
        return newRecord
      }
      return null
    },
    
    // 更新记录
    updateRecord(projectId: string, tableId: string, recordId: string, updates: Record<string, unknown>) {
      const table = this.getTableById(projectId, tableId)
      if (table) {
        const record = table.data.find((r: Record<string, unknown>) => r.id === recordId)
        if (record) {
          Object.assign(record, updates)
          table.updatedAt = new Date().toISOString()
          const project = this.getProjectById(projectId)
          if (project) project.updatedAt = table.updatedAt
          this.saveToStorage()
        }
      }
    },
    
    // 删除记录
    deleteRecord(projectId: string, tableId: string, recordId: string) {
      const table = this.getTableById(projectId, tableId)
      if (table) {
        table.data = table.data.filter((r: Record<string, unknown>) => r.id !== recordId)
        // 删除相关评论
        table.comments = table.comments.filter((c: Comment) => c.recordId !== recordId)
        table.updatedAt = new Date().toISOString()
        const project = this.getProjectById(projectId)
        if (project) project.updatedAt = table.updatedAt
        this.saveToStorage()
      }
    },
    
    // 批量删除记录
    batchDeleteRecords(projectId: string, tableId: string, recordIds: string[]) {
      const table = this.getTableById(projectId, tableId)
      if (table) {
        table.data = table.data.filter((r: Record<string, unknown>) => !recordIds.includes(r.id as string))
        table.comments = table.comments.filter((c: Comment) => !recordIds.includes(c.recordId))
        table.updatedAt = new Date().toISOString()
        const project = this.getProjectById(projectId)
        if (project) project.updatedAt = table.updatedAt
        this.saveToStorage()
      }
    },

    // 批量更新记录
    batchUpdateRecords(projectId: string, tableId: string, recordIds: string[], updates: Record<string, unknown>) {
      const table = this.getTableById(projectId, tableId)
      if (table) {
        table.data.forEach((record: Record<string, unknown>) => {
          if (recordIds.includes(record.id as string)) {
            Object.assign(record, updates)
          }
        })
        table.updatedAt = new Date().toISOString()
        const project = this.getProjectById(projectId)
        if (project) project.updatedAt = table.updatedAt
        this.saveToStorage()
      }
    },
    
    // 复制记录
    copyRecord(projectId: string, tableId: string, recordId: string) {
      const table = this.getTableById(projectId, tableId)
      if (table) {
        const record = table.data.find((r: Record<string, unknown>) => r.id === recordId)
        if (record) {
          const newRecord = {
            ...record,
            id: generateId()
          }
          table.data.push(newRecord)
          table.updatedAt = new Date().toISOString()
          const project = this.getProjectById(projectId)
          if (project) project.updatedAt = table.updatedAt
          this.saveToStorage()
          return newRecord
        }
      }
      return null
    },

    // 移动记录顺序
    moveRecord(projectId: string, tableId: string, fromRecordId: string, toRecordId: string) {
      const table = this.getTableById(projectId, tableId)
      if (table) {
        const fromIndex = table.data.findIndex((r: Record<string, unknown>) => r.id === fromRecordId)
        const toIndex = table.data.findIndex((r: Record<string, unknown>) => r.id === toRecordId)
        if (fromIndex === -1 || toIndex === -1 || fromIndex === toIndex) return

        const [movedRecord] = table.data.splice(fromIndex, 1)
        const insertIndex = fromIndex < toIndex ? toIndex : toIndex
        table.data.splice(insertIndex, 0, movedRecord)
        table.updatedAt = new Date().toISOString()
        const project = this.getProjectById(projectId)
        if (project) project.updatedAt = table.updatedAt
        this.saveToStorage()
      }
    },
    
    // 创建视图
    createView(projectId: string, tableId: string, view: Omit<View, 'id'>) {
      const table = this.getTableById(projectId, tableId)
      if (table) {
        const newView: View = {
          ...view,
          id: generateId(),
          tableId,
          filterConditions: view.filterConditions || [],
          sortConditions: view.sortConditions || [],
          visibleFieldIds: view.visibleFieldIds || table.fieldDefinitions.slice(0, 6).map(f => f.id)
        }
        table.views.push(newView)
        table.updatedAt = new Date().toISOString()
        const project = this.getProjectById(projectId)
        if (project) project.updatedAt = table.updatedAt
        this.saveToStorage()
        return newView
      }
      return null
    },
    
    // 更新视图
    updateView(projectId: string, tableId: string, viewId: string, updates: Partial<View>) {
      const table = this.getTableById(projectId, tableId)
      if (table) {
        const view = table.views.find((v: View) => v.id === viewId)
        if (view) {
          Object.assign(view, updates)
          table.updatedAt = new Date().toISOString()
          const project = this.getProjectById(projectId)
          if (project) project.updatedAt = table.updatedAt
          this.saveToStorage()
        }
      }
    },
    
    // 删除视图
    deleteView(projectId: string, tableId: string, viewId: string) {
      const table = this.getTableById(projectId, tableId)
      if (table) {
        const index = table.views.findIndex((v: View) => v.id === viewId)
        if (index !== -1) {
          table.views.splice(index, 1)
          table.updatedAt = new Date().toISOString()
          const project = this.getProjectById(projectId)
          if (project) project.updatedAt = table.updatedAt
          if (this.currentView?.id === viewId) {
            this.currentView = table.views[0] || null
          }
          this.saveToStorage()
        }
      }
    },
    
    // 切换视图
    switchView(viewId: string) {
      if (this.currentTable) {
        const view = this.currentTable.views.find(v => v.id === viewId)
        if (view) {
          this.currentView = view
        }
      }
    },

    // 按类型切换视图
    switchViewByType(viewType: View['type']) {
      if (!this.currentTable) return null

      const targetView = this.currentTable.views.find(view => view.type === viewType)
      if (targetView) {
        this.currentView = targetView
        return targetView
      }
      return null
    },
    
    // 设置筛选条件
    setFilterConditions(projectId: string, tableId: string, viewId: string, conditions: FilterCondition[]) {
      this.updateView(projectId, tableId, viewId, { filterConditions: conditions })
    },
    
    // 设置排序条件
    setSortConditions(projectId: string, tableId: string, viewId: string, conditions: SortCondition[]) {
      this.updateView(projectId, tableId, viewId, { sortConditions: conditions })
    },
    
    // 添加评论
    addComment(projectId: string, tableId: string, recordId: string, content: string, userId: string, userName: string) {
      const table = this.getTableById(projectId, tableId)
      if (table) {
        const comment: Comment = {
          id: generateId(),
          recordId,
          tableId,
          userId,
          userName,
          content,
          createdAt: new Date().toISOString()
        }
        table.comments.push(comment)
        table.updatedAt = new Date().toISOString()
        const project = this.getProjectById(projectId)
        if (project) project.updatedAt = table.updatedAt
        this.saveToStorage()
        return comment
      }
      return null
    },
    
    // 删除评论
    deleteComment(projectId: string, tableId: string, commentId: string) {
      const table = this.getTableById(projectId, tableId)
      if (table) {
        table.comments = table.comments.filter((c: Comment) => c.id !== commentId)
        table.updatedAt = new Date().toISOString()
        const project = this.getProjectById(projectId)
        if (project) project.updatedAt = table.updatedAt
        this.saveToStorage()
      }
    },
    
    // 创建自动化规则
    createAutomationRule(projectId: string, tableId: string, rule: Omit<AutomationRule, 'id' | 'createdAt'>) {
      const table = this.getTableById(projectId, tableId)
      if (table) {
        const newRule: AutomationRule = {
          ...rule,
          id: generateId(),
          createdAt: new Date().toISOString()
        }
        // 规则存储在项目级别
        this.saveToStorage()
        return newRule
      }
      return null
    },
    
    // 导出数据
    exportData(projectId: string, tableId: string): string {
      const table = this.getTableById(projectId, tableId)
      if (!table) return ''
      
      const headers = table.fieldDefinitions.map(f => f.fieldLabel)
      const rows = table.data.map(record => {
        return table.fieldDefinitions.map(f => {
          const value = record[f.fieldName]
          if (Array.isArray(value)) return value.join('; ')
          return serializeCsvValue(value)
        })
      })
      
      const csv = [
        headers.map(header => escapeCsvCell(header)).join(','),
        ...rows.map(row => row.map(cell => escapeCsvCell(cell)).join(','))
      ].join('\n')
      return csv
    },
    
    // 导入数据
    importData(projectId: string, tableId: string, csvContent: string) {
      const table = this.getTableById(projectId, tableId)
      if (!table) return { success: 0, failed: 0, errors: [] }
      
      const rows = parseCsvContent(csvContent)
      if (rows.length < 2) return { success: 0, failed: 0, errors: ['CSV文件至少需要包含表头和一行数据'] }

      const headers = rows[0].map(h => h.trim())
      const fieldMap: Record<string, string> = {} // header label -> fieldName
      
      // 匹配字段
      headers.forEach((header, index) => {
        const field = table.fieldDefinitions.find(f => f.fieldLabel === header || f.fieldName === header)
        if (field) {
          fieldMap[index.toString()] = field.fieldName
        }
      })
      
      const errors: string[] = []
      let success = 0
      let failed = 0
      
      for (let i = 1; i < rows.length; i++) {
        try {
          const values = rows[i]
          const record: Record<string, unknown> = {}
          
          values.forEach((value: string, index: number) => {
            const fieldName = fieldMap[index.toString()]
            if (fieldName) {
              const field = table.fieldDefinitions.find((f: FieldDefinition) => f.fieldName === fieldName)
              if (field) {
                record[fieldName] = parseValue(value.trim(), field.fieldType)
              }
            }
          })
          
          this.addRecord(projectId, tableId, record)
          success++
        } catch (error) {
          failed++
          errors.push(`第${i + 1}行导入失败: ${(error as Error).message}`)
        }
      }
      
      return { success, failed, errors }
    },
    
    // 导出备份
    exportBackup(): string {
      const backup = {
        projects: this.projects,
        users: this.onlineUsers,
        exportedAt: new Date().toISOString(),
        version: '1.0.0'
      }
      return JSON.stringify(backup, null, 2)
    },
    
    // 导入备份
    importBackup(backupJson: string): boolean {
      try {
        const backup = JSON.parse(backupJson)
        this.projects = backup.projects || []
        this.onlineUsers = backup.users || []
        if (this.projects.length > 0) {
          this.currentProject = this.projects[0]
          this.currentTable = this.projects[0].tables[0] || null
          this.currentView = this.currentTable?.views[0] || null
        }
        this.saveToStorage()
        return true
      } catch (error) {
        console.error('导入备份失败:', error)
        return false
      }
    },
    
    // 添加在线用户
    addOnlineUser(userId: string, userName: string) {
      const existing = this.onlineUsers.find(u => u.id === userId)
      if (!existing) {
        this.onlineUsers.push({ id: userId, name: userName })
        this.saveToStorage()
      }
    },
    
    // 移除在线用户
    removeOnlineUser(userId: string) {
      this.onlineUsers = this.onlineUsers.filter(u => u.id !== userId)
      this.saveToStorage()
    },
    
    // 重置为测试数据
    resetToTestData() {
      const testProject = createTestProject()
      this.projects = [testProject]
      this.currentProject = testProject
      this.currentTable = testProject.tables[0] || null
      this.currentView = this.currentTable?.views[0] || null
      this.saveToStorage()
    }
  }
})

// 应用筛选条件
function applyFilter(value: unknown, condition: FilterCondition): boolean {
  switch (condition.operator) {
    case 'equals':
      return value === condition.value
    case 'contains':
      return String(value).includes(String(condition.value))
    case 'not_contains':
      return !String(value).includes(String(condition.value))
    case 'greater_than':
      return Number(value) > Number(condition.value)
    case 'less_than':
      return Number(value) < Number(condition.value)
    case 'greater_or_equal':
      return Number(value) >= Number(condition.value)
    case 'less_or_equal':
      return Number(value) <= Number(condition.value)
    case 'is_empty':
      return value == null || value === ''
    case 'is_not_empty':
      return value != null && value !== ''
    default:
      return true
  }
}

// 解析导入值
function parseValue(value: string, fieldType: string): string | number | boolean | string[] {
  switch (fieldType) {
    case 'number':
      return parseFloat(value) || 0
    case 'date':
      return normalizeDateValue(value)
    case 'boolean':
      return value.toLowerCase() === 'true' || value === '1'
    case 'rating':
      return parseInt(value) || 0
    case 'tags':
      return value
        .split(/[;,]/)
        .map(t => t.trim())
        .filter(Boolean)
    default:
      return value
  }
}

function normalizeDateValue(value: string): string {
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) {
    return ''
  }
  return date.toISOString().slice(0, 10)
}

function serializeCsvValue(value: unknown): string {
  if (value == null) return ''
  if (Array.isArray(value)) return value.join('; ')
  return String(value)
}

function escapeCsvCell(value: string): string {
  if (/[",\n]/.test(value)) {
    return `"${value.replace(/"/g, '""')}"`
  }
  return value
}

function parseCsvContent(csvContent: string): string[][] {
  const rows: string[][] = []
  let currentRow: string[] = []
  let currentCell = ''
  let inQuotes = false

  for (let index = 0; index < csvContent.length; index++) {
    const char = csvContent[index]
    const nextChar = csvContent[index + 1]

    if (char === '"') {
      if (inQuotes && nextChar === '"') {
        currentCell += '"'
        index++
      } else {
        inQuotes = !inQuotes
      }
      continue
    }

    if (char === ',' && !inQuotes) {
      currentRow.push(currentCell)
      currentCell = ''
      continue
    }

    if ((char === '\n' || char === '\r') && !inQuotes) {
      if (char === '\r' && nextChar === '\n') {
        index++
      }
      currentRow.push(currentCell)
      if (currentRow.some(cell => cell.trim() !== '')) {
        rows.push(currentRow)
      }
      currentRow = []
      currentCell = ''
      continue
    }

    currentCell += char
  }

  if (currentCell.length > 0 || currentRow.length > 0) {
    currentRow.push(currentCell)
    if (currentRow.some(cell => cell.trim() !== '')) {
      rows.push(currentRow)
    }
  }

  return rows
}
