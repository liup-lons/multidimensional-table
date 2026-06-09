<script setup lang="ts">
import { useTableStore } from '../store/table'
import TableView from '../components/TableView.vue'
import KanbanView from '../components/KanbanView.vue'
import CalendarView from '../components/CalendarView.vue'
import GanttView from '../components/GanttView.vue'
import DashboardView from '../components/DashboardView.vue'
import WorkflowManager from '../components/WorkflowManager.vue'

const store = useTableStore()
</script>

<template>
  <div class="workspace-view">
    <!-- 空状态 - 没有项目 -->
    <div v-if="!store.currentProject" class="empty-state">
      <div class="empty-icon">📋</div>
      <h3>还没有项目</h3>
      <p>点击左侧"新建项目"按钮创建您的第一个多维表项目</p>
    </div>

    <!-- 空状态 - 没有表格 -->
    <div v-else-if="!store.currentTable" class="empty-state">
      <div class="empty-icon">📝</div>
      <h3>还没有表格</h3>
      <p>点击上方"+"按钮创建表格</p>
    </div>

    <!-- 视图内容 -->
    <template v-else>
      <TableView v-if="store.currentView?.type === 'table'" />
      <KanbanView v-else-if="store.currentView?.type === 'kanban'" />
      <CalendarView v-else-if="store.currentView?.type === 'calendar'" />
      <GanttView v-else-if="store.currentView?.type === 'gantt'" />
      <DashboardView v-else-if="store.currentView?.type === 'dashboard'" />
      <WorkflowManager v-else-if="store.currentView?.type === 'workflow'" />
    </template>
  </div>
</template>

<style scoped>
.workspace-view {
  height: 100%;
  overflow: hidden;
}

.empty-state {
  height: 100%;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  color: var(--text-placeholder);
}

.empty-icon {
  font-size: 72px;
  margin-bottom: var(--spacing-md);
  opacity: 0.6;
}

.empty-state h3 {
  margin: 0 0 var(--spacing-xs) 0;
  font-size: var(--font-size-xl);
  font-weight: var(--font-weight-semibold);
  color: var(--text-primary);
}

.empty-state p {
  margin: 0;
  font-size: var(--font-size-sm);
  color: var(--text-placeholder);
}
</style>