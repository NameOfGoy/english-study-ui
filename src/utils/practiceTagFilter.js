// 练习页全局标签筛选: 持久化在 localStorage, 跨页生效.
// 约定 (与后端 GetWordCardListReq.TagIDs 一致):
//   空数组 / null → "全部" 模式, 不筛选
//   [id1, id2, ...] → 只取打了任一标签的词条

const KEY = 'english_study_practice_tag_filter'

export function getPracticeTagFilter() {
  try {
    const raw = localStorage.getItem(KEY)
    if (!raw) return []
    const parsed = JSON.parse(raw)
    if (!Array.isArray(parsed)) return []
    return parsed.map((x) => Number(x) || 0).filter((x) => x > 0)
  } catch (e) {
    return []
  }
}

export function setPracticeTagFilter(ids) {
  if (!Array.isArray(ids) || ids.length === 0) {
    localStorage.removeItem(KEY)
    return
  }
  localStorage.setItem(KEY, JSON.stringify(ids))
}

export function clearPracticeTagFilter() {
  localStorage.removeItem(KEY)
}
