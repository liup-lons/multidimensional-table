import type { Comment, FieldDefinition, Table } from '../types/table'

export function formatFieldValue(value: unknown, type: string): string {
  if (value == null || value === '') return '-'

  switch (type) {
    case 'date': {
      const date = new Date(String(value))
      return Number.isNaN(date.getTime()) ? String(value) : date.toLocaleDateString('zh-CN')
    }
    case 'boolean':
      return value ? '是' : '否'
    case 'tags':
      return Array.isArray(value) ? value.join(', ') : String(value)
    case 'rating': {
      const rating = Math.max(0, Math.min(5, Number(value) || 0))
      return '★'.repeat(rating) + '☆'.repeat(5 - rating)
    }
    default:
      return String(value)
  }
}

export function normalizeFieldValue(field: FieldDefinition, value: unknown): unknown {
  if (value == null) {
    return getDefaultFieldValue(field)
  }

  switch (field.fieldType) {
    case 'number':
      return value === '' ? 0 : Number(value)
    case 'boolean':
      return Boolean(value)
    case 'rating':
      return Math.max(0, Math.min(5, Number(value) || 0))
    case 'tags':
      if (Array.isArray(value)) return value
      return String(value)
        .split(/[;,]/)
        .map(tag => tag.trim())
        .filter(Boolean)
    case 'date': {
      const stringValue = String(value).trim()
      if (!stringValue) return ''
      const date = new Date(stringValue)
      return Number.isNaN(date.getTime()) ? stringValue : date.toISOString().slice(0, 10)
    }
    default:
      return value
  }
}

export function normalizeRecordValues(
  fields: FieldDefinition[],
  source: Record<string, unknown>
): Record<string, unknown> {
  const normalized: Record<string, unknown> = {}

  fields.forEach(field => {
    normalized[field.fieldName] = normalizeFieldValue(field, source[field.fieldName])
  })

  return normalized
}

export function getDefaultFieldValue(field: FieldDefinition): unknown {
  if (field.defaultValue !== undefined) {
    return field.defaultValue
  }

  switch (field.fieldType) {
    case 'boolean':
      return false
    case 'number':
    case 'rating':
      return 0
    case 'date':
      return ''
    case 'tags':
      return []
    case 'select':
      return field.options?.[0] || ''
    default:
      return ''
  }
}

export function getRecordComments(table: Table | null | undefined, recordId: string): Comment[] {
  if (!table) return []
  return table.comments
    .filter(comment => comment.recordId === recordId)
    .sort((left, right) => new Date(right.createdAt).getTime() - new Date(left.createdAt).getTime())
}

export function getVisualState(record: Record<string, unknown>): {
  overdue: boolean
  highPriority: boolean
  completed: boolean
} {
  const rawStatus = String(record.status || '').toLowerCase()
  const rawPriority = String(record.priority || '').toLowerCase()
  const progress = Number(record.progress ?? 0)
  const endDate = record.endDate ? new Date(String(record.endDate)) : null
  const completed = rawStatus.includes('完成') || rawStatus === 'done' || rawStatus === 'completed' || progress >= 100
  const overdue = Boolean(endDate && !Number.isNaN(endDate.getTime()) && endDate.getTime() < Date.now() && !completed)
  const highPriority = rawPriority.includes('高') || rawPriority === 'high' || rawPriority.includes('p0') || rawPriority.includes('critical')

  return {
    overdue,
    highPriority,
    completed
  }
}

export function getPriorityLabel(record: Record<string, unknown>): string {
  const priority = record.priority
  return priority == null || priority === '' ? '' : String(priority)
}
