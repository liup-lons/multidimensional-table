<script setup lang="ts">

</script>

<template>
  <div class="home-container">
    <div class="hero-section">
      <h2>欢迎使用多维表格可视化平台</h2>
      <p>一个轻量级、高性能的开源表格解决方案</p>
      <div class="hero-buttons">
        <router-link to="/examples" class="btn-primary">
          查看示例展示
        </router-link>
        <router-link to="/table/d43ed0d3d8f48e4ebe467128eb7a7259" class="btn-secondary">
          查看示例表格
        </router-link>
      </div>
    </div>
    
    <div class="features-section">
      <h3>核心功能</h3>
      <div class="features-grid">
        <div class="feature-card">
          <h4>多维数据展示</h4>
          <p>支持多维度数据的灵活展示和分析</p>
        </div>
        <div class="feature-card">
          <h4>实时编辑</h4>
          <p>单元格级别的实时编辑和数据验证</p>
        </div>
        <div class="feature-card">
          <h4>字段类型管理</h4>
          <p>支持多种字段类型，包括文本、数字、日期、选择等</p>
        </div>
        <div class="feature-card">
          <h4>数据导出</h4>
          <p>支持将表格数据导出为Excel、CSV等格式</p>
        </div>
        <div class="feature-card">
          <h4>虚拟滚动</h4>
          <p>优化大数据量渲染性能，确保流畅操作</p>
        </div>
        <div class="feature-card">
          <h4>拖拽功能</h4>
          <p>支持行/列拖拽，灵活调整表格结构</p>
        </div>
      </div>
    </div>
    
    <div class="tech-stack-section">
      <h3>技术栈</h3>
      <div class="tech-grid">
        <span class="tech-tag">Vue 3</span>
        <span class="tech-tag">TypeScript</span>
        <span class="tech-tag">Pinia</span>
        <span class="tech-tag">Vue Router</span>
        <span class="tech-tag">Axios</span>
        <span class="tech-tag">Vite</span>
        <span class="tech-tag">Element Plus</span>
      </div>
    </div>
  </div>
</template>

<style scoped>
.home-container {
  max-width: 1200px;
  margin: 0 auto;
}

.hero-section {
  text-align: center;
  padding: 4rem 0;
  background-color: white;
  border-radius: 8px;
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.1);
  margin-bottom: 2rem;
}

.hero-section h2 {
  font-size: 2.5rem;
  margin-bottom: 1rem;
  color: #303133;
}

.hero-section p {
  font-size: 1.2rem;
  margin-bottom: 2rem;
  color: #606266;
}

.hero-buttons {
  display: flex;
  gap: 1rem;
  justify-content: center;
}

.btn-primary {
  display: inline-block;
  background-color: #1890ff;
  color: white;
  padding: 0.8rem 2rem;
  border-radius: 4px;
  text-decoration: none;
  font-size: 1rem;
  transition: background-color 0.3s;
}

.btn-primary:hover {
  background-color: #40a9ff;
}

.btn-secondary {
  display: inline-block;
  background-color: white;
  color: #1890ff;
  border: 2px solid #1890ff;
  padding: 0.8rem 2rem;
  border-radius: 4px;
  text-decoration: none;
  font-size: 1rem;
  transition: all 0.3s;
}

.btn-secondary:hover {
  background-color: #1890ff;
  color: white;
}

.features-section {
  margin-bottom: 2rem;
}

.features-section h3 {
  font-size: 1.8rem;
  margin-bottom: 1.5rem;
  color: #303133;
  text-align: center;
}

.features-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
  gap: 1.5rem;
}

.feature-card {
  background-color: white;
  padding: 1.5rem;
  border-radius: 8px;
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.1);
  transition: transform 0.3s, box-shadow 0.3s;
}

.feature-card:hover {
  transform: translateY(-5px);
  box-shadow: 0 5px 20px rgba(0, 0, 0, 0.15);
}

.feature-card h4 {
  font-size: 1.2rem;
  margin-bottom: 0.5rem;
  color: #303133;
}

.feature-card p {
  color: #606266;
  line-height: 1.5;
}

.tech-stack-section {
  background-color: white;
  padding: 2rem;
  border-radius: 8px;
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.1);
}

.tech-stack-section h3 {
  font-size: 1.8rem;
  margin-bottom: 1.5rem;
  color: #303133;
  text-align: center;
}

.tech-grid {
  display: flex;
  flex-wrap: wrap;
  gap: 1rem;
  justify-content: center;
}

.tech-tag {
  background-color: #f0f2f5;
  padding: 0.5rem 1rem;
  border-radius: 20px;
  font-size: 0.9rem;
  color: #303133;
}
</style>