<template>
  <div class="workflow-manager">
    <div class="manager-header">
      <h2>自动化工作流</h2>
      <button class="btn-primary" @click="showCreateModal = true">+ 新建工作流</button>
    </div>

    <!-- 工作流列表 -->
    <div class="workflow-list">
      <div
        v-for="workflow in workflows"
        :key="workflow.id"
        class="workflow-card"
        :class="{ 'disabled': !workflow.enabled }"
      >
        <div class="workflow-header">
          <div class="workflow-info">
            <h3>{{ workflow.name }}</h3>
            <p class="workflow-desc">{{ workflow.description }}</p>
          </div>
          <div class="workflow-status">
            <span :class="['status-indicator', workflow.enabled ? 'active' : 'inactive']">
              {{ workflow.enabled ? '已启用' : '已禁用' }}
            </span>
          </div>
        </div>

        <div class="workflow-details">
          <div class="detail-item">
            <span class="detail-label">触发方式:</span>
            <span class="detail-value">{{ getTriggerLabel(workflow.trigger.type) }}</span>
          </div>
          <div class="detail-item">
            <span class="detail-label">动作数量:</span>
            <span class="detail-value">{{ workflow.actions.length }} 个</span>
          </div>
          <div class="detail-item">
            <span class="detail-label">创建时间:</span>
            <span class="detail-value">{{ formatDate(workflow.createdAt) }}</span>
          </div>
        </div>

        <div class="workflow-actions">
          <button @click="toggleWorkflow(workflow.id)" class="action-btn">
            {{ workflow.enabled ? '禁用' : '启用' }}
          </button>
          <button @click="editWorkflow(workflow)" class="action-btn">编辑</button>
          <button @click="deleteWorkflowConfirm(workflow.id)" class="action-btn danger">删除</button>
          <button @click="testWorkflow(workflow.id)" class="action-btn">测试执行</button>
        </div>
      </div>
    </div>

    <!-- 空状态 -->
    <div v-if="workflows.length === 0" class="empty-state">
      <div class="empty-icon">⚙️</div>
      <h3>暂无工作流</h3>
      <p>创建自动化工作流来提升工作效率</p>
      <button class="btn-primary" @click="showCreateModal = true">+ 新建工作流</button>
    </div>

    <!-- 创建/编辑工作流弹窗 -->
    <div v-if="showCreateModal" class="modal-overlay" @click.self="closeModal">
      <div class="modal-content workflow-modal">
        <h3>{{ editingWorkflow ? '编辑工作流' : '新建工作流' }}</h3>
        <form @submit.prevent="saveWorkflow">
          <div class="form-group">
            <label>工作流名称 *</label>
            <input
              type="text"
              v-model="form.name"
              required
              class="form-input"
              placeholder="输入工作流名称"
            />
          </div>
          <div class="form-group">
            <label>描述</label>
            <textarea
              v-model="form.description"
              class="form-input"
              placeholder="输入工作流描述"
            ></textarea>
          </div>

          <!-- 触发条件 -->
          <div class="form-section">
            <h4>触发条件</h4>
            <div class="form-group">
              <label>触发类型 *</label>
              <select v-model="form.triggerType" required class="form-input">
                <option value="create">记录创建时</option>
                <option value="update">记录更新时</option>
                <option value="delete">记录删除时</option>
                <option value="field_change">字段变更时</option>
                <option value="schedule">定时执行</option>
              </select>
            </div>

            <div v-if="form.triggerType === 'field_change'" class="form-group">
              <label>监控字段</label>
              <select v-model="form.triggerField" class="form-input">
                <option value="">选择字段</option>
                <option v-for="field in currentFields" :key="field.id" :value="field.fieldName">
                  {{ field.fieldLabel }}
                </option>
              </select>
            </div>

            <div v-if="form.triggerType === 'schedule'" class="form-group">
              <label>定时规则（cron表达式）</label>
              <input
                type="text"
                v-model="form.schedule"
                class="form-input"
                placeholder="例如: 0 0 * * * 每天凌晨执行"
              />
            </div>

            <!-- 条件设置 -->
            <div class="conditions-section">
              <h5>执行条件（可选）</h5>
              <button type="button" @click="addCondition" class="add-condition-btn">+ 添加条件</button>
              <div v-for="(condition, index) in form.conditions" :key="index" class="condition-row">
                <select v-model="condition.fieldId" class="condition-field">
                  <option value="">选择字段</option>
                  <option v-for="field in currentFields" :key="field.id" :value="field.fieldName">
                    {{ field.fieldLabel }}
                  </option>
                </select>
                <select v-model="condition.operator" class="condition-operator">
                  <option value="equals">等于</option>
                  <option value="not_equals">不等于</option>
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
                  placeholder="条件值"
                  class="condition-value"
                />
                <button type="button" @click="removeCondition(index)" class="remove-condition">×</button>
              </div>
            </div>
          </div>

          <!-- 动作设置 -->
          <div class="form-section">
            <h4>执行动作</h4>
            <button type="button" @click="addAction" class="add-action-btn">+ 添加动作</button>
            <div v-for="(action, index) in form.actions" :key="index" class="action-row">
              <select v-model="action.type" class="action-type">
                <option value="update_field">更新字段</option>
                <option value="send_notification">发送通知</option>
                <option value="webhook">调用Webhook</option>
                <option value="email">发送邮件</option>
              </select>
              
              <template v-if="action.type === 'update_field'">
                <select v-model="action.fieldId" class="action-param">
                  <option value="">选择字段</option>
                  <option v-for="field in currentFields" :key="field.id" :value="field.fieldName">
                    {{ field.fieldLabel }}
                  </option>
                </select>
                <input
                  type="text"
                  v-model="action.value"
                  placeholder="设置值"
                  class="action-param"
                />
              </template>

              <template v-if="action.type === 'send_notification'">
                <input
                  type="text"
                  v-model="action.template"
                  placeholder="通知内容"
                  class="action-param wide"
                />
              </template>

              <template v-if="action.type === 'webhook'">
                <input
                  type="text"
                  v-model="action.url"
                  placeholder="Webhook URL"
                  class="action-param wide"
                />
                <select v-model="action.method" class="action-param">
                  <option value="POST">POST</option>
                  <option value="GET">GET</option>
                  <option value="PUT">PUT</option>
                  <option value="DELETE">DELETE</option>
                </select>
              </template>

              <template v-if="action.type === 'email'">
                <input
                  type="text"
                  v-model="action.template"
                  placeholder="邮件内容"
                  class="action-param wide"
                />
              </template>

              <button type="button" @click="removeAction(index)" class="remove-action">×</button>
            </div>
          </div>

          <div class="form-group">
            <label>
              <input type="checkbox" v-model="form.enabled" /> 启用工作流
            </label>
          </div>

          <div class="form-actions">
            <button type="button" class="btn-cancel" @click="closeModal">取消</button>
            <button type="submit" class="btn-submit">保存</button>
          </div>
        </form>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch } from 'vue'
import { useWorkflowStore } from '../store/workflow'
import { useTableStore } from '../store/table'
import type { Workflow, WorkflowCondition, WorkflowAction } from '../types/workflow'

const workflowStore = useWorkflowStore()
const tableStore = useTableStore()

const showCreateModal = ref(false)
const editingWorkflow = ref<Workflow | null>(null)

const form = ref({
  name: '',
  description: '',
  triggerType: 'create' as 'create' | 'update' | 'delete' | 'field_change' | 'schedule',
  triggerField: '',
  schedule: '',
  conditions: [] as { fieldId: string; operator: string; value: string }[],
  actions: [] as WorkflowAction[],
  enabled: true
})

const workflows = computed(() => {
  if (!tableStore.currentTable) return []
  return workflowStore.workflows.filter(w => w.tableId === tableStore.currentTable!.id)
})

const currentFields = computed(() => {
  return tableStore.currentTable?.fieldDefinitions || []
})

const getTriggerLabel = (type: string) => {
  const labels: Record<string, string> = {
    create: '记录创建时',
    update: '记录更新时',
    delete: '记录删除时',
    field_change: '字段变更时',
    schedule: '定时执行'
  }
  return labels[type] || type
}

const formatDate = (dateStr: string) => {
  return new Date(dateStr).toLocaleString('zh-CN')
}

const addCondition = () => {
  form.value.conditions.push({
    fieldId: '',
    operator: 'equals',
    value: ''
  })
}

const removeCondition = (index: number) => {
  form.value.conditions.splice(index, 1)
}

const addAction = () => {
  form.value.actions.push({
    type: 'update_field',
    fieldId: '',
    value: ''
  })
}

const removeAction = (index: number) => {
  form.value.actions.splice(index, 1)
}

const closeModal = () => {
  showCreateModal.value = false
  editingWorkflow.value = null
  form.value = {
    name: '',
    description: '',
    triggerType: 'create',
    triggerField: '',
    schedule: '',
    conditions: [],
    actions: [],
    enabled: true
  }
}

const editWorkflow = (workflow: Workflow) => {
  editingWorkflow.value = workflow
  form.value = {
    name: workflow.name,
    description: workflow.description,
    triggerType: workflow.trigger.type,
    triggerField: workflow.trigger.fieldId || '',
    schedule: workflow.trigger.schedule || '',
    conditions: workflow.trigger.conditions?.map(c => ({
      fieldId: c.fieldId,
      operator: c.operator,
      value: String(c.value)
    })) || [],
    actions: [...workflow.actions],
    enabled: workflow.enabled
  }
  showCreateModal.value = true
}

const saveWorkflow = () => {
  if (!tableStore.currentTable) return

  const workflowData = {
    name: form.value.name,
    description: form.value.description,
    tableId: tableStore.currentTable.id,
    trigger: {
      type: form.value.triggerType,
      fieldId: form.value.triggerField || undefined,
      schedule: form.value.schedule || undefined,
      conditions: form.value.conditions.length > 0 ? form.value.conditions as WorkflowCondition[] : undefined
    },
    actions: form.value.actions,
    enabled: form.value.enabled
  }

  if (editingWorkflow.value) {
    workflowStore.updateWorkflow(editingWorkflow.value.id, workflowData)
  } else {
    workflowStore.createWorkflow(workflowData)
  }

  closeModal()
}

const toggleWorkflow = (workflowId: string) => {
  workflowStore.toggleWorkflow(workflowId)
}

const deleteWorkflowConfirm = (workflowId: string) => {
  if (confirm('确定要删除这个工作流吗？')) {
    workflowStore.deleteWorkflow(workflowId)
  }
}

const testWorkflow = (workflowId: string) => {
  workflowStore.executeWorkflow(workflowId, undefined, {})
  alert('工作流已执行，请查看日志')
}
</script>

<style scoped>
.workflow-manager {
  padding: var(--spacing-lg);
  height: 100%;
  overflow-y: auto;
}

.manager-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: var(--spacing-lg);
}

.manager-header h2 {
  margin: 0;
  font-size: var(--font-size-xl);
  font-weight: var(--font-weight-semibold);
  color: var(--text-primary);
}

.btn-primary {
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

.btn-primary:hover {
  background-color: var(--primary-hover);
}

/* 工作流列表 */
.workflow-list {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(400px, 1fr));
  gap: var(--spacing-md);
}

.workflow-card {
  background-color: var(--bg-white);
  border-radius: var(--radius-lg);
  padding: var(--spacing-md);
  box-shadow: var(--shadow-sm);
  transition: all var(--transition-normal);
}

.workflow-card:hover {
  box-shadow: var(--shadow-md);
}

.workflow-card.disabled {
  opacity: 0.6;
}

.workflow-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: var(--spacing-sm);
}

.workflow-info h3 {
  margin: 0 0 var(--spacing-xs) 0;
  font-size: var(--font-size-md);
  font-weight: var(--font-weight-semibold);
  color: var(--text-primary);
}

.workflow-desc {
  margin: 0;
  font-size: var(--font-size-sm);
  color: var(--text-secondary);
}

.status-indicator {
  padding: 4px 10px;
  border-radius: 12px;
  font-size: var(--font-size-xs);
  font-weight: var(--font-weight-semibold);
}

.status-indicator.active {
  background-color: rgba(54, 211, 153, 0.1);
  color: #10B981;
}

.status-indicator.inactive {
  background-color: rgba(148, 163, 184, 0.1);
  color: #64748B;
}

.workflow-details {
  display: flex;
  flex-wrap: wrap;
  gap: var(--spacing-md);
  padding: var(--spacing-sm) 0;
  border-top: 1px solid var(--border-color);
  border-bottom: 1px solid var(--border-color);
  margin-bottom: var(--spacing-sm);
}

.detail-item {
  display: flex;
  align-items: center;
  gap: 4px;
}

.detail-label {
  font-size: var(--font-size-xs);
  color: var(--text-placeholder);
}

.detail-value {
  font-size: var(--font-size-xs);
  color: var(--text-secondary);
  font-weight: var(--font-weight-medium);
}

.workflow-actions {
  display: flex;
  gap: var(--spacing-xs);
}

.action-btn {
  padding: 4px 10px;
  font-size: var(--font-size-xs);
  font-weight: var(--font-weight-medium);
  color: var(--text-secondary);
  background-color: var(--bg-gray);
  border: none;
  border-radius: var(--radius-sm);
  cursor: pointer;
  transition: all var(--transition-fast);
}

.action-btn:hover {
  background-color: rgba(22, 93, 255, 0.1);
  color: var(--primary-color);
}

.action-btn.danger:hover {
  background-color: rgba(248, 113, 113, 0.1);
  color: var(--danger-color);
}

/* 空状态 */
.empty-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: var(--spacing-xl);
  text-align: center;
}

.empty-icon {
  font-size: 48px;
  margin-bottom: var(--spacing-md);
}

.empty-state h3 {
  margin: 0 0 var(--spacing-xs) 0;
  font-size: var(--font-size-lg);
  font-weight: var(--font-weight-semibold);
  color: var(--text-primary);
}

.empty-state p {
  margin: 0 0 var(--spacing-md) 0;
  font-size: var(--font-size-sm);
  color: var(--text-secondary);
}

/* 弹窗样式 */
.workflow-modal {
  width: 600px;
  max-height: 80vh;
  overflow-y: auto;
}

.form-section {
  margin: var(--spacing-md) 0;
  padding: var(--spacing-md);
  background-color: var(--bg-gray);
  border-radius: var(--radius-md);
}

.form-section h4 {
  margin: 0 0 var(--spacing-sm) 0;
  font-size: var(--font-size-md);
  font-weight: var(--font-weight-semibold);
  color: var(--text-primary);
}

.form-section h5 {
  margin: 0 0 var(--spacing-xs) 0;
  font-size: var(--font-size-sm);
  font-weight: var(--font-weight-medium);
  color: var(--text-secondary);
}

.add-condition-btn,
.add-action-btn {
  margin-bottom: var(--spacing-sm);
  padding: 4px 10px;
  font-size: var(--font-size-xs);
  font-weight: var(--font-weight-medium);
  color: var(--primary-color);
  background-color: rgba(22, 93, 255, 0.1);
  border: none;
  border-radius: var(--radius-sm);
  cursor: pointer;
}

.condition-row,
.action-row {
  display: flex;
  align-items: center;
  gap: var(--spacing-xs);
  margin-bottom: var(--spacing-xs);
  flex-wrap: wrap;
}

.condition-field,
.condition-operator,
.condition-value,
.action-type,
.action-param {
  padding: 4px 8px;
  font-size: var(--font-size-xs);
  border: 1px solid var(--border-color);
  border-radius: var(--radius-sm);
  background-color: var(--bg-white);
  color: var(--text-primary);
}

.action-param.wide {
  flex: 1;
  min-width: 200px;
}

.remove-condition,
.remove-action {
  width: 24px;
  height: 24px;
  border: none;
  background-color: transparent;
  border-radius: 50%;
  font-size: 16px;
  cursor: pointer;
  color: var(--text-secondary);
}

.remove-condition:hover,
.remove-action:hover {
  background-color: rgba(248, 113, 113, 0.1);
  color: var(--danger-color);
}

/* 响应式设计 */
@media (max-width: 768px) {
  .workflow-list {
    grid-template-columns: 1fr;
  }

  .workflow-modal {
    width: 90%;
  }

  .condition-row,
  .action-row {
    flex-direction: column;
    align-items: stretch;
  }

  .action-param.wide {
    min-width: auto;
  }
}
</style>