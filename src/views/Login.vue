<template>
  <main class="login-stage" role="main">
    <!-- one slow-drifting orb pair — the single restrained accent gesture -->
    <div class="orb orb-1" aria-hidden="true"></div>
    <div class="orb orb-2" aria-hidden="true"></div>

    <!-- ===== BRAND LOCKUP ===== -->
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

      <h1 class="wordmark">英语<span class="accent">学习</span></h1>

      <p class="subtitle"><span class="rule" aria-hidden="true"></span>让学习变得更简单</p>
    </header>

    <!-- ===== FORM ===== -->
    <form class="form" autocomplete="on" novalidate @submit.prevent="handleLogin">
      <!-- 账号 -->
      <div class="field">
        <label class="field-label" for="login-account">账号</label>
        <div class="field-row">
          <span class="glyph" aria-hidden="true">
            <svg viewBox="0 0 24 24" fill="none">
              <circle cx="12" cy="8" r="3.4" stroke="currentColor" stroke-width="1.7"/>
              <path d="M4.8 19.2c.7-3.4 3.6-5.4 7.2-5.4s6.5 2 7.2 5.4" stroke="currentColor" stroke-width="1.7" stroke-linecap="round"/>
            </svg>
          </span>
          <input
            id="login-account"
            v-model="formData.account"
            type="text"
            inputmode="text"
            placeholder="请输入账号"
            autocomplete="username"
            spellcheck="false"
            @keyup.enter="focusPassword"
          >
        </div>
      </div>

      <!-- 密码 -->
      <div class="field">
        <label class="field-label" for="login-password">密码</label>
        <div class="field-row">
          <span class="glyph" aria-hidden="true">
            <svg viewBox="0 0 24 24" fill="none">
              <rect x="4.5" y="10.2" width="15" height="9.3" rx="2.4" stroke="currentColor" stroke-width="1.7"/>
              <path d="M7.8 10.2V7.6a4.2 4.2 0 0 1 8.4 0v2.6" stroke="currentColor" stroke-width="1.7" stroke-linecap="round"/>
              <circle cx="12" cy="14.6" r="1.3" fill="currentColor"/>
            </svg>
          </span>
          <input
            id="login-password"
            ref="passwordInput"
            v-model="formData.password"
            :type="showPassword ? 'text' : 'password'"
            placeholder="请输入密码"
            autocomplete="current-password"
          >
          <button
            type="button"
            class="reveal"
            :aria-label="showPassword ? '隐藏密码' : '显示密码'"
            tabindex="-1"
            @click="showPassword = !showPassword"
          >
            <svg v-if="!showPassword" viewBox="0 0 24 24" fill="none">
              <path d="M2.5 12S6 5.8 12 5.8 21.5 12 21.5 12 18 18.2 12 18.2 2.5 12 2.5 12Z" stroke="currentColor" stroke-width="1.6" stroke-linejoin="round"/>
              <circle cx="12" cy="12" r="2.7" stroke="currentColor" stroke-width="1.6"/>
            </svg>
            <svg v-else viewBox="0 0 24 24" fill="none">
              <path d="M3 3.5 20.5 21" stroke="currentColor" stroke-width="1.6" stroke-linecap="round"/>
              <path d="M9.6 5.9A8.7 8.7 0 0 1 12 5.6c6 0 9.5 6.2 9.5 6.2a16 16 0 0 1-2.8 3.4M6.2 7.6A16.4 16.4 0 0 0 2.5 11.8S6 18 12 18a8.6 8.6 0 0 0 3.3-.66" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"/>
            </svg>
          </button>
        </div>
      </div>

      <!-- options: remember me -->
      <div class="options">
        <label class="remember">
          <input v-model="rememberMe" type="checkbox">
          <span class="box" aria-hidden="true">
            <svg viewBox="0 0 24 24"><path d="M4 12.5 9.5 18 20 6.5"/></svg>
          </span>
          记住我
        </label>
      </div>

      <!-- primary action -->
      <button class="btn" type="submit" :class="{ 'is-loading': loading }" :disabled="loading">
        <span class="label">
          <span v-if="loading" class="spinner" aria-hidden="true"></span>
          <template v-if="loading">登录中</template>
          <template v-else>
            登&nbsp;录
            <svg viewBox="0 0 24 24" fill="none" aria-hidden="true">
              <path d="M5 12h13" stroke="#fff" stroke-width="2" stroke-linecap="round"/>
              <path d="M13 6.5 18.5 12 13 17.5" stroke="#fff" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
            </svg>
          </template>
        </span>
      </button>
    </form>

    <!-- ===== FOOTER ===== -->
    <footer class="foot">
      还没有账号？<router-link to="/register" class="reg">立即注册</router-link>
      <div class="legal">登录即代表同意《用户协议》与《隐私政策》</div>
    </footer>
  </main>
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
  setRole,
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
    const showPassword = ref(false)
    const passwordInput = ref(null)

    const formData = reactive({
      account: '',
      password: ''
    })

    // 页面加载时恢复账号 + 密码（用户主动选择把密码缓存到 localStorage 以换取自动登录）
    onMounted(() => {
      if (getRememberPassword()) {
        rememberMe.value = true
        formData.account = getSavedAccount()
        formData.password = getSavedPassword()
      }
    })

    // 账号输入框回车 → 聚焦密码框
    const focusPassword = () => {
      passwordInput.value && passwordInput.value.focus()
    }

    // 处理登录
    const handleLogin = async () => {
      if (loading.value) return

      // 轻量必填校验（替代原 van-form rules，保持同样的提示）
      const account = formData.account.trim()
      if (!account) {
        showToast('请输入账号')
        return
      }
      if (!formData.password) {
        showToast('请输入密码')
        return
      }

      try {
        loading.value = true

        const response = await login({
          account,
          password: formData.password
        })

        // 保存token和用户信息
        setToken(response.token)
        setUserInfo(response.data)
        setUserId(response.data.id)
        setRole(response.data.role) // 角色由响应回包带回, 仅 UI 用

        // "记住我"：保存账号 + 密码到 localStorage，方便下次自动填回（用户主动选择，见 memory）
        if (rememberMe.value) {
          setRememberPassword(true)
          setSavedAccount(account)
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
      showPassword,
      passwordInput,
      focusPassword,
      handleLogin
    }
  }
}
</script>

<style lang="scss" scoped>
/* ============================================================
   EDITORIAL MINIMAL — premium light login
   One restrained cool-blue accent, oversized type lockup,
   hairline-bordered inputs, generous negative space.
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

.login-stage {
  position: relative;
  width: 100%;
  max-width: 430px;
  margin: 0 auto;
  min-height: 100vh;
  min-height: 100dvh;
  padding: clamp(40px, 9vh, 88px) 32px clamp(28px, 5vh, 44px);
  display: flex;
  flex-direction: column;
  overflow: hidden;
  color: $ink;
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'PingFang SC',
               'Hiragino Sans GB', 'Microsoft YaHei', Roboto, Helvetica, Arial, sans-serif;
  -webkit-font-smoothing: antialiased;
  text-rendering: optimizeLegibility;
  /* near-white editorial wash with one faint cool tint top-right */
  background:
    radial-gradient(120% 80% at 88% -8%, rgba(91, 200, 234, .16) 0%, rgba(91, 200, 234, 0) 46%),
    radial-gradient(120% 90% at 8% 108%, rgba(25, 137, 250, .10) 0%, rgba(25, 137, 250, 0) 50%),
    linear-gradient(180deg, #FBFDFF 0%, #F2F6FC 100%);
}

/* one slow-drifting orb — the single restrained accent gesture */
.orb {
  position: absolute;
  border-radius: 50%;
  filter: blur(2px);
  pointer-events: none;
  opacity: .55;
  z-index: 0;
}
.orb-1 {
  width: 230px; height: 230px;
  top: -70px; right: -64px;
  background: radial-gradient(circle at 30% 30%, rgba(91, 200, 234, .38), rgba(61, 165, 244, .10) 62%, transparent 72%);
  animation: drift1 16s $ease infinite alternate;
}
.orb-2 {
  width: 150px; height: 150px;
  bottom: 56px; left: -52px;
  background: radial-gradient(circle at 40% 40%, rgba(25, 137, 250, .22), rgba(34, 184, 214, .06) 60%, transparent 72%);
  animation: drift2 19s $ease infinite alternate;
}
@keyframes drift1 {
  from { transform: translate(0, 0) scale(1); }
  to   { transform: translate(-26px, 30px) scale(1.08); }
}
@keyframes drift2 {
  from { transform: translate(0, 0) scale(1); }
  to   { transform: translate(22px, -24px) scale(1.1); }
}

/* ---- brand lockup (the focal moment) ---- */
.head {
  position: relative;
  z-index: 1;
  flex: 0 0 auto;
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
  margin-bottom: 26px;
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
  font-size: clamp(46px, 15vw, 62px);
  line-height: .98;
  font-weight: 800;
  letter-spacing: -0.02em;
  color: $ink;
  margin-bottom: 18px;
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
.form {
  position: relative;
  z-index: 1;
  flex: 1 1 auto;
  display: flex;
  flex-direction: column;
  justify-content: center;
  gap: 8px;
  padding: clamp(28px, 6vh, 52px) 0 0;
}

.field {
  position: relative;
  padding: 14px 4px 12px;
}
/* barely-there hairline bottom border — no heavy box */
.field::after {
  content: "";
  position: absolute;
  left: 0; right: 0; bottom: 0;
  height: 1px;
  background: $hair;
  transition: background .3s $ease;
}
/* animated focus caret/underline — the tiny tasteful detail */
.field::before {
  content: "";
  position: absolute;
  left: 0; bottom: 0;
  height: 2px;
  width: 0;
  border-radius: 2px;
  background: linear-gradient(90deg, $primary, $grad-b);
  transition: width .42s $ease;
  z-index: 2;
}
.field:focus-within::before { width: 100%; }
.field:focus-within::after  { background: $hair-soft; }

.field-label {
  display: block;
  font-size: 11px;
  letter-spacing: .14em;
  text-transform: uppercase;
  font-weight: 600;
  color: $ink-3;
  margin-bottom: 6px;
  transition: color .3s $ease;
}
.field:focus-within .field-label { color: $primary; }

.field-row {
  display: flex;
  align-items: center;
  gap: 12px;
}
.glyph {
  flex: 0 0 auto;
  width: 20px; height: 20px;
  color: $ink-3;
  transition: color .3s $ease;
}
.field:focus-within .glyph { color: $primary; }
.glyph svg { display: block; width: 20px; height: 20px; }

.field input {
  flex: 1 1 auto;
  border: 0;
  outline: 0;
  background: transparent;
  font: inherit;
  font-size: 17px;
  letter-spacing: .01em;
  color: $ink;
  padding: 2px 0;
  min-width: 0;
}
.field input::placeholder {
  color: $ink-3;
  letter-spacing: .01em;
}

/* show/hide affordance */
.reveal {
  flex: 0 0 auto;
  border: 0;
  background: transparent;
  color: $ink-3;
  cursor: pointer;
  padding: 4px;
  display: grid; place-items: center;
  transition: color .25s $ease;
}
.reveal:hover { color: $ink-2; }
.reveal svg { display: block; width: 19px; height: 19px; }

/* ---- remember-me row ---- */
.options {
  display: flex;
  align-items: center;
  margin: 22px 4px 30px;
}
.remember {
  display: inline-flex;
  align-items: center;
  gap: 10px;
  cursor: pointer;
  user-select: none;
  font-size: 14px;
  color: $ink-2;
}
.box {
  width: 20px; height: 20px;
  border-radius: 7px;
  border: 1.5px solid $hair;
  background: $surface;
  display: grid; place-items: center;
  transition: all .25s $ease;
  flex: 0 0 auto;
}
.box svg {
  width: 12px; height: 12px;
  stroke: #fff;
  stroke-width: 3;
  stroke-linecap: round;
  stroke-linejoin: round;
  fill: none;
  stroke-dasharray: 18;
  stroke-dashoffset: 18;
  transition: stroke-dashoffset .3s $ease .04s;
}
.remember input { position: absolute; opacity: 0; pointer-events: none; }
.remember input:checked + .box {
  background: linear-gradient(135deg, $grad-a, $primary);
  border-color: transparent;
  box-shadow: 0 4px 10px rgba(25, 137, 250, .30);
}
.remember input:checked + .box svg { stroke-dashoffset: 0; }
.remember input:focus-visible + .box { outline: 2px solid $primary; outline-offset: 2px; }

/* ---- primary login button ---- */
.btn {
  position: relative;
  width: 100%;
  border: 0;
  cursor: pointer;
  font: inherit;
  font-size: 17px;
  font-weight: 700;
  letter-spacing: .12em;
  color: #fff;
  padding: 18px 24px;
  border-radius: 15px;
  overflow: hidden;
  background: linear-gradient(118deg, $grad-a 0%, $primary 56%, $teal 130%);
  background-size: 180% 180%;
  box-shadow:
    0 10px 24px rgba(25, 137, 250, .32),
    0 2px 6px rgba(25, 137, 250, .20),
    inset 0 1px 0 rgba(255, 255, 255, .36);
  transition: transform .18s $ease, box-shadow .25s $ease;
  animation: gradShift 9s ease-in-out infinite;
}
@keyframes gradShift {
  0%, 100% { background-position: 0% 50%; }
  50%      { background-position: 100% 50%; }
}
.btn:hover {
  transform: translateY(-1px);
  box-shadow:
    0 14px 30px rgba(25, 137, 250, .38),
    0 3px 8px rgba(25, 137, 250, .22),
    inset 0 1px 0 rgba(255, 255, 255, .42);
}
.btn:active { transform: translateY(1px) scale(.992); }
.btn:disabled { cursor: default; }
.btn.is-loading { opacity: .9; }

.btn .label {
  position: relative;
  z-index: 2;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 10px;
}
.btn .label svg { width: 17px; height: 17px; }

/* loading spinner */
.spinner {
  width: 18px; height: 18px;
  border-radius: 50%;
  border: 2px solid rgba(255, 255, 255, .4);
  border-top-color: #fff;
  animation: spin .7s linear infinite;
}
@keyframes spin { to { transform: rotate(360deg); } }

/* slow shimmer sweep */
.btn::before {
  content: "";
  position: absolute;
  top: 0; bottom: 0;
  left: -60%;
  width: 45%;
  z-index: 1;
  background: linear-gradient(100deg, transparent, rgba(255, 255, 255, .45), transparent);
  transform: skewX(-18deg);
  animation: shimmer 5.5s ease-in-out infinite;
}
@keyframes shimmer {
  0%   { left: -60%; }
  55%  { left: 130%; }
  100% { left: 130%; }
}
.btn.is-loading::before { animation: none; opacity: 0; }

/* ---- footer register link ---- */
.foot {
  position: relative;
  z-index: 1;
  flex: 0 0 auto;
  text-align: center;
  padding-top: clamp(26px, 5vh, 40px);
  font-size: 14.5px;
  color: $ink-2;
  letter-spacing: .01em;
}
.foot .reg {
  position: relative;
  color: $primary;
  font-weight: 700;
  text-decoration: none;
  margin-left: 4px;
}
.foot .reg::after {
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
.foot .reg:hover::after { transform: scaleX(1); }

.legal {
  margin-top: 16px;
  font-size: 11px;
  color: $ink-3;
  letter-spacing: .04em;
}

@media (prefers-reduced-motion: reduce) {
  .orb, .btn, .btn::before { animation: none !important; }
  .btn, .field::before, .foot .reg::after { transition: none !important; }
}
</style>
