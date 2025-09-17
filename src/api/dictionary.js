import request from '@/utils/request'

// 获取单词列表
export function getWordList(params) {
  return request({
    url: '/v1/dictionary/word/list',
    method: 'get',
    params
  })
}

// 获取单词详情
export function getWordDetail(id) {
  return request({
    url: '/v1/dictionary/word/detail',
    method: 'get',
    params: { id }
  })
}

// 添加单词
export function addWord(data) {
  return request({
    url: '/v1/dictionary/word/add',
    method: 'post',
    data
  })
}

// 删除单词
export function deleteWord(id) {
  return request({
    url: '/v1/dictionary/word/delete',
    method: 'post',
    data: { id }
  })
}

// 更新单词
export function updateWord(data) {
  return request({
    url: '/v1/dictionary/word/update',
    method: 'post',
    data
  })
}

// 批量导入单词
export function importWord(filePath) {
  return request({
    url: '/v1/dictionary/word/import',
    method: 'post',
    data: { file_path: filePath }
  })
}

// 批量导出单词
export function exportWord() {
  return request({
    url: '/v1/dictionary/word/export',
    method: 'post',
    data: {}
  })
}