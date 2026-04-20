# 多维表格可视化平台

## 项目简介

该项目为自研开源的轻量级多维表格可视化平台，支持表格数据编辑、字段类型配置、筛选排序、数据联动、视图切换等核心功能。项目采用Vue3 + TypeScript + 组件化架构，实现高可扩展表格引擎，支持行/列拖拽、虚拟滚动、单元格编辑、数据导出，可用于任务管理、数据清单、低代码平台等场景。

## 技术栈

- **前端框架**: Vue 3 + TypeScript
- **构建工具**: Vite
- **状态管理**: Pinia
- **路由管理**: Vue Router
- **HTTP请求**: Axios
- **UI组件**: 自定义组件 + Element Plus (可选)
- **拖拽功能**: vue-draggable-next
- **数据导出**: 内置CSV导出 + xlsx库(Excel导出)

## 核心功能

- **多维表格渲染**: 支持复杂数据结构的表格展示
- **单元格编辑**: 支持多种字段类型的编辑
- **字段类型管理**: 支持文本、数字、日期、选择、标签、布尔等多种字段类型
- **数据校验**: 内置数据验证规则
- **虚拟滚动**: 优化大数据量渲染性能
- **行/列拖拽**: 支持表格行和列的拖拽排序
- **搜索筛选**: 支持高级搜索和筛选功能
- **数据导出**: 支持导出为CSV和Excel格式
- **右键菜单**: 提供便捷的右键操作功能
- **分页加载**: 支持大数据量的分页加载

## 安装和运行

### 环境要求

- Node.js 16+ 
- npm 7+
- Git

### 安装步骤

1. 克隆项目

```bash
git clone https://github.com/your-username/multidimensional-table.git
cd multidimensional-table
```

2. 安装依赖

```bash
npm install
```

3. 启动开发服务器

```bash
npm run dev
```

4. 构建生产版本

```bash
npm run build
```

## 项目结构

```
├── src/
│   ├── components/          # 组件目录
│   │   ├── MultidimensionalTable.vue    # 核心多维表格组件
│   │   ├── TableController.vue          # 表格控制器组件
│   │   ├── SearchFilter.vue             # 搜索筛选组件
│   │   ├── ContextMenu.vue              # 右键菜单组件
│   │   └── DataExporter.vue             # 数据导出组件
│   ├── router/              # 路由配置
│   ├── store/               # Pinia状态管理
│   ├── types/               # TypeScript类型定义
│   ├── utils/               # 工具函数
│   ├── views/               # 页面视图
│   ├── App.vue              # 应用入口组件
│   └── main.ts              # 应用入口文件
├── public/                  # 静态资源
├── package.json             # 项目配置
├── tsconfig.json            # TypeScript配置
└── vite.config.ts           # Vite配置
```

## 使用示例

### 基本使用

```vue
<template>
  <MultidimensionalTable
    tableId="123456"
    apiUrl="/api/matrix-tables"
  />
</template>

<script setup lang="ts">
import MultidimensionalTable from './components/MultidimensionalTable.vue'
</script>
```

### 自定义配置

```vue
<template>
  <MultidimensionalTable
    tableId="123456"
    apiUrl="/api/matrix-tables"
    apiPathSuffix="/detailed"
  />
</template>
```

## API 接口

项目默认使用以下API接口格式：

- **获取表格数据**: `GET /api/matrix-tables/{tableId}`
- **更新表格数据**: `PUT /api/matrix-tables/{tableId}`
- **添加表格行**: `POST /api/matrix-tables/{tableId}/rows`
- **删除表格行**: `DELETE /api/matrix-tables/{tableId}/rows/{rowId}`

## 贡献指南

1. Fork 项目
2. 创建功能分支 (`git checkout -b feature/AmazingFeature`)
3. 提交更改 (`git commit -m 'Add some AmazingFeature'`)
4. 推送到分支 (`git push origin feature/AmazingFeature`)
5. 打开 Pull Request

## 许可证

本项目采用 MIT 许可证 - 详情请参阅 [LICENSE](LICENSE) 文件

## 联系方式

- 项目地址: [https://github.com/your-username/multidimensional-table](https://github.com/your-username/multidimensional-table)
- 问题反馈: [https://github.com/your-username/multidimensional-table/issues](https://github.com/your-username/multidimensional-table/issues)