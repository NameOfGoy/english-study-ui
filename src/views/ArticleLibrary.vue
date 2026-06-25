<template>
  <div class="article-library" :class="{ 'is-selecting': selectMode }">
    <PracticeHeader title="收录文章" @back="goHome" />

    <div class="lib-body">
      <!-- ===== editorial header on the wash ===== -->
      <header class="lib-intro">
        <div class="lib-intro-main">
          <span class="es-eyebrow">SAVED · 文章库</span>
          <h2 class="es-title">收录<span class="accent">文章</span></h2>
          <p class="lib-sub"><span class="rule" aria-hidden="true"></span>搜索标题或它收纳的单词</p>
        </div>
        <button
          v-if="list.length"
          type="button"
          class="lib-select-toggle"
          :class="{ active: selectMode }"
          @click="toggleSelectMode"
        >{{ selectMode ? '取消' : '多选' }}</button>
      </header>

      <!-- 搜索 + 标签筛选 -->
      <div class="lib-filters es-card">
        <van-search v-model="keyword" placeholder="搜索标题或包含的单词" />
        <div class="tag-filter">
          <div class="tf-header" @click="tagExpanded = !tagExpanded">
            <span class="tf-label"><van-icon name="label-o" /> 标签筛选 <span class="tf-summary">{{ tagSummary }}</span></span>
            <van-icon class="tf-chevron" :name="tagExpanded ? 'arrow-up' : 'arrow-down'" />
          </div>
          <div v-if="tagExpanded" class="tf-body">
            <ArticleTagPicker v-model="tagIds" :multiple="true" />
          </div>
        </div>
      </div>

      <!-- 列表 -->
      <div class="lib-list">
        <van-list
          v-model:loading="loading"
          :finished="finished"
          finished-text="没有更多了"
          @load="onLoad"
        >
          <!-- 多选模式: 整行点击切换勾选, 禁用左滑/跳转 -->
          <template v-if="selectMode">
            <div
              v-for="item in list"
              :key="item.id"
              class="art-row es-card art-row--select"
              :class="{ 'is-checked': selectedIds.has(item.id) }"
              @click="toggleSelect(item)"
            >
              <van-checkbox
                class="art-check"
                :model-value="selectedIds.has(item.id)"
                @click.stop="toggleSelect(item)"
              />
              <div class="art-main">
                <div class="art-title">
                  <template v-if="item.title_en">{{ item.title_en }}<span v-if="item.title_zh" class="art-title-zh">（{{ item.title_zh }}）</span></template>
                  <template v-else>{{ item.title_zh }}</template>
                </div>
                <div v-if="item.tags && item.tags.length" class="art-tags">
                  <span
                    v-for="t in item.tags"
                    :key="t.tag_id"
                    class="es-pill art-tag"
                    :style="{ background: t.style || '#1989fa' }"
                  >{{ t.name }}</span>
                </div>
                <div v-if="item.words && item.words.length" class="art-words">
                  {{ item.words.join(' · ') }}
                </div>
              </div>
            </div>
          </template>

          <!-- 普通模式: 左滑露出删除, 点条目进详情 -->
          <template v-else>
            <van-swipe-cell
              v-for="item in list"
              :key="item.id"
              class="art-swipe"
            >
              <div
                class="art-row es-card"
                @click="openDetail(item)"
              >
                <div class="art-title">
                  <template v-if="item.title_en">{{ item.title_en }}<span v-if="item.title_zh" class="art-title-zh">（{{ item.title_zh }}）</span></template>
                  <template v-else>{{ item.title_zh }}</template>
                </div>

                <div v-if="item.tags && item.tags.length" class="art-tags">
                  <span
                    v-for="t in item.tags"
                    :key="t.tag_id"
                    class="es-pill art-tag"
                    :style="{ background: t.style || '#1989fa' }"
                  >{{ t.name }}</span>
                </div>

                <div v-if="item.words && item.words.length" class="art-words">
                  {{ item.words.join(' · ') }}
                </div>

                <span class="art-go" aria-hidden="true">
                  <svg viewBox="0 0 24 24" fill="none">
                    <path d="M9 6.5 14.5 12 9 17.5" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                  </svg>
                </span>
              </div>

              <template #right>
                <button
                  type="button"
                  class="art-del-btn"
                  @click="confirmSingleDelete(item)"
                >删除</button>
              </template>
            </van-swipe-cell>
          </template>
        </van-list>

        <van-empty v-if="finished && list.length === 0" :description="emptyText" />
      </div>
    </div>

    <!-- 多选底部操作条 -->
    <div v-if="selectMode" class="lib-actionbar">
      <button type="button" class="lib-ab-select" @click="toggleSelectAll">
        {{ allSelected ? '取消全选' : '全选' }}
      </button>
      <span class="lib-ab-count">已选 {{ selectedIds.size }} 篇</span>
      <button
        type="button"
        class="lib-ab-del"
        :disabled="selectedIds.size === 0"
        @click="confirmBatchDelete"
      >删除</button>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, watch } from 'vue'
import { useRouter } from 'vue-router'
import { showConfirmDialog, showToast } from 'vant'
import PracticeHeader from '@/components/practice/PracticeHeader.vue'
import ArticleTagPicker from '@/components/article/ArticleTagPicker.vue'
import { getArticleList, deleteArticle, batchDeleteArticle } from '@/api/article'

const router = useRouter()
const LIMIT = 10

const keyword = ref('')
const tagIds = ref([])
const tagExpanded = ref(false)

const list = ref([])
const total = ref(0)
const loading = ref(false)
const finished = ref(false)

// ---- 多选模式 ----
const selectMode = ref(false)
const selectedIds = ref(new Set())

const allSelected = computed(
  () => list.value.length > 0 && selectedIds.value.size === list.value.length
)

const toggleSelectMode = () => {
  selectMode.value = !selectMode.value
  selectedIds.value = new Set() // 进入/退出都清空已选
}

const toggleSelect = (item) => {
  const next = new Set(selectedIds.value)
  if (next.has(item.id)) next.delete(item.id)
  else next.add(item.id)
  selectedIds.value = next
}

const toggleSelectAll = () => {
  if (allSelected.value) {
    selectedIds.value = new Set()
  } else {
    selectedIds.value = new Set(list.value.map((it) => it.id))
  }
}

// 就地移除若干行后, 同步 total 并处理"删空但服务端还有"的边界
const afterRemove = (removedCount) => {
  total.value = Math.max(0, total.value - removedCount)
  if (list.value.length === 0 && total.value > 0) {
    reload() // 当前页删空但服务端仍有未加载 → 重拉首页
  }
}

// 单删(左滑删除按钮)
const confirmSingleDelete = async (item) => {
  const title = item.title_en || item.title_zh || '这篇文章'
  try {
    await showConfirmDialog({
      title: '删除文章',
      message: `确定删除《${title}》吗？删除后不可恢复。`,
      confirmButtonText: '删除',
      confirmButtonColor: '#ee0a24'
    })
  } catch (_) {
    return // 用户取消
  }
  try {
    await deleteArticle(item.id)
    const idx = list.value.findIndex((it) => it.id === item.id)
    if (idx !== -1) list.value.splice(idx, 1)
    afterRemove(1)
  } catch (_) { /* 失败已由拦截器 toast */ }
}

// 批删(底部操作条)
const confirmBatchDelete = async () => {
  const ids = [...selectedIds.value]
  if (ids.length === 0) return
  try {
    await showConfirmDialog({
      title: '批量删除',
      message: `确定删除选中的 ${ids.length} 篇文章吗？删除后不可恢复。`,
      confirmButtonText: '删除',
      confirmButtonColor: '#ee0a24'
    })
  } catch (_) {
    return // 用户取消
  }
  try {
    const resp = await batchDeleteArticle(ids)
    const n = resp?.deleted ?? ids.length // 用后端实际删除篇数维护 total, 避免漂移
    const idSet = new Set(ids)
    list.value = list.value.filter((it) => !idSet.has(it.id))
    afterRemove(n)
    selectMode.value = false
    selectedIds.value = new Set()
    showToast(`已删除 ${n} 篇`)
  } catch (_) { /* 失败已由拦截器 toast */ }
}

const hasFilter = computed(() => keyword.value.trim() !== '' || tagIds.value.length > 0)
const emptyText = computed(() => (hasFilter.value ? '没有匹配的文章' : '还没有收录任何文章'))
const tagSummary = computed(() => (tagIds.value.length ? `已选 ${tagIds.value.length} 个` : '全部'))

const onLoad = async () => {
  try {
    const resp = await getArticleList({
      offset: list.value.length,
      limit: LIMIT,
      keyword: keyword.value.trim(),
      tag_ids: tagIds.value
    })
    const data = resp.data || []
    list.value.push(...data)
    total.value = resp.total_count || 0
    if (data.length === 0 || list.value.length >= total.value) {
      finished.value = true
    }
  } catch (e) {
    finished.value = true // 防止失败时 van-list 反复触发
  } finally {
    loading.value = false
  }
}

const reload = () => {
  list.value = []
  total.value = 0
  finished.value = false
  loading.value = true
  selectMode.value = false
  selectedIds.value = new Set()
  onLoad()
}

// 关键词防抖 + 标签即时, 变更后重载
let kwTimer = null
watch(keyword, () => {
  if (kwTimer) clearTimeout(kwTimer)
  kwTimer = setTimeout(reload, 300)
})
watch(tagIds, reload, { deep: true })

const openDetail = (item) => {
  router.push(`/practice/article/library/${item.id}`)
}
const goHome = () => {
  router.push('/practice')
}
</script>

<style lang="scss" scoped>
/* ============================================================
   收录文章 — editorial library on the cool wash
   Eyebrow + oversized title header, refined search bar,
   each article a soft hairline es-card row.
   ============================================================ */
.article-library {
  min-height: 100vh;
  background: transparent; // let the global wash show through
  padding-bottom: 72px;    // keep clearance for the tab bar

  // 多选时为底部固定操作条额外留白, 避免遮住最后一行
  &.is-selecting {
    padding-bottom: calc(132px + env(safe-area-inset-bottom, 0px));
  }
}

.lib-body {
  padding: 0 16px;
}

/* ---- editorial intro lockup ---- */
.lib-intro {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 12px;
  padding: 22px 4px 16px;
}
.lib-intro-main {
  min-width: 0;
}
.es-title {
  font-size: 30px;
  margin-top: 8px;
}

/* 多选入口 / 取消 — 克制的文字按钮, 与标题区右上对齐 */
.lib-select-toggle {
  flex: 0 0 auto;
  margin-top: 4px;
  padding: 7px 14px;
  font-size: 13px;
  font-weight: 600;
  letter-spacing: .02em;
  color: var(--es-primary);
  background: var(--es-surface);
  border: 1px solid var(--es-hair);
  border-radius: 999px;
  box-shadow: var(--es-shadow-soft);
  cursor: pointer;
  transition: background .18s var(--es-ease), border-color .18s var(--es-ease), color .18s var(--es-ease);
  -webkit-tap-highlight-color: transparent;

  &:active { transform: translateY(1px); }
  &.active {
    color: var(--es-ink-2);
    background: var(--es-hair-soft);
    border-color: var(--es-hair);
  }
}
.lib-sub {
  display: flex;
  align-items: center;
  gap: 10px;
  margin-top: 12px;
  font-size: 13.5px;
  color: var(--es-ink-2);
  letter-spacing: .01em;

  .rule {
    flex: 0 0 auto;
    width: 26px;
    height: 2px;
    border-radius: 2px;
    background: linear-gradient(90deg, var(--es-primary), var(--es-grad-b));
  }
}

/* ---- search + tag filter card ---- */
.lib-filters {
  padding: 6px 8px 4px;
  overflow: hidden;
}

.tag-filter {
  border-top: 1px solid var(--es-hair);
  margin-top: 4px;
}
.tf-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 12px 8px 11px;
  font-size: 13.5px;
  color: var(--es-ink);
  cursor: pointer;
  user-select: none;

  .tf-label {
    display: inline-flex;
    align-items: center;
    gap: 6px;
    font-weight: 600;
  }
  .tf-label .van-icon {
    color: var(--es-primary);
    font-size: 16px;
  }
  .tf-summary {
    color: var(--es-ink-3);
    font-size: 12.5px;
    font-weight: 500;
    margin-left: 2px;
  }
  .tf-chevron {
    color: var(--es-ink-3);
    font-size: 15px;
    transition: color .25s var(--es-ease);
  }
  &:active .tf-chevron { color: var(--es-primary); }
}
.tf-body {
  padding: 4px 8px 12px;
}

/* refined search bar — borderless on the card */
:deep(.van-search) {
  padding: 6px 4px;
  background: transparent;
}
:deep(.van-search__content) {
  background: var(--es-hair-soft);
  border-radius: 999px;
  padding-left: 14px;
  transition: box-shadow .25s var(--es-ease), background .25s var(--es-ease);
}
:deep(.van-search__content--round) { border-radius: 999px; }
:deep(.van-search .van-field__left-icon .van-icon) {
  color: var(--es-ink-3);
}
:deep(.van-search .van-cell) {
  padding: 9px 12px 9px 6px;
  background: transparent;
}
:deep(.van-search .van-field__control) {
  color: var(--es-ink);
  font-size: 15px;
}
:deep(.van-search .van-field__control::placeholder) {
  color: var(--es-ink-3);
}
:deep(.van-search__content:focus-within) {
  background: #fff;
  box-shadow: 0 0 0 1.5px var(--es-primary) inset, var(--es-shadow-soft);
}

/* ---- list ---- */
.lib-list {
  padding: 16px 0 4px;
}

/* swipe-cell wrapper carries the row spacing; inner row resets its own margin */
.art-swipe {
  display: block;
  margin-bottom: 12px;
  border-radius: var(--es-r-card);
  overflow: hidden;

  .art-row {
    margin-bottom: 0;
  }
}
/* right-swipe 红色删除按钮: 整高贴合卡片 */
.art-del-btn {
  height: 100%;
  min-height: 100%;
  padding: 0 22px;
  font-size: 15px;
  font-weight: 700;
  letter-spacing: .04em;
  color: #fff;
  background: #ee0a24;
  border: none;
  cursor: pointer;
  -webkit-tap-highlight-color: transparent;

  &:active { background: #d50018; }
}

.art-row {
  position: relative;
  padding: 16px 44px 16px 18px; // room for the chevron on the right
  margin-bottom: 12px;
  cursor: pointer;
  transition: transform .18s var(--es-ease), box-shadow .25s var(--es-ease);

  &:active {
    transform: translateY(1px) scale(.995);
    box-shadow: var(--es-shadow-soft);
  }

  .art-title {
    font-size: 16.5px;
    font-weight: 800;
    color: var(--es-ink);
    line-height: 1.4;
    letter-spacing: -.01em;
    word-break: break-word;
  }
  .art-title-zh {
    color: var(--es-ink-2);
    font-size: 14px;
    font-weight: 500;
  }

  .art-tags {
    display: flex;
    flex-wrap: wrap;
    gap: 8px;
    margin-top: 12px;
  }
  /* keep the per-tag inline :style background; soften it into a pill */
  .art-tag {
    height: 24px;
    padding: 0 12px;
    font-size: 12px;
    font-weight: 600;
    color: #fff;
    border-radius: 999px;
    box-shadow: 0 4px 12px -6px rgba(20, 30, 50, .5);
  }

  .art-words {
    font-size: 12.5px;
    color: var(--es-ink-2);
    margin-top: 12px;
    line-height: 1.55;
    word-break: break-word;
  }

  /* the editorial go-chevron */
  .art-go {
    position: absolute;
    top: 50%;
    right: 14px;
    transform: translateY(-50%);
    width: 22px;
    height: 22px;
    display: grid;
    place-items: center;
    color: var(--es-ink-3);
    transition: color .2s var(--es-ease), transform .2s var(--es-ease);
  }
  .art-go svg { width: 18px; height: 18px; display: block; }
  &:active .art-go { color: var(--es-primary); transform: translateY(-50%) translateX(2px); }
}

/* ---- 多选模式行: 前置勾选框 + 主体, 选中态描边 ---- */
.art-row--select {
  display: flex;
  align-items: flex-start;
  gap: 12px;
  padding: 16px 18px; // no chevron in select mode

  .art-check {
    flex: 0 0 auto;
    margin-top: 2px;
  }
  .art-main {
    min-width: 0;
    flex: 1;
  }
  &.is-checked {
    box-shadow: 0 0 0 1.5px var(--es-primary) inset, var(--es-shadow-soft);
  }
}
:deep(.art-check .van-checkbox__icon .van-icon) {
  border-color: var(--es-ink-3);
}
:deep(.art-check .van-checkbox__icon--checked .van-icon) {
  background-color: var(--es-primary);
  border-color: var(--es-primary);
}

/* ---- 底部多选操作条: 固定在 tabbar 之上 ---- */
.lib-actionbar {
  position: fixed;
  left: 0;
  right: 0;
  bottom: calc(50px + env(safe-area-inset-bottom, 0px)); // 浮在 50px 高的 tabbar 之上
  z-index: 20;
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 10px 16px;
  background: rgba(255, 255, 255, 0.96);
  backdrop-filter: blur(12px);
  -webkit-backdrop-filter: blur(12px);
  border-top: 1px solid var(--es-hair);
  box-shadow: 0 -6px 20px -12px rgba(20, 30, 50, .2);
}
.lib-ab-select {
  flex: 0 0 auto;
  padding: 9px 16px;
  font-size: 13.5px;
  font-weight: 600;
  color: var(--es-primary);
  background: var(--es-hair-soft);
  border: none;
  border-radius: 999px;
  cursor: pointer;
  -webkit-tap-highlight-color: transparent;

  &:active { transform: translateY(1px); }
}
.lib-ab-count {
  flex: 1;
  text-align: center;
  font-size: 13.5px;
  font-weight: 600;
  color: var(--es-ink-2);
}
.lib-ab-del {
  flex: 0 0 auto;
  padding: 9px 22px;
  font-size: 14px;
  font-weight: 700;
  letter-spacing: .04em;
  color: #fff;
  background: #ee0a24;
  border: none;
  border-radius: 999px;
  cursor: pointer;
  box-shadow: 0 8px 18px -8px rgba(238, 10, 36, .55);
  transition: background .18s var(--es-ease), opacity .18s var(--es-ease);
  -webkit-tap-highlight-color: transparent;

  &:active { background: #d50018; transform: translateY(1px); }
  &:disabled {
    background: var(--es-hair);
    color: var(--es-ink-3);
    box-shadow: none;
    cursor: not-allowed;
  }
}

/* ---- van-list / van-empty refinement ---- */
:deep(.van-list__finished-text),
:deep(.van-list__loading),
:deep(.van-list__error-text) {
  color: var(--es-ink-3);
  font-size: 12.5px;
  letter-spacing: .04em;
  padding: 14px 0 6px;
}
:deep(.van-empty) {
  padding: 56px 0;
}
:deep(.van-empty__description) {
  color: var(--es-ink-3);
  font-size: 13.5px;
}

@media (prefers-reduced-motion: reduce) {
  .art-row,
  .art-row .art-go,
  .tf-header .tf-chevron,
  :deep(.van-search__content) {
    transition: none !important;
  }
}
</style>
