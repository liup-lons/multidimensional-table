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
        <div class="task-list-header">
          <span>任务</span>
          <span class="stat-count">{{ displayData.length }}</span>
        </div>
        <div
          v-for="record in displayData"
          :key="record.id"
          class="task-item"
          :class="{ 'task-selected': selectedRecord?.id === record.id }"
          @click="selectedRecord = record"
        >
          <div class="task-info">
            <span class="task-name">{{ record[titleField] || '无标题' }}</span>
            <div v-if="record.progress !== undefined" class="task-progress-mini">
              <div class="progress-mini-bar">
                <div class="progress-mini-fill" :style="{ width: Math.min(record.progress, 100) + '%' }"></div>
              </div>
              <span class="progress-mini-text">{{ Math.min(record.progress, 100) }}%</span>
            </div>
          </div>
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
            :class="{ 'current-period': isCurrentPeriod(period) }"
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
            :class="{ 'row-selected': selectedRecord?.id === record.id }"
          >
            <div class="gantt-bars">
              <div
                class="gantt-bar"
                :class="{
                  'bar-completed': record.progress === 100,
                  'bar-in-progress': record.progress > 0 && record.progress < 100,
                  'bar-pending': !record.progress
                }"
                :style="{
                  left: getBarPosition(record) + 'px',
                  width: getBarWidth(record) + 'px'
                }"
                @click="openTaskDetail(record)"
              >
                <div v-if="record.progress !== undefined && record.progress > 0" class="bar-progress-bg">
                  <div class="bar-progress-fill" :style="{ width: Math.min(record.progress, 100) + '%' }"></div>
                </div>
                <span class="bar-label">{{ record[titleField] || '任务' }}</span>
                <span v-if="record.progress !== undefined" class="bar-progress-text">{{ Math.min(record.progress, 100) }}%</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- 任务详情弹窗 -->
    <div v-if="selectedRecord" class="modal-overlay" @click.self="selectedRecord = null">
      <div class="modal-content">
        <div class="modal-header">
          <h3>任务详情</h3>
          <button class="close-btn" @click="selectedRecord = null">×</button>
        </div>
        <div class="modal-body">
          <div class="detail-section">
            <h4>基本信息</h4>
            <div class="detail-grid">
              <div class="detail-item">
                <label>任务名称</label>
                <span>{{ selectedRecord[titleField] || '无标题' }}</span>
              </div>
              <div v-if="selectedRecord.status" class="detail-item">
                <label>状态</label>
                <span class="badge status-badge">{{ selectedRecord.status }}</span>
              </div>
              <div v-if="selectedRecord.priority" class="detail-item">
                <label>优先级</label>
                <span class="badge priority-badge">{{ selectedRecord.priority }}</span>
              </div>
              <div v-if="selectedRecord.assignee" class="detail-item">
                <label>负责人</label>
                <span>{{ selectedRecord.assignee }}</span>
              </div>
            </div>
          </div>

          <div class="detail-section">
            <h4>时间安排</h4>
            <div class="detail-grid">
              <div v-if="startDateField" class="detail-item">
                <label>开始日期</label>
                <span>{{ formatDate(selectedRecord[startDateField.fieldName]) }}</span>
              </div>
              <div v-if="endDateField" class="detail-item">
                <label>结束日期</label>
                <span>{{ formatDate(selectedRecord[endDateField.fieldName]) }}</span>
              </div>
              <div v-if="selectedRecord.progress !== undefined" class="detail-item full-width">
                <label>进度</label>
                <div class="progress-info">
                  <div class="progress-bar">
                    <div class="progress-fill" :style="{ width: Math.min(selectedRecord.progress, 100) + '%' }"></div>
                  </div>
                  <span class="progress-text">{{ Math.min(selectedRecord.progress, 100) }}%</span>
                </div>
              </div>
            </div>
          </div>

          <div v-if="selectedRecord.tags && selectedRecord.tags.length" class="detail-section">
            <h4>标签</h4>
            <div class="tags-list">
              <span v-for="tag in selectedRecord.tags" :key="tag" class="tag-item">{{ tag }}</span>
            </div>
          </div>

          <div v-if="selectedRecord.description" class="detail-section">
            <h4>描述</h4>
            <p class="description-text">{{ selectedRecord.description }}</p>
          </div>
        </div>
        <div class="modal-footer">
          <button type="button" class="btn-primary" @click="editTask(selectedRecord)">编辑</button>
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

const timelineStart = ref('')
const timelineEnd = ref('')

const timelinePeriods = computed(() => {
  const periods = []
  
  // 获取数据中的日期范围
  let dataStartDate: Date | null = null
  let dataEndDate: Date | null = null
  
  if (startDateField.value) {
    for (const record of displayData.value) {
      const dateVal = record[startDateField.value.fieldName]
      if (dateVal) {
        const d = new Date(dateVal)
        if (!dataStartDate || d < dataStartDate) dataStartDate = d
        if (!dataEndDate || d > dataEndDate) dataEndDate = d
      }
      
      if (endDateField.value) {
        const endDateVal = record[endDateField.value.fieldName]
        if (endDateVal) {
          const d = new Date(endDateVal)
          if (!dataStartDate || d < dataStartDate) dataStartDate = d
          if (!dataEndDate || d > dataEndDate) dataEndDate = d
        }
      }
    }
  }
  
  // 如果没有数据，使用默认范围
  const today = new Date()
  let startDate: Date
  let endDate: Date
  
  if (dataStartDate && dataEndDate) {
    // 有数据时，前后各扩展一个月
    startDate = new Date(dataStartDate)
    startDate.setMonth(startDate.getMonth() - 1)
    endDate = new Date(dataEndDate)
    endDate.setMonth(endDate.getMonth() + 1)
  } else {
    // 无数据时，显示过去30天到未来90天
    startDate = new Date(today)
    startDate.setDate(startDate.getDate() - 30)
    endDate = new Date(today)
    endDate.setDate(endDate.getDate() + 90)
  }
  
  // 更新调试信息
  timelineStart.value = startDate.toLocaleDateString('zh-CN')
  timelineEnd.value = endDate.toLocaleDateString('zh-CN')

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

const isCurrentPeriod = (period: any) => {
  const today = new Date()
  const periodDate = new Date(period.date)
  return today.getFullYear() === periodDate.getFullYear() &&
         today.getMonth() === periodDate.getMonth()
}

const editTask = (record: Record<string, any>) => {
  selectedRecord.value = null
  store.setCurrentView('table')
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
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.stat-count {
  background-color: var(--primary-color);
  color: white;
  padding: 2px 8px;
  border-radius: 10px;
  font-size: 11px;
  font-weight: 600;
}

.task-item {
  padding: var(--spacing-sm);
  border-bottom: 1px solid rgba(0, 0, 0, 0.05);
  transition: background-color var(--transition-fast);
  cursor: pointer;
}

.task-item:hover {
  background-color: rgba(22, 93, 255, 0.05);
}

.task-item.task-selected {
  background-color: rgba(22, 93, 255, 0.1);
  border-left: 3px solid var(--primary-color);
}

.task-info {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.task-name {
  font-size: var(--font-size-sm);
  color: var(--text-primary);
  font-weight: 500;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.task-progress-mini {
  display: flex;
  align-items: center;
  gap: 6px;
}

.progress-mini-bar {
  flex: 1;
  height: 4px;
  background-color: var(--bg-gray);
  border-radius: 2px;
  overflow: hidden;
}

.progress-mini-fill {
  height: 100%;
  background-color: var(--primary-color);
  border-radius: 2px;
  transition: width 0.3s ease;
}

.progress-mini-text {
  font-size: 10px;
  color: var(--text-secondary);
  font-weight: 600;
  min-width: 28px;
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
  transition: all var(--transition-fast);
}

.timeline-period.current-period {
  background-color: rgba(22, 93, 255, 0.1);
  color: var(--primary-color);
  font-weight: 600;
}

.timeline-content {
  flex: 1;
  overflow: auto;
}

.gantt-row {
  height: 52px;
  border-bottom: 1px solid rgba(0, 0, 0, 0.05);
  position: relative;
  background-color: var(--bg-white);
  transition: background-color var(--transition-fast);
}

.gantt-row:hover {
  background-color: rgba(22, 93, 255, 0.02);
}

.gantt-row.row-selected {
  background-color: rgba(22, 93, 255, 0.08);
}

.gantt-row:nth-child(even) {
  background-color: rgba(0, 0, 0, 0.015);
}

.gantt-row:nth-child(even).row-selected {
  background-color: rgba(22, 93, 255, 0.08);
}

.gantt-bars {
  position: relative;
  height: 100%;
  padding: var(--spacing-xs) 0;
}

.gantt-bar {
  position: absolute;
  top: var(--spacing-xs);
  height: 36px;
  background-color: var(--primary-color);
  border-radius: var(--radius-sm);
  padding: 0 var(--spacing-sm);
  display: flex;
  align-items: center;
  gap: 8px;
  cursor: pointer;
  transition: all var(--transition-fast);
  min-width: 60px;
  overflow: hidden;
}

.gantt-bar.bar-pending {
  background-color: #94a3b8;
}

.gantt-bar.bar-in-progress {
  background-color: var(--primary-color);
}

.gantt-bar.bar-completed {
  background-color: #22c55e;
}

.gantt-bar:hover {
  transform: scaleY(1.05);
  box-shadow: var(--shadow-md);
  z-index: 10;
}

.gantt-bar.bar-pending:hover {
  background-color: #64748b;
}

.gantt-bar.bar-in-progress:hover {
  background-color: #1d4ed8;
}

.gantt-bar.bar-completed:hover {
  background-color: #16a34a;
}

.bar-progress-bg {
  position: absolute;
  left: 0;
  top: 0;
  height: 100%;
  background-color: rgba(0, 0, 0, 0.1);
  pointer-events: none;
}

.bar-progress-fill {
  height: 100%;
  background-color: rgba(255, 255, 255, 0.3);
  transition: width 0.3s ease;
}

.bar-label {
  font-size: var(--font-size-xs);
  font-weight: var(--font-weight-medium);
  color: white;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  z-index: 1;
}

.bar-progress-text {
  font-size: 10px;
  font-weight: 600;
  color: rgba(255, 255, 255, 0.95);
  background-color: rgba(0, 0, 0, 0.15);
  padding: 2px 6px;
  border-radius: 10px;
  z-index: 1;
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
  width: 520px;
  max-width: 95vw;
  max-height: 85vh;
  overflow: hidden;
  display: flex;
  flex-direction: column;
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

.modal-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: var(--spacing-md) var(--spacing-lg);
  border-bottom: 1px solid var(--border-color);
}

.modal-header h3 {
  margin: 0;
  font-size: var(--font-size-lg);
  font-weight: var(--font-weight-semibold);
  color: var(--text-primary);
}

.close-btn {
  width: 32px;
  height: 32px;
  border: none;
  background-color: var(--bg-gray);
  border-radius: 50%;
  font-size: 18px;
  cursor: pointer;
  color: var(--text-secondary);
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all var(--transition-fast);
}

.close-btn:hover {
  background-color: rgba(0, 0, 0, 0.1);
  color: var(--text-primary);
}

.modal-body {
  padding: var(--spacing-lg);
  overflow-y: auto;
  flex: 1;
}

.detail-section {
  margin-bottom: var(--spacing-lg);
}

.detail-section:last-child {
  margin-bottom: 0;
}

.detail-section h4 {
  margin: 0 0 var(--spacing-sm) 0;
  font-size: var(--font-size-sm);
  font-weight: var(--font-weight-semibold);
  color: var(--text-secondary);
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

.detail-grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: var(--spacing-sm);
}

.detail-item {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.detail-item.full-width {
  grid-column: span 2;
}

.detail-item label {
  font-size: 11px;
  color: var(--text-placeholder);
  text-transform: uppercase;
  font-weight: 600;
  letter-spacing: 0.3px;
}

.detail-item > span:not(.badge) {
  font-size: var(--font-size-sm);
  color: var(--text-primary);
}

.badge {
  display: inline-block;
  padding: 3px 10px;
  border-radius: 12px;
  font-size: 11px;
  font-weight: 600;
  width: fit-content;
}

.status-badge {
  background-color: rgba(22, 93, 255, 0.1);
  color: var(--primary-color);
}

.priority-badge {
  background-color: rgba(251, 189, 35, 0.1);
  color: #d97706;
}

.progress-info {
  display: flex;
  align-items: center;
  gap: var(--spacing-sm);
}

.progress-bar {
  flex: 1;
  height: 8px;
  background-color: var(--bg-gray);
  border-radius: 4px;
  overflow: hidden;
}

.progress-fill {
  height: 100%;
  background-color: var(--primary-color);
  border-radius: 4px;
  transition: width 0.3s ease;
}

.progress-text {
  font-size: var(--font-size-sm);
  font-weight: var(--font-weight-semibold);
  color: var(--primary-color);
  min-width: 40px;
}

.tags-list {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
}

.tag-item {
  padding: 3px 12px;
  background-color: var(--bg-gray);
  border-radius: 12px;
  font-size: 11px;
  color: var(--text-secondary);
  font-weight: 500;
}

.description-text {
  margin: 0;
  font-size: var(--font-size-sm);
  color: var(--text-primary);
  line-height: 1.6;
}

.modal-footer {
  display: flex;
  justify-content: flex-end;
  gap: var(--spacing-sm);
  padding: var(--spacing-md) var(--spacing-lg);
  border-top: 1px solid var(--border-color);
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
  background-color: #1d4ed8;
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