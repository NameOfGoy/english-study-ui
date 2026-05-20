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
export function importWord(filePath, fileName) {
  return request({
    url: '/v1/dictionary/operation/import',
    method: 'post',
    data: { file_path: filePath, file_name: fileName }
  })
}

// 获取导入任务列表 (params 支持 start_date, end_date, days)
export function getImportTaskList(params = {}) {
  return request({
    url: '/v1/dictionary/operation/import/tasks',
    method: 'get',
    params
  })
}

// 批量导出单词
export function exportWord() {
  return request({
    url: '/v1/dictionary/operation/export',
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

// ==================== 单词状态相关接口 ====================

// 获取单词状态列表
export function getWordStatusList(word_id, word_type) {
  const params = {}
  if (typeof word_id !== 'undefined') {
    params.word_id = word_id
    params.word_type = typeof word_type !== 'undefined' ? word_type : 1
  } else if (typeof word_type !== 'undefined') {
    params.word_type = word_type
  }
  return request({
    url: '/v1/dictionary/status/list',
    method: 'get',
    params,
    paramsSerializer: {
      indexes: null // This ensures arrays are serialized as param=value1&param=value2
    }
  })
}

// 修改单词状态
export function updateWordStatus(data) {
  const payload = { ...data }
  if (typeof payload.word_type === 'undefined') {
    payload.word_type = 1
  }
  return request({
    url: '/v1/dictionary/status/update',
    method: 'post',
    data: payload
  })
}

// ==================== 单词标签相关接口 ====================

// 获取单词标签列表
export function getWordTagList(word_id, word_type) {
  const params = {}
  if (typeof word_id !== 'undefined') {
    params.word_id = word_id
    params.word_type = typeof word_type !== 'undefined' ? word_type : 1
  } else if (typeof word_type !== 'undefined') {
    params.word_type = word_type
  }
  return request({
    url: '/v1/dictionary/tag/list',
    method: 'get',
    params,
    paramsSerializer: {
      indexes: null // This ensures arrays are serialized as param=value1&param=value2
    }
  })
}

// 修改单词标签
export function updateWordTag(data) {
  const payload = { ...data }
  if (typeof payload.word_type === 'undefined') {
    payload.word_type = 1
  }
  // 兼容旧参数名：tag_ids / tagIds -> tags
  if (!payload.tags && (payload.tag_ids || payload.tagIds)) {
    payload.tags = payload.tag_ids || payload.tagIds
  }
  // 移除旧参数名避免后端误解析
  delete payload.tag_ids
  delete payload.tagIds

  return request({
    url: '/v1/dictionary/tag/update',
    method: 'post',
    data: payload
  })
}

// ==================== 短语相关接口 ====================

// 获取短语列表
export function getWordPhraseList(params) {
  return request({
    url: '/v1/dictionary/phrase/list',
    method: 'get',
    params
  })
}

// 获取短语详情
export function getWordPhraseDetail(id) {
  return request({
    url: '/v1/dictionary/phrase/detail',
    method: 'get',
    params: { id }
  })
}

// 添加短语
export function addWordPhrase(data) {
  return request({
    url: '/v1/dictionary/phrase/add',
    method: 'post',
    data
  })
}

// 更新短语
export function updateWordPhrase(data) {
  return request({
    url: '/v1/dictionary/phrase/update',
    method: 'post',
    data
  })
}

// 删除短语
export function deleteWordPhrase(id) {
  return request({
    url: '/v1/dictionary/phrase/delete',
    method: 'delete',
    data: { id }
  })
}

// 生成短语图片
export function generatePhrasePicture(phraseId) {
  return request({
    url: '/v1/dictionary/phrase/picture',
    method: 'post',
    data: { id: phraseId }
  })
}

// 更新短语图片
export function updatePhrasePicture(data) {
  return request({
    url: '/v1/dictionary/phrase/picture/update',
    method: 'post',
    data
  })
}

// 批量更新单词释义 (按 word_pos_id)
export function updateWordTranslation(items) {
  return request({
    url: '/v1/dictionary/word/translation/update',
    method: 'post',
    data: { items }
  })
}

// 中文搜索stardict词库
export function searchStardict(params) {
  return request({
    url: '/v1/dictionary/search/stardict',
    method: 'get',
    params
  })
}

// 批量添加stardict词条到个人词典
export function batchAddStardict(data) {
  return request({
    url: '/v1/dictionary/search/batch-add',
    method: 'post',
    data
  })
}