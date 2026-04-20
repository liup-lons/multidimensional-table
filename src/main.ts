import { createApp } from 'vue'
import { createPinia } from 'pinia'
import router from './router'
import axios from 'axios'
import './style.css'
import App from './App.vue'

// 创建应用实例
const app = createApp(App)

// 集成Pinia
app.use(createPinia())

// 集成Vue Router
app.use(router)

// 配置Axios
app.config.globalProperties.$axios = axios

// 挂载应用
app.mount('#app')