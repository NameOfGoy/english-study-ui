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

// 生成词性图片
export function generateWordPicture(wordPosId) {
  return request({
    url: '/v1/dictionary/word/picture',
    method: 'post',
    data: { word_pos_id: wordPosId }
  })
}

// 更新词性图片
export function updateWordPicture(data) {
  return request({
    url: '/v1/dictionary/word/picture/update',
    method: 'post',
    data
  })
}

// 删除词性图片
export function deleteWordPicture(wordPosId) {
  return request({
    url: '/v1/dictionary/word/picture/delete',
    method: 'post',
    data: { word_pos_id: wordPosId }
  })
}

// 更新例句
export function updateExample(data) {
  return request({
    url: '/v1/dictionary/example/update',
    method: 'post',
    data
  })
}

// 生成例句
export function generateExample(data) {
  return request({
    url: '/v1/dictionary/example/generate',
    method: 'post',
    data
  })
}