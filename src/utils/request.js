import axios from 'axios'
import { showToast } from 'vant'
import router from '@/router'
import { getToken, removeToken } from '@/utils/auth'

// 获取当前浏览器的host地址
const getBaseURL = () => {
  if (typeof window !== 'undefined') {
    // 浏览器环境，使用当前页面的host
    return `${window.location.protocol}//${window.location.host}/api`
  }
  // 非浏览器环境（如SSR），使用默认地址
  return '/api'
}

// 创建axios实例
const request = axios.create({
  baseURL: getBaseURL(),
  headers: {
    'Content-Type': 'application/json'
  }
})

// 请求拦截器
request.interceptors.request.use(
  config => {
    // 添加token到请求头
    const token = getToken()
    if (token) {
      config.headers.Authorization = `Bearer ${token}`
    }
    return config
  },
  error => {
    console.error('请求错误:', error)
    return Promise.reject(error)
  }
)

// 响应拦截器
request.interceptors.response.use(
  response => {
    const { data } = response
    
    // 如果是文件下载等特殊情况，直接返回
    if (response.config.responseType === 'blob') {
      return response
    }
    
    // 业务成功
    if (data.code === 0) {
      return data
    }
    
    // 业务失败，显示错误信息
    if (data.message) {
      showToast({
        message: data.message,
        type: 'fail'
      })
    }
    
    return Promise.reject(new Error(data.message || '请求失败'))
  },
  error => {
    console.error('响应错误:', error)
    
    // 401未授权，清除token并跳转到登录页
    if (error.response?.status === 401) {
      removeToken()
      router.push('/login')
      showToast({
        message: '登录已过期，请重新登录',
        type: 'fail'
      })
      return Promise.reject(error)
    }
    
    // 网络错误或其他错误
    const message = error.response?.data?.message || error.message || '网络错误'
    showToast({
      message,
      type: 'fail'
    })
    
    return Promise.reject(error)
  }
)

// 创建资源请求实例（不添加baseURL前缀）
const resourceRequest = axios.create({
  headers: {
    'Content-Type': 'application/json'
  }
})

// 资源请求拦截器（只添加token，不处理响应格式）
resourceRequest.interceptors.request.use(
  config => {
    const token = getToken()
    if (token) {
      config.headers.Authorization = `Bearer ${token}`
    }
    return config
  },
  error => {
    console.error('资源请求错误:', error)
    return Promise.reject(error)
  }
)

// 资源请求响应拦截器（简单处理，主要用于401处理）
resourceRequest.interceptors.response.use(
  response => response,
  error => {
    if (error.response?.status === 401) {
      removeToken()
      router.push('/login')
      showToast({
        message: '登录已过期，请重新登录',
        type: 'fail'
      })
    }
    return Promise.reject(error)
  }
)

// 通用文件资源URL处理方法
export const getResourceUrl = (path) => {
  if (!path) {
    return ''
  }
  
  // 如果已经是完整的URL（以http开头），直接返回
  if (path.startsWith('http://') || path.startsWith('https://')) {
    return path
  }
  
  // 走当前页面 origin，由 nginx 或 Vite proxy 转发到后端 / 文件存储
  // （以前这里有本地调试分支硬编码了内网 IP+端口，已移除；本地开发请配置 vite.config.js proxy）
  const baseUrl = window.location.origin
  return `${baseUrl}${path}`
}

export default request
export { resourceRequest }