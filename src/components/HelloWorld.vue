<script setup lang="ts">
import { ref } from 'vue'
import MultidimensionalTable from './MultidimensionalTable.vue'
import EmployeeMultidimensionalTable from './EmployeeMultidimensionalTable.vue'

// 直接设置标题，不依赖路由props
const pageTitle = ref('多维表示例展示')

const activeTab = ref('basic')
const tabs = [
  { id: 'basic', label: '基础示例' },
  { id: 'employee', label: '员工数据' },
  { id: 'custom', label: '自定义数据' }
]

// 示例数据
const sampleTableData = {
  tableId: 'sample-demo',
  name: '产品销售数据',
  fieldDefinitions: [
    { fieldName: 'product', fieldType: 'text', fieldLabel: '产品名称', required: true },
    { fieldName: 'quantity', fieldType: 'number', fieldLabel: '销售数量', validation: { min: 0 } },
    { fieldName: 'price', fieldType: 'number', fieldLabel: '单价', validation: { min: 0 } },
    { fieldName: 'region', fieldType: 'select', fieldLabel: '地区', options: ['华东', '华南', '华北', '西南', '西北'] },
    { fieldName: 'date', fieldType: 'date', fieldLabel: '销售日期' },
    { fieldName: 'status', fieldType: 'boolean', fieldLabel: '已发货' }
  ],
  data: [
    { id: '1', product: '笔记本电脑', quantity: 100, price: 5999, region: '华东', date: '2024-01-15', status: true },
    { id: '2', product: '无线鼠标', quantity: 500, price: 99, region: '华南', date: '2024-01-16', status: true },
    { id: '3', product: '机械键盘', quantity: 200, price: 399, region: '华北', date: '2024-01-17', status: false },
    { id: '4', product: '显示器', quantity: 80, price: 1299, region: '西南', date: '2024-01-18', status: true },
    { id: '5', product: '耳机', quantity: 300, price: 199, region: '华东', date: '2024-01-19', status: true }
  ]
}
</script>

<template>
  <div class="examples-container">
    <h1>{{ pageTitle }}</h1>
    
    <!-- 标签页导航 -->
    <div class="tabs-nav">
      <button 
        v-for="tab in tabs" 
        :key="tab.id"
        :class="['tab-btn', { active: activeTab === tab.id }]"
        @click="activeTab = tab.id"
      >
        {{ tab.label }}
      </button>
    </div>

    <!-- 基础示例 -->
    <div v-show="activeTab === 'basic'" class="tab-content">
      <div class="section-title">
        <h2>基础多维表示例</h2>
        <p>展示多维表的核心功能，包括数据展示、编辑、筛选等</p>
      </div>
      <MultidimensionalTable tableId="sample-table" />
    </div>

    <!-- 员工数据示例 -->
    <div v-show="activeTab === 'employee'" class="tab-content">
      <div class="section-title">
        <h2>员工数据管理</h2>
        <p>使用真实API接口获取和展示员工数据</p>
      </div>
      <EmployeeMultidimensionalTable />
    </div>

    <!-- 自定义数据示例 -->
    <div v-show="activeTab === 'custom'" class="tab-content">
      <div class="section-title">
        <h2>产品销售数据</h2>
        <p>自定义字段和数据的示例，展示不同字段类型的使用</p>
      </div>
      
      <!-- 自定义数据展示 -->
      <div class="custom-data-section">
        <div class="data-summary">
          <div class="stat-card">
            <div class="stat-value">{{ sampleTableData.data.length }}</div>
            <div class="stat-label">数据条数</div>
          </div>
          <div class="stat-card">
            <div class="stat-value">{{ sampleTableData.fieldDefinitions.length }}</div>
            <div class="stat-label">字段数量</div>
          </div>
          <div class="stat-card">
            <div class="stat-value">{{ sampleTableData.data.filter(d => d.status).length }}</div>
            <div class="stat-label">已发货</div>
          </div>
        </div>

        <div class="field-preview">
          <h3>字段定义</h3>
          <div class="field-list">
            <div v-for="field in sampleTableData.fieldDefinitions" :key="field.fieldName" class="field-item">
              <span class="field-name">{{ field.fieldLabel }}</span>
              <span class="field-badge">{{ field.fieldType }}</span>
              <span v-if="field.required" class="field-badge required">必填</span>
            </div>
          </div>
        </div>

        <div class="data-preview">
          <h3>数据预览</h3>
          <div class="table-wrapper">
            <table class="preview-table">
              <thead>
                <tr>
                  <th v-for="field in sampleTableData.fieldDefinitions" :key="field.fieldName">
                    {{ field.fieldLabel }}
                  </th>
                </tr>
              </thead>
              <tbody>
                <tr v-for="row in sampleTableData.data" :key="row.id">
                  <td v-for="field in sampleTableData.fieldDefinitions" :key="field.fieldName">
                    <template v-if="field.fieldType === 'boolean'">
                      {{ (row as Record<string, any>)[field.fieldName] ? '✅' : '❌' }}
                    </template>
                    <template v-else-if="field.fieldType === 'select'">
                      <span class="select-tag">{{ (row as Record<string, any>)[field.fieldName] }}</span>
                    </template>
                    <template v-else>
                      {{ (row as Record<string, any>)[field.fieldName] }}
                    </template>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.examples-container {
  max-width: 1400px;
  margin: 0 auto;
  padding: 2rem;
}

h1 {
  text-align: center;
  color: #303133;
  margin-bottom: 2rem;
  font-size: 2.5rem;
}

.tabs-nav {
  display: flex;
  gap: 0.5rem;
  margin-bottom: 2rem;
  border-bottom: 2px solid #e0e0e0;
}

.tab-btn {
  padding: 0.8rem 1.5rem;
  border: none;
  background: none;
  font-size: 1rem;
  cursor: pointer;
  color: #606266;
  border-bottom: 3px solid transparent;
  margin-bottom: -2px;
  transition: all 0.3s;
}

.tab-btn:hover {
  color: #1890ff;
}

.tab-btn.active {
  color: #1890ff;
  border-bottom-color: #1890ff;
  font-weight: 600;
}

.tab-content {
  animation: fadeIn 0.3s ease-in-out;
}

@keyframes fadeIn {
  from {
    opacity: 0;
    transform: translateY(10px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

.section-title {
  text-align: center;
  margin-bottom: 2rem;
}

.section-title h2 {
  color: #303133;
  margin-bottom: 0.5rem;
  font-size: 1.8rem;
}

.section-title p {
  color: #606266;
  font-size: 1rem;
}

.custom-data-section {
  background: white;
  border-radius: 8px;
  padding: 2rem;
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.1);
}

.data-summary {
  display: flex;
  gap: 2rem;
  margin-bottom: 2rem;
  justify-content: center;
}

.stat-card {
  text-align: center;
  padding: 1.5rem 2.5rem;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  border-radius: 12px;
  color: white;
  min-width: 150px;
}

.stat-value {
  font-size: 2.5rem;
  font-weight: bold;
  margin-bottom: 0.5rem;
}

.stat-label {
  font-size: 0.9rem;
  opacity: 0.9;
}

.field-preview,
.data-preview {
  margin-bottom: 2rem;
}

.field-preview h3,
.data-preview h3 {
  color: #303133;
  margin-bottom: 1rem;
  font-size: 1.2rem;
}

.field-list {
  display: flex;
  flex-wrap: wrap;
  gap: 0.8rem;
}

.field-item {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.5rem 1rem;
  background: #f5f7fa;
  border-radius: 20px;
}

.field-name {
  font-weight: 500;
  color: #303133;
}

.field-badge {
  font-size: 0.8rem;
  padding: 0.2rem 0.6rem;
  border-radius: 10px;
  background: #e6f7ff;
  color: #1890ff;
}

.field-badge.required {
  background: #fff1f0;
  color: #ff4d4f;
}

.table-wrapper {
  overflow-x: auto;
  border: 1px solid #e0e0e0;
  border-radius: 8px;
}

.preview-table {
  width: 100%;
  border-collapse: collapse;
}

.preview-table th,
.preview-table td {
  padding: 12px;
  text-align: left;
  border-bottom: 1px solid #e0e0e0;
}

.preview-table th {
  background: #f8f9fa;
  font-weight: 600;
  color: #303133;
}

.preview-table tbody tr:hover {
  background: #f5f7fa;
}

.select-tag {
  display: inline-block;
  padding: 0.2rem 0.6rem;
  background: #e6f7ff;
  color: #1890ff;
  border-radius: 4px;
  font-size: 0.9rem;
}

.usage-guide {
  margin-top: 3rem;
  padding: 2rem;
  background: white;
  border-radius: 8px;
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.1);
}

.usage-guide h2 {
  text-align: center;
  color: #303133;
  margin-bottom: 2rem;
  font-size: 1.8rem;
}

.guide-steps {
  display: flex;
  flex-direction: column;
  gap: 2rem;
}

.step {
  display: flex;
  gap: 1.5rem;
  align-items: flex-start;
}

.step-number {
  width: 50px;
  height: 50px;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 1.5rem;
  font-weight: bold;
  flex-shrink: 0;
}

.step-content h3 {
  color: #303133;
  margin-bottom: 0.5rem;
  font-size: 1.2rem;
}

.step-content p {
  color: #606266;
  margin-bottom: 1rem;
}

.code-block {
  background: #1e1e1e;
  color: #d4d4d4;
  padding: 1rem;
  border-radius: 6px;
  font-family: 'Consolas', 'Monaco', monospace;
  font-size: 0.9rem;
  overflow-x: auto;
}

.code-block code {
  display: block;
}

@media (max-width: 768px) {
  .examples-container {
    padding: 1rem;
  }
  
  h1 {
    font-size: 1.8rem;
  }
  
  .tabs-nav {
    flex-wrap: wrap;
  }
  
  .data-summary {
    flex-direction: column;
    gap: 1rem;
  }
  
  .step {
    flex-direction: column;
  }
}
</style>
