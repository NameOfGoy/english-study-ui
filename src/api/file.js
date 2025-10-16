import request from '@/utils/request'
import { getToken } from '@/utils/auth'

/**
 * 文件上传
 * @param {File} file - 要上传的文件
 * @param {string} bucket - 桶名，固定为 englishstudy
 * @param {string} object - 对象名，格式：/avatar/$userId/$fileName
 * @returns {Promise} 返回包含path字段的响应
 */
export function uploadFile(file, bucket = 'englishstudy', object) {
  const formData = new FormData()
  formData.append('file', file)
  formData.append('bucket', bucket)
  formData.append('object', object)

  return request({
    url: '/v1/file-service/upload',
    method: 'post',
    data: formData,
    headers: {
      'Content-Type': 'multipart/form-data',
      'Authorization': `Bearer ${getToken()}`
    }
  })
}

/**
 * 文件下载/获取文件URL
 * @param {string} path - 文件路径
 * @returns {Promise} 返回包含url字段的响应
 */
export function downloadFile(path) {
  return request({
    url: '/v1/file-service/download',
    method: 'get',
    params: {
      path
    },
    headers: {
      'Authorization': `Bearer ${getToken()}`
    }
  })
}

/**
 * 上传头像的便捷方法
 * @param {File} file - 头像文件
 * @param {string} userId - 用户ID
 * @returns {Promise} 返回上传结果
 */
export function uploadAvatar(file, userId) {
  const fileName = file.name
  const object = `avatar/${userId}/${fileName}`
  return uploadFile(file, 'englishstudy', object)
}

/**
 * 创建文件选择器
 * @param {string} accept - 接受的文件类型，默认为图片
 * @param {boolean} multiple - 是否允许多选
 * @returns {Promise<FileList>} 返回选择的文件列表
 */
export function selectFiles(accept = 'image/*', multiple = false) {
  return new Promise((resolve, reject) => {
    const input = document.createElement('input')
    input.type = 'file'
    input.accept = accept
    input.multiple = multiple
    
    input.onchange = (event) => {
      const files = event.target.files
      if (files && files.length > 0) {
        resolve(files)
      } else {
        reject(new Error('未选择文件'))
      }
    }
    
    input.oncancel = () => {
      reject(new Error('用户取消选择'))
    }
    
    // 触发文件选择
    input.click()
  })
}

/**
 * 头像上传的完整流程
 * @param {string} userId - 用户ID
 * @returns {Promise<string>} 返回上传后的文件路径
 */
export async function uploadAvatarFlow(userId) {
  try {
    // 1. 选择文件
    const files = await selectFiles('image/*', false)
    const file = files[0]
    
    // 2. 验证文件
    if (!file) {
      throw new Error('请选择文件')
    }
    
    // 验证文件大小（限制为5MB）
    if (file.size > 5 * 1024 * 1024) {
      throw new Error('文件大小不能超过5MB')
    }
    
    // 验证文件类型
    if (!file.type.startsWith('image/')) {
      throw new Error('请选择图片文件')
    }
    
    // 3. 上传文件
    const uploadResult = await uploadAvatar(file, userId)
    
    if (uploadResult.code === 0) {
      if (uploadResult.path) {
        return uploadResult.path
      } else {
        throw new Error('上传成功但未返回文件路径')
      }
    } else {
      throw new Error(uploadResult.message || '上传失败')
    }
  } catch (error) {
    console.error('头像上传失败:', error)
    throw error
  }
}