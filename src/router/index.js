import { createRouter, createWebHistory } from 'vue-router'
import { getToken, isTokenExpired, clearAllData, isAdmin } from '@/utils/auth'
import { showToast } from 'vant'
import Dictionary from '@/views/Dictionary.vue'

// 路由配置
const routes = [
  {
    path: '/',
    redirect: '/dashboard'
  },
  {
    path: '/dashboard',
    name: 'Dashboard',
    component: () => import('@/views/Dashboard.vue'),
    meta: {
      title: '首页',
      requiresAuth: true,
      showTabbar: true
    }
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
    path: '/practice/review',
    name: 'PracticeReview',
    component: () => import('@/views/PracticeReview.vue'),
    meta: {
      title: '复习模式',
      requiresAuth: true,
      showTabbar: true
    }
  },
  {
    path: '/practice/strength',
    name: 'PracticeStrength',
    component: () => import('@/views/PracticeStrength.vue'),
    meta: {
      title: '强化模式',
      requiresAuth: true,
      showTabbar: true
    }
  },
  {
    path: '/practice/spot',
    name: 'PracticeSpot',
    component: () => import('@/views/PracticeSpot.vue'),
    meta: {
      title: '抽查模式',
      requiresAuth: true,
      showTabbar: true
    }
  },
  {
    path: '/practice/article/instant',
    name: 'ArticleInstant',
    component: () => import('@/views/ArticleInstant.vue'),
    meta: {
      title: '即时文章',
      requiresAuth: true,
      showTabbar: false
    }
  },
  {
    path: '/practice/article/library',
    name: 'ArticleLibrary',
    component: () => import('@/views/ArticleLibrary.vue'),
    meta: {
      title: '收录文章',
      requiresAuth: true,
      showTabbar: true
    }
  },
  {
    path: '/practice/article/library/:id',
    name: 'ArticleLibraryDetail',
    component: () => import('@/views/ArticleLibraryDetail.vue'),
    meta: {
      title: '文章详情',
      requiresAuth: true,
      showTabbar: false
    }
  },
  {
    path: '/dictionary',
    name: 'Dictionary',
    component: Dictionary,
    beforeEnter: (to, from, next) => {
      const token = getToken()
      if (!token) {
        showToast({
          message: '请先登录',
          type: 'fail'
        })
        next('/login')
      } else {
        next()
      }
    },
    meta: {
      title: '词典',
      requiresAuth: true,
      showTabbar: true
    }
  },
  {
    path: '/dictionary/words',
    name: 'DictionaryWords',
    component: () => import('@/views/DictionaryWords.vue'),
    meta: {
      title: '词典-单词',
      requiresAuth: true,
      showTabbar: true
    }
  },
  {
    path: '/dictionary/phrases',
    name: 'DictionaryPhrases',
    component: () => import('@/views/DictionaryPhrases.vue'),
    meta: {
      title: '词典-短语',
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
  },
  {
    path: '/profile/tags',
    name: 'TagManage',
    component: () => import('@/views/TagManage.vue'),
    meta: {
      title: '我的标签',
      requiresAuth: true,
      showTabbar: false
    }
  },
  {
    path: '/profile/import-tasks',
    name: 'ImportTaskHistory',
    component: () => import('@/views/ImportTaskHistory.vue'),
    meta: {
      title: '导入任务历史',
      requiresAuth: true,
      showTabbar: false
    }
  },
  {
    path: '/admin/chat',
    name: 'AdminChat',
    component: () => import('@/views/AdminChat.vue'),
    meta: {
      title: 'AI 辅助',
      requiresAuth: true,
      requiresAdmin: true, // 路由守卫读这个; 真鉴权在后端 (relay-token + ws 双校验)
      showTabbar: false
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
    // 主动检查 JWT exp; 过期则清缓存跳登录, 不依赖下一次 API 请求才发现
    if (isTokenExpired()) {
      clearAllData()
      showToast({ message: '登录已过期, 请重新登录', type: 'fail' })
      next('/login')
      return
    }
  }
  
  // admin 路由守卫: 非 admin 直接踢回 profile
  if (to.meta.requiresAdmin && !isAdmin()) {
    showToast({ message: '此功能仅管理员可用', type: 'fail' })
    next('/profile')
    return
  }

  // 如果已登录用户访问登录或注册页面，重定向到首页
  if ((to.name === 'Login' || to.name === 'Register') && getToken()) {
    next('/dashboard')
    return
  }

  next()
})

export default router
