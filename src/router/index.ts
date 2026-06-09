import { createRouter, createWebHistory } from 'vue-router'

const routes = [
  // 主应用布局（包含侧边栏和表格功能）
  {
    path: '/',
    name: 'App',
    component: () => import('../views/AppLayout.vue'),
    children: [
      {
        path: '',
        name: 'Workspace',
        component: () => import('../views/WorkspaceView.vue')
      }
    ]
  },
  // GIS 地图视图
  {
    path: '/gis',
    name: 'GIS',
    component: () => import('../views/GISView.vue')
  },
  // 首页（介绍页面）
  {
    path: '/home',
    name: 'Home',
    component: () => import('../views/Home.vue')
  }
]

const router = createRouter({
  history: createWebHistory(),
  routes
})

export default router