import { createRouter, createWebHistory } from 'vue-router'

const routes = [
  {
    path: '/',
    name: 'Home',
    component: () => import('../views/Home.vue')
  },
  {
    path: '/examples',
    name: 'Examples',
    component: () => import('../components/HelloWorld.vue')
  },
  {
    path: '/table/:id',
    name: 'Table',
    component: () => import('../components/MultidimensionalTable.vue'),
    props: true
  }
]

const router = createRouter({
  history: createWebHistory(),
  routes
})

export default router