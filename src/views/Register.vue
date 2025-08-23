<template>
  <div class="register-page">
    <div class="register-container">
      <!-- 头部 -->
      <div class="register-header">
        <van-nav-bar
          title="用户注册"
          left-text="返回"
          left-arrow
          @click-left="goBack"
        />
      </div>
      
      <!-- 注册表单 -->
      <div class="register-form">
        <div class="form-title">创建新账号</div>
        
        <van-form @submit="handleRegister">
          <van-field
            v-model="formData.account"
            name="account"
            label="账号"
            placeholder="请输入账号"
            :rules="accountRules"
            left-icon="user-o"
            clearable
          />
          
          <van-field
            v-model="formData.password"
            type="password"
            name="password"
            label="密码"
            placeholder="请输入密码（6-20位）"
            :rules="passwordRules"
            left-icon="lock"
            clearable
          />
          
          <van-field
            v-model="confirmPassword"
            type="password"
            name="confirmPassword"
            label="确认密码"
            placeholder="请再次输入密码"
            :rules="confirmPasswordRules"
            left-icon="lock"
            clearable
          />
          
          <van-field
            v-model="formData.name"
            name="name"
            label="用户名"
            placeholder="请输入用户名"
            :rules="nameRules"
            left-icon="contact"
            clearable
          />
          
          <van-field
            v-model="formData.phone"
            name="phone"
            label="手机号"
            placeholder="请输入手机号"
            :rules="phoneRules"
            left-icon="phone-o"
            clearable
          />
          
          <van-field
            v-model="formData.email"
            name="email"
            label="邮箱"
            placeholder="请输入邮箱地址"
            :rules="emailRules"
            left-icon="envelop-o"
            clearable
          />
          
          <!-- 注册按钮 -->
          <div class="register-actions">
            <van-button
              type="primary"
              size="large"
              block
              :loading="loading"
              native-type="submit"
            >
              注册
            </van-button>
          </div>
        </van-form>
        
        <!-- 底部链接 -->
        <div class="register-footer">
          <p class="login-tip">
            已有账号？
            <router-link to="/login" class="login-link">立即登录</router-link>
          </p>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import { ref, reactive } from 'vue'
import { useRouter } from 'vue-router'
import { showToast } from 'vant'
import { register } from '@/api/user'

export default {
  name: 'Register',
  setup() {
    const router = useRouter()
    const loading = ref(false)
    const confirmPassword = ref('')
    
    const formData = reactive({
      account: '',
      password: '',
      name: '',
      phone: '',
      email: ''
    })
    
    // 表单验证规则
    const accountRules = [
      { required: true, message: '请输入账号' },
      { min: 3, max: 20, message: '账号长度为3-20位' },
      { pattern: /^[a-zA-Z0-9_]+$/, message: '账号只能包含字母、数字和下划线' }
    ]
    
    const passwordRules = [
      { required: true, message: '请输入密码' },
      { min: 6, max: 20, message: '密码长度为6-20位' }
    ]
    
    const confirmPasswordRules = [
      { required: true, message: '请确认密码' },
      {
        validator: (value) => {
          if (value !== formData.password) {
            return '两次输入的密码不一致'
          }
          return true
        }
      }
    ]
    
    const nameRules = [
      { required: true, message: '请输入用户名' },
      { min: 2, max: 10, message: '用户名长度为2-10位' }
    ]
    
    const phoneRules = [
      { required: true, message: '请输入手机号' },
      { pattern: /^1[3-9]\d{9}$/, message: '请输入正确的手机号' }
    ]
    
    const emailRules = [
      { required: true, message: '请输入邮箱地址' },
      { pattern: /^[^\s@]+@[^\s@]+\.[^\s@]+$/, message: '请输入正确的邮箱地址' }
    ]
    
    // 返回上一页
    const goBack = () => {
      router.go(-1)
    }
    
    // 处理注册
    const handleRegister = async () => {
      if (loading.value) return
      
      try {
        loading.value = true
        
        await register({
          account: formData.account,
          password: formData.password,
          name: formData.name,
          phone: formData.phone,
          email: formData.email
        })
        
        showToast({
          message: '注册成功，请登录',
          type: 'success'
        })
        
        // 跳转到登录页面
        router.push('/login')
        
      } catch (error) {
        console.error('注册失败:', error)
      } finally {
        loading.value = false
      }
    }
    
    return {
      formData,
      confirmPassword,
      loading,
      accountRules,
      passwordRules,
      confirmPasswordRules,
      nameRules,
      phoneRules,
      emailRules,
      goBack,
      handleRegister
    }
  }
}
</script>

<style lang="scss" scoped>
.register-page {
  min-height: 100vh;
  background-color: #f8f9fa;
}

.register-container {
  height: 100vh;
  display: flex;
  flex-direction: column;
  background: white;
}

.register-header {
  :deep(.van-nav-bar) {
    background: linear-gradient(135deg, #1989fa 0%, #1976d2 100%);
    
    .van-nav-bar__title {
      color: white;
      font-weight: 500;
    }
    
    .van-nav-bar__left {
      color: white;
    }
  }
}

.register-form {
  flex: 1;
  padding: 20px;
  overflow-y: auto;
  
  .form-title {
    font-size: 24px;
    font-weight: bold;
    color: #323233;
    text-align: center;
    margin-bottom: 30px;
  }
  
  :deep(.van-field) {
    margin-bottom: 16px;
    border-radius: 8px;
    background-color: #f8f9fa;
    
    .van-field__control {
      font-size: 16px;
    }
    
    .van-field__label {
      width: 80px;
      font-weight: 500;
    }
  }
}

.register-actions {
  margin: 30px 0 20px;
  
  :deep(.van-button) {
    height: 48px;
    border-radius: 24px;
    font-size: 16px;
    font-weight: 500;
  }
}

.register-footer {
  text-align: center;
  padding-bottom: 20px;
  
  .login-tip {
    font-size: 14px;
    color: #646566;
    
    .login-link {
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