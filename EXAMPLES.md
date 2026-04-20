# 使用示例

本文件提供了多维表格组件的详细使用示例，帮助开发者快速上手。

## 基本使用

### 1. 安装依赖

```bash
npm install
```

### 2. 导入组件

```vue
<template>
  <div class="app">
    <h1>多维表格示例</h1>
    <MultidimensionalTable
      tableId="8d2dfda3b49e699cf0dba2c5457cccd8"
      apiUrl="/api/matrix-tables"
    />
  </div>
</template>

<script setup lang="ts">
import MultidimensionalTable from './components/MultidimensionalTable.vue'
</script>

<style scoped>
.app {
  padding: 20px;
  max-width: 1200px;
  margin: 0 auto;
}

h1 {
  color: #303133;
  margin-bottom: 30px;
}
</style>
```

## 高级配置

### 1. 自定义API路径

```vue
<template>
  <MultidimensionalTable
    tableId="123456"
    apiUrl="https://api.example.com/matrix-tables"
    apiPathSuffix="/detailed"
  />
</template>
```

### 2. 集成其他组件

```vue
<template>
  <div class="table-page">
    <TableController
      title="员工数据表格"
      :show-export="true"
      :show-search="true"
      :show-refresh="true"
      :show-settings="true"
      :loading="loading"
      @search="handleSearch"
      @refresh="handleRefresh"
      @export="handleExport"
      @settings="handleSettings"
    />
    
    <SearchFilter
      :fields="fieldDefinitions"
      :show-advanced="true"
      @filter="handleFilter"
      @reset="handleReset"
    />
    
    <MultidimensionalTable
      tableId="employees"
      apiUrl="/api/matrix-tables"
      @load="handleTableLoad"
    />
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import MultidimensionalTable from './components/MultidimensionalTable.vue'
import TableController from './components/TableController.vue'
import SearchFilter from './components/SearchFilter.vue'

const loading = ref(false)
const fieldDefinitions = ref([
  { fieldName: 'name', fieldLabel: '姓名', fieldType: 'text' },
  { fieldName: 'age', fieldLabel: '年龄', fieldType: 'number' },
  { fieldName: 'department', fieldLabel: '部门', fieldType: 'select', options: ['技术部', '市场部', '人力资源部'] },
  { fieldName: 'hireDate', fieldLabel: '入职日期', fieldType: 'date' },
  { fieldName: 'active', fieldLabel: '在职', fieldType: 'boolean' }
])

const handleSearch = (keyword: string) => {
  console.log('搜索关键词:', keyword)
  // 实现搜索逻辑
}

const handleFilter = (filters: any) => {
  console.log('筛选条件:', filters)
  // 实现筛选逻辑
}

const handleRefresh = () => {
  console.log('刷新数据')
  // 刷新表格数据
}

const handleExport = (format: 'csv' | 'excel') => {
  console.log('导出格式:', format)
  // 实现导出逻辑
}

const handleSettings = () => {
  console.log('打开设置')
  // 打开设置面板
}

const handleReset = () => {
  console.log('重置筛选')
  // 重置筛选条件
}

const handleTableLoad = (data: any) => {
  console.log('表格数据加载完成:', data)
  // 处理表格加载完成事件
}
</script>

<style scoped>
.table-page {
  padding: 20px;
  max-width: 1200px;
  margin: 0 auto;
}
</style>
```

## 自定义主题

### 1. 全局样式覆盖

在 `src/style.css` 文件中添加自定义样式：

```css
/* 自定义表格样式 */
.multidimensional-table-container {
  font-family: 'Arial', sans-serif;
}

.data-table {
  border-collapse: collapse;
  width: 100%;
  margin-top: 20px;
}

.data-table th {
  background-color: #f5f7fa;
  color: #303133;
  font-weight: bold;
  text-align: left;
  padding: 12px;
  border-bottom: 2px solid #e0e0e0;
}

.data-table td {
  padding: 10px;
  border-bottom: 1px solid #e0e0e0;
}

.data-table tr:hover {
  background-color: #f5f7fa;
}

/* 自定义按钮样式 */
.action-button {
  border-radius: 6px;
  font-weight: 500;
}

.action-button:hover {
  transform: translateY(-1px);
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
}
```

### 2. 组件级样式

```vue
<template>
  <MultidimensionalTable
    tableId="123456"
    apiUrl="/api/matrix-tables"
    class="custom-table"
  />
</template>

<style scoped>
.custom-table :deep(.data-table) {
  border: 1px solid #dcdfe6;
  border-radius: 4px;
  overflow: hidden;
}

.custom-table :deep(.data-table th) {
  background-color: #409eff;
  color: white;
}

.custom-table :deep(.data-cell:hover) {
  background-color: #ecf5ff;
}
</style>
```

## 响应式设计

### 1. 适配不同屏幕尺寸

```vue
<template>
  <div class="responsive-container">
    <MultidimensionalTable
      tableId="123456"
      apiUrl="/api/matrix-tables"
    />
  </div>
</template>

<style scoped>
.responsive-container {
  width: 100%;
  overflow-x: auto;
}

@media (max-width: 768px) {
  .responsive-container {
    padding: 10px;
  }
}
</style>
```

## 性能优化

### 1. 大数据量处理

对于大数据量的表格，可以通过以下方式优化性能：

- 使用虚拟滚动（已内置）
- 启用分页加载
- 减少不必要的计算和渲染
- 使用防抖和节流优化事件处理

### 2. 缓存策略

```vue
<template>
  <MultidimensionalTable
    tableId="123456"
    apiUrl="/api/matrix-tables"
  />
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import MultidimensionalTable from './components/MultidimensionalTable.vue'
import { storageUtils } from './utils'

// 缓存表格数据
const cachedData = storageUtils.get('table_123456')
if (cachedData) {
  // 使用缓存数据
  console.log('使用缓存数据')
}

onMounted(() => {
  // 监听表格数据变化，更新缓存
  // 这里需要根据实际情况实现
})
</script>
```

## 常见问题

### 1. API 接口调用失败

- 检查 API 地址是否正确
- 确保后端服务正常运行
- 检查网络连接
- 查看浏览器控制台的错误信息

### 2. 表格数据不显示

- 检查 tableId 是否正确
- 确认 API 返回的数据格式正确
- 检查字段定义是否匹配
- 查看浏览器控制台的错误信息

### 3. 编辑功能不工作

- 检查字段类型是否支持编辑
- 确保 API 有更新数据的权限
- 查看浏览器控制台的错误信息

### 4. 性能问题

- 对于大数据量，启用虚拟滚动和分页加载
- 减少不必要的计算和渲染
- 优化事件处理，使用防抖和节流
- 考虑使用 WebWorker 处理复杂计算