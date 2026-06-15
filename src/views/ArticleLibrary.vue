<template>
  <div class="article-library">
    <PracticeHeader title="收录文章" @back="goHome" />

    <div class="lib-body">
      <!-- ===== editorial header on the wash ===== -->
      <header class="lib-intro">
        <span class="es-eyebrow">SAVED · 文章库</span>
        <h2 class="es-title">收录<span class="accent">文章</span></h2>
        <p class="lib-sub"><span class="rule" aria-hidden="true"></span>搜索标题或它收纳的单词</p>
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
          <div
            v-for="item in list"
            :key="item.id"
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
        </van-list>

        <van-empty v-if="finished && list.length === 0" :description="emptyText" />
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, watch } from 'vue'
import { useRouter } from 'vue-router'
import PracticeHeader from '@/components/practice/PracticeHeader.vue'
import ArticleTagPicker from '@/components/article/ArticleTagPicker.vue'
import { getArticleList } from '@/api/article'

const router = useRouter()
const LIMIT = 10

const keyword = ref('')
const tagIds = ref([])
const tagExpanded = ref(false)

const list = ref([])
const total = ref(0)
const loading = ref(false)
const finished = ref(false)

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
}

.lib-body {
  padding: 0 16px;
}

/* ---- editorial intro lockup ---- */
.lib-intro {
  padding: 22px 4px 16px;
}
.es-title {
  font-size: 30px;
  margin-top: 8px;
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
