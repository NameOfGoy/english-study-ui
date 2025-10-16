import request from '@/utils/request'

// 新增标签
export function addTag(data) {
  return request({
    url: '/v1/tag/add',
    method: 'post',
    data
  })
}

// 删除标签
export function deleteTag(id) {
  return request({
    url: '/v1/tag/delete',
    method: 'post',
    data: { id }
  })
}

// 获取标签列表
export function getTagList(params) {
  return request({
    url: '/v1/tag/list',
    method: 'get',
    params
  })
}

// 获取标签详情
export function getTagDetail(id) {
  return request({
    url: '/v1/tag/detail',
    method: 'get',
    params: { id }
  })
}

// 更新标签
export function updateTag(data) {
  return request({
    url: '/v1/tag/update',
    method: 'post',
    data
  })
}