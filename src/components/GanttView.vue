<template>
  <div class="gantt-view">
    <!-- 工具栏 -->
    <div class="gantt-header">
      <div class="zoom-controls">
        <button class="zoom-btn" @click="zoomOut">−</button>
        <span>{{ zoomLevel }}%</span>
        <button class="zoom-btn" @click="zoomIn">+</button>
      </div>
      <div class="time-range">
        <select v-model="timeScale" class="time-scale-select">
          <option value="day">日</option>
          <option value="week">周</option>
          <option value="month">月</option>
          <option value="quarter">季度</option>
        </select>
      </div>
    </div>

    <!-- 甘特图主体 -->
    <div class="gantt-container">
      <!-- 左侧任务列表 -->
      <div class="gantt-tasks">
        <div class="task-list-header">任务</div>
        <div
          v-for="record in displayData"
          :key="record.id"
          class="task-item"
        >
          <span class="task-name">{{ record[titleField] || '无标题' }}</span>
        </div>
      </div>

      <!-- 右侧时间轴 -->
      <div class="gantt-timeline">
        <!-- 时间刻度 -->
        <div class="timeline-header">
          <div
            v-for="period in timelinePeriods"
            :key="period.key"
            class="timeline-period"
            :style="{ width: period.width + 'px' }"
          >
            {{ period.label }}
          </div>
        </div>

        <!-- 甘特条 -->
        <div class="timeline-content">
          <div
            v-for="record in displayData"
            :key="record.id"
            class="gantt-row"
          >
            <div class="gantt-bars">
              <div
                class="gantt-bar"
                :style="{
                  left: getBarPosition(record) + 'px',
                  width: getBarWidth(record) + 'px'
                }"
                @click="openTaskDetail(record)"
              >
                <span class="bar-label">{{ record[titleField] || '任务' }}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- 任务详情弹窗 -->
    <div v-if="selectedRecord" class="modal-overlay" @click.self="selectedRecord = null">
      <div class="modal-content">
        <h3>任务详情</h3>
        <div class="detail-info">
          <div class="info-row">
            <label>任务名称</label>
            <span>{{ selectedRecord[titleField] || '无标题' }}</span>
          </div>
          <div v-if="startDateField" class="info-row">
            <label>开始日期</label>
            <span>{{ formatDate(selectedRecord[startDateField.fieldName]) }}</span>
          </div>
          <div v-if="endDateField" class="info-row">
            <label>结束日期</label>
            <span>{{ formatDate(selectedRecord[endDateField.fieldName]) }}</span>
          </div>
        </div>
        <div class="form-actions">
          <button type="button" class="btn-cancel" @click="selectedRecord = null">关闭</button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import { useTableStore } from '../store/table'

const store = useTableStore()

const zoomLevel = ref(100)
const timeScale = ref<'day' | 'week' | 'month' | 'quarter'>('week')
const selectedRecord = ref<Record<string, any> | null>(null)

const currentFields = computed(() => {
  return store.currentTable?.fieldDefinitions || []
})

const titleField = computed(() => {
  return currentFields.value.find(f => f.fieldName === 'title' || f.fieldType === 'text')?.fieldName || ''
})

const startDateField = computed(() => {
  return currentFields.value.find(f => f.fieldName === 'startDate' || f.fieldName === 'start_date') ||
         currentFields.value.find(f => f.fieldType === 'date')
})

const endDateField = computed(() => {
  return currentFields.value.find(f => f.fieldName === 'endDate' || f.fieldName === 'end_date')
})

const displayData = computed(() => {
  return store.getFilteredTableData || []
})

const timelinePeriods = computed(() => {
  const periods = []
  const today = new Date()
  const startDate = new Date(today)
  startDate.setDate(startDate.getDate() - 30) // 显示过去30天
  const endDate = new Date(today)
  endDate.setDate(endDate.getDate() + 90) // 显示未来90天

  const periodWidth = 100 // 每个时间周期的宽度

  let currentDate = new Date(startDate)
  while (currentDate <= endDate) {
    let label = ''
    let days = 1

    switch (timeScale.value) {
      case 'day':
        label = currentDate.getDate() + '日'
        days = 1
        break
      case 'week':
        const weekStart = new Date(currentDate)
        weekStart.setDate(weekStart.getDate() - weekStart.getDay())
        const weekEnd = new Date(weekStart)
        weekEnd.setDate(weekEnd.getDate() + 6)
        label = `${weekStart.getMonth() + 1}/${weekStart.getDate()}-${weekEnd.getDate()}`
        days = 7
        break
      case 'month':
        label = `${currentDate.getFullYear()}/${currentDate.getMonth() + 1}`
        days = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 0).getDate()
        break
      case 'quarter':
        const quarter = Math.floor(currentDate.getMonth() / 3) + 1
        label = `${currentDate.getFullYear()}Q${quarter}`
        days = 90
        break
    }

    periods.push({
      key: currentDate.toISOString(),
      label,
      width: periodWidth * (zoomLevel.value / 100),
      date: new Date(currentDate)
    })

    currentDate.setDate(currentDate.getDate() + days)
  }

  return periods
})

const zoomIn = () => {
  if (zoomLevel.value < 200) {
    zoomLevel.value += 25
  }
}

const zoomOut = () => {
  if (zoomLevel.value > 50) {
    zoomLevel.value -= 25
  }
}

const getBarPosition = (record: Record<string, any>) => {
  if (!startDateField.value) return 0
  
  const startVal = record[startDateField.value.fieldName]
  if (!startVal) return 0

  const taskStart = new Date(startVal)
  const firstPeriod = timelinePeriods.value[0]
  
  if (!firstPeriod) return 0

  const periodDays = getDaysPerPeriod()
  const diffDays = Math.floor((taskStart.getTime() - firstPeriod.date.getTime()) / (1000 * 60 * 60 * 24))
  const periodWidth = 100 * (zoomLevel.value / 100)

  return (diffDays / periodDays) * periodWidth
}

const getBarWidth = (record: Record<string, any>) => {
  if (!startDateField.value) return 50
  
  const startVal = record[startDateField.value.fieldName]
  const endVal = endDateField.value ? record[endDateField.value.fieldName] : null
  
  if (!startVal) return 50

  const startDate = new Date(startVal)
  const endDate = endVal ? new Date(endVal) : new Date(startDate)
  endDate.setDate(endDate.getDate() + 1) // 包含结束日期

  const periodDays = getDaysPerPeriod()
  const diffDays = Math.floor((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24))
  const periodWidth = 100 * (zoomLevel.value / 100)

  return Math.max((diffDays / periodDays) * periodWidth, 30)
}

const getDaysPerPeriod = () => {
  switch (timeScale.value) {
    case 'day': return 1
    case 'week': return 7
    case 'month': return 30
    case 'quarter': return 90
    default: return 7
  }
}

const openTaskDetail = (record: Record<string, any>) => {
  selectedRecord.value = record
}

const formatDate = (dateStr: string | undefined) => {
  if (!dateStr) return '-'
  return new Date(dateStr).toLocaleDateString('zh-CN', {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  })
}
</script>

<style scoped>
.gantt-view {
  height: 100%;
  display: flex;
  flex-direction: column;
  background-color: var(--bg-white);
}

.gantt-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: var(--spacing-sm) var(--spacing-md);
  background-color: var(--bg-white);
  border-bottom: 1px solid var(--border-color);
}

.zoom-controls {
  display: flex;
  align-items: center;
  gap: var(--spacing-xs);
  background-color: var(--bg-gray);
  border-radius: var(--radius-md);
  padding: var(--spacing-xs);
}

.zoom-btn {
  width: 28px;
  height: 28px;
  font-size: var(--font-size-lg);
  font-weight: var(--font-weight-semibold);
  color: var(--text-secondary);
  background-color: transparent;
  border: none;
  border-radius: var(--radius-sm);
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all var(--transition-fast);
}

.zoom-btn:hover {
  background-color: rgba(0, 0, 0, 0.05);
  color: var(--primary-color);
}

.zoom-controls span {
  font-size: var(--font-size-sm);
  color: var(--text-secondary);
  padding: 0 var(--spacing-xs);
}

.time-scale-select {
  padding: var(--spacing-xs) var(--spacing-sm);
  font-size: var(--font-size-sm);
  font-family: inherit;
  background-color: var(--bg-white);
  border: 1px solid var(--border-color);
  border-radius: var(--radius-md);
  cursor: pointer;
  outline: none;
  transition: all var(--transition-fast);
}

.time-scale-select:focus {
  border-color: var(--primary-color);
  box-shadow: 0 0 0 3px var(--primary-light);
}

.gantt-container {
  flex: 1;
  display: flex;
  overflow: hidden;
}

.gantt-tasks {
  width: 220px;
  flex-shrink: 0;
  border-right: 1px solid var(--border-color);
  background-color: var(--bg-white);
}

.task-list-header {
  padding: var(--spacing-sm);
  font-weight: var(--font-weight-semibold);
  font-size: var(--font-size-sm);
  color: var(--text-primary);
  background-color: var(--bg-gray);
  border-bottom: 1px solid var(--border-color);
}

.task-item {
  padding: var(--spacing-sm);
  border-bottom: 1px solid rgba(0, 0, 0, 0.05);
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  transition: background-color var(--transition-fast);
}

.task-item:hover {
  background-color: rgba(22, 93, 255, 0.05);
}

.task-name {
  font-size: var(--font-size-sm);
  color: var(--text-primary);
}

.gantt-timeline {
  flex: 1;
  display: flex;
  flex-direction: column;
  overflow: auto;
  background-color: var(--bg-gray);
}

.timeline-header {
  display: flex;
  background-color: var(--bg-white);
  border-bottom: 1px solid var(--border-color);
  position: sticky;
  top: 0;
  z-index: 10;
}

.timeline-period {
  padding: var(--spacing-xs);
  font-size: var(--font-size-xs);
  color: var(--text-placeholder);
  border-right: 1px solid var(--border-color);
  text-align: center;
  min-width: 80px;
  font-weight: var(--font-weight-medium);
}

.timeline-content {
  flex: 1;
  overflow: auto;
}

.gantt-row {
  height: 48px;
  border-bottom: 1px solid rgba(0, 0, 0, 0.05);
  position: relative;
  background-color: var(--bg-white);
}

.gantt-row:nth-child(even) {
  background-color: rgba(0, 0, 0, 0.02);
}

.gantt-bars {
  position: relative;
  height: 100%;
  padding: var(--spacing-xs) 0;
}

.gantt-bar {
  position: absolute;
  top: var(--spacing-xs);
  height: 32px;
  background-color: var(--primary-color);
  border-radius: var(--radius-sm);
  padding: 0 var(--spacing-sm);
  display: flex;
  align-items: center;
  cursor: pointer;
  transition: all var(--transition-fast);
  min-width: 40px;
}

.gantt-bar:hover {
  background-color: var(--primary-dark);
  transform: scaleY(1.05);
  box-shadow: var(--shadow-md);
}

.bar-label {
  font-size: var(--font-size-xs);
  font-weight: var(--font-weight-medium);
  color: white;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

/* 时间轴网格线 */
.gantt-row::before {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: repeating-linear-gradient(
    90deg,
    transparent,
    transparent 79px,
    rgba(0, 0, 0, 0.03) 79px,
    rgba(0, 0, 0, 0.03) 80px
  );
  pointer-events: none;
}

/* 弹窗样式 */
.modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background-color: rgba(0, 0, 0, 0.5);
  backdrop-filter: blur(2px);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: var(--z-modal);
  animation: fadeIn var(--transition-fast);
}

@keyframes fadeIn {
  from { opacity: 0; }
  to { opacity: 1; }
}

.modal-content {
  background-color: var(--bg-white);
  border-radius: var(--radius-lg);
  box-shadow: var(--shadow-lg);
  padding: var(--spacing-lg);
  width: 420px;
  max-width: 95vw;
  animation: slideUp var(--transition-normal);
}

@keyframes slideUp {
  from {
    opacity: 0;
    transform: translateY(20px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

.modal-content h3 {
  margin: 0 0 var(--spacing-md) 0;
  font-size: var(--font-size-xl);
  font-weight: var(--font-weight-semibold);
  color: var(--text-primary);
}

.detail-info {
  margin-bottom: var(--spacing-md);
}

.info-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: var(--spacing-sm) 0;
  border-bottom: 1px solid var(--border-color);
}

.info-row label {
  font-weight: var(--font-weight-medium);
  color: var(--text-placeholder);
  font-size: var(--font-size-sm);
}

.info-row span {
  font-size: var(--font-size-sm);
  color: var(--text-primary);
}

.form-actions {
  display: flex;
  justify-content: flex-end;
  gap: var(--spacing-sm);
  margin-top: var(--spacing-lg);
  padding-top: var(--spacing-md);
  border-top: 1px solid var(--border-color);
}

.btn-cancel {
  padding: var(--spacing-xs) var(--spacing-md);
  font-size: var(--font-size-sm);
  font-weight: var(--font-weight-medium);
  color: var(--text-secondary);
  background-color: var(--bg-gray);
  border: none;
  border-radius: var(--radius-md);
  cursor: pointer;
  transition: all var(--transition-fast);
}

.btn-cancel:hover {
  background-color: rgba(0, 0, 0, 0.05);
}

/* 响应式设计 */
@media (max-width: 768px) {
  .gantt-tasks {
    width: 150px;
  }
  
  .timeline-period {
    min-width: 60px;
  }
  
  .modal-content {
    width: 95vw;
    padding: var(--spacing-md);
  }
}
</style>