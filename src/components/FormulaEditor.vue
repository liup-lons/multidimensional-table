<template>
  <div class="formula-editor">
    <div class="editor-header">
      <span class="formula-icon">∑</span>
      <input
        ref="inputRef"
        v-model="formula"
        type="text"
        class="formula-input"
        :placeholder="placeholder"
        @keydown.enter="handleEnter"
        @keydown.escape="handleEscape"
        @input="handleInput"
      />
      <button class="btn-close" @click="handleClose">×</button>
    </div>

    <!-- 函数列表 -->
    <div class="functions-panel" v-if="showFunctions">
      <div class="panel-header">
        <span>可用函数</span>
        <input
          v-model="searchText"
          type="text"
          class="search-input"
          placeholder="搜索函数..."
        />
      </div>
      <div class="functions-list">
        <div
          v-for="func in filteredFunctions"
          :key="func.name"
          class="function-item"
          @click="insertFunction(func.name)"
        >
          <span class="func-name">{{ func.name }}</span>
          <span class="func-desc">{{ func.description }}</span>
        </div>
      </div>
    </div>

    <!-- 字段列表 -->
    <div class="fields-panel" v-if="showFields">
      <div class="panel-header">
        <span>可用字段</span>
      </div>
      <div class="fields-list">
        <div
          v-for="field in fields"
          :key="field.id"
          class="field-item"
          @click="insertField(field.name)"
        >
          <span class="field-name">{{ field.name }}</span>
          <span class="field-type">{{ field.type }}</span>
        </div>
      </div>
    </div>

    <!-- 示例公式 -->
    <div class="examples-panel">
      <div class="panel-header">
        <span>示例公式</span>
      </div>
      <div class="examples-list">
        <div
          v-for="example in examples"
          :key="example.formula"
          class="example-item"
          @click="insertExample(example.formula)"
        >
          <span class="example-formula">{{ example.formula }}</span>
          <span class="example-desc">{{ example.description }}</span>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch, nextTick, onMounted } from 'vue'
import { getAvailableFunctions, getFunctionDescription } from '../utils/formula'
import type { Field } from '../types/table'

const props = defineProps<{
  modelValue: string
  fields: Field[]
  placeholder?: string
}>()

const emit = defineEmits<{
  (e: 'update:modelValue', value: string): void
  (e: 'confirm'): void
  (e: 'cancel'): void
}>()

const inputRef = ref<HTMLInputElement | null>(null)
const formula = ref(props.modelValue)
const searchText = ref('')
const showFunctions = ref(true)
const showFields = ref(true)

const allFunctions = computed(() => {
  return getAvailableFunctions().map(name => ({
    name,
    description: getFunctionDescription(name)
  }))
})

const filteredFunctions = computed(() => {
  if (!searchText.value) return allFunctions.value
  const search = searchText.value.toLowerCase()
  return allFunctions.value.filter(
    func => func.name.toLowerCase().includes(search) ||
            func.description.toLowerCase().includes(search)
  )
})

const examples = [
  { formula: '=SUM([字段1], [字段2])', description: '求和' },
  { formula: '=IF([状态]="已完成", "是", "否")', description: '条件判断' },
  { formula: '=CONCAT([姓], [名])', description: '文本连接' },
  { formula: '=DATEDIF([开始日期], [结束日期], "D")', description: '计算天数差' },
  { formula: '=ROUND([数值], 2)', description: '保留两位小数' },
  { formula: '=UPPER([文本])', description: '转为大写' },
  { formula: '=NOW()', description: '当前时间' },
  { formula: '=RAND()', description: '随机数' }
]

watch(() => props.modelValue, (newVal) => {
  formula.value = newVal
})

const handleInput = () => {
  emit('update:modelValue', formula.value)
}

const handleEnter = () => {
  emit('confirm')
}

const handleEscape = () => {
  emit('cancel')
}

const handleClose = () => {
  emit('cancel')
}

const insertFunction = (funcName: string) => {
  const input = inputRef.value
  if (!input) return

  const funcDesc = getFunctionDescription(funcName)
  const matches = funcDesc.match(/\(([^)]+)\)/)
  const params = matches ? matches[1].split(',').map(p => p.trim()).filter(p => p.startsWith('[') && p.endsWith(']')) : []
  
  let insertText = funcName + '('
  if (params.length > 0) {
    insertText += params.map(() => '').join(', ')
  }
  insertText += ')'

  insertAtCursor(input, insertText)
}

const insertField = (fieldName: string) => {
  const input = inputRef.value
  if (!input) return
  insertAtCursor(input, `[${fieldName}]`)
}

const insertExample = (exampleFormula: string) => {
  formula.value = exampleFormula
  emit('update:modelValue', formula.value)
}

const insertAtCursor = (input: HTMLInputElement, text: string) => {
  const start = input.selectionStart || 0
  const end = input.selectionEnd || 0
  const value = input.value
  
  input.value = value.substring(0, start) + text + value.substring(end)
  
  setTimeout(() => {
    input.selectionStart = input.selectionEnd = start + text.length
    input.focus()
  }, 0)
}

onMounted(() => {
  nextTick(() => {
    inputRef.value?.focus()
  })
})
</script>

<style scoped>
.formula-editor {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-md);
  padding: var(--spacing-md);
}

.editor-header {
  display: flex;
  align-items: center;
  gap: var(--spacing-sm);
  padding: var(--spacing-xs) var(--spacing-sm);
  background-color: var(--bg-white);
  border: 1px solid var(--border-color);
  border-radius: var(--radius-md);
}

.formula-icon {
  font-size: var(--font-size-lg);
  color: var(--primary-color);
  font-weight: var(--font-weight-bold);
}

.formula-input {
  flex: 1;
  border: none;
  outline: none;
  font-size: var(--font-size-sm);
  color: var(--text-primary);
  background: transparent;
  font-family: 'SF Mono', 'Monaco', 'Consolas', monospace;
}

.formula-input::placeholder {
  color: var(--text-placeholder);
}

.btn-close {
  width: 28px;
  height: 28px;
  border: none;
  background-color: transparent;
  border-radius: 50%;
  font-size: 18px;
  cursor: pointer;
  color: var(--text-secondary);
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all var(--transition-fast);
}

.btn-close:hover {
  background-color: var(--bg-gray);
  color: var(--text-primary);
}

.functions-panel,
.fields-panel,
.examples-panel {
  background-color: var(--bg-white);
  border: 1px solid var(--border-color);
  border-radius: var(--radius-md);
  overflow: hidden;
}

.panel-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: var(--spacing-sm) var(--spacing-md);
  background-color: var(--bg-gray);
  font-size: var(--font-size-xs);
  font-weight: var(--font-weight-semibold);
  color: var(--text-secondary);
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

.search-input {
  padding: 4px 8px;
  font-size: var(--font-size-xs);
  border: 1px solid var(--border-color);
  border-radius: var(--radius-sm);
  background-color: var(--bg-white);
  color: var(--text-primary);
  outline: none;
}

.search-input:focus {
  border-color: var(--primary-color);
}

.functions-list,
.fields-list,
.examples-list {
  max-height: 180px;
  overflow-y: auto;
}

.function-item,
.field-item,
.example-item {
  display: flex;
  align-items: center;
  padding: var(--spacing-sm) var(--spacing-md);
  cursor: pointer;
  transition: background-color var(--transition-fast);
}

.function-item:hover,
.field-item:hover,
.example-item:hover {
  background-color: rgba(22, 93, 255, 0.05);
}

.func-name {
  font-family: 'SF Mono', 'Monaco', 'Consolas', monospace;
  font-weight: var(--font-weight-semibold);
  color: var(--primary-color);
  margin-right: var(--spacing-md);
}

.func-desc {
  font-size: var(--font-size-xs);
  color: var(--text-placeholder);
}

.field-name {
  font-weight: var(--font-weight-medium);
  color: var(--text-primary);
  margin-right: var(--spacing-md);
}

.field-type {
  font-size: var(--font-size-xs);
  color: var(--text-placeholder);
  background-color: var(--bg-gray);
  padding: 2px 6px;
  border-radius: var(--radius-sm);
}

.example-formula {
  font-family: 'SF Mono', 'Monaco', 'Consolas', monospace;
  font-size: var(--font-size-xs);
  color: var(--primary-color);
  margin-right: var(--spacing-md);
}

.example-desc {
  font-size: var(--font-size-xs);
  color: var(--text-placeholder);
}
</style>