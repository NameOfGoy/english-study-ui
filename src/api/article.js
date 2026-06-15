import request from '@/utils/request'

// 文章练习 API
// 注意: 凡带 tag_ids 的 GET 都要 paramsSerializer:{indexes:null}, 让数组以 tag_ids=1&tag_ids=2
// 重复参数形式发送(go-zero form:"tag_ids" []uint 才能解析). practise.js 漏了序列化器, 勿照抄.

// 即时生成文章(同步; 后端该路由 60s 超时, 前端放宽到 120s 以防网络抖动)
// data: { method:1随机|2自选, count?, status?, category?, tag_ids?:[], words?:[{word_id,word_type}] }
export function generateArticle(data) {
  return request({
    url: '/v1/practise/article/generate',
    method: 'post',
    data,
    timeout: 120000
  })
}

// 自选候选词列表
// params: { status, category, tag_ids?:[] }
export function getArticleCandidates(params) {
  return request({
    url: '/v1/practise/article/candidates',
    method: 'get',
    params,
    paramsSerializer: { indexes: null }
  })
}

// 收录已生成的文章
// data: { title_en, title_zh, sentences:[{en,zh}], used_words:[{word_id,word_type,word,surfaces,...}] }
export function saveArticle(data) {
  return request({
    url: '/v1/practise/article/save',
    method: 'post',
    data
  })
}

// 收录列表(分页 + 搜索 + 标签多选)
// params: { offset, limit, keyword?, tag_ids?:[] }
export function getArticleList(params) {
  return request({
    url: '/v1/practise/article/list',
    method: 'get',
    params,
    paramsSerializer: { indexes: null }
  })
}

// 文章详情
export function getArticleDetail(id) {
  return request({
    url: '/v1/practise/article/detail',
    method: 'get',
    params: { id }
  })
}

// 词条简要批量(按文本; 缺失返回 found=false)
// words: [{ word, type }]
export function getArticleWordsInfo(words) {
  return request({
    url: '/v1/practise/article/words/info',
    method: 'post',
    data: { words }
  })
}
