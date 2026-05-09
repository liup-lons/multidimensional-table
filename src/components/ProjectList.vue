<template>
  <div class="project-list">
    <div class="project-list-header">
      <h2 class="title">项目列表</h2>
      <button class="btn-add" @click="showCreateModal = true">
        <span class="icon">+</span>
        新建项目
      </button>
    </div>

    <div class="project-search">
      <input
        type="text"
        v-model="searchKeyword"
        placeholder="搜索项目..."
        class="search-input"
      />
    </div>

    <div class="project-grid">
      <div
        v-for="project in filteredProjects"
        :key="project.id"
        class="project-card"
        :class="{ active: project.id === currentProjectId }"
        @click="selectProject(project.id)"
      >
        <div class="project-icon">📋</div>
        <div class="project-info">
          <h3 class="project-name">{{ project.name }}</h3>
          <p class="project-desc">{{ project.description || '暂无描述' }}</p>
          <div class="project-meta">
            <span class="meta-item">{{ project.tables.length }} 个表格</span>
            <span class="meta-item">{{ formatDate(project.updatedAt) }}</span>
          </div>
        </div>
        <div class="project-actions">
          <button class="action-btn" @click.stop="copyProject(project.id)">
            <span>复制</span>
          </button>
          <button class="action-btn" @click.stop="editProject(project)">
            <span>编辑</span>
          </button>
          <button class="action-btn delete" @click.stop="showDeleteConfirm(project)">
            <span>删除</span>
          </button>
        </div>
      </div>
    </div>

    <!-- 创建/编辑项目弹窗 -->
    <div v-if="showCreateModal" class="modal-overlay" @click.self="closeModal">
      <div class="modal-content">
        <h3>{{ editingProject ? '编辑项目' : '创建新项目' }}</h3>
        <form @submit.prevent="saveProject">
          <div class="form-group">
            <label>项目名称 *</label>
            <input
              type="text"
              v-model="projectForm.name"
              required
              placeholder="请输入项目名称"
              class="form-input"
            />
          </div>
          <div class="form-group">
            <label>项目描述</label>
            <textarea
              v-model="projectForm.description"
              placeholder="请输入项目描述（可选）"
              class="form-textarea"
            ></textarea>
          </div>
          <div class="form-actions">
            <button type="button" class="btn-cancel" @click="closeModal">取消</button>
            <button type="submit" class="btn-submit">
              {{ editingProject ? '保存修改' : '创建项目' }}
            </button>
          </div>
        </form>
      </div>
    </div>

    <!-- 删除确认弹窗 -->
    <div v-if="showDeleteModal" class="modal-overlay" @click.self="showDeleteModal = false">
      <div class="modal-content delete-modal">
        <h3>确认删除</h3>
        <p>确定要删除项目 "{{ deleteProjectName }}" 吗？此操作不可撤销，所有表格和数据将被永久删除。</p>
        <div class="form-actions">
          <button type="button" class="btn-cancel" @click="showDeleteModal = false">取消</button>
          <button type="button" class="btn-delete" @click="confirmDelete">删除</button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import { useTableStore } from '../store/table'
import type { Project } from '../types/table'

const store = useTableStore()

const searchKeyword = ref('')
const showCreateModal = ref(false)
const showDeleteModal = ref(false)
const editingProject = ref<Project | null>(null)
const deleteProjectId = ref('')
const deleteProjectName = ref('')

const projectForm = ref({
  name: '',
  description: ''
})

const filteredProjects = computed(() => {
  if (!searchKeyword.value) return store.projects
  const keyword = searchKeyword.value.toLowerCase()
  return store.projects.filter(
    project =>
      project.name.toLowerCase().includes(keyword) ||
      project.description?.toLowerCase().includes(keyword)
  )
})

const currentProjectId = computed(() => store.currentProject?.id || '')

const selectProject = (projectId: string) => {
  store.switchProject(projectId)
}

const editProject = (project: Project) => {
  editingProject.value = project
  projectForm.value = {
    name: project.name,
    description: project.description || ''
  }
  showCreateModal.value = true
}

const closeModal = () => {
  showCreateModal.value = false
  editingProject.value = null
  projectForm.value = { name: '', description: '' }
}

const saveProject = () => {
  if (editingProject.value) {
    store.updateProject(editingProject.value.id, {
      name: projectForm.value.name,
      description: projectForm.value.description
    })
  } else {
    store.createProject(projectForm.value.name, projectForm.value.description)
  }
  closeModal()
}

const showDeleteConfirm = (project: Project) => {
  deleteProjectId.value = project.id
  deleteProjectName.value = project.name
  showDeleteModal.value = true
}

const confirmDelete = () => {
  store.deleteProject(deleteProjectId.value)
  showDeleteModal.value = false
}

const copyProject = (projectId: string) => {
  store.copyProject(projectId)
}

const formatDate = (dateString: string) => {
  const date = new Date(dateString)
  return date.toLocaleDateString('zh-CN', {
    year: 'numeric',
    month: 'short',
    day: 'numeric'
  })
}
</script>

<style scoped>
.project-list {
  height: 100%;
  display: flex;
  flex-direction: column;
  background-color: var(--bg-white);
}

.project-list-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: var(--spacing-md);
  border-bottom: 1px solid var(--border-color);
}

.title {
  font-size: var(--font-size-xl);
  font-weight: var(--font-weight-semibold);
  color: var(--text-primary);
  margin: 0;
}

.btn-add {
  display: inline-flex;
  align-items: center;
  gap: var(--spacing-xs);
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

.btn-add:hover {
  background-color: var(--primary-dark);
}

.btn-add:active {
  transform: scale(0.98);
}

.icon {
  font-size: var(--font-size-lg);
}

.project-search {
  padding: var(--spacing-sm) var(--spacing-md);
}

.search-input {
  width: 100%;
  padding: var(--spacing-xs) var(--spacing-sm);
  font-size: var(--font-size-sm);
  font-family: inherit;
  background-color: var(--bg-gray);
  border: 1px solid var(--border-color);
  border-radius: var(--radius-md);
  transition: all var(--transition-fast);
  outline: none;
}

.search-input:focus {
  border-color: var(--primary-color);
  box-shadow: 0 0 0 3px var(--primary-light);
}

.search-input::placeholder {
  color: var(--text-placeholder);
}

.project-grid {
  flex: 1;
  overflow-y: auto;
  padding: var(--spacing-sm);
  display: flex;
  flex-direction: column;
  gap: var(--spacing-sm);
}

.project-card {
  display: flex;
  align-items: center;
  gap: var(--spacing-sm);
  padding: var(--spacing-sm);
  background-color: var(--bg-white);
  border-radius: var(--radius-md);
  cursor: pointer;
  border: 2px solid transparent;
  transition: all var(--transition-fast);
}

.project-card:hover {
  box-shadow: var(--shadow-md);
  background-color: rgba(22, 93, 255, 0.02);
}

.project-card.active {
  border-color: var(--primary-color);
  background-color: var(--primary-light);
}

.project-icon {
  font-size: 28px;
  width: 44px;
  height: 44px;
  display: flex;
  align-items: center;
  justify-content: center;
  background-color: rgba(22, 93, 255, 0.1);
  border-radius: var(--radius-md);
  flex-shrink: 0;
}

.project-info {
  flex: 1;
  min-width: 0;
}

.project-name {
  font-size: var(--font-size-sm);
  font-weight: var(--font-weight-semibold);
  color: var(--text-primary);
  margin: 0 0 var(--spacing-xs) 0;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.project-desc {
  font-size: var(--font-size-xs);
  color: var(--text-placeholder);
  margin: 0 0 var(--spacing-xs) 0;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.project-meta {
  display: flex;
  gap: var(--spacing-md);
}

.meta-item {
  font-size: var(--font-size-xs);
  color: var(--text-disabled);
}

.project-actions {
  display: flex;
  gap: var(--spacing-xs);
  opacity: 0;
  transition: opacity var(--transition-fast);
  flex-shrink: 0;
}

.project-card:hover .project-actions {
  opacity: 1;
}

.action-btn {
  padding: var(--spacing-xs) var(--spacing-sm);
  font-size: var(--font-size-xs);
  font-weight: var(--font-weight-medium);
  color: var(--text-secondary);
  background-color: transparent;
  border: 1px solid var(--border-color);
  border-radius: var(--radius-sm);
  cursor: pointer;
  transition: all var(--transition-fast);
}

.action-btn:hover {
  background-color: var(--bg-gray);
  border-color: var(--primary-color);
  color: var(--primary-color);
}

.action-btn.delete:hover {
  background-color: rgba(248, 113, 113, 0.1);
  border-color: var(--danger-color);
  color: var(--danger-color);
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

.form-input,
.form-textarea {
  width: 100%;
  padding: var(--spacing-xs) var(--spacing-sm);
  font-size: var(--font-size-sm);
  font-family: inherit;
  background-color: var(--bg-white);
  border: 1px solid var(--border-color);
  border-radius: var(--radius-md);
  transition: all var(--transition-fast);
  outline: none;
}

.form-input:focus,
.form-textarea:focus {
  border-color: var(--primary-color);
  box-shadow: 0 0 0 3px var(--primary-light);
}

.form-textarea {
  min-height: 100px;
  resize: vertical;
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

.btn-submit:active {
  transform: scale(0.98);
}

.delete-modal p {
  color: var(--text-secondary);
  line-height: var(--line-height);
  font-size: var(--font-size-sm);
}

.btn-delete {
  padding: var(--spacing-xs) var(--spacing-md);
  font-size: var(--font-size-sm);
  font-weight: var(--font-weight-medium);
  color: white;
  background-color: var(--danger-color);
  border: none;
  border-radius: var(--radius-md);
  cursor: pointer;
  transition: all var(--transition-fast);
}

.btn-delete:hover {
  background-color: #EF4444;
}

.btn-delete:active {
  transform: scale(0.98);
}

/* 响应式设计 */
@media (max-width: 768px) {
  .project-card {
    padding: var(--spacing-xs);
  }
  
  .project-icon {
    width: 36px;
    height: 36px;
    font-size: 24px;
  }
  
  .project-actions {
    opacity: 1;
  }
  
  .modal-content {
    width: 95vw;
    padding: var(--spacing-md);
  }
}
</style>