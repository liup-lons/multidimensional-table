<template>
  <div class="calendar-view">
    <!-- 日历导航 -->
    <div class="calendar-header">
      <button class="nav-btn" @click="prevMonth">‹</button>
      <h2>{{ currentYear }}年{{ currentMonth + 1 }}月</h2>
      <button class="nav-btn" @click="nextMonth">›</button>
      <div class="view-switch">
        <button
          v-for="view in (['day', 'week', 'month'] as const)"
          :key="view"
          :class="{ active: currentViewMode === view }"
          @click="currentViewMode = view"
        >
          {{ view === 'day' ? '日' : view === 'week' ? '周' : '月' }}
        </button>
      </div>
    </div>

    <!-- 月视图 -->
    <div v-if="currentViewMode === 'month'" class="calendar-container">
      <div class="weekday-header">
        <div v-for="day in weekdays" :key="day" class="weekday">{{ day }}</div>
      </div>
      <div class="calendar-grid">
        <div
          v-for="(day, index) in calendarDays"
          :key="index"
          class="calendar-day"
          :class="{ 
            'other-month': !day.isCurrentMonth,
            'today': day.isToday,
            'has-events': day.events.length > 0
          }"
          @click="openDayEvents(day)"
        >
          <div class="day-header">
            <span class="day-number">{{ day.date }}</span>
            <span v-if="day.events.length > 0" class="event-count">{{ day.events.length }}</span>
          </div>
          <div class="day-events">
            <div
              v-for="event in day.events.slice(0, 3)"
              :key="event.id"
              class="event-item"
              :title="event.title"
              @click.stop="openEventDetail(event)"
            >
              <span class="event-title">{{ event.title }}</span>
            </div>
            <div v-if="day.events.length > 3" class="more-events">
              +{{ day.events.length - 3 }} 更多
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- 周视图 -->
    <div v-if="currentViewMode === 'week'" class="week-container">
      <div class="week-grid">
        <div
          v-for="day in weekDays"
          :key="day.dateStr"
          class="week-day-column"
        >
          <div class="day-header">
            <span class="day-name">{{ day.dayName }}</span>
            <span class="day-date">{{ day.date }}</span>
          </div>
          <div class="day-events-list">
            <div
              v-for="event in day.events"
              :key="event.id"
              class="event-item"
              @click="openEventDetail(event)"
            >
              <span class="event-title">{{ event.title }}</span>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- 日视图 -->
    <div v-if="currentViewMode === 'day'" class="day-container">
      <div class="day-info">
        <h3>{{ formatDate(new Date()) }}</h3>
        <p>共 {{ todayEvents.length }} 个事件</p>
      </div>
      <div class="day-events-list-full">
        <div
          v-for="event in todayEvents"
          :key="event.id"
          class="event-card"
          @click="openEventDetail(event)"
        >
          <div class="event-card-header">
            <span class="event-card-title">{{ event.title }}</span>
            <span class="event-card-date">{{ event.date }}</span>
          </div>
          <div class="event-card-body">
            <span v-if="event.record.status" class="event-tag status-{{ event.record.status }}">
              {{ event.record.status }}
            </span>
            <span v-if="event.record.priority" class="event-tag priority-{{ event.record.priority }}">
              {{ event.record.priority }}
            </span>
          </div>
        </div>
        <div v-if="todayEvents.length === 0" class="no-events">
          今天没有事件
        </div>
      </div>
    </div>

    <!-- 事件详情弹窗 -->
    <div v-if="selectedEvent" class="modal-overlay" @click.self="selectedEvent = null">
      <div class="modal-content event-detail-modal">
        <div class="modal-header">
          <h3>{{ selectedEvent.title }}</h3>
          <button class="close-btn" @click="selectedEvent = null">×</button>
        </div>
        <div class="modal-body">
          <div class="detail-section">
            <h4>基本信息</h4>
            <div class="detail-grid">
              <div class="detail-item">
                <label>日期</label>
                <span>{{ formatDate(selectedEvent.date) }}</span>
              </div>
              <div v-if="selectedEvent.record.status" class="detail-item">
                <label>状态</label>
                <span class="badge status-badge">{{ selectedEvent.record.status }}</span>
              </div>
              <div v-if="selectedEvent.record.priority" class="detail-item">
                <label>优先级</label>
                <span class="badge priority-badge">{{ selectedEvent.record.priority }}</span>
              </div>
              <div v-if="selectedEvent.record.assignee" class="detail-item">
                <label>负责人</label>
                <span>{{ selectedEvent.record.assignee }}</span>
              </div>
              <div v-if="selectedEvent.record.department" class="detail-item">
                <label>部门</label>
                <span>{{ selectedEvent.record.department }}</span>
              </div>
            </div>
          </div>

          <div v-if="selectedEvent.record.progress !== undefined" class="detail-section">
            <h4>进度</h4>
            <div class="progress-info">
              <div class="progress-bar">
                <div class="progress-fill" :style="{ width: selectedEvent.record.progress + '%' }"></div>
              </div>
              <span class="progress-text">{{ selectedEvent.record.progress }}%</span>
            </div>
          </div>

          <div v-if="selectedEvent.record.startDate || selectedEvent.record.endDate" class="detail-section">
            <h4>时间范围</h4>
            <div class="detail-grid">
              <div v-if="selectedEvent.record.startDate" class="detail-item">
                <label>开始日期</label>
                <span>{{ selectedEvent.record.startDate }}</span>
              </div>
              <div v-if="selectedEvent.record.endDate" class="detail-item">
                <label>结束日期</label>
                <span>{{ selectedEvent.record.endDate }}</span>
              </div>
            </div>
          </div>

          <div v-if="selectedEvent.record.tags && selectedEvent.record.tags.length" class="detail-section">
            <h4>标签</h4>
            <div class="tags-list">
              <span v-for="tag in selectedEvent.record.tags" :key="tag" class="tag-item">{{ tag }}</span>
            </div>
          </div>

          <div v-if="selectedEvent.record.description" class="detail-section">
            <h4>描述</h4>
            <p class="description-text">{{ selectedEvent.record.description }}</p>
          </div>

          <div v-if="selectedEvent.record.url" class="detail-section">
            <h4>链接</h4>
            <a :href="selectedEvent.record.url" target="_blank" class="link-item">{{ selectedEvent.record.url }}</a>
          </div>
        </div>
        <div class="modal-footer">
          <button type="button" class="btn-primary" @click="editEventRecord">编辑</button>
          <button type="button" class="btn-cancel" @click="selectedEvent = null">关闭</button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import { useTableStore } from '../store/table'

const store = useTableStore()

const currentYear = ref(new Date().getFullYear())
const currentMonth = ref(new Date().getMonth())
const currentViewMode = ref<'day' | 'week' | 'month'>('month')
const selectedEvent = ref<Record<string, any> | null>(null)

const weekdays = ['日', '一', '二', '三', '四', '五', '六']

const currentFields = computed(() => {
  return store.currentTable?.fieldDefinitions || []
})

const dateFields = computed(() => {
  return currentFields.value.filter(f => f.fieldType === 'date')
})

const titleField = computed(() => {
  return currentFields.value.find(f => f.fieldName === 'title') || 
         currentFields.value.find(f => f.fieldType === 'text')
})

const calendarDays = computed(() => {
  const days = []
  const firstDay = new Date(currentYear.value, currentMonth.value, 1)
  const lastDay = new Date(currentYear.value, currentMonth.value + 1, 0)
  const startDate = new Date(firstDay)
  startDate.setDate(startDate.getDate() - firstDay.getDay())

  const today = new Date()

  while (startDate <= lastDay || days.length % 7 !== 0) {
    const isCurrentMonth = startDate.getMonth() === currentMonth.value
    const isToday = startDate.toDateString() === today.toDateString()
    
    days.push({
      date: startDate.getDate(),
      month: startDate.getMonth(),
      year: startDate.getFullYear(),
      dateStr: startDate.toISOString().split('T')[0],
      isCurrentMonth,
      isToday,
      events: getEventsForDate(startDate)
    })

    startDate.setDate(startDate.getDate() + 1)
  }

  return days
})

const weekDays = computed(() => {
  const days = []
  const today = new Date(currentYear.value, currentMonth.value, 1)
  const startOfWeek = new Date(today)
  startOfWeek.setDate(startOfWeek.getDate() - today.getDay())

  for (let i = 0; i < 7; i++) {
    const date = new Date(startOfWeek)
    date.setDate(date.getDate() + i)
    days.push({
      date: date.getDate(),
      month: date.getMonth(),
      year: date.getFullYear(),
      dateStr: date.toISOString().split('T')[0],
      dayName: weekdays[date.getDay()],
      events: getEventsForDate(date)
    })
  }

  return days
})

const todayEvents = computed(() => {
  const today = new Date()
  return getEventsForDate(today)
})

const getEventsForDate = (date: Date) => {
  if (dateFields.value.length === 0 || !titleField.value) return []
  
  const dateStr = date.toISOString().split('T')[0]
  const data = store.getFilteredTableData || []
  const primaryDateField = dateFields.value[0]
  
  return data
    .filter(record => {
      const recordDate = record[primaryDateField.fieldName]
      return recordDate && recordDate.startsWith(dateStr)
    })
    .map(record => ({
      id: record.id,
      title: record[titleField.value!.fieldName] || '无标题',
      date: record[primaryDateField.fieldName],
      record
    }))
}

const prevMonth = () => {
  if (currentMonth.value === 0) {
    currentMonth.value = 11
    currentYear.value--
  } else {
    currentMonth.value--
  }
}

const nextMonth = () => {
  if (currentMonth.value === 11) {
    currentMonth.value = 0
    currentYear.value++
  } else {
    currentMonth.value++
  }
}

const openDayEvents = (day: any) => {
  if (day.events.length > 0) {
    selectedEvent.value = day.events[0]
  }
}

const openEventDetail = (event: any) => {
  selectedEvent.value = event
}

const editEventRecord = () => {
  if (!selectedEvent.value) return
  store.setCurrentView('table')
}

const formatDate = (dateStr: string) => {
  return new Date(dateStr).toLocaleDateString('zh-CN', {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  })
}
</script>

<style scoped>
.calendar-view {
  height: 100%;
  display: flex;
  flex-direction: column;
  background-color: var(--bg-white);
}

.calendar-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: var(--spacing-sm) var(--spacing-md);
  background-color: var(--bg-white);
  border-bottom: 1px solid var(--border-color);
}

.nav-btn {
  width: 32px;
  height: 32px;
  font-size: var(--font-size-lg);
  font-weight: var(--font-weight-semibold);
  color: var(--text-secondary);
  background-color: var(--bg-gray);
  border: none;
  border-radius: var(--radius-md);
  cursor: pointer;
  transition: all var(--transition-fast);
  display: flex;
  align-items: center;
  justify-content: center;
}

.nav-btn:hover {
  background-color: rgba(22, 93, 255, 0.1);
  color: var(--primary-color);
}

.calendar-header h2 {
  margin: 0;
  font-size: var(--font-size-lg);
  font-weight: var(--font-weight-semibold);
  color: var(--text-primary);
}

.view-switch {
  display: flex;
  gap: var(--spacing-xs);
  background-color: var(--bg-gray);
  border-radius: var(--radius-md);
  padding: var(--spacing-xs);
}

.view-switch button {
  padding: var(--spacing-xs) var(--spacing-md);
  font-size: var(--font-size-sm);
  font-weight: var(--font-weight-medium);
  color: var(--text-secondary);
  background-color: transparent;
  border: none;
  border-radius: var(--radius-sm);
  cursor: pointer;
  transition: all var(--transition-fast);
}

.view-switch button:hover {
  background-color: rgba(0, 0, 0, 0.05);
}

.view-switch button.active {
  background-color: var(--bg-white);
  color: var(--primary-color);
  box-shadow: var(--shadow-sm);
}

/* 月视图 */
.calendar-container {
  flex: 1;
  padding: var(--spacing-md);
  overflow: auto;
}

.weekday-header {
  display: grid;
  grid-template-columns: repeat(7, 1fr);
  margin-bottom: var(--spacing-sm);
  padding-bottom: var(--spacing-sm);
  border-bottom: 1px solid var(--border-color);
}

.weekday {
  text-align: center;
  font-size: var(--font-size-sm);
  font-weight: var(--font-weight-semibold);
  color: var(--text-placeholder);
  padding: var(--spacing-xs) 0;
}

.calendar-grid {
  display: grid;
  grid-template-columns: repeat(7, 1fr);
  gap: var(--spacing-xs);
  min-height: 500px;
}

.calendar-day {
  min-height: 100px;
  background-color: var(--bg-white);
  border: 1px solid var(--border-color);
  border-radius: var(--radius-md);
  padding: var(--spacing-xs);
  cursor: pointer;
  transition: all var(--transition-fast);
  display: flex;
  flex-direction: column;
  position: relative;
}

.calendar-day:hover {
  background-color: rgba(22, 93, 255, 0.05);
  border-color: var(--primary-color);
}

.calendar-day.other-month {
  background-color: var(--bg-gray);
  color: var(--text-disabled);
}

.calendar-day.today {
  background-color: var(--primary-light);
  border-color: var(--primary-color);
}

.calendar-day.today .day-number {
  color: var(--primary-color);
}

.calendar-day.has-events {
  background-color: rgba(251, 189, 35, 0.05);
}

.calendar-day .day-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 4px;
}

.day-number {
  font-size: var(--font-size-sm);
  font-weight: var(--font-weight-semibold);
  color: var(--text-primary);
}

.event-count {
  font-size: 10px;
  background: var(--primary-color);
  color: white;
  padding: 1px 5px;
  border-radius: 10px;
  font-weight: bold;
}

.day-events {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 2px;
  overflow: hidden;
}

.event-item {
  padding: 2px 4px;
  background-color: var(--primary-color);
  color: white;
  border-radius: 3px;
  font-size: 10px;
  cursor: pointer;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  transition: all 0.2s;
}

.event-item:hover {
  background-color: #1a4ccc;
  transform: scale(1.02);
}

.event-title {
  display: block;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.more-events {
  font-size: 10px;
  color: var(--text-secondary);
  text-align: center;
  padding: 2px;
}

/* 周视图 */
.week-container {
  flex: 1;
  padding: var(--spacing-md);
  overflow: auto;
}

.week-grid {
  display: grid;
  grid-template-columns: repeat(7, 1fr);
  gap: var(--spacing-sm);
  height: calc(100% - 40px);
}

.week-day-column {
  background-color: var(--bg-white);
  border: 1px solid var(--border-color);
  border-radius: var(--radius-md);
  display: flex;
  flex-direction: column;
  transition: all var(--transition-fast);
}

.week-day-column:hover {
  border-color: var(--primary-color);
}

.day-header {
  padding: var(--spacing-sm);
  text-align: center;
  border-bottom: 1px solid var(--border-color);
  background-color: var(--bg-gray);
}

.day-name {
  display: block;
  font-size: var(--font-size-xs);
  color: var(--text-placeholder);
}

.day-date {
  font-size: var(--font-size-lg);
  font-weight: var(--font-weight-semibold);
  color: var(--text-primary);
}

.day-events-list {
  flex: 1;
  padding: var(--spacing-xs);
  overflow-y: auto;
}

.event-item {
  background-color: var(--primary-light);
  padding: var(--spacing-xs) var(--spacing-sm);
  border-radius: var(--radius-sm);
  margin-bottom: var(--spacing-xs);
  cursor: pointer;
  transition: all var(--transition-fast);
  border-left: 3px solid var(--primary-color);
}

.event-item:hover {
  background-color: rgba(22, 93, 255, 0.2);
}

.event-title {
  font-size: var(--font-size-xs);
  color: var(--text-primary);
  display: block;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

/* 日视图 */
.day-container {
  flex: 1;
  padding: var(--spacing-md);
  overflow: auto;
}

.day-info {
  margin-bottom: var(--spacing-md);
  padding: var(--spacing-md);
  background: var(--bg-white);
  border-radius: var(--radius-md);
  border: 1px solid var(--border-color);
}

.day-info h3 {
  margin: 0 0 8px 0;
  font-size: var(--font-size-lg);
  color: var(--text-primary);
}

.day-info p {
  margin: 0;
  font-size: var(--font-size-sm);
  color: var(--text-secondary);
}

.day-events-list-full {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-sm);
}

.event-card {
  background: var(--bg-white);
  border-radius: var(--radius-md);
  border: 1px solid var(--border-color);
  padding: var(--spacing-md);
  cursor: pointer;
  transition: all var(--transition-fast);
}

.event-card:hover {
  border-color: var(--primary-color);
  box-shadow: 0 2px 8px rgba(22, 93, 255, 0.1);
}

.event-card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 8px;
}

.event-card-title {
  font-size: var(--font-size-base);
  font-weight: var(--font-weight-semibold);
  color: var(--text-primary);
}

.event-card-date {
  font-size: var(--font-size-xs);
  color: var(--text-secondary);
}

.event-card-body {
  display: flex;
  gap: 8px;
}

.event-tag {
  font-size: 10px;
  padding: 2px 8px;
  border-radius: 12px;
  background: var(--bg-gray);
  color: var(--text-secondary);
}

.no-events {
  text-align: center;
  padding: 40px;
  color: var(--text-secondary);
  font-size: var(--font-size-base);
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
  background-color: #1a4ccc;
}

/* 事件详情弹窗样式 */
.event-detail-modal {
  width: 500px;
  max-height: 80vh;
  overflow-y: auto;
}

.event-detail-modal .modal-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: var(--spacing-md);
  padding-bottom: var(--spacing-md);
  border-bottom: 1px solid var(--border-color);
}

.event-detail-modal .modal-header h3 {
  margin: 0;
  font-size: var(--font-size-lg);
  color: var(--text-primary);
}

.event-detail-modal .close-btn {
  width: 32px;
  height: 32px;
  border: none;
  background: var(--bg-gray);
  border-radius: 50%;
  font-size: 18px;
  cursor: pointer;
  color: var(--text-secondary);
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all var(--transition-fast);
}

.event-detail-modal .close-btn:hover {
  background: rgba(0, 0, 0, 0.1);
  color: var(--text-primary);
}

.event-detail-modal .modal-body {
  margin-bottom: var(--spacing-md);
}

.event-detail-modal .detail-section {
  margin-bottom: var(--spacing-md);
  padding-bottom: var(--spacing-md);
  border-bottom: 1px solid var(--border-color);
}

.event-detail-modal .detail-section:last-child {
  border-bottom: none;
  margin-bottom: 0;
  padding-bottom: 0;
}

.event-detail-modal .detail-section h4 {
  margin: 0 0 var(--spacing-sm) 0;
  font-size: var(--font-size-sm);
  font-weight: var(--font-weight-semibold);
  color: var(--text-secondary);
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

.event-detail-modal .detail-grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: var(--spacing-sm);
}

.event-detail-modal .detail-item {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.event-detail-modal .detail-item label {
  font-size: var(--font-size-xs);
  color: var(--text-placeholder);
}

.event-detail-modal .detail-item span {
  font-size: var(--font-size-sm);
  color: var(--text-primary);
}

.event-detail-modal .badge {
  display: inline-block;
  padding: 2px 8px;
  border-radius: 12px;
  font-size: var(--font-size-xs);
  font-weight: var(--font-weight-medium);
}

.event-detail-modal .status-badge {
  background: rgba(22, 93, 255, 0.1);
  color: var(--primary-color);
}

.event-detail-modal .priority-badge {
  background: rgba(251, 189, 35, 0.1);
  color: #d48806;
}

.event-detail-modal .progress-info {
  display: flex;
  align-items: center;
  gap: var(--spacing-sm);
}

.event-detail-modal .progress-bar {
  flex: 1;
  height: 8px;
  background: var(--bg-gray);
  border-radius: 4px;
  overflow: hidden;
}

.event-detail-modal .progress-fill {
  height: 100%;
  background: var(--primary-color);
  border-radius: 4px;
  transition: width 0.3s ease;
}

.event-detail-modal .progress-text {
  font-size: var(--font-size-sm);
  font-weight: var(--font-weight-semibold);
  color: var(--primary-color);
  min-width: 40px;
}

.event-detail-modal .tags-list {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
}

.event-detail-modal .tag-item {
  padding: 2px 10px;
  background: var(--bg-gray);
  border-radius: 12px;
  font-size: var(--font-size-xs);
  color: var(--text-secondary);
}

.event-detail-modal .description-text {
  margin: 0;
  font-size: var(--font-size-sm);
  color: var(--text-primary);
  line-height: 1.6;
}

.event-detail-modal .link-item {
  font-size: var(--font-size-sm);
  color: var(--primary-color);
  text-decoration: none;
  word-break: break-all;
}

.event-detail-modal .link-item:hover {
  text-decoration: underline;
}

.event-detail-modal .modal-footer {
  display: flex;
  justify-content: flex-end;
  gap: var(--spacing-sm);
  padding-top: var(--spacing-md);
  border-top: 1px solid var(--border-color);
}

/* 响应式设计 */
@media (max-width: 768px) {
  .calendar-header {
    flex-wrap: wrap;
    gap: var(--spacing-sm);
  }
  
  .calendar-header h2 {
    order: 1;
    width: 100%;
    text-align: center;
  }
  
  .view-switch {
    order: 2;
  }
  
  .week-grid {
    grid-template-columns: repeat(7, minmax(60px, 1fr));
  }
  
  .modal-content {
    width: 95vw;
    padding: var(--spacing-md);
  }
}
</style>