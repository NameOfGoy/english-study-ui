<template>
  <div class="article-instant">
    <PracticeHeader title="即时文章" @back="goBack" />

    <!-- 步骤指示 -->
    <div class="ai-steps-wrap">
      <van-steps :active="stepsActive" active-color="#1989fa" class="ai-steps">
        <van-step v-for="(t, i) in stepTitles" :key="i">{{ t }}</van-step>
      </van-steps>
    </div>

    <div class="ai-content">
      <!-- 步骤1: 挑选方式 -->
      <div v-if="step === 1" class="ai-step">
        <div class="ai-block">
          <span class="es-eyebrow ai-eyebrow">STEP 01 · METHOD</span>
          <h2 class="es-title ai-block-title">挑选<span class="accent">方式</span></h2>
          <div class="method-cards">
            <div class="method-card" :class="{ active: method === 'random' }" @click="method = 'random'">
              <div class="m-icon">🎲</div>
              <div class="m-title">随机</div>
              <div class="m-desc">系统从筛选结果中随机挑 3~8 个词语</div>
              <span class="m-tick" aria-hidden="true"></span>
            </div>
            <div class="method-card" :class="{ active: method === 'self' }" @click="method = 'self'">
              <div class="m-icon">✍️</div>
              <div class="m-title">自选</div>
              <div class="m-desc">自己从词库里勾选要练的词语</div>
              <span class="m-tick" aria-hidden="true"></span>
            </div>
          </div>

          <div v-if="method === 'random'" class="count-row">
            <span class="count-label">目标词数</span>
            <van-stepper v-model="randomCount" :min="3" :max="8" integer />
            <span class="count-hint">(3~8)</span>
          </div>
        </div>

        <div class="ai-footer">
          <van-button type="primary" block round @click="step = 2">下一步</van-button>
        </div>
      </div>

      <!-- 步骤2: 状态 / 类别 筛选 -->
      <div v-else-if="step === 2" class="ai-step">
        <div class="ai-block">
          <span class="es-eyebrow ai-eyebrow">STEP 02 · FILTER</span>
          <h2 class="es-title ai-block-title">设定<span class="accent">范围</span></h2>

          <div class="filter-group">
            <div class="filter-label">状态</div>
            <div class="opt-row">
              <div
                v-for="o in statusOptions"
                :key="o.value"
                class="opt"
                :class="{ active: filterStatus === o.value }"
                @click="filterStatus = o.value"
              >{{ o.label }}</div>
            </div>
          </div>

          <div class="filter-group">
            <div class="filter-label">类别</div>
            <div class="opt-row">
              <div
                v-for="o in categoryOptions"
                :key="o.value"
                class="opt"
                :class="{ active: filterCategory === o.value }"
                @click="filterCategory = o.value"
              >{{ o.label }}</div>
            </div>
          </div>

          <div v-if="filterCategory === 'tag'" class="tag-pick-wrap">
            <ArticleTagPicker v-model="filterTagIds" :multiple="true" />
          </div>
        </div>

        <div class="ai-footer">
          <van-button
            type="primary"
            block
            round
            :loading="generating || candidatesLoading"
            @click="onStep2Next"
          >{{ method === 'random' ? '生成文章' : '下一步' }}</van-button>
        </div>
      </div>

      <!-- 步骤3: 自选具体词语 -->
      <div v-else-if="step === 3" class="ai-step">
        <div class="ai-block ai-block--flush">
          <div class="select-head">
            <span class="es-eyebrow ai-eyebrow">STEP 03 · WORDS</span>
            <h2 class="es-title ai-block-title">
              选择<span class="accent">词语</span>
              <span class="sel-count es-pill" :class="{ ok: selectedOk }">已选 {{ selected.length }}（需 3~8）</span>
            </h2>
          </div>
          <van-search v-model="candidateKeyword" placeholder="搜索词语或释义" />

          <div v-if="candidatesLoading" class="ai-loading"><van-loading /></div>
          <div v-else-if="filteredCandidates.length === 0" class="ai-empty">
            <van-empty description="当前筛选下没有可选词语" />
          </div>
          <div v-else class="cand-list">
            <div
              v-for="c in filteredCandidates"
              :key="c.word_id + '_' + c.word_type"
              class="cand-item"
              :class="{ active: isPicked(c), disabled: !isPicked(c) && selected.length >= 8 }"
              @click="togglePick(c)"
            >
              <van-icon :name="isPicked(c) ? 'checked' : 'circle'" class="cand-check" />
              <div class="cand-main">
                <div class="cand-word">
                  {{ c.word }}
                  <span class="cand-type">{{ c.word_type === 2 ? '词语' : '单词' }}</span>
                </div>
                <div v-if="c.meaning" class="cand-meaning">{{ c.meaning }}</div>
              </div>
            </div>
          </div>
        </div>

        <div class="ai-footer">
          <div class="ai-footer-tip" :class="{ ok: selectedOk }">已选 {{ selected.length }} 个（需 3~8）</div>
          <van-button
            type="primary"
            block
            round
            :disabled="!selectedOk"
            :loading="generating"
            @click="generate"
          >生成文章</van-button>
        </div>
      </div>

      <!-- 步骤4: 结果 -->
      <div v-else-if="step === 4" class="ai-step">
        <div v-if="generationError" class="ai-error">
          <div class="es-card err-card">
            <van-empty image="error" description="生成失败，请重试" />
            <div class="err-actions">
              <van-button round @click="step = method === 'self' ? 3 : 2">返回修改</van-button>
              <van-button type="primary" round :loading="generating" @click="generate">重试</van-button>
            </div>
          </div>
        </div>
        <ArticleRenderer
          v-else-if="article"
          :article="article"
          :show-archive="true"
          :archiving="archiving"
          :archived="archived"
          @archive="archive"
          @home="goPractice"
        />
      </div>
    </div>

    <ArticleLoaderOverlay :visible="generating" :seconds="seconds" />
  </div>
</template>

<script setup>
import { ref, computed } from 'vue'
import { useRouter, onBeforeRouteLeave } from 'vue-router'
import { showToast } from 'vant'
import PracticeHeader from '@/components/practice/PracticeHeader.vue'
import ArticleTagPicker from '@/components/article/ArticleTagPicker.vue'
import ArticleRenderer from '@/components/article/ArticleRenderer.vue'
import ArticleLoaderOverlay from '@/components/article/ArticleLoaderOverlay.vue'
import { useElapsedTimer } from '@/composables/useElapsedTimer'
import { generateArticle, getArticleCandidates, saveArticle } from '@/api/article'

const router = useRouter()
const { seconds, start: startTimer, stop: stopTimer } = useElapsedTimer()

const step = ref(1)
const method = ref('random') // 'random' | 'self'
const randomCount = ref(5)

const filterStatus = ref('all') // all/study/review/strength/done
const filterCategory = ref('all') // all/tag/word/phrase
const filterTagIds = ref([])

const candidates = ref([])
const candidatesLoading = ref(false)
const candidateKeyword = ref('')
const selected = ref([]) // [{word_id, word_type, word, ...}]

const article = ref(null)
const generating = ref(false)
const generationError = ref(false)
const archiving = ref(false)
const archived = ref(false)

const statusOptions = [
  { label: '学习', value: 'study' },
  { label: '复习', value: 'review' },
  { label: '强化', value: 'strength' },
  { label: '完成', value: 'done' },
  { label: '全部', value: 'all' }
]
const categoryOptions = [
  { label: '标签', value: 'tag' },
  { label: '单词', value: 'word' },
  { label: '词语', value: 'phrase' },
  { label: '全部', value: 'all' }
]

const STATUS_MAP = { all: 0, study: 1, review: 2, strength: 3, done: 4 }
const CATEGORY_MAP = { tag: 1, word: 2, phrase: 3, all: 4 }

const stepTitles = computed(() =>
  method.value === 'self' ? ['方式', '筛选', '选词', '生成'] : ['方式', '筛选', '生成']
)
const stepsActive = computed(() => Math.min(step.value - 1, stepTitles.value.length - 1))

const selectedOk = computed(() => selected.value.length >= 3 && selected.value.length <= 8)

const filteredCandidates = computed(() => {
  const kw = candidateKeyword.value.trim().toLowerCase()
  if (!kw) return candidates.value
  return candidates.value.filter(
    (c) => (c.word || '').toLowerCase().includes(kw) || (c.meaning || '').toLowerCase().includes(kw)
  )
})

const pickKey = (c) => c.word_id + '_' + c.word_type
const isPicked = (c) => selected.value.some((s) => pickKey(s) === pickKey(c))

const togglePick = (c) => {
  if (isPicked(c)) {
    selected.value = selected.value.filter((s) => pickKey(s) !== pickKey(c))
    return
  }
  if (selected.value.length >= 8) {
    showToast('最多选择 8 个词语')
    return
  }
  selected.value = [...selected.value, c]
}

const buildFilterPayload = () => ({
  status: STATUS_MAP[filterStatus.value] ?? 0,
  category: CATEGORY_MAP[filterCategory.value] ?? 4,
  tag_ids: filterCategory.value === 'tag' ? filterTagIds.value : []
})

const onStep2Next = async () => {
  if (method.value === 'random') {
    await generate()
    return
  }
  // 自选: 拉候选词进入步骤3
  candidatesLoading.value = true
  selected.value = []
  try {
    const resp = await getArticleCandidates(buildFilterPayload())
    candidates.value = resp.data || []
    step.value = 3
  } catch (e) {
    // 已 toast
  } finally {
    candidatesLoading.value = false
  }
}

const generate = async () => {
  if (method.value === 'self' && !selectedOk.value) {
    showToast('请选择 3~8 个词语')
    return
  }
  const payload = { method: method.value === 'self' ? 2 : 1, ...buildFilterPayload() }
  if (method.value === 'self') {
    payload.words = selected.value.map((c) => ({ word_id: c.word_id, word_type: c.word_type }))
  } else {
    payload.count = randomCount.value
  }

  generating.value = true
  generationError.value = false
  startTimer()
  try {
    const resp = await generateArticle(payload)
    article.value = resp.data
    archived.value = false
    step.value = 4
  } catch (e) {
    generationError.value = true
    step.value = 4
  } finally {
    generating.value = false
    stopTimer()
  }
}

const archive = async () => {
  if (!article.value || archived.value) return
  archiving.value = true
  try {
    await saveArticle({
      title_en: article.value.title_en,
      title_zh: article.value.title_zh,
      sentences: article.value.sentences,
      used_words: article.value.used_words
    })
    archived.value = true
    showToast({ message: '已收录', type: 'success' })
  } catch (e) {
    // 已 toast
  } finally {
    archiving.value = false
  }
}

// 生成结果页直接回练习首页, 不用从左上角逐步返回. bypassGuard 让显式返回跳过"退一步"拦截.
const bypassGuard = ref(false)
const goPractice = () => {
  bypassGuard.value = true
  router.push('/practice')
}

const goBack = () => {
  if (generating.value) return
  if (step.value === 4) {
    step.value = method.value === 'self' ? 3 : 2
    return
  }
  if (step.value === 3) {
    step.value = 2
    return
  }
  if (step.value === 2) {
    step.value = 1
    return
  }
  router.back()
}

// 拦截浏览器/手势返回: 向导未完成时退一步而非直接离开
onBeforeRouteLeave((to, from, next) => {
  if (bypassGuard.value) {
    next() // 显式"返回练习"等, 放行
    return
  }
  if (generating.value) {
    next(false)
    return
  }
  if (step.value > 1) {
    goBack()
    next(false)
    return
  }
  next()
})
</script>

<style lang="scss" scoped>
/* ============================================================
   即时文章 — editorial wizard
   Cool-blue brand, hairline rows, soft cards, gradient CTA.
   Page bg transparent → global cool wash shows through.
   ============================================================ */
.article-instant {
  min-height: 100vh;
  background: transparent;
}

/* ---- step indicator on a hairline-edged white band ---- */
.ai-steps-wrap {
  background: var(--es-surface);
  border-bottom: 1px solid var(--es-hair);
  padding: 6px 4px 2px;
}
.ai-steps {
  background: transparent;
}
:deep(.van-steps) {
  background: transparent;
}
:deep(.van-step__title) {
  font-size: 12px;
  letter-spacing: .02em;
  color: var(--es-ink-3);
}
:deep(.van-step--finish .van-step__title),
:deep(.van-step__title--active) {
  color: var(--es-primary);
  font-weight: 600;
}
/* recolor the connecting line + circles to the brand hairline/accent */
:deep(.van-step__line) {
  background-color: var(--es-hair);
}
:deep(.van-step--finish .van-step__line) {
  background-color: var(--es-primary);
}
:deep(.van-step__circle) {
  background-color: var(--es-ink-3);
}
:deep(.van-step--finish .van-step__circle),
:deep(.van-step__icon) {
  color: var(--es-primary);
}
:deep(.van-step__circle-container) {
  background-color: var(--es-surface);
}

.ai-content {
  padding: 18px 16px 24px;
  /* 给固定底部操作栏留出空间, 避免最后一个词被遮住 */
  padding-bottom: calc(96px + env(safe-area-inset-bottom));
}

/* a step's content lives on a soft white card */
.ai-block {
  background: var(--es-surface);
  border-radius: var(--es-r-card);
  box-shadow: var(--es-shadow-card);
  padding: 22px 18px 20px;
  box-sizing: border-box;
}
/* step 3 holds a search + list that go edge-to-edge */
.ai-block--flush {
  padding: 22px 0 8px;
  overflow: hidden;
}
.ai-block--flush .select-head {
  padding: 0 18px;
}

.ai-eyebrow {
  display: block;
  margin-bottom: 8px;
}
.ai-block-title {
  font-size: 26px;
  margin: 0 0 18px;
  display: flex;
  align-items: baseline;
  flex-wrap: wrap;
  gap: 10px;

  .sel-count {
    height: 26px;
    padding: 0 12px;
    font-size: 12px;
    font-weight: 600;
    color: #d33b4d;
    background: rgba(211, 59, 77, .10);
    -webkit-text-fill-color: #d33b4d; /* override .accent gradient inheritance safety */
    &.ok {
      color: #07a854;
      background: rgba(7, 168, 84, .12);
      -webkit-text-fill-color: #07a854;
    }
  }
}
.ai-block--flush .ai-block-title {
  margin-bottom: 14px;
}

/* ---- method selection — refined soft cards ---- */
.method-cards {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 12px;
}
.method-card {
  position: relative;
  background: var(--es-surface);
  border-radius: var(--es-r-card);
  padding: 22px 14px 18px;
  text-align: center;
  border: 1px solid var(--es-hair);
  box-shadow: var(--es-shadow-soft);
  cursor: pointer;
  transition: border-color .22s var(--es-ease), box-shadow .22s var(--es-ease),
    transform .22s var(--es-ease);

  &.active {
    border-color: var(--es-primary);
    box-shadow: 0 14px 30px -16px rgba(25, 137, 250, .45);
    transform: translateY(-1px);
  }
  .m-icon {
    font-size: 30px;
    line-height: 1;
  }
  .m-title {
    font-size: 17px;
    font-weight: 700;
    color: var(--es-ink);
    margin-top: 10px;
    letter-spacing: -.01em;
  }
  .m-desc {
    font-size: 12px;
    color: var(--es-ink-2);
    margin-top: 6px;
    line-height: 1.5;
  }
  /* selected tick — gradient dot top-right */
  .m-tick {
    position: absolute;
    top: 12px;
    right: 12px;
    width: 18px;
    height: 18px;
    border-radius: 50%;
    border: 1.5px solid var(--es-hair);
    background: var(--es-surface);
    transition: all .22s var(--es-ease);
  }
  &.active .m-tick {
    border-color: transparent;
    background: var(--es-grad);
    box-shadow: 0 3px 8px rgba(25, 137, 250, .35);
  }
  &.active .m-tick::after {
    content: "";
    position: absolute;
    left: 5px;
    top: 2px;
    width: 5px;
    height: 9px;
    border: solid #fff;
    border-width: 0 2px 2px 0;
    transform: rotate(42deg);
  }
}
.count-row {
  display: flex;
  align-items: center;
  gap: 12px;
  margin-top: 22px;
  padding-top: 18px;
  border-top: 1px solid var(--es-hair);
  .count-label {
    font-size: 14px;
    font-weight: 600;
    color: var(--es-ink);
  }
  .count-hint {
    font-size: 12px;
    color: var(--es-ink-3);
  }
}

/* ---- filter pills ---- */
.filter-group + .filter-group {
  margin-top: 20px;
}
.filter-label {
  font-size: 11px;
  letter-spacing: .14em;
  text-transform: uppercase;
  font-weight: 600;
  color: var(--es-ink-3);
  margin-bottom: 10px;
}
.opt-row {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}
.opt {
  padding: 7px 16px;
  border-radius: 999px;
  background: var(--es-surface);
  color: var(--es-ink-2);
  font-size: 13px;
  font-weight: 600;
  border: 1px solid var(--es-hair);
  cursor: pointer;
  transition: all .2s var(--es-ease);

  &.active {
    background: var(--es-grad);
    color: #fff;
    border-color: transparent;
    box-shadow: 0 6px 14px -4px rgba(25, 137, 250, .45);
  }
}
.tag-pick-wrap {
  margin-top: 18px;
  padding-top: 18px;
  border-top: 1px solid var(--es-hair);
}

.ai-loading,
.ai-empty {
  padding: 28px 0;
  text-align: center;
}

/* ---- candidate word list — hairline rows ---- */
.cand-list {
  margin-top: 4px;
}
.cand-item {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 14px 18px;
  cursor: pointer;
  transition: background .18s var(--es-ease);

  & + .cand-item {
    border-top: 1px solid var(--es-hair-soft);
  }
  &.active {
    background: rgba(25, 137, 250, .05);
  }
  &.disabled {
    opacity: 0.45;
  }
  .cand-check {
    font-size: 22px;
    color: var(--es-ink-3);
    flex: 0 0 auto;
    transition: color .18s var(--es-ease);
  }
  &.active .cand-check {
    color: var(--es-primary);
  }
  .cand-main {
    flex: 1;
    min-width: 0;
  }
  .cand-word {
    font-size: 15px;
    color: var(--es-ink);
    font-weight: 600;
    letter-spacing: -.01em;
  }
  .cand-type {
    font-size: 11px;
    font-weight: 600;
    color: var(--es-primary);
    background: rgba(25, 137, 250, 0.10);
    padding: 2px 8px;
    border-radius: 999px;
    margin-left: 8px;
    vertical-align: middle;
  }
  .cand-meaning {
    font-size: 12px;
    color: var(--es-ink-2);
    margin-top: 3px;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }
}

/* van-search → flush, hairline, no heavy fill */
:deep(.van-search) {
  background: transparent;
  padding: 6px 18px 10px;
}
:deep(.van-search__content) {
  background: var(--es-hair-soft);
  border-radius: 999px;
}
:deep(.van-search .van-field__control) {
  color: var(--es-ink);
}

/* ---- fixed footer action bar ---- */
.ai-footer {
  position: fixed;
  left: 0;
  right: 0;
  bottom: 0;
  padding: 12px 16px calc(12px + env(safe-area-inset-bottom));
  background: rgba(255, 255, 255, .92);
  backdrop-filter: saturate(140%) blur(10px);
  -webkit-backdrop-filter: saturate(140%) blur(10px);
  border-top: 1px solid var(--es-hair);
  z-index: 50;
}
.ai-footer-tip {
  font-size: 12px;
  font-weight: 600;
  color: #d33b4d;
  text-align: center;
  margin-bottom: 8px;
  letter-spacing: .01em;
  &.ok {
    color: #07a854;
  }
}

/* primary CTA in footer → gradient, pill, shimmer-free but layered */
.ai-footer :deep(.van-button--primary) {
  border: 0;
  font-weight: 700;
  letter-spacing: .1em;
  background: linear-gradient(118deg, var(--es-grad-a) 0%, var(--es-primary) 56%, var(--es-teal) 130%);
  box-shadow: 0 10px 22px -8px rgba(25, 137, 250, .55), inset 0 1px 0 rgba(255, 255, 255, .35);
}
.ai-footer :deep(.van-button--primary.van-button--disabled) {
  background: var(--es-hair);
  color: var(--es-ink-3);
  box-shadow: none;
  opacity: 1;
}

/* ---- error state ---- */
.ai-error {
  padding-top: 24px;
  .err-card {
    padding: 24px 18px 22px;
  }
  .err-actions {
    display: flex;
    gap: 12px;
    justify-content: center;
    margin-top: 12px;
    :deep(.van-button) {
      min-width: 110px;
    }
    :deep(.van-button--primary) {
      border: 0;
      font-weight: 700;
      background: linear-gradient(118deg, var(--es-grad-a) 0%, var(--es-primary) 56%, var(--es-teal) 130%);
      box-shadow: 0 8px 18px -8px rgba(25, 137, 250, .55);
    }
  }
}

/* stepper alignment with brand */
:deep(.van-stepper__input) {
  background: var(--es-hair-soft);
  color: var(--es-ink);
}
:deep(.van-stepper__minus),
:deep(.van-stepper__plus) {
  background: var(--es-hair-soft);
  color: var(--es-primary);
}

@media (prefers-reduced-motion: reduce) {
  .method-card,
  .opt,
  .cand-item,
  .cand-check {
    transition: none !important;
  }
}
</style>
