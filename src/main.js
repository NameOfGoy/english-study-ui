import { createApp } from 'vue'
import App from './App.vue'
import router from './router'

// 引入Vant组件库
import Vant from 'vant'
import 'vant/lib/index.css'

// 引入移动端触摸模拟器
import '@vant/touch-emulator'

// 引入全局样式
import '@/styles/index.scss'

// 创建Vue应用实例
const app = createApp(App)

// 使用插件
app.use(router)
app.use(Vant)

// 挂载应用
app.mount('#app')