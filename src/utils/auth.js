const TOKEN_KEY = 'english_study_token'
const USER_INFO_KEY = 'english_study_user_info'
const USER_ID_KEY = 'english_study_user_id'
const USER_ROLE_KEY = 'english_study_user_role' // 0=普通 1=超管, 仅 UI 用; 真鉴权在服务端 JWT
const REMEMBER_PASSWORD_KEY = 'english_study_remember_password'
const SAVED_ACCOUNT_KEY = 'english_study_saved_account'

export const ROLE_NORMAL = 0
export const ROLE_ADMIN = 1
// 注：密码明文写 localStorage 是已知风险（XSS / DevTools / 任何同源脚本都能读），
// 用户主动保留这个体验（自动登录优先于安全），见 memory: feedback-remember-password
const SAVED_PASSWORD_KEY = 'english_study_saved_password'

// Token相关
export function getToken() {
  return localStorage.getItem(TOKEN_KEY)
}

export function setToken(token) {
  localStorage.setItem(TOKEN_KEY, token)
}

export function removeToken() {
  localStorage.removeItem(TOKEN_KEY)
}

// 用户信息相关
export function getUserInfo() {
  const userInfo = localStorage.getItem(USER_INFO_KEY)
  if (!userInfo) return null
  try {
    return JSON.parse(userInfo)
  } catch (e) {
    // 损坏/被篡改的 localStorage 不要让整个应用崩, 清掉重来
    console.warn('getUserInfo: JSON 解析失败, 清空缓存', e)
    localStorage.removeItem(USER_INFO_KEY)
    return null
  }
}

// 解析 JWT exp, 主动检查是否过期; 解析失败一律视为过期 (安全起见)
export function isTokenExpired() {
  const token = getToken()
  if (!token) return true
  try {
    const parts = token.split('.')
    if (parts.length !== 3) return true
    const payload = JSON.parse(atob(parts[1].replace(/-/g, '+').replace(/_/g, '/')))
    if (!payload.exp) return true
    return Date.now() >= payload.exp * 1000
  } catch (e) {
    return true
  }
}

export function setUserInfo(userInfo) {
  localStorage.setItem(USER_INFO_KEY, JSON.stringify(userInfo))
}

export function removeUserInfo() {
  localStorage.removeItem(USER_INFO_KEY)
}

// 用户ID相关
export function getUserId() {
  return localStorage.getItem(USER_ID_KEY)
}

export function setUserId(userId) {
  localStorage.setItem(USER_ID_KEY, userId.toString())
}

export function removeUserId() {
  localStorage.removeItem(USER_ID_KEY)
}

// 角色: 仅前端 UI 显隐用 (隐藏系统标签编辑按钮等), 真正权限校验在服务端 JWT 中
export function setRole(role) {
  if (role === undefined || role === null) {
    localStorage.removeItem(USER_ROLE_KEY)
    return
  }
  localStorage.setItem(USER_ROLE_KEY, String(Number(role) || 0))
}

export function getRole() {
  const v = localStorage.getItem(USER_ROLE_KEY)
  if (v !== null) return Number(v) || 0
  // localStorage 没存 (老会话遗留, 升级前登录的) → 尝试从 JWT claims 里读 role.
  // JWT 由后端 HMAC 签过名, 这里只用来取 role 字段做 UI 显隐;
  // 真正的权限校验仍然在后端用同一份 JWT 二次解码 + role 判断.
  const token = getToken()
  if (!token) return 0
  try {
    const parts = token.split('.')
    if (parts.length !== 3) return 0
    const payload = JSON.parse(atob(parts[1].replace(/-/g, '+').replace(/_/g, '/')))
    const role = Number(payload.role)
    if (Number.isFinite(role)) {
      // 顺手回填 localStorage, 下次直接命中
      try { localStorage.setItem(USER_ROLE_KEY, String(role)) } catch (_) {}
      return role
    }
  } catch (_) {}
  return 0
}

export function isAdmin() {
  return getRole() === ROLE_ADMIN
}

export function removeRole() {
  localStorage.removeItem(USER_ROLE_KEY)
}

// 记住密码相关
export function getRememberPassword() {
  return localStorage.getItem(REMEMBER_PASSWORD_KEY) === 'true'
}

export function setRememberPassword(remember) {
  localStorage.setItem(REMEMBER_PASSWORD_KEY, remember.toString())
}

export function getSavedAccount() {
  return localStorage.getItem(SAVED_ACCOUNT_KEY) || ''
}

export function setSavedAccount(account) {
  localStorage.setItem(SAVED_ACCOUNT_KEY, account)
}

// 密码持久化：用户主动选择把密码缓存到 localStorage 换取自动登录体验。
// 详见 memory: feedback-remember-password。不要再以"XSS 风险"为由把这里改成 no-op。
export function getSavedPassword() {
  return localStorage.getItem(SAVED_PASSWORD_KEY) || ''
}

export function setSavedPassword(password) {
  if (password) {
    localStorage.setItem(SAVED_PASSWORD_KEY, password)
  } else {
    localStorage.removeItem(SAVED_PASSWORD_KEY)
  }
}

export function removeSavedCredentials() {
  localStorage.removeItem(SAVED_ACCOUNT_KEY)
  localStorage.removeItem(SAVED_PASSWORD_KEY)
  localStorage.removeItem(REMEMBER_PASSWORD_KEY)
}

// 清除会话（退出登录用）：只擦掉 token + 用户信息 + role，"记住的账号 + 密码 + 勾选状态"保留。
export function clearAllData() {
  removeToken()
  removeUserInfo()
  removeUserId()
  removeRole()
}

// 清除所有本地数据（包括"记住的账号 + 密码"）—— 给"忘记我"之类的功能预留，目前未使用
export function clearAllDataAndCredentials() {
  clearAllData()
  removeSavedCredentials()
}