const TOKEN_KEY = 'english_study_token'
const USER_INFO_KEY = 'english_study_user_info'
const REMEMBER_PASSWORD_KEY = 'english_study_remember_password'
const SAVED_ACCOUNT_KEY = 'english_study_saved_account'
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
  return userInfo ? JSON.parse(userInfo) : null
}

export function setUserInfo(userInfo) {
  localStorage.setItem(USER_INFO_KEY, JSON.stringify(userInfo))
}

export function removeUserInfo() {
  localStorage.removeItem(USER_INFO_KEY)
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

export function getSavedPassword() {
  return localStorage.getItem(SAVED_PASSWORD_KEY) || ''
}

export function setSavedPassword(password) {
  localStorage.setItem(SAVED_PASSWORD_KEY, password)
}

export function removeSavedCredentials() {
  localStorage.removeItem(SAVED_ACCOUNT_KEY)
  localStorage.removeItem(SAVED_PASSWORD_KEY)
  localStorage.removeItem(REMEMBER_PASSWORD_KEY)
}

// 清除所有本地数据
export function clearAllData() {
  removeToken()
  removeUserInfo()
  removeSavedCredentials()
}