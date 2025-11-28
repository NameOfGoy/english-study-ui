import request from '@/utils/request'

// 练习操作常量
export const PRACTISE_OPERATION = {
  COMPLETE: 1,
  FAIL: 2
}

// 单词类型常量
export const WORD_TYPE = {
  ALL: 0,    // 都行
  WORD: 1,   // 单词
  PHRASE: 2  // 短语
}

// ==================== 学习模式 ====================
// 获取学习模式单词卡片列表
// params: { count?: number, random?: boolean, word_type?: number }
// word_type: 0-都行 1-单词 2-短语
export function getStudyWordCardList(params) {
  return request({
    url: '/v1/practise/study/list',
    method: 'get',
    params
  })
}

// 完成学习
// data: { word_id: number, word_type: number }
// word_type: 1-单词 2-短语
export function finishStudy(data) {
  return request({
    url: '/v1/practise/study/finish',
    method: 'post',
    data
  })
}

// ==================== 复习模式 ====================
// 获取复习模式单词卡片列表
// params: { count?: number, random?: boolean, word_type?: number }
// word_type: 0-都行 1-单词 2-短语
export function getReviewWordCardList(params) {
  return request({
    url: '/v1/practise/review/list',
    method: 'get',
    params
  })
}

// 完成复习或复习失败
// data: { word_id: number, word_type: number, operation: 1 | 2 }
// word_type: 1-单词 2-短语, operation: 1-完成复习 2-复习失败
export function finishReview(data) {
  return request({
    url: '/v1/practise/review/finish',
    method: 'post',
    data
  })
}

// ==================== 强化模式 ====================
// 获取强化模式单词卡片列表
// params: { count?: number, random?: boolean, word_type?: number }
// word_type: 0-都行 1-单词 2-短语
export function getStrengthWordCardList(params) {
  return request({
    url: '/v1/practise/strength/list',
    method: 'get',
    params
  })
}

// 完成强化或强化失败
// data: { word_id: number, word_type: number, operation: 1 | 2 }
// word_type: 1-单词 2-短语, operation: 1-完成强化 2-强化失败
export function finishStrength(data) {
  return request({
    url: '/v1/practise/strength/finish',
    method: 'post',
    data
  })
}

// ==================== 抽查模式 ====================
// 获取抽查模式单词卡片列表
// params: { count?: number, random?: boolean, word_type?: number }
// word_type: 0-都行 1-单词 2-短语
export function getSpotWordCardList(params) {
  return request({
    url: '/v1/practise/spot/list',
    method: 'get',
    params
  })
}

// 完成抽查或抽查失败
// data: { word_id: number, word_type: number, operation: 1 | 2 }
// word_type: 1-单词 2-短语, operation: 1-完成抽查 2-抽查失败
export function finishSpot(data) {
  return request({
    url: '/v1/practise/spot/finish',
    method: 'post',
    data
  })
}

// 统一的模式映射，便于按模式动态调用
export const PRACTISE_MODE = {
  STUDY: 'study',
  REVIEW: 'review',
  STRENGTH: 'strength',
  SPOT: 'spot'
}

// 按模式获取列表（可选的通用方法）
// params: { count?: number, random?: boolean, word_type?: number }
// word_type: 0-都行 1-单词 2-短语
export function getWordCardListByMode(mode, params) {
  const url = `/v1/practise/${mode}/list`
  return request({ url, method: 'get', params })
}

// 按模式完成（可选的通用方法）
// data: 对应模式的完成参数，必须包含 word_type 字段
// word_type: 1-单词 2-短语
export function finishByMode(mode, data) {
  const url = `/v1/practise/${mode}/finish`
  return request({ url, method: 'post', data })
}