<template>
  <div class="login-page">
    <div class="login-container">
      <!-- 头部logo和标题 -->
      <div class="login-header">
        <div class="logo">
          <svg width="60" height="60" viewBox="0 0 60 60" fill="none">
            <circle cx="30" cy="30" r="28" fill="#1989fa" stroke="#fff" stroke-width="4"/>
            <text x="30" y="38" text-anchor="middle" fill="white" font-size="24" font-weight="bold">E</text>
          </svg>
        </div>
        <h1 class="title">英语学习</h1>
        <p class="subtitle">让学习变得更简单</p>
      </div>
      
      <!-- 登录表单 -->
      <div class="login-form">
        <van-form @submit="handleLogin">
          <van-field
            v-model="formData.account"
            name="account"
            label="账号"
            placeholder="请输入账号"
            :rules="[{ required: true, message: '请输入账号' }]"
            left-icon="user-o"
            clearable
          />
          
          <van-field
            v-model="formData.password"
            type="password"
            name="password"
            label="密码"
            placeholder="请输入密码"
            :rules="[{ required: true, message: '请输入密码' }]"
            left-icon="lock"
            clearable
          />
          
          <!-- 记住我 -->
          <div class="remember-me">
            <van-checkbox v-model="rememberMe">记住我</van-checkbox>
          </div>
          
          <!-- 登录按钮 -->
          <div class="login-actions">
            <van-button
              type="primary"
              size="large"
              block
              :loading="loading"
              native-type="submit"
            >
              登录
            </van-button>
          </div>
        </van-form>
        
        <!-- 底部链接 -->
        <div class="login-footer">
          <p class="register-tip">
            还没有账号？
            <router-link to="/register" class="register-link">立即注册</router-link>
          </p>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import { ref, reactive, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { showToast } from 'vant'
import { login } from '@/api/user'
import { 
  setToken, 
  setUserInfo, 
  setUserId,
  setRememberPassword, 
  setSavedAccount, 
  setSavedPassword,
  getRememberPassword,
  getSavedAccount,
  getSavedPassword
} from '@/utils/auth'

export default {
  name: 'Login',
  setup() {
    const router = useRouter()
    const loading = ref(false)
    const rememberMe = ref(false)
    
    const formData = reactive({
      account: '',
      password: ''
    })
    
    // 页面加载时恢复保存的登录信息
    onMounted(() => {
      const savedRemember = getRememberPassword()
      if (savedRemember) {
        rememberMe.value = true
        formData.account = getSavedAccount()
        formData.password = getSavedPassword()
      }
    })
    
    // 处理登录
    const handleLogin = async () => {
      if (loading.value) return
      
      try {
        loading.value = true
        
        const response = await login({
          account: formData.account,
          password: formData.password
        })
        
        // 保存token和用户信息
        setToken(response.token)
        setUserInfo(response.data)
        setUserId(response.data.id)
        
        // 处理记住密码
        if (rememberMe.value) {
          setRememberPassword(true)
          setSavedAccount(formData.account)
          setSavedPassword(formData.password)
        } else {
          setRememberPassword(false)
          setSavedAccount('')
          setSavedPassword('')
        }
        
        showToast({
          message: '登录成功',
          type: 'success'
        })
        
        // 跳转到首页
        router.push('/practice')
        
      } catch (error) {
        console.error('登录失败:', error)
        // 不在这里显示错误信息，因为request.js的响应拦截器已经处理了
      } finally {
        loading.value = false
      }
    }
    
    return {
      formData,
      loading,
      rememberMe,
      handleLogin
    }
  }
}
</script>

<style lang="scss" scoped>
.login-page {
  min-height: 100vh;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 20px;
}

.login-container {
  width: 100%;
  max-width: 400px;
  background: white;
  border-radius: 16px;
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.1);
  overflow: hidden;
}

.login-header {
  text-align: center;
  padding: 40px 20px 20px;
  background: linear-gradient(135deg, #1989fa 0%, #1976d2 100%);
  color: white;
  
  .logo {
    margin-bottom: 16px;
  }
  
  .title {
    font-size: 24px;
    font-weight: bold;
    margin-bottom: 8px;
  }
  
  .subtitle {
    font-size: 14px;
    opacity: 0.9;
  }
}

.login-form {
  padding: 30px 20px 20px;
  
  :deep(.van-field) {
    margin-bottom: 16px;
    border-radius: 8px;
    background-color: #f8f9fa;
    
    .van-field__control {
      font-size: 16px;
    }
  }
}

.remember-me {
  margin: 16px 0 24px;
  
  :deep(.van-checkbox) {
    .van-checkbox__label {
      font-size: 14px;
      color: #646566;
    }
  }
}

.login-actions {
  margin-bottom: 24px;
  
  :deep(.van-button) {
    height: 48px;
    border-radius: 24px;
    font-size: 16px;
    font-weight: 500;
  }
}

.login-footer {
  text-align: center;
  
  .register-tip {
    font-size: 14px;
    color: #646566;
    
    .register-link {
      color: #1989fa;
      text-decoration: none;
      font-weight: 500;
      
      &:hover {
        text-decoration: underline;
      }
    }
  }
}
</style>