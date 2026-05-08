<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { ElTable, ElTableColumn, ElPagination, ElMessage, ElDialog, ElForm, ElFormItem, ElInput, ElSelect, ElOption, ElButton, ElTag } from 'element-plus'
import 'element-plus/dist/index.css'
import type { FormInstance } from 'element-plus'

// 员工类型定义
interface Employee {
  id: string
  姓名: string
  年龄: string
  性别: string
  入职日期: string
  技能: string
  createdAt: string
  updatedAt: string
}

// 组件属性
const props = defineProps<{
  tableId?: string
  apiUrl?: string
  apiPathSuffix?: string
}>()

// 默认配置
const tableId = ref(props.tableId || 'd43ed0d3d8f48e4ebe467128eb7a7259')
const baseApiUrl = ref(props.apiUrl || '/api/matrix-tables')

// 加载状态
const loading = ref(false)
// 分页配置
const currentPage = ref(1)
const pageSize = ref(5)
const total = ref(0)

// 员工数据
const employees = ref<Employee[]>([])
const employeesData = ref<Employee[]>([])

// 过滤条件
const filterForm = ref({
  姓名: '',
  性别: '',
  技能: ''
})

// 编辑对话框
const editDialogVisible = ref(false)
const currentEmployee = ref<Employee>({
  id: '',
  姓名: '',
  年龄: '',
  性别: '',
  入职日期: '',
  技能: '',
  createdAt: '',
  updatedAt: ''
})
// 编辑表单引用
const editFormRef = ref<FormInstance | null>(null)

// API调用函数
const fetchEmployeeData = async () => {
  loading.value = true
  
  try {
    // 开发环境下直接使用示例数据（条件编译，生产构建时会被移除）
    if (import.meta.env.DEV) {
      loadSampleData()
      return
    }
    
    const response = await fetch(`${baseApiUrl.value}/${tableId.value}?pageNum=${currentPage.value}&pageSize=${pageSize.value}`)
    
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`)
    }
    
    const data = await response.json()
    // 处理API返回数据
    employees.value = Array.isArray(data.data || data) ? data.data || data : []
    total.value = data.total || employees.value.length
    employeesData.value = [...employees.value]
  } catch (err) {
    console.error('获取数据失败，使用示例数据:', err)
    // 加载示例数据
    loadSampleData()
  } finally {
    loading.value = false
  }
}

// 加载示例数据
const loadSampleData = () => {
  employees.value = [
    {
      createdAt: "2025-12-17T02:18:00",
      技能: "javascript,c++,javascript",
      姓名: "吴十",
      id: "02553925e6e99ec80d75db34a824068a",
      年龄: "26",
      updatedAt: "2025-12-17T02:18:00",
      入职日期: "2023-05-31",
      性别: "female"
    },
    {
      createdAt: "2025-12-15T15:45:00",
      技能: "vue,react,typescript",
      姓名: "李四",
      id: "abcdef1234567890abcdef1234567890",
      年龄: "25",
      updatedAt: "2025-12-15T15:45:00",
      入职日期: "2023-08-20",
      性别: "female"
    },
    {
      createdAt: "2025-12-14T09:20:00",
      技能: "c#,asp.net,sql server",
      姓名: "王五",
      id: "def1234567890abcdef1234567890abc",
      年龄: "30",
      updatedAt: "2025-12-14T09:20:00",
      入职日期: "2021-11-10",
      性别: "male"
    },
    {
      createdAt: "2025-12-13T14:10:00",
      技能: "javascript,node.js,express",
      姓名: "赵六",
      id: "ef1234567890abcdef1234567890abcd",
      年龄: "27",
      updatedAt: "2025-12-13T14:10:00",
      入职日期: "2022-06-05",
      性别: "male"
    },
    {
      createdAt: "2025-12-12T11:30:00",
      技能: "html,css,javascript",
      姓名: "孙七",
      id: "f1234567890abcdef1234567890abcde",
      年龄: "24",
      updatedAt: "2025-12-12T11:30:00",
      入职日期: "2023-12-01",
      性别: "female"
    }
  ]
  total.value = employees.value.length
  employeesData.value = [...employees.value]
}

// 分页数据
const paginatedEmployees = computed(() => {
  const start = (currentPage.value - 1) * pageSize.value
  const end = start + pageSize.value
  return employeesData.value.slice(start, end)
})

// 过滤数据
const filterEmployees = () => {
  employeesData.value = employees.value.filter(employee => {
    let match = true
    
    if (filterForm.value.姓名) {
      match = match && employee.姓名.includes(filterForm.value.姓名)
    }
    
    if (filterForm.value.性别) {
      match = match && employee.性别 === filterForm.value.性别
    }
    
    if (filterForm.value.技能) {
      match = match && employee.技能.includes(filterForm.value.技能)
    }
    
    return match
  })
  
  total.value = employeesData.value.length
  currentPage.value = 1
}

// 重置过滤条件
const resetFilter = () => {
  filterForm.value = {
    姓名: '',
    性别: '',
    技能: ''
  }
  employeesData.value = [...employees.value]
  total.value = employeesData.value.length
  currentPage.value = 1
}

// 查看详情
const viewEmployee = (employee: Employee) => {
  currentEmployee.value = { ...employee }
  editDialogVisible.value = true
}

// 保存编辑
const saveEdit = () => {
  if (currentEmployee.value) {
    const index = employees.value.findIndex(emp => emp.id === currentEmployee.value?.id)
    if (index !== -1) {
      employees.value[index] = { ...currentEmployee.value }
      employeesData.value = [...employees.value]
      filterEmployees()
      ElMessage.success('编辑成功')
    }
  }
  editDialogVisible.value = false
}

// 分页变化
const handlePageChange = (page: number, size: number) => {
  if (size) {
    pageSize.value = size
  }
  currentPage.value = page
}

// 格式化日期
const formatDate = (dateStr: string) => {
  if (!dateStr) return ''
  const date = new Date(dateStr)
  return date.toLocaleString('zh-CN', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit'
  })
}

// 格式化技能标签
const formatSkills = (skills: string) => {
  if (!skills) return []
  return skills.split(',').map(skill => skill.trim()).filter(skill => skill)
}

// 生命周期钩子 - 组件挂载时获取数据
onMounted(() => {
  fetchEmployeeData()
})
</script>

<template>
  <div class="employee-multidimensional-table-container">
    <h2 class="table-title">员工多维信息表</h2>
    
    <!-- 过滤表单 -->
    <div class="filter-container">
      <el-form :model="filterForm" inline>
        <el-form-item label="姓名">
          <el-input v-model="filterForm.姓名" placeholder="输入姓名" clearable />
        </el-form-item>
        <el-form-item label="性别">
          <el-select v-model="filterForm.性别" placeholder="选择性别" clearable>
            <el-option label="男" value="male" />
            <el-option label="女" value="female" />
          </el-select>
        </el-form-item>
        <el-form-item label="技能">
          <el-input v-model="filterForm.技能" placeholder="输入技能" clearable />
        </el-form-item>
        <el-form-item>
          <el-button type="primary" @click="filterEmployees">查询</el-button>
          <el-button @click="resetFilter">重置</el-button>
        </el-form-item>
      </el-form>
    </div>
    
    <!-- 员工表格 -->
    <el-table
      v-loading="loading"
      :data="paginatedEmployees"
      stripe
      style="width: 100%"
      border
    >
      <el-table-column prop="姓名" label="姓名" min-width="100" />
      <el-table-column prop="性别" label="性别" min-width="80">
        <template #default="scope">
          <el-tag :type="scope.row.性别 === 'female' ? 'info' : 'success'">
            {{ scope.row.性别 === 'female' ? '女' : '男' }}
          </el-tag>
        </template>
      </el-table-column>
      <el-table-column prop="年龄" label="年龄" min-width="80" />
      <el-table-column prop="入职日期" label="入职日期" min-width="120">
        <template #default="scope">
          {{ formatDate(scope.row.入职日期) }}
        </template>
      </el-table-column>
      <el-table-column prop="技能" label="技能" min-width="200">
        <template #default="scope">
          <el-tag
            v-for="skill in formatSkills(scope.row.技能)"
            :key="skill"
            size="small"
            type="warning"
          >
            {{ skill }}
          </el-tag>
        </template>
      </el-table-column>
      <el-table-column prop="createdAt" label="创建时间" min-width="150">
        <template #default="scope">
          {{ formatDate(scope.row.createdAt) }}
        </template>
      </el-table-column>
      <el-table-column label="操作" fixed="right" min-width="100">
        <template #default="scope">
          <el-button size="small" @click="viewEmployee(scope.row)">详情</el-button>
        </template>
      </el-table-column>
    </el-table>
    
    <!-- 分页 -->
    <div class="pagination-container">
      <el-pagination
        v-model:current-page="currentPage"
        v-model:page-size="pageSize"
        :page-sizes="[5, 10, 20, 50]"
        :total="total"
        layout="total, sizes, prev, pager, next, jumper"
        @size-change="(size) => handlePageChange(1, size)"
        @current-change="(page) => handlePageChange(page, pageSize)"
      />
    </div>
    
    <!-- 编辑对话框 -->
    <el-dialog
      v-model="editDialogVisible"
      title="员工详情"
      width="50%"
    >
      <el-form
        ref="editFormRef"
        :model="currentEmployee"
        label-position="top"
      >
        <el-form-item label="姓名">
          <el-input v-model="currentEmployee.姓名" placeholder="输入姓名" />
        </el-form-item>
        <el-form-item label="性别">
          <el-select v-model="currentEmployee.性别" placeholder="选择性别">
            <el-option label="男" value="male" />
            <el-option label="女" value="female" />
          </el-select>
        </el-form-item>
        <el-form-item label="年龄">
          <el-input v-model="currentEmployee.年龄" placeholder="输入年龄" />
        </el-form-item>
        <el-form-item label="入职日期">
          <el-input v-model="currentEmployee.入职日期" placeholder="输入入职日期" />
        </el-form-item>
        <el-form-item label="技能">
          <el-input v-model="currentEmployee.技能" placeholder="输入技能，用逗号分隔" />
        </el-form-item>
      </el-form>
      <template #footer>
        <span class="dialog-footer">
          <el-button @click="editDialogVisible = false">取消</el-button>
          <el-button type="primary" @click="saveEdit">保存</el-button>
        </span>
      </template>
    </el-dialog>
  </div>
</template>

<style scoped>
.employee-multidimensional-table-container {
  max-width: 1200px;
  margin: 0 auto;
  padding: 20px;
  background-color: #f5f7fa;
  min-height: 100vh;
}

.table-title {
  color: #303133;
  font-size: 24px;
  margin-bottom: 20px;
  text-align: center;
  font-weight: bold;
}

.filter-container {
  background-color: #fff;
  padding: 15px;
  border-radius: 8px;
  box-shadow: 0 2px 12px 0 rgba(0, 0, 0, 0.1);
  margin-bottom: 20px;
}

.pagination-container {
  margin-top: 20px;
  text-align: right;
  padding: 15px;
  background-color: #fff;
  border-radius: 8px;
  box-shadow: 0 2px 12px 0 rgba(0, 0, 0, 0.1);
}

.el-table {
  background-color: #fff;
  border-radius: 8px;
  overflow: hidden;
  box-shadow: 0 2px 12px 0 rgba(0, 0, 0, 0.1);
}

.el-table__header-wrapper th {
  background-color: #f5f7fa;
  font-weight: bold;
  color: #303133;
}

.el-tag {
  margin-right: 5px;
  margin-bottom: 5px;
}
</style>
