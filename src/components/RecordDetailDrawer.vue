<template>
  <div v-if="visible && record" class="drawer-root">
    <div class="drawer-mask" @click="handleClose"></div>
    <aside class="drawer-panel">
      <div class="drawer-header">
        <div>
          <h3>{{ isEditing ? '编辑记录' : (title || '记录详情') }}</h3>
          <p v-if="subtitle" class="drawer-subtitle">{{ subtitle }}</p>
        </div>
        <button class="icon-btn" @click="handleClose">×</button>
      </div>

      <div class="drawer-content">
        <section class="section-card">
          <div class="section-header">
            <h4>字段信息</h4>
            <div class="header-actions">
              <button v-if="!isEditing" class="secondary-btn" @click="startEdit">编辑</button>
              <template v-else>
                <button class="secondary-btn" @click="cancelEdit">取消</button>
                <button class="primary-btn" @click="saveRecord">保存</button>
              </template>
            </div>
          </div>

          <div class="field-list">
            <div v-for="field in fields" :key="field.id" class="field-item">
              <label>{{ field.fieldLabel }}<span v-if="field.required" class="required">*</span></label>

              <template v-if="isEditing">
                <input
                  v-if="['text', 'person', 'url'].includes(field.fieldType)"
                  v-model="formState[field.fieldName]"
                  class="form-input"
                  type="text"
                />
                <input
                  v-else-if="field.fieldType === 'number'"
                  v-model.number="formState[field.fieldName]"
                  class="form-input"
                  type="number"
                />
                <input
                  v-else-if="field.fieldType === 'date'"
                  v-model="formState[field.fieldName]"
                  class="form-input"
                  type="date"
                />
                <select
                  v-else-if="field.fieldType === 'select'"
                  v-model="formState[field.fieldName]"
                  class="form-input"
                >
                  <option value="">请选择</option>
                  <option v-for="option in field.options || []" :key="option" :value="option">{{ option }}</option>
                </select>
                <textarea
                  v-else-if="field.fieldType === 'tags'"
                  v-model="tagText[field.fieldName]"
                  class="form-input textarea-input"
                  placeholder="使用逗号分隔多个标签"
                ></textarea>
                <label v-else-if="field.fieldType === 'boolean'" class="checkbox-line">
                  <input v-model="formState[field.fieldName]" type="checkbox" />
                  <span>启用</span>
                </label>
                <input
                  v-else-if="field.fieldType === 'rating'"
                  v-model.number="formState[field.fieldName]"
                  class="form-input"
                  type="range"
                  min="0"
                  max="5"
                />
                <input
                  v-else
                  v-model="formState[field.fieldName]"
                  class="form-input"
                  type="text"
                />
              </template>

              <template v-else>
                <a
                  v-if="field.fieldType === 'url' && record[field.fieldName]"
                  :href="String(record[field.fieldName])"
                  target="_blank"
                  rel="noreferrer"
                  class="link-value"
                >
                  {{ record[field.fieldName] }}
                </a>
                <span v-else class="field-value">{{ formatFieldValue(record[field.fieldName], field.fieldType) }}</span>
              </template>
            </div>
          </div>
        </section>

        <section class="section-card">
          <div class="section-header">
            <h4>评论</h4>
            <span class="comment-count">{{ comments.length }} 条</span>
          </div>

          <div class="comment-editor">
            <textarea
              v-model="commentContent"
              class="comment-input"
              placeholder="补充记录说明、协作备注或下一步计划"
            ></textarea>
            <button class="primary-btn" :disabled="!commentContent.trim()" @click="submitComment">发表评论</button>
          </div>

          <div v-if="comments.length > 0" class="comment-list">
            <article v-for="comment in comments" :key="comment.id" class="comment-card">
              <div class="comment-meta">
                <strong>{{ comment.userName }}</strong>
                <span>{{ formatCommentTime(comment.createdAt) }}</span>
              </div>
              <p>{{ comment.content }}</p>
            </article>
          </div>
          <div v-else class="empty-comments">还没有评论，适合记录协作上下文和决策过程。</div>
        </section>
      </div>
    </aside>
  </div>
</template>

<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import type { Comment, FieldDefinition } from '../types/table'
import { formatFieldValue, normalizeRecordValues } from '../utils/recordHelpers'

const props = defineProps<{
  visible: boolean
  record: Record<string, unknown> | null
  fields: FieldDefinition[]
  comments: Comment[]
  title?: string
  subtitle?: string
}>()

const emit = defineEmits<{
  close: []
  save: [recordId: string, updates: Record<string, unknown>]
  addComment: [content: string]
}>()

const isEditing = ref(false)
const formState = ref<Record<string, unknown>>({})
const tagText = ref<Record<string, string>>({})
const commentContent = ref('')

const syncFormState = () => {
  if (!props.record) {
    formState.value = {}
    tagText.value = {}
    return
  }

  formState.value = { ...props.record }
  const nextTagText: Record<string, string> = {}
  props.fields.forEach(field => {
    const value = props.record?.[field.fieldName]
    if (field.fieldType === 'tags') {
      nextTagText[field.fieldName] = Array.isArray(value) ? value.join(', ') : String(value || '')
    }
  })
  tagText.value = nextTagText
}

watch(
  () => [props.visible, props.record],
  ([visible]) => {
    if (visible) {
      isEditing.value = false
      commentContent.value = ''
      syncFormState()
    }
  },
  { immediate: true }
)

const normalizedForm = computed(() => {
  const draft = { ...formState.value }
  props.fields.forEach(field => {
    if (field.fieldType === 'tags') {
      draft[field.fieldName] = tagText.value[field.fieldName] || ''
    }
  })
  return normalizeRecordValues(props.fields, draft)
})

const startEdit = () => {
  isEditing.value = true
}

const cancelEdit = () => {
  isEditing.value = false
  syncFormState()
}

const saveRecord = () => {
  if (!props.record?.id) return
  const { id: _id, ...updates } = normalizedForm.value
  emit('save', String(props.record.id), updates)
  isEditing.value = false
}

const submitComment = () => {
  const content = commentContent.value.trim()
  if (!content) return
  emit('addComment', content)
  commentContent.value = ''
}

const handleClose = () => {
  isEditing.value = false
  emit('close')
}

const formatCommentTime = (value: string) => {
  const date = new Date(value)
  return Number.isNaN(date.getTime()) ? value : date.toLocaleString('zh-CN')
}
</script>

<style scoped>
.drawer-root {
  position: fixed;
  inset: 0;
  z-index: 2100;
}

.drawer-mask {
  position: absolute;
  inset: 0;
  background: rgba(15, 23, 42, 0.35);
}

.drawer-panel {
  position: absolute;
  top: 0;
  right: 0;
  width: min(560px, 92vw);
  height: 100%;
  background: var(--bg-white);
  box-shadow: -12px 0 32px rgba(15, 23, 42, 0.12);
  display: flex;
  flex-direction: column;
}

.drawer-header {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: var(--spacing-md);
  padding: var(--spacing-lg);
  border-bottom: 1px solid var(--border-color);
}

.drawer-header h3 {
  margin: 0;
}

.drawer-subtitle {
  margin: var(--spacing-xs) 0 0;
  color: var(--text-secondary);
  font-size: var(--font-size-sm);
}

.drawer-content {
  flex: 1;
  overflow-y: auto;
  padding: var(--spacing-lg);
  display: flex;
  flex-direction: column;
  gap: var(--spacing-md);
  background: var(--bg-gray);
}

.section-card {
  background: var(--bg-white);
  border: 1px solid var(--border-color);
  border-radius: var(--radius-lg);
  padding: var(--spacing-md);
}

.section-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: var(--spacing-md);
  margin-bottom: var(--spacing-md);
}

.section-header h4 {
  margin: 0;
}

.header-actions {
  display: flex;
  gap: var(--spacing-sm);
}

.field-list {
  display: grid;
  gap: var(--spacing-md);
}

.field-item {
  display: grid;
  gap: var(--spacing-xs);
}

.field-item label {
  font-size: var(--font-size-sm);
  color: var(--text-secondary);
}

.field-value {
  color: var(--text-primary);
  line-height: 1.5;
}

.link-value {
  color: var(--primary-color);
  text-decoration: none;
  word-break: break-all;
}

.form-input,
.comment-input {
  width: 100%;
  border: 1px solid var(--border-color);
  border-radius: var(--radius-md);
  padding: 10px 12px;
  font: inherit;
  color: var(--text-primary);
  background: var(--bg-white);
  box-sizing: border-box;
}

.textarea-input,
.comment-input {
  min-height: 88px;
  resize: vertical;
}

.checkbox-line {
  display: inline-flex;
  align-items: center;
  gap: var(--spacing-xs);
  color: var(--text-primary);
}

.comment-editor {
  display: grid;
  gap: var(--spacing-sm);
  margin-bottom: var(--spacing-md);
}

.comment-list {
  display: grid;
  gap: var(--spacing-sm);
}

.comment-card {
  padding: var(--spacing-md);
  background: var(--bg-gray);
  border-radius: var(--radius-md);
}

.comment-card p {
  margin: var(--spacing-xs) 0 0;
  line-height: 1.6;
  white-space: pre-wrap;
}

.comment-meta {
  display: flex;
  justify-content: space-between;
  gap: var(--spacing-sm);
  color: var(--text-secondary);
  font-size: var(--font-size-sm);
}

.empty-comments,
.comment-count {
  color: var(--text-secondary);
  font-size: var(--font-size-sm);
}

.required {
  color: var(--danger-color);
}

.primary-btn,
.secondary-btn,
.icon-btn {
  border: none;
  border-radius: var(--radius-md);
  cursor: pointer;
  font: inherit;
}

.primary-btn,
.secondary-btn {
  padding: 8px 14px;
}

.primary-btn {
  background: var(--primary-color);
  color: #fff;
}

.primary-btn:disabled {
  cursor: not-allowed;
  opacity: 0.6;
}

.secondary-btn {
  background: var(--bg-gray);
  color: var(--text-primary);
}

.icon-btn {
  width: 32px;
  height: 32px;
  background: transparent;
  color: var(--text-secondary);
  font-size: 24px;
  line-height: 1;
}
</style>
