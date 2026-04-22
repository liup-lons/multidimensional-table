<script setup lang="ts">

</script>

<template>
  <div class="app-container">
    <header class="app-header">
      <h1>多维表格可视化平台</h1>
      <nav>
        <router-link to="/">首页</router-link>
        <router-link to="/examples">示例展示</router-link>
        <router-link to="/table/d43ed0d3d8f48e4ebe467128eb7a7259">示例表格</router-link>
      </nav>
    </header>
    
    <main class="app-main">
      <router-view />
    </main>
    
    <footer class="app-footer">
      <p>© 2026 多维表格可视化平台 | 开源项目</p>
    </footer>
  </div>
</template>

<style scoped>
.app-container {
  display: flex;
  flex-direction: column;
  min-height: 100vh;
  font-family: Arial, sans-serif;
}

.app-header {
  background-color: #1890ff;
  color: white;
  padding: 1rem 2rem;
  display: flex;
  justify-content: space-between;
  align-items: center;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.15);
}

.app-header h1 {
  margin: 0;
  font-size: 1.5rem;
}

nav {
  display: flex;
  gap: 1rem;
}

nav a {
  color: white;
  text-decoration: none;
  padding: 0.5rem 1rem;
  border-radius: 4px;
  transition: background-color 0.3s;
}

nav a:hover {
  background-color: rgba(255, 255, 255, 0.1);
}

.app-main {
  flex: 1;
  padding: 2rem;
  background-color: #f5f7fa;
}

.app-footer {
  background-color: #f0f2f5;
  padding: 1rem;
  text-align: center;
  border-top: 1px solid #e8e8e8;
  color: #666;
}
</style>