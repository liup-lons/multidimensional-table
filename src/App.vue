<template>
  <div class="app-container">
    <!-- 侧边栏 -->
    <aside class="sidebar">
      <div class="sidebar-header">
        <h1 class="app-title">📊 多维表</h1>
      </div>
      
      <div class="sidebar-section">
        <ProjectList />
      </div>
    </aside>

    <!-- 主内容区 -->
    <main class="main-content">
      <!-- 顶部导航 -->
      <header class="main-header">
        <div v-if="store.currentProject" class="project-info">
          <h2>{{ store.currentProject.name }}</h2>
          <p v-if="store.currentProject.description">{{ store.currentProject.description }}</p>
        </div>
        <div class="header-actions">
          <button v-if="store.currentProject" class="header-btn" @click="showBackupModal = true">
            备份数据
          </button>
          <button class="header-btn" @click="resetTestData">
            重置测试数据
          </button>
        </div>
      </header>

      <!-- 表格列表 -->
      <div v-if="store.currentProject" class="table-tabs">
        <div class="tabs-header">
          <button
            v-for="table in store.currentProject.tables"
            :key="table.id"
            :class="{ active: store.currentTable?.id === table.id }"
            @click="store.switchTable(store.currentProject!.id, table.id)"
            class="table-tab"
          >
            {{ table.name }}
            <button class="tab-close" @click.stop="deleteTable(table.id)">×</button>
          </button>
          <button class="add-table-btn" @click="showCreateTableModal = true">+</button>
        </div>
      </div>

      <!-- 视图切换 -->
      <div v-if="store.currentTable" class="view-tabs">
        <button
          v-for="view in store.currentTable.views"
          :key="view.id"
          :class="{ active: store.currentView?.id === view.id }"
          @click="store.switchView(view.id)"
          class="view-tab"
        >
          {{ view.name }}
          <span class="tab-close" @click.stop="deleteView(view.id)">×</span>
        </button>
        <button class="add-view-btn" @click="showCreateViewModal = true">+ 添加视图</button>
      </div>

      <!-- 内容区域 -->
      <div class="content-area">
        <!-- 空状态 -->
        <div v-if="!store.currentProject" class="empty-state">
          <div class="empty-icon">📋</div>
          <h3>还没有项目</h3>
          <p>点击左侧"新建项目"按钮创建您的第一个多维表项目</p>
        </div>

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
        </template>
      </div>
    </main>

    <!-- 创建表格弹窗 -->
    <div v-if="showCreateTableModal" class="modal-overlay" @click.self="showCreateTableModal = false">
      <div class="modal-content">
        <h3>创建表格</h3>
        <form @submit.prevent="createTable">
          <div class="form-group">
            <label>表格名称 *</label>
            <input
              type="text"
              v-model="tableName"
              required
              placeholder="请输入表格名称"
              class="form-input"
            />
          </div>
          <div class="form-actions">
            <button type="button" class="btn-cancel" @click="showCreateTableModal = false">取消</button>
            <button type="submit" class="btn-submit">创建</button>
          </div>
        </form>
      </div>
    </div>

    <!-- 创建视图弹窗 -->
    <div v-if="showCreateViewModal" class="modal-overlay" @click.self="showCreateViewModal = false">
      <div class="modal-content">
        <h3>创建视图</h3>
        <form @submit.prevent="createView">
          <div class="form-group">
            <label>视图名称 *</label>
            <input
              type="text"
              v-model="viewName"
              required
              placeholder="请输入视图名称"
              class="form-input"
            />
          </div>
          <div class="form-group">
            <label>视图类型 *</label>
            <select v-model="viewType" required class="form-input">
              <option value="table">表格视图</option>
              <option value="kanban">看板视图</option>
              <option value="calendar">日历视图</option>
              <option value="gantt">甘特视图</option>
            </select>
          </div>
          <div class="form-actions">
            <button type="button" class="btn-cancel" @click="showCreateViewModal = false">取消</button>
            <button type="submit" class="btn-submit">创建</button>
          </div>
        </form>
      </div>
    </div>

    <!-- 备份弹窗 -->
    <div v-if="showBackupModal" class="modal-overlay" @click.self="showBackupModal = false">
      <div class="modal-content">
        <h3>数据备份</h3>
        <div class="backup-options">
          <button class="backup-btn" @click="exportBackup">导出备份</button>
          <button class="backup-btn" @click="showImportModal = true">导入备份</button>
        </div>
        <div class="form-actions">
          <button type="button" class="btn-cancel" @click="showBackupModal = false">关闭</button>
        </div>
      </div>
    </div>

    <!-- 导入备份弹窗 -->
    <div v-if="showImportModal" class="modal-overlay" @click.self="showImportModal = false">
      <div class="modal-content">
        <h3>导入备份</h3>
        <p>导入备份将覆盖现有数据，请确保已备份当前数据。</p>
        <div class="form-group">
          <label>选择备份文件</label>
          <input
            type="file"
            accept=".json"
            @change="handleBackupFile"
            class="file-input"
          />
        </div>
        <textarea
          v-model="backupContent"
          placeholder="或直接粘贴备份内容..."
          class="backup-textarea"
        ></textarea>
        <div class="form-actions">
          <button type="button" class="btn-cancel" @click="showImportModal = false">取消</button>
          <button type="button" class="btn-submit" @click="importBackup">导入</button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useTableStore } from './store/table'
import ProjectList from './components/ProjectList.vue'
import TableView from './components/TableView.vue'
import KanbanView from './components/KanbanView.vue'
import CalendarView from './components/CalendarView.vue'
import GanttView from './components/GanttView.vue'

const store = useTableStore()

const showCreateTableModal = ref(false)
const showCreateViewModal = ref(false)
const showBackupModal = ref(false)
const showImportModal = ref(false)
const tableName = ref('')
const viewName = ref('')
const viewType = ref('table')
const backupContent = ref('')

onMounted(() => {
  store.initStore()
})

const createTable = () => {
  if (!store.currentProject || !tableName.value) return
  
  store.createTable(store.currentProject.id, tableName.value)
  showCreateTableModal.value = false
  tableName.value = ''
}

const deleteTable = (tableId: string) => {
  if (!store.currentProject) return
  
  if (confirm('确定删除此表格吗？所有数据将被永久删除。')) {
    store.deleteTable(store.currentProject.id, tableId)
  }
}

const createView = () => {
  if (!store.currentProject || !store.currentTable || !viewName.value) return
  
  store.createView(store.currentProject.id, store.currentTable.id, {
    name: viewName.value,
    type: viewType.value as any,
    tableId: store.currentTable.id
  })
  showCreateViewModal.value = false
  viewName.value = ''
  viewType.value = 'table'
}

const deleteView = (viewId: string) => {
  if (!store.currentProject || !store.currentTable) return
  
  if (confirm('确定删除此视图吗？')) {
    store.deleteView(store.currentProject.id, store.currentTable.id, viewId)
  }
}

const exportBackup = () => {
  const backup = store.exportBackup()
  const blob = new Blob([backup], { type: 'application/json' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = `multidimensional-table-backup-${new Date().toISOString().split('T')[0]}.json`
  a.click()
  URL.revokeObjectURL(url)
  showBackupModal.value = false
}

const handleBackupFile = (event: Event) => {
  const target = event.target as HTMLInputElement
  const file = target.files?.[0]
  if (file) {
    const reader = new FileReader()
    reader.onload = (e) => {
      backupContent.value = e.target?.result as string
    }
    reader.readAsText(file)
  }
}

const importBackup = () => {
  if (!backupContent.value) {
    alert('请选择备份文件或粘贴备份内容')
    return
  }
  
  if (confirm('确定导入备份吗？这将覆盖所有现有数据。')) {
    if (store.importBackup(backupContent.value)) {
      alert('导入成功！')
      showImportModal.value = false
      backupContent.value = ''
    } else {
      alert('导入失败，请检查备份文件格式是否正确。')
    }
  }
}

const resetTestData = () => {
  if (confirm('确定重置为测试数据吗？这将覆盖所有现有数据。')) {
    store.resetToTestData()
    alert('测试数据已重置！')
  }
}
</script>

<style scoped>
.app-container {
  display: flex;
  height: 100vh;
  overflow: hidden;
  background-color: var(--bg-gray);
}

/* 侧边栏 */
.sidebar {
  width: 280px;
  flex-shrink: 0;
  background-color: var(--bg-white);
  border-right: 1px solid var(--border-color);
  display: flex;
  flex-direction: column;
  overflow: hidden;
}

.sidebar-header {
  padding: var(--spacing-md);
  border-bottom: 1px solid var(--border-color);
}

.app-title {
  margin: 0;
  font-size: var(--font-size-xl);
  font-weight: var(--font-weight-bold);
  color: var(--text-primary);
}

.sidebar-section {
  flex: 1;
  overflow: hidden;
}

/* 主内容区 */
.main-content {
  flex: 1;
  display: flex;
  flex-direction: column;
  background-color: var(--bg-gray);
  overflow: hidden;
}

.main-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: var(--spacing-md) var(--spacing-lg);
  background-color: var(--bg-white);
  border-bottom: 1px solid var(--border-color);
}

.project-info h2 {
  margin: 0 0 var(--spacing-xs) 0;
  font-size: var(--font-size-xl);
  font-weight: var(--font-weight-semibold);
  color: var(--text-primary);
}

.project-info p {
  margin: 0;
  font-size: var(--font-size-sm);
  color: var(--text-placeholder);
}

.header-btn {
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

.header-btn:hover {
  background-color: rgba(0, 0, 0, 0.05);
}

/* 表格标签 */
.table-tabs {
  background-color: var(--bg-white);
  border-bottom: 1px solid var(--border-color);
}

.tabs-header {
  display: flex;
  gap: var(--spacing-xs);
  padding: var(--spacing-xs) var(--spacing-md);
}

.table-tab {
  display: flex;
  align-items: center;
  gap: var(--spacing-xs);
  padding: var(--spacing-xs) var(--spacing-md);
  font-size: var(--font-size-sm);
  font-weight: var(--font-weight-medium);
  color: var(--text-secondary);
  background-color: transparent;
  border: 2px solid transparent;
  border-radius: var(--radius-md) var(--radius-md) 0 0;
  cursor: pointer;
  transition: all var(--transition-fast);
}

.table-tab:hover {
  background-color: rgba(0, 0, 0, 0.03);
}

.table-tab.active {
  background-color: var(--bg-gray);
  color: var(--primary-color);
  border-color: var(--primary-color);
  border-bottom-color: transparent;
}

.tab-close {
  width: 20px;
  height: 20px;
  font-size: var(--font-size-sm);
  color: var(--text-placeholder);
  background-color: transparent;
  border: none;
  border-radius: 50%;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all var(--transition-fast);
}

.tab-close:hover {
  background-color: rgba(248, 113, 113, 0.1);
  color: var(--danger-color);
}

.add-table-btn {
  width: 32px;
  height: 32px;
  font-size: var(--font-size-lg);
  font-weight: var(--font-weight-semibold);
  color: var(--text-secondary);
  background-color: var(--bg-gray);
  border: none;
  border-radius: var(--radius-md);
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all var(--transition-fast);
}

.add-table-btn:hover {
  background-color: rgba(22, 93, 255, 0.1);
  color: var(--primary-color);
}

/* 视图标签 */
.view-tabs {
  display: flex;
  flex-wrap: wrap;
  gap: var(--spacing-sm);
  padding: var(--spacing-sm) var(--spacing-md);
  background-color: var(--bg-white);
  border-bottom: 1px solid var(--border-color);
}

.view-tab {
  display: flex;
  align-items: center;
  gap: var(--spacing-xs);
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

.view-tab:hover {
  background-color: rgba(0, 0, 0, 0.05);
}

.view-tab.active {
  background-color: var(--primary-color);
  color: white;
}

.add-view-btn {
  padding: var(--spacing-xs) var(--spacing-md);
  font-size: var(--font-size-sm);
  font-weight: var(--font-weight-medium);
  color: var(--primary-color);
  background-color: transparent;
  border: 1px dashed var(--primary-color);
  border-radius: var(--radius-md);
  cursor: pointer;
  transition: all var(--transition-fast);
}

.add-view-btn:hover {
  background-color: var(--primary-light);
}

/* 内容区域 */
.content-area {
  flex: 1;
  overflow: hidden;
  margin: var(--spacing-md);
  background-color: var(--bg-white);
  border-radius: var(--radius-lg);
  box-shadow: var(--shadow-sm);
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

.form-group {
  margin-bottom: var(--spacing-md);
}

.form-group label {
  display: block;
  font-size: var(--font-size-sm);
  font-weight: var(--font-weight-medium);
  color: var(--text-primary);
  margin-bottom: var(--spacing-xs);
}

.form-input {
  width: 100%;
  padding: var(--spacing-xs) var(--spacing-sm);
  font-size: var(--font-size-sm);
  font-family: inherit;
  background-color: var(--bg-white);
  border: 1px solid var(--border-color);
  border-radius: var(--radius-md);
  transition: all var(--transition-fast);
  outline: none;
  box-sizing: border-box;
}

.form-input:focus {
  border-color: var(--primary-color);
  box-shadow: 0 0 0 3px var(--primary-light);
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

.btn-submit {
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

.btn-submit:hover {
  background-color: var(--primary-dark);
}

.backup-options {
  display: flex;
  gap: var(--spacing-sm);
  margin-bottom: var(--spacing-md);
}

.backup-btn {
  flex: 1;
  padding: var(--spacing-md);
  font-size: var(--font-size-sm);
  font-weight: var(--font-weight-medium);
  color: white;
  background-color: var(--primary-color);
  border: none;
  border-radius: var(--radius-md);
  cursor: pointer;
  transition: all var(--transition-fast);
}

.backup-btn:hover {
  background-color: var(--primary-dark);
}

.file-input {
  width: 100%;
  padding: var(--spacing-sm);
  font-size: var(--font-size-sm);
  background-color: var(--bg-gray);
  border: 1px solid var(--border-color);
  border-radius: var(--radius-md);
  cursor: pointer;
}

.backup-textarea {
  width: 100%;
  height: 180px;
  padding: var(--spacing-sm);
  font-size: var(--font-size-xs);
  font-family: 'Monaco', 'Consolas', monospace;
  background-color: var(--bg-gray);
  border: 1px solid var(--border-color);
  border-radius: var(--radius-md);
  resize: vertical;
  outline: none;
  box-sizing: border-box;
  margin-top: var(--spacing-sm);
  transition: all var(--transition-fast);
}

.backup-textarea:focus {
  border-color: var(--primary-color);
  box-shadow: 0 0 0 3px var(--primary-light);
}

.backup-textarea::placeholder {
  color: var(--text-placeholder);
}

/* 响应式设计 */
@media (max-width: 768px) {
  .sidebar {
    width: 60px;
    padding: var(--spacing-sm);
  }
  
  .sidebar-header {
    padding: var(--spacing-sm);
    text-align: center;
  }
  
  .app-title {
    font-size: var(--font-size-lg);
  }
  
  .main-header {
    padding: var(--spacing-sm);
    flex-wrap: wrap;
    gap: var(--spacing-sm);
  }
  
  .project-info h2 {
    font-size: var(--font-size-lg);
  }
  
  .view-tabs {
    gap: var(--spacing-xs);
    padding: var(--spacing-xs) var(--spacing-sm);
  }
  
  .view-tab {
    padding: var(--spacing-xs) var(--spacing-sm);
    font-size: var(--font-size-xs);
  }
  
  .add-view-btn {
    padding: var(--spacing-xs) var(--spacing-sm);
    font-size: var(--font-size-xs);
  }
  
  .content-area {
    margin: var(--spacing-sm);
  }
  
  .modal-content {
    width: 95vw;
    padding: var(--spacing-md);
  }
}

@media (max-width: 640px) {
  .table-tab span:last-child {
    display: none;
  }
  
  .add-table-btn {
    width: 28px;
    height: 28px;
  }
}
</style>