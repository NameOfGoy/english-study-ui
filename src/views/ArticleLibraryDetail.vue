<template>
  <div class="article-library-detail">
    <PracticeHeader title="文章详情" @back="goBack" />

    <div class="ald-body">
      <div v-if="loading" class="ald-loading">
        <van-loading vertical>加载中…</van-loading>
      </div>
      <div v-else-if="!article" class="ald-empty">
        <van-empty image="error" description="文章不存在或已删除" />
      </div>
      <div v-else class="ald-reader">
        <ArticleRenderer :article="article" :show-archive="false" />
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import PracticeHeader from '@/components/practice/PracticeHeader.vue'
import ArticleRenderer from '@/components/article/ArticleRenderer.vue'
import { getArticleDetail } from '@/api/article'

const route = useRoute()
const router = useRouter()

const article = ref(null)
const loading = ref(true)

const goBack = () => router.back()

onMounted(async () => {
  const id = route.params.id
  try {
    const resp = await getArticleDetail(id)
    article.value = resp.data
  } catch (e) {
    article.value = null
  } finally {
    loading.value = false
  }
})
</script>

<style lang="scss" scoped>
/* ============================================================
   EDITORIAL — 文章详情 (thin reading page)
   A clean reading header (delegated to PracticeHeader) over the
   global cool wash, with a calm soft-white reading surface that
   hosts the <ArticleRenderer>. Hairline + soft layered shadow,
   generous spacing. No opaque flat gray page bg.
   ============================================================ */
.article-library-detail {
  min-height: 100vh;
  /* let the global cool wash show through */
  background: transparent;
}

/* generous reading column, mobile-first ~390px */
.ald-body {
  max-width: 720px;
  margin: 0 auto;
  padding: 18px 14px calc(28px + env(safe-area-inset-bottom, 0px));
  box-sizing: border-box;
}

/* ---- loading state ---- */
.ald-loading {
  padding: 72px 0 56px;
  text-align: center;
}
.ald-loading :deep(.van-loading__text) {
  color: var(--es-ink-2);
  font-size: 13px;
  letter-spacing: .04em;
}
.ald-loading :deep(.van-loading__spinner) {
  color: var(--es-primary);
}

/* ---- empty / not-found state on a soft card ---- */
.ald-empty {
  background: var(--es-surface);
  border-radius: var(--es-r-card);
  box-shadow: var(--es-shadow-card);
  padding: 36px 18px 30px;
  margin-top: 6px;
}
.ald-empty :deep(.van-empty__description) {
  color: var(--es-ink-3);
  font-size: 14px;
  letter-spacing: .02em;
}

/* ---- the reading surface that hosts ArticleRenderer ---- */
.ald-reader {
  background: var(--es-surface);
  border-radius: var(--es-r-card);
  box-shadow: var(--es-shadow-card);
  border: 1px solid var(--es-hair-soft);
  padding: 6px;
  overflow: hidden;
}

@media (prefers-reduced-motion: reduce) {
  .ald-reader,
  .ald-empty {
    transition: none;
  }
}
</style>
