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
          <span class="day-number">{{ day.date }}</span>
          <div class="day-events">
            <div
              v-for="event in day.events.slice(0, 3)"
              :key="event.id"
              class="event-dot"
              :title="event.title"
            ></div>
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
      <div class="day-timeline">
        <div class="time-slots">
          <div v-for="hour in 24" :key="hour" class="time-slot">
            <span>{{ hour }}:00</span>
          </div>
        </div>
        <div class="day-events-area">
          <div
            v-for="event in todayEvents"
            :key="event.id"
            class="timeline-event"
            @click="openEventDetail(event)"
          >
            <span>{{ event.title }}</span>
          </div>
        </div>
      </div>
    </div>

    <!-- 事件详情弹窗 -->
    <div v-if="selectedEvent" class="modal-overlay" @click.self="selectedEvent = null">
      <div class="modal-content">
        <h3>事件详情</h3>
        <div class="detail-info">
          <div class="info-row">
            <label>标题</label>
            <span>{{ selectedEvent.title }}</span>
          </div>
          <div class="info-row">
            <label>日期</label>
            <span>{{ formatDate(selectedEvent.date) }}</span>
          </div>
        </div>
        <div class="form-actions">
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

const dateField = computed(() => {
  return currentFields.value.find(f => f.fieldType === 'date')
})

const titleField = computed(() => {
  return currentFields.value.find(f => f.fieldName === 'title' || f.fieldType === 'text')
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
  if (!dateField.value || !titleField.value) return []
  
  const dateStr = date.toISOString().split('T')[0]
  const data = store.getFilteredTableData || []
  
  return data
    .filter(record => {
      const recordDate = record[dateField.value!.fieldName]
      return recordDate && recordDate.startsWith(dateStr)
    })
    .map(record => ({
      id: record.id,
      title: record[titleField.value!.fieldName] || '无标题',
      date: record[dateField.value!.fieldName],
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
}

.calendar-day {
  aspect-ratio: 1;
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
  background-color: rgba(251, 189, 35, 0.1);
}

.day-number {
  font-size: var(--font-size-sm);
  font-weight: var(--font-weight-semibold);
  color: var(--text-primary);
}

.day-events {
  flex: 1;
  display: flex;
  flex-wrap: wrap;
  gap: 2px;
  margin-top: var(--spacing-xs);
  align-items: flex-end;
  justify-content: center;
}

.event-dot {
  width: 8px;
  height: 8px;
  background-color: var(--primary-color);
  border-radius: 50%;
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

.day-timeline {
  display: flex;
  height: calc(100% - 40px);
  background-color: var(--bg-white);
  border-radius: var(--radius-md);
  border: 1px solid var(--border-color);
  overflow: hidden;
}

.time-slots {
  width: 70px;
  background-color: var(--bg-gray);
  border-right: 1px solid var(--border-color);
}

.time-slot {
  height: 60px;
  padding: var(--spacing-xs);
  font-size: var(--font-size-xs);
  color: var(--text-placeholder);
  border-bottom: 1px solid rgba(0, 0, 0, 0.05);
  display: flex;
  align-items: flex-start;
}

.day-events-area {
  flex: 1;
  position: relative;
  background: repeating-linear-gradient(
    0deg,
    transparent,
    transparent 59px,
    rgba(0, 0, 0, 0.03) 59px,
    rgba(0, 0, 0, 0.03) 60px
  );
}

.timeline-event {
  position: relative;
  margin: var(--spacing-sm);
  padding: var(--spacing-sm);
  background-color: var(--primary-light);
  border-radius: var(--radius-sm);
  cursor: pointer;
  border-left: 3px solid var(--primary-color);
  transition: all var(--transition-fast);
}

.timeline-event:hover {
  background-color: rgba(22, 93, 255, 0.2);
}

.timeline-event span {
  font-size: var(--font-size-sm);
  color: var(--text-primary);
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