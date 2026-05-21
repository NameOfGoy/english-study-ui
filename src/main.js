import { createApp } from 'vue'
import App from './App.vue'
import router from './router'

import Vant from 'vant'
import 'vant/lib/index.css'

import '@vant/touch-emulator'

import '@/styles/index.scss'

const app = createApp(App)
app.use(router)
app.use(Vant)
app.mount('#app')
