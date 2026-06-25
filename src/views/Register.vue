<template>
  <main class="reg-stage" role="main">
    <!-- one slow-drifting orb pair — the single restrained accent gesture -->
    <div class="orb orb-1" aria-hidden="true"></div>
    <div class="orb orb-2" aria-hidden="true"></div>

    <!-- ===== TOP BAR: lightweight back affordance + brand lockup ===== -->
    <div class="register-header">
      <van-nav-bar
        title="用户注册"
        left-text="返回"
        left-arrow
        @click-left="goBack"
      />
    </div>

    <!-- ===== BRAND LOCKUP / HEADING ===== -->
    <header class="head">
      <span class="eyebrow">
        <span class="mark" aria-hidden="true">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
            <path d="M12 6.2C9.8 4.6 7 4.2 4.4 4.7A1 1 0 0 0 3.6 5.7v11.1a1 1 0 0 0 1.2 1c2.3-.5 4.8-.1 6.7 1.3 1.9-1.4 4.4-1.8 6.7-1.3a1 1 0 0 0 1.2-1V5.7a1 1 0 0 0-.8-1C16.9 4.2 14.1 4.6 12 6.2Z" stroke="#fff" stroke-width="1.6" stroke-linejoin="round"/>
            <path d="M12 6.2v12.9" stroke="#fff" stroke-width="1.6" stroke-linecap="round"/>
          </svg>
        </span>
        English&nbsp;Study
      </span>

      <h1 class="wordmark">创建<span class="accent">账号</span></h1>

      <p class="subtitle"><span class="rule" aria-hidden="true"></span>开启你的英语学习之旅</p>
    </header>

    <!-- ===== 注册表单 ===== -->
    <div class="register-form">
      <van-form autocomplete="off" @submit="handleRegister">
        <van-field
          v-model="formData.account"
          name="account"
          label="账号"
          placeholder="请输入账号"
          :rules="accountRules"
          left-icon="user-o"
          autocomplete="off"
          clearable
        />

        <van-field
          v-model="formData.password"
          type="password"
          name="password"
          label="密码"
          placeholder="请输入密码（8-64位）"
          :rules="passwordRules"
          left-icon="lock"
          autocomplete="new-password"
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
          autocomplete="new-password"
          clearable
        />

        <van-field
          v-model="formData.name"
          name="name"
          autocomplete="off"
          label="用户名"
          placeholder="请输入用户名"
          :rules="nameRules"
          left-icon="contact"
          clearable
        />

        <van-field
          v-model="formData.phone"
          name="phone"
          autocomplete="off"
          label="手机号"
          placeholder="请输入手机号"
          :rules="phoneRules"
          left-icon="phone-o"
          clearable
        />

        <van-field
          v-model="formData.email"
          name="email"
          autocomplete="off"
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
  </main>
</template>

<script>
import { ref, reactive } from 'vue'
import { useRouter } from 'vue-router'
import { showToast } from 'vant'
import { register } from '@/api/user'
import { validatePasswordStrength } from '@/utils/password'

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
      // 与后端密码强度一致: 返回 true=通过, 返回字符串=错误文案 (作为 message)
      { validator: (v) => { const r = validatePasswordStrength(v); return r === true ? true : r } }
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
        
        const response = await register({
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
        // 不在这里显示错误信息，因为request.js的响应拦截器已经处理了
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
/* ============================================================
   EDITORIAL MINIMAL — premium light register (sibling of Login)
   Cool-blue accent, oversized type lockup, hairline van-fields,
   gradient+shimmer CTA, generous negative space. Sits on the
   global cool wash (#app) — page itself stays transparent.
   ============================================================ */
$primary:   #1989fa;
$grad-a:    #3DA5F4;
$grad-b:    #5BC8EA;
$teal:      #22B8D6;
$ink:       #1F2937;
$ink-2:     #6B7280;
$ink-3:     #9AA3AF;
$hair:      #E6ECF5;
$hair-soft: #EEF3FA;
$surface:   #FFFFFF;
$ease:      cubic-bezier(.22, .61, .36, 1);

.reg-stage {
  position: relative;
  width: 100%;
  max-width: 430px;
  margin: 0 auto;
  min-height: 100vh;
  min-height: 100dvh;
  padding: 0 32px clamp(28px, 5vh, 44px);
  display: flex;
  flex-direction: column;
  overflow: hidden;
  color: $ink;
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'PingFang SC',
               'Hiragino Sans GB', 'Microsoft YaHei', Roboto, Helvetica, Arial, sans-serif;
  -webkit-font-smoothing: antialiased;
  text-rendering: optimizeLegibility;
  /* let the global cool wash show through */
  background: transparent;
}

/* slow-drifting orbs — the single restrained accent gesture */
.orb {
  position: absolute;
  border-radius: 50%;
  filter: blur(2px);
  pointer-events: none;
  opacity: .5;
  z-index: 0;
}
.orb-1 {
  width: 220px; height: 220px;
  top: -64px; right: -60px;
  background: radial-gradient(circle at 30% 30%, rgba(91, 200, 234, .34), rgba(61, 165, 244, .09) 62%, transparent 72%);
  animation: drift1 16s $ease infinite alternate;
}
.orb-2 {
  width: 150px; height: 150px;
  bottom: 40px; left: -52px;
  background: radial-gradient(circle at 40% 40%, rgba(25, 137, 250, .20), rgba(34, 184, 214, .05) 60%, transparent 72%);
  animation: drift2 19s $ease infinite alternate;
}
@keyframes drift1 {
  from { transform: translate(0, 0) scale(1); }
  to   { transform: translate(-24px, 28px) scale(1.08); }
}
@keyframes drift2 {
  from { transform: translate(0, 0) scale(1); }
  to   { transform: translate(20px, -22px) scale(1.1); }
}

/* ---- lightweight editorial back affordance (replaces blue nav bar) ---- */
.register-header {
  position: relative;
  z-index: 1;
  flex: 0 0 auto;
  margin: 0 -32px;
  padding-top: clamp(8px, 3vh, 24px);

  :deep(.van-nav-bar) {
    background: transparent;
    line-height: normal;

    &::after { display: none; } // kill the bottom hairline border
  }
  :deep(.van-nav-bar__content) {
    height: 46px;
  }
  :deep(.van-nav-bar__title) {
    display: none; // brand lockup below carries the heading instead
  }
  :deep(.van-nav-bar__left) {
    padding-left: 20px;

    .van-icon {
      color: $primary;
      font-size: 18px;
      font-weight: 600;
    }
    .van-nav-bar__text {
      color: $ink-2;
      font-size: 14px;
      letter-spacing: .02em;
    }
    &:active { opacity: .6; }
  }
}

/* ---- brand lockup / heading (the focal moment) ---- */
.head {
  position: relative;
  z-index: 1;
  flex: 0 0 auto;
  padding-top: clamp(14px, 4vh, 32px);
}
.eyebrow {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  font-size: 11px;
  letter-spacing: .26em;
  text-transform: uppercase;
  color: $ink-3;
  font-weight: 600;
  margin-bottom: 20px;
}
.eyebrow .mark {
  width: 30px; height: 30px;
  border-radius: 9px;
  display: grid; place-items: center;
  background: linear-gradient(135deg, $grad-a, $grad-b);
  box-shadow:
    0 6px 14px rgba(61, 165, 244, .34),
    inset 0 1px 0 rgba(255, 255, 255, .5);
}
.eyebrow .mark svg { display: block; }

.wordmark {
  font-size: clamp(40px, 13vw, 56px);
  line-height: .98;
  font-weight: 800;
  letter-spacing: -0.02em;
  color: $ink;
  margin-bottom: 14px;
}
.wordmark .accent {
  background: linear-gradient(120deg, $primary 0%, $grad-b 100%);
  -webkit-background-clip: text;
  background-clip: text;
  -webkit-text-fill-color: transparent;
  color: $primary;
}

.subtitle {
  display: flex;
  align-items: center;
  gap: 14px;
  color: $ink-2;
  font-size: 15px;
  letter-spacing: .02em;
}
.subtitle .rule {
  width: 34px;
  height: 2px;
  border-radius: 2px;
  background: linear-gradient(90deg, $primary, $grad-b);
  flex: 0 0 auto;
}

/* ---- the form ---- */
.register-form {
  position: relative;
  z-index: 1;
  flex: 1 1 auto;
  padding: clamp(20px, 5vh, 38px) 0 0;

  /* van-form fields → borderless hairline editorial rows */
  :deep(.van-form) {
    display: flex;
    flex-direction: column;
    gap: 2px;
  }

  :deep(.van-cell-group),
  :deep(.van-cell-group--inset) {
    background: transparent;
    margin: 0;
    border-radius: 0;
    box-shadow: none;
  }

  :deep(.van-field) {
    position: relative;
    margin: 0;
    padding: 16px 2px 12px;
    background: transparent;
    border-radius: 0;
    overflow: visible;
    transition: background .3s $ease;

    /* hide vant's default cell border */
    &::after {
      display: none;
    }
  }

  /* barely-there hairline bottom border on every field */
  :deep(.van-field)::before {
    content: "";
    position: absolute;
    left: 0; right: 0; bottom: 0;
    height: 1px;
    background: $hair;
    transition: background .3s $ease;
    z-index: 0;
  }
  /* animated focus underline on top of the hairline */
  :deep(.van-field) .van-field__body::after {
    content: "";
    position: absolute;
    left: 0; bottom: -12px;
    height: 2px;
    width: 0;
    border-radius: 2px;
    background: linear-gradient(90deg, $primary, $grad-b);
    transition: width .42s $ease;
    z-index: 2;
  }
  :deep(.van-field.van-field--focused) .van-field__body::after {
    width: 100%;
  }
  :deep(.van-field) .van-field__body {
    position: relative;
  }

  :deep(.van-field__label) {
    width: 70px;
    font-size: 11px;
    letter-spacing: .12em;
    text-transform: uppercase;
    font-weight: 600;
    color: $ink-3;
    align-self: center;
    transition: color .3s $ease;
  }
  :deep(.van-field.van-field--focused) .van-field__label {
    color: $primary;
  }

  :deep(.van-field__left-icon) {
    color: $ink-3;
    margin-right: 8px;
    transition: color .3s $ease;

    .van-icon { font-size: 18px; }
  }
  :deep(.van-field.van-field--focused) .van-field__left-icon {
    color: $primary;
  }

  :deep(.van-field__control) {
    font-size: 16px;
    letter-spacing: .01em;
    color: $ink;

    &::placeholder {
      color: $ink-3;
    }
  }

  :deep(.van-field__clear) {
    color: $ink-3;
  }

  /* validation error message + error-state hairline */
  :deep(.van-field--error)::before {
    background: var(--van-danger-color, #ee0a24);
  }
  :deep(.van-field__error-message) {
    font-size: 12px;
    letter-spacing: .01em;
    padding-top: 2px;
  }
}

/* ---- primary register CTA → gradient + shimmer (mirrors login) ---- */
.register-actions {
  margin: clamp(28px, 6vh, 40px) 0 4px;

  :deep(.van-button) {
    position: relative;
    height: 54px;
    border: 0;
    border-radius: 15px;
    overflow: hidden;
    font-size: 17px;
    font-weight: 700;
    letter-spacing: .12em;
    color: #fff;
    background: linear-gradient(118deg, $grad-a 0%, $primary 56%, $teal 130%);
    background-size: 180% 180%;
    box-shadow:
      0 10px 24px rgba(25, 137, 250, .32),
      0 2px 6px rgba(25, 137, 250, .20),
      inset 0 1px 0 rgba(255, 255, 255, .36);
    transition: transform .18s $ease, box-shadow .25s $ease;
    animation: gradShift 9s ease-in-out infinite;
  }
  :deep(.van-button)::before {
    /* override vant's active overlay */
    display: none;
  }
  :deep(.van-button)::after {
    border: 0;
  }
  /* slow shimmer sweep on a dedicated layer */
  :deep(.van-button .van-button__content)::before {
    content: "";
    position: absolute;
    top: 0; bottom: 0;
    left: -60%;
    width: 45%;
    z-index: 1;
    background: linear-gradient(100deg, transparent, rgba(255, 255, 255, .45), transparent);
    transform: skewX(-18deg);
    animation: shimmer 5.5s ease-in-out infinite;
    pointer-events: none;
  }
  :deep(.van-button .van-button__text),
  :deep(.van-button .van-loading) {
    position: relative;
    z-index: 2;
  }
  :deep(.van-button:active) {
    transform: translateY(1px) scale(.992);
  }
  :deep(.van-button.van-button--loading) {
    opacity: .92;
  }
}

@keyframes gradShift {
  0%, 100% { background-position: 0% 50%; }
  50%      { background-position: 100% 50%; }
}
@keyframes shimmer {
  0%   { left: -60%; }
  55%  { left: 130%; }
  100% { left: 130%; }
}

/* ---- footer login link ---- */
.register-footer {
  position: relative;
  z-index: 1;
  text-align: center;
  padding-top: clamp(22px, 5vh, 36px);

  .login-tip {
    font-size: 14.5px;
    color: $ink-2;
    letter-spacing: .01em;

    .login-link {
      position: relative;
      color: $primary;
      text-decoration: none;
      font-weight: 700;
      margin-left: 4px;

      &::after {
        content: "";
        position: absolute;
        left: 0; bottom: -3px;
        width: 100%;
        height: 1.5px;
        background: linear-gradient(90deg, $primary, $grad-b);
        transform: scaleX(0);
        transform-origin: left;
        transition: transform .32s $ease;
      }
      &:hover::after { transform: scaleX(1); }
    }
  }
}

@media (prefers-reduced-motion: reduce) {
  .orb,
  .register-actions :deep(.van-button),
  .register-actions :deep(.van-button .van-button__content)::before {
    animation: none !important;
  }
  .register-actions :deep(.van-button),
  .register-form :deep(.van-field) .van-field__body::after,
  .register-footer .login-link::after {
    transition: none !important;
  }
}
</style>