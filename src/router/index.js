import { createRouter, createWebHistory } from 'vue-router'
import { getToken } from '@/utils/auth'
import { showToast } from 'vant'

// 路由配置
const routes = [
  {
    path: '/',
    redirect: '/practice'
  },
  {
    path: '/login',
    name: 'Login',
    component: () => import('@/views/Login.vue'),
    meta: {
      title: '登录',
      requiresAuth: false
    }
  },
  {
    path: '/register',
    name: 'Register',
    component: () => import('@/views/Register.vue'),
    meta: {
      title: '注册',
      requiresAuth: false
    }
  },
  {
    path: '/practice',
    name: 'Practice',
    component: () => import('@/views/Practice.vue'),
    meta: {
      title: '练习',
      requiresAuth: true,
      showTabbar: true
    }
  },
  {
    path: '/practice/study',
    name: 'PracticeStudy',
    component: () => import('@/views/PracticeStudy.vue'),
    meta: {
      title: '学习模式',
      requiresAuth: true,
      showTabbar: true
    }
  },
  {
    path: '/dictionary',
    name: 'Dictionary',
    component: () => import('@/views/Dictionary.vue'),
    meta: {
      title: '词典',
      requiresAuth: true,
      showTabbar: true
    }
  },
  {
    path: '/profile',
    name: 'Profile',
    component: () => import('@/views/Profile.vue'),
    meta: {
      title: '我的',
      requiresAuth: true,
      showTabbar: true
    }
  }
]

// 创建路由实例
const router = createRouter({
  history: createWebHistory(),
  routes
})

// 全局前置守卫
router.beforeEach((to, from, next) => {
  // 设置页面标题
  if (to.meta.title) {
    document.title = to.meta.title
  }
  
  // 检查是否需要登录
  if (to.meta.requiresAuth) {
    const token = getToken()
    if (!token) {
      showToast({
        message: '请先登录',
        type: 'fail'
      })
      next('/login')
      return
    }
  }
  
  // 如果已登录用户访问登录或注册页面，重定向到首页
  if ((to.name === 'Login' || to.name === 'Register') && getToken()) {
    next('/practice')
    return
  }
  
  next()
})

export default router