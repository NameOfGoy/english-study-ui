import request from '@/utils/request'

// 生成分享码
export function generateShare(data) {
  return request({
    url: '/v1/share/generate',
    method: 'post',
    data
  })
}

// 预览分享码内容
export function previewShare(token) {
  return request({
    url: '/v1/share/preview',
    method: 'post',
    data: { token }
  })
}

// 获取分享中某个词的详情
export function getShareWordDetail(data) {
  return request({
    url: '/v1/share/word-detail',
    method: 'post',
    data
  })
}

// 导入分享码
export function importShare(data) {
  return request({
    url: '/v1/share/import',
    method: 'post',
    data
  })
}
