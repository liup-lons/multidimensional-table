<template>
  <div class="dashboard-view">
    <!-- 页面标题 -->
    <div class="dashboard-header">
      <h2>数据仪表盘</h2>
      <div class="header-actions">
        <select v-model="selectedTable" class="table-select">
          <option value="">选择表格</option>
          <option v-for="table in tables" :key="table.id" :value="table.id">
            {{ table.name }}
          </option>
        </select>
      </div>
    </div>

    <!-- 统计卡片 -->
    <div class="stats-grid">
      <div class="stat-card">
        <div class="stat-icon total">📊</div>
        <div class="stat-info">
          <span class="stat-value">{{ stats.total }}</span>
          <span class="stat-label">总任务数</span>
        </div>
      </div>
      <div class="stat-card">
        <div class="stat-icon completed">✅</div>
        <div class="stat-info">
          <span class="stat-value">{{ stats.completed }}</span>
          <span class="stat-label">已完成</span>
        </div>
      </div>
      <div class="stat-card">
        <div class="stat-icon in-progress">🔄</div>
        <div class="stat-info">
          <span class="stat-value">{{ stats.inProgress }}</span>
          <span class="stat-label">进行中</span>
        </div>
      </div>
      <div class="stat-card">
        <div class="stat-icon pending">⏳</div>
        <div class="stat-info">
          <span class="stat-value">{{ stats.pending }}</span>
          <span class="stat-label">待开始</span>
        </div>
      </div>
      <div class="stat-card">
        <div class="stat-icon avg-progress">📈</div>
        <div class="stat-info">
          <span class="stat-value">{{ stats.avgProgress }}%</span>
          <span class="stat-label">平均进度</span>
        </div>
      </div>
      <div class="stat-card">
        <div class="stat-icon completion-rate">🎯</div>
        <div class="stat-info">
          <span class="stat-value">{{ stats.completionRate }}%</span>
          <span class="stat-label">完成率</span>
        </div>
      </div>
    </div>

    <!-- 图表区域 -->
    <div class="charts-grid">
      <!-- 柱状图：状态分布 -->
      <div class="chart-card">
        <h3>任务状态分布</h3>
        <div ref="statusChartRef" class="chart-container"></div>
      </div>

      <!-- 饼图：优先级分布 -->
      <div class="chart-card">
        <h3>优先级分布</h3>
        <div ref="priorityChartRef" class="chart-container"></div>
      </div>

      <!-- 折线图：完成趋势 -->
      <div class="chart-card full-width">
        <h3>任务完成趋势</h3>
        <div ref="trendChartRef" class="chart-container"></div>
      </div>
    </div>

    <!-- 最近任务 -->
    <div class="recent-tasks">
      <h3>最近任务</h3>
      <table class="tasks-table">
        <thead>
          <tr>
            <th>任务名称</th>
            <th>状态</th>
            <th>优先级</th>
            <th>进度</th>
            <th>负责人</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="task in recentTasks" :key="task.id">
            <td class="task-title">{{ task.title || '无标题' }}</td>
            <td>
              <span :class="['status-badge', getStatusClass(task.status)]">
                {{ task.status || '-' }}
              </span>
            </td>
            <td>
              <span :class="['priority-badge', getPriorityClass(task.priority)]">
                {{ task.priority || '-' }}
              </span>
            </td>
            <td>
              <div class="mini-progress">
                <div class="mini-progress-fill" :style="{ width: (task.progress || 0) + '%' }"></div>
              </div>
              <span class="progress-text">{{ task.progress || 0 }}%</span>
            </td>
            <td>{{ task.assignee || '-' }}</td>
          </tr>
        </tbody>
      </table>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch, onMounted, onUnmounted, nextTick } from 'vue'
import { useTableStore } from '../store/table'
import * as echarts from 'echarts'

const store = useTableStore()

const selectedTable = ref('')
const statusChartRef = ref<HTMLElement | null>(null)
const priorityChartRef = ref<HTMLElement | null>(null)
const trendChartRef = ref<HTMLElement | null>(null)

let statusChart: echarts.ECharts | null = null
let priorityChart: echarts.ECharts | null = null
let trendChart: echarts.ECharts | null = null

const tables = computed(() => {
  return store.currentProject?.tables || []
})

const currentTableData = computed(() => {
  if (!selectedTable.value) {
    return store.getFilteredTableData || []
  }
  const table = store.getTableById(store.currentProject!.id, selectedTable.value)
  return table?.data || []
})

const stats = computed(() => {
  const data = currentTableData.value
  const total = data.length
  const completed = data.filter(r => r.status === '已完成' || r.progress === 100).length
  const inProgress = data.filter(r => r.status === '进行中' || (r.progress && r.progress > 0 && r.progress < 100)).length
  const pending = total - completed - inProgress
  const avgProgress = total > 0
    ? Math.round(data.reduce((sum, r) => sum + (r.progress || 0), 0) / total)
    : 0
  const completionRate = total > 0 ? Math.round((completed / total) * 100) : 0

  return { total, completed, inProgress, pending, avgProgress, completionRate }
})

const recentTasks = computed(() => {
  return [...currentTableData.value]
    .sort((a, b) => new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime())
    .slice(0, 10)
})

const getStatusClass = (status?: string) => {
  const statusMap: Record<string, string> = {
    '已完成': 'status-completed',
    '进行中': 'status-in-progress',
    '待开始': 'status-pending',
    '已取消': 'status-canceled'
  }
  return statusMap[status || ''] || 'status-default'
}

const getPriorityClass = (priority?: string) => {
  const priorityMap: Record<string, string> = {
    '高': 'priority-high',
    '中': 'priority-medium',
    '低': 'priority-low'
  }
  return priorityMap[priority || ''] || 'priority-default'
}

const initCharts = () => {
  nextTick(() => {
    // 状态分布柱状图
    if (statusChartRef.value) {
      statusChart = echarts.init(statusChartRef.value)
      updateStatusChart()
    }

    // 优先级分布饼图
    if (priorityChartRef.value) {
      priorityChart = echarts.init(priorityChartRef.value)
      updatePriorityChart()
    }

    // 完成趋势折线图
    if (trendChartRef.value) {
      trendChart = echarts.init(trendChartRef.value)
      updateTrendChart()
    }
  })
}

const updateStatusChart = () => {
  if (!statusChart) return

  const data = currentTableData.value
  const statusCounts: Record<string, number> = {
    '已完成': 0,
    '进行中': 0,
    '待开始': 0,
    '已取消': 0
  }

  data.forEach(record => {
    const status = record.status || '待开始'
    if (statusCounts[status] !== undefined) {
      statusCounts[status]++
    }
  })

  statusChart.setOption({
    tooltip: {
      trigger: 'axis',
      axisPointer: { type: 'shadow' }
    },
    grid: {
      left: '3%',
      right: '4%',
      bottom: '3%',
      containLabel: true
    },
    xAxis: {
      type: 'category',
      data: Object.keys(statusCounts),
      axisLine: { lineStyle: { color: '#E5E6EB' } },
      axisLabel: { color: '#86909C' }
    },
    yAxis: {
      type: 'value',
      axisLine: { show: false },
      axisTick: { show: false },
      splitLine: { lineStyle: { color: '#F5F7FA' } },
      axisLabel: { color: '#86909C' }
    },
    series: [{
      type: 'bar',
      data: Object.values(statusCounts),
      barWidth: '50%',
      itemStyle: {
        borderRadius: [6, 6, 0, 0],
        color: (params: any) => {
          const colors: Record<string, string> = {
            '已完成': '#36D399',
            '进行中': '#165DFF',
            '待开始': '#94A3B8',
            '已取消': '#F87171'
          }
          return colors[Object.keys(statusCounts)[params.dataIndex]] || '#165DFF'
        }
      }
    }]
  })
}

const updatePriorityChart = () => {
  if (!priorityChart) return

  const data = currentTableData.value
  const priorityCounts: Record<string, number> = { '高': 0, '中': 0, '低': 0 }

  data.forEach(record => {
    const priority = record.priority || '中'
    if (priorityCounts[priority] !== undefined) {
      priorityCounts[priority]++
    }
  })

  priorityChart.setOption({
    tooltip: {
      trigger: 'item',
      formatter: '{b}: {c} ({d}%)'
    },
    legend: {
      orient: 'vertical',
      right: '5%',
      top: 'center',
      textStyle: { color: '#4E5969' }
    },
    series: [{
      type: 'pie',
      radius: ['40%', '70%'],
      center: ['40%', '50%'],
      avoidLabelOverlap: false,
      itemStyle: {
        borderRadius: 8,
        borderColor: '#fff',
        borderWidth: 2
      },
      label: {
        show: false,
        position: 'center'
      },
      emphasis: {
        label: {
          show: true,
          fontSize: 18,
          fontWeight: 'bold'
        }
      },
      labelLine: { show: false },
      data: [
        { value: priorityCounts['高'], name: '高优先级', itemStyle: { color: '#F87171' } },
        { value: priorityCounts['中'], name: '中优先级', itemStyle: { color: '#FBBD23' } },
        { value: priorityCounts['低'], name: '低优先级', itemStyle: { color: '#36D399' } }
      ]
    }]
  })
}

const updateTrendChart = () => {
  if (!trendChart) return

  // 生成最近7天的数据
  const days: string[] = []
  const completedData: number[] = []
  const totalData: number[] = []

  for (let i = 6; i >= 0; i--) {
    const date = new Date()
    date.setDate(date.getDate() - i)
    days.push(`${date.getMonth() + 1}/${date.getDate()}`)
    // 模拟数据
    completedData.push(Math.floor(Math.random() * 10) + 5)
    totalData.push(Math.floor(Math.random() * 15) + 10)
  }

  trendChart.setOption({
    tooltip: {
      trigger: 'axis',
      axisPointer: { type: 'cross' }
    },
    legend: {
      data: ['已完成', '总任务'],
      textStyle: { color: '#4E5969' }
    },
    grid: {
      left: '3%',
      right: '4%',
      bottom: '3%',
      containLabel: true
    },
    xAxis: {
      type: 'category',
      data: days,
      boundaryGap: false,
      axisLine: { lineStyle: { color: '#E5E6EB' } },
      axisLabel: { color: '#86909C' }
    },
    yAxis: {
      type: 'value',
      axisLine: { show: false },
      axisTick: { show: false },
      splitLine: { lineStyle: { color: '#F5F7FA' } },
      axisLabel: { color: '#86909C' }
    },
    series: [
      {
        name: '已完成',
        type: 'line',
        smooth: true,
        data: completedData,
        lineStyle: { color: '#36D399', width: 3 },
        areaStyle: {
          color: new echarts.graphic.LinearGradient(0, 0, 0, 1, [
            { offset: 0, color: 'rgba(54, 211, 153, 0.3)' },
            { offset: 1, color: 'rgba(54, 211, 153, 0)' }
          ])
        },
        itemStyle: { color: '#36D399' }
      },
      {
        name: '总任务',
        type: 'line',
        smooth: true,
        data: totalData,
        lineStyle: { color: '#165DFF', width: 3 },
        areaStyle: {
          color: new echarts.graphic.LinearGradient(0, 0, 0, 1, [
            { offset: 0, color: 'rgba(22, 93, 255, 0.15)' },
            { offset: 1, color: 'rgba(22, 93, 255, 0)' }
          ])
        },
        itemStyle: { color: '#165DFF' }
      }
    ]
  })
}

const handleResize = () => {
  statusChart?.resize()
  priorityChart?.resize()
  trendChart?.resize()
}

watch(currentTableData, () => {
  updateStatusChart()
  updatePriorityChart()
  updateTrendChart()
}, { deep: true })

watch(selectedTable, () => {
  updateStatusChart()
  updatePriorityChart()
  updateTrendChart()
})

onMounted(() => {
  if (tables.value.length > 0) {
    selectedTable.value = tables.value[0].id
  }
  initCharts()
  window.addEventListener('resize', handleResize)
})

onUnmounted(() => {
  window.removeEventListener('resize', handleResize)
  statusChart?.dispose()
  priorityChart?.dispose()
  trendChart?.dispose()
})
</script>

<style scoped>
.dashboard-view {
  padding: var(--spacing-lg);
  height: 100%;
  overflow-y: auto;
}

.dashboard-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: var(--spacing-lg);
}

.dashboard-header h2 {
  margin: 0;
  font-size: var(--font-size-xl);
  font-weight: var(--font-weight-semibold);
  color: var(--text-primary);
}

.table-select {
  padding: var(--spacing-xs) var(--spacing-md);
  font-size: var(--font-size-sm);
  background-color: var(--bg-white);
  border: 1px solid var(--border-color);
  border-radius: var(--radius-md);
  color: var(--text-primary);
  cursor: pointer;
  outline: none;
}

.table-select:focus {
  border-color: var(--primary-color);
}

/* 统计卡片 */
.stats-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(180px, 1fr));
  gap: var(--spacing-md);
  margin-bottom: var(--spacing-lg);
}

.stat-card {
  display: flex;
  align-items: center;
  gap: var(--spacing-md);
  padding: var(--spacing-md);
  background-color: var(--bg-white);
  border-radius: var(--radius-lg);
  box-shadow: var(--shadow-sm);
  transition: all var(--transition-normal);
}

.stat-card:hover {
  transform: translateY(-2px);
  box-shadow: var(--shadow-md);
}

.stat-icon {
  width: 48px;
  height: 48px;
  border-radius: var(--radius-md);
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 24px;
}

.stat-icon.total {
  background-color: rgba(22, 93, 255, 0.1);
}

.stat-icon.completed {
  background-color: rgba(54, 211, 153, 0.1);
}

.stat-icon.in-progress {
  background-color: rgba(251, 189, 35, 0.1);
}

.stat-icon.pending {
  background-color: rgba(148, 163, 184, 0.1);
}

.stat-icon.avg-progress {
  background-color: rgba(96, 165, 250, 0.1);
}

.stat-icon.completion-rate {
  background-color: rgba(168, 85, 247, 0.1);
}

.stat-info {
  display: flex;
  flex-direction: column;
}

.stat-value {
  font-size: var(--font-size-xl);
  font-weight: var(--font-weight-bold);
  color: var(--text-primary);
}

.stat-label {
  font-size: var(--font-size-xs);
  color: var(--text-placeholder);
}

/* 图表区域 */
.charts-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(320px, 1fr));
  gap: var(--spacing-md);
  margin-bottom: var(--spacing-lg);
}

.chart-card {
  background-color: var(--bg-white);
  border-radius: var(--radius-lg);
  padding: var(--spacing-md);
  box-shadow: var(--shadow-sm);
}

.chart-card.full-width {
  grid-column: 1 / -1;
}

.chart-card h3 {
  margin: 0 0 var(--spacing-md) 0;
  font-size: var(--font-size-md);
  font-weight: var(--font-weight-semibold);
  color: var(--text-primary);
}

.chart-container {
  height: 280px;
}

.chart-card.full-width .chart-container {
  height: 320px;
}

/* 最近任务表格 */
.recent-tasks {
  background-color: var(--bg-white);
  border-radius: var(--radius-lg);
  padding: var(--spacing-md);
  box-shadow: var(--shadow-sm);
}

.recent-tasks h3 {
  margin: 0 0 var(--spacing-md) 0;
  font-size: var(--font-size-md);
  font-weight: var(--font-weight-semibold);
  color: var(--text-primary);
}

.tasks-table {
  width: 100%;
  border-collapse: collapse;
}

.tasks-table th {
  text-align: left;
  padding: var(--spacing-sm);
  font-size: var(--font-size-xs);
  font-weight: var(--font-weight-semibold);
  color: var(--text-placeholder);
  text-transform: uppercase;
  letter-spacing: 0.5px;
  border-bottom: 2px solid var(--border-color);
}

.tasks-table td {
  padding: var(--spacing-sm);
  font-size: var(--font-size-sm);
  color: var(--text-primary);
  border-bottom: 1px solid rgba(0, 0, 0, 0.05);
}

.tasks-table tr:hover td {
  background-color: rgba(22, 93, 255, 0.03);
}

.task-title {
  font-weight: var(--font-weight-medium);
}

.status-badge {
  display: inline-block;
  padding: 3px 10px;
  border-radius: 12px;
  font-size: 11px;
  font-weight: 600;
}

.status-completed {
  background-color: rgba(54, 211, 153, 0.1);
  color: #10B981;
}

.status-in-progress {
  background-color: rgba(22, 93, 255, 0.1);
  color: var(--primary-color);
}

.status-pending {
  background-color: rgba(148, 163, 184, 0.1);
  color: #64748B;
}

.status-canceled {
  background-color: rgba(248, 113, 113, 0.1);
  color: var(--danger-color);
}

.status-default {
  background-color: var(--bg-gray);
  color: var(--text-placeholder);
}

.priority-badge {
  display: inline-block;
  padding: 3px 10px;
  border-radius: 12px;
  font-size: 11px;
  font-weight: 600;
}

.priority-high {
  background-color: rgba(248, 113, 113, 0.1);
  color: var(--danger-color);
}

.priority-medium {
  background-color: rgba(251, 189, 35, 0.1);
  color: #D97706;
}

.priority-low {
  background-color: rgba(54, 211, 153, 0.1);
  color: #10B981;
}

.priority-default {
  background-color: var(--bg-gray);
  color: var(--text-placeholder);
}

.mini-progress {
  width: 80px;
  height: 6px;
  background-color: var(--bg-gray);
  border-radius: 3px;
  overflow: hidden;
  display: inline-block;
  vertical-align: middle;
  margin-right: var(--spacing-sm);
}

.mini-progress-fill {
  height: 100%;
  background-color: var(--primary-color);
  border-radius: 3px;
  transition: width var(--transition-normal);
}

.progress-text {
  font-size: var(--font-size-xs);
  font-weight: var(--font-weight-semibold);
  color: var(--text-secondary);
}

/* 响应式设计 */
@media (max-width: 768px) {
  .dashboard-view {
    padding: var(--spacing-md);
  }

  .dashboard-header {
    flex-direction: column;
    gap: var(--spacing-md);
    align-items: stretch;
  }

  .stats-grid {
    grid-template-columns: repeat(2, 1fr);
  }

  .charts-grid {
    grid-template-columns: 1fr;
  }

  .tasks-table {
    display: block;
    overflow-x: auto;
  }

  .chart-container {
    height: 200px;
  }
}
</style>