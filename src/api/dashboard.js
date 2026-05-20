import request from '@/utils/request'

// 获取今日学习看板数据
export function getDashboard() {
  return request({
    url: '/v1/dashboard',
    method: 'get'
  })
}
