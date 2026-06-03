import request from '@/utils/request'
import { getToken } from '@/utils/auth'

// AI 桥文件上传: 传到私有桶 cc-uploads, 返回带签名 token 的临时下载地址 (admin only).
// 返回 { code, file_url(相对 /api/v1/cc/download?t=...), file_name, file_mime, file_size, expires_at }
// file_url 是相对地址, 调用方拼 location.origin 得到 CC 能 curl 的绝对地址.
export function uploadChatFile(file) {
  const formData = new FormData()
  formData.append('file', file)
  return request({
    url: '/v1/cc/upload-file',
    method: 'post',
    data: formData,
    headers: {
      'Content-Type': 'multipart/form-data',
      Authorization: `Bearer ${getToken()}`,
    },
    timeout: 60000, // 文件上传放宽超时 (默认可能偏短)
  })
}

// 进 /admin/chat 二次门禁登录: 用 AccessKey 换 access + refresh token (admin only).
// 返回 { code, access_token, refresh_token, access_expires_at, refresh_expires_at, ws_url }
export function relayLogin(accessKey) {
  return request({
    url: '/v1/cc/relay-login',
    method: 'post',
    data: { access_key: accessKey },
  })
}

// 用 refresh token 换新 access + 新 refresh (rotation: 旧 refresh 同步作废).
// 返回结构同 relayLogin.
export function relayRefresh(refreshToken) {
  return request({
    url: '/v1/cc/relay-refresh',
    method: 'post',
    data: { refresh_token: refreshToken },
  })
}
