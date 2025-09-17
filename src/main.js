import { createApp } from 'vue'
import App from './App.vue'
import router from './router'

// 全局调试信息
console.log('🔥 main.js 开始执行', new Date().toLocaleTimeString())

// 引入Vant组件库
import Vant from 'vant'
import 'vant/lib/index.css'

// 引入移动端触摸模拟器
import '@vant/touch-emulator'

// 引入全局样式
import '@/styles/index.scss'

console.log('📦 所有依赖加载完成')

// 创建Vue应用实例
const app = createApp(App)
console.log('🎯 Vue应用实例创建完成')

// 使用插件
app.use(router)
app.use(Vant)
console.log('🔌 插件注册完成')

// 挂载应用
app.mount('#app')
console.log('🚀 应用挂载完成')