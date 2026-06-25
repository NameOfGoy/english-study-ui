import request from '@/utils/request'
import { uploadAvatarFlow } from '@/api/file'

// 用户登录
export function login(data) {
  return request({
    url: '/v1/user/login',
    method: 'post',
    data
  })
}

// 用户注册
export function register(data) {
  return request({
    url: '/v1/user/register',
    method: 'post',
    data
  })
}

// 修改密码 (JWT, token 由请求层自动带) —— data = { old_password, new_password }
export function changePassword(data) {
  return request({
    url: '/v1/user/password',
    method: 'post',
    data
  })
}

// 获取用户信息
export function getUserInfo(id) {
  return request({
    url: `/v1/user/${id}`,
    method: 'get'
  })
}

// 更新用户信息
export function updateUserInfo(id, data) {
  return request({
    url: `/v1/user/${id}`,
    method: 'put',
    data
  })
}

// 更新用户头像的完整流程
export async function updateUserAvatar(userId) {
  try {
    // 1. 获取当前用户信息
    const currentUserInfo = await getUserInfo(userId)
    if (currentUserInfo.code !== 0) {
      throw new Error('获取用户信息失败')
    }
    
    // 2. 上传头像文件
    const avatarPath = await uploadAvatarFlow(userId)
    
    // 3. 更新用户信息中的头像字段，保留其他字段
    const updateResult = await updateUserInfo(userId, {
      data: {
        ...currentUserInfo.data,
        avatar: avatarPath
      }
    })
    
    if (updateResult.code === 0) {
      // 4. 重新获取用户信息
      const userInfo = await getUserInfo(userId)
      return userInfo
    } else {
      throw new Error(updateResult.message || '更新头像失败')
    }
  } catch (error) {
    console.error('头像更新流程失败:', error)
    throw error
  }
}