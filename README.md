# 多维表格可视化平台

## 项目简介

该项目为自研开源的轻量级多维表格可视化平台，支持表格数据编辑、字段类型配置、筛选排序、数据联动、多视图切换等核心功能。项目采用 Vue3 + TypeScript + Tailwind CSS 架构，实现高可扩展表格引擎，支持行/列拖拽、虚拟滚动、单元格编辑、数据导出，界面风格贴近飞书多维表视觉规范。

## 技术栈

- **前端框架**: Vue 3 + TypeScript
- **构建工具**: Vite
- **状态管理**: Pinia
- **样式方案**: Tailwind CSS 3 + 自定义CSS变量
- **拖拽功能**: vue-draggable-next
- **图标库**: Lucide Vue

## 核心功能

### 视图类型
- **表格视图**: 支持复杂数据结构的表格展示，斑马纹行背景，表头固定
- **看板视图**: 按字段分组展示卡片，支持拖拽排序，卡片hover效果
- **日历视图**: 日/周/月视图切换，事件卡片展示，日期选中高亮
- **甘特视图**: 时间轴展示，甘特条拖拽，时间范围缩放

### 表格功能
- **单元格编辑**: 支持多种字段类型的编辑
- **字段类型管理**: 支持文本、数字、日期、选择、标签、布尔等多种字段类型
- **数据校验**: 内置数据验证规则
- **虚拟滚动**: 优化大数据量渲染性能
- **行/列拖拽**: 支持表格行和列的拖拽排序
- **搜索筛选**: 支持高级搜索和筛选功能
- **数据导出**: 支持导出为JSON备份格式
- **右键菜单**: 提供便捷的右键操作功能

### 视觉风格
- 飞书多维表视觉风格，清爽简约
- 主色 #165DFF，完善的配色体系
- 统一的圆角、间距、字体规范
- 响应式适配，支持移动端

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
│   │   ├── TableView.vue          # 表格视图组件
│   │   ├── KanbanView.vue         # 看板视图组件
│   │   ├── CalendarView.vue       # 日历视图组件
│   │   ├── GanttView.vue          # 甘特视图组件
│   │   └── ProjectList.vue        # 项目列表组件
│   ├── store/               # Pinia状态管理
│   │   └── table.ts               # 表格数据状态管理
│   ├── types/               # TypeScript类型定义
│   │   └── table.ts               # 表格相关类型定义
│   ├── utils/               # 工具函数
│   │   └── index.ts               # 通用工具函数
│   ├── views/               # 页面视图
│   │   └── Home.vue               # 首页视图
│   ├── App.vue              # 应用入口组件
│   ├── main.ts              # 应用入口文件
│   └── style.css            # 全局样式和主题变量
├── public/                  # 静态资源
├── index.html               # HTML模板
├── package.json             # 项目配置
├── tsconfig.json            # TypeScript配置
├── vite.config.ts           # Vite配置
└── tailwind.config.js       # Tailwind CSS配置
```

## 使用说明

### 创建项目

1. 点击左侧"新建项目"按钮
2. 输入项目名称和描述
3. 点击"创建项目"完成

### 创建表格

1. 选择项目后，点击上方"+"按钮
2. 输入表格名称
3. 点击"创建"完成

### 创建视图

1. 在表格页面，点击"+ 添加视图"按钮
2. 输入视图名称
3. 选择视图类型（表格/看板/日历/甘特）
4. 点击"创建"完成

### 数据备份

1. 在项目页面，点击右上角"备份数据"按钮
2. 选择"导出备份"下载JSON文件
3. 选择"导入备份"恢复数据

## 主题变量规范

项目使用 CSS 变量实现主题统一：

```css
:root {
  /* 主色调 */
  --primary-color: #165DFF;
  --primary-light: #E8F3FF;
  --primary-dark: #094FC4;
  
  /* 辅助色 */
  --success-color: #36D399;
  --warning-color: #FBBD23;
  --danger-color: #F87171;
  
  /* 中性色 */
  --bg-white: #FFFFFF;
  --bg-gray: #F5F7FA;
  --border-color: #E5E6EB;
  --text-primary: #1D2129;
  --text-secondary: #4E5969;
  --text-placeholder: #86909C;
  
  /* 圆角规范 */
  --radius-sm: 4px;
  --radius-md: 8px;
  --radius-lg: 12px;
  
  /* 间距规范 */
  --spacing-xs: 4px;
  --spacing-sm: 8px;
  --spacing-md: 16px;
  --spacing-lg: 24px;
}
```

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
