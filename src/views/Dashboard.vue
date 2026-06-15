<template>
  <div class="dashboard-page">
    <!-- 顶部问候区 — editorial greeting on the cool wash (no opaque header bar) -->
    <header class="greeting-header">
      <div class="greeting-row">
        <div class="greeting-text">
          <p class="hello es-eyebrow">TODAY · {{ greeting }}</p>
          <h1 class="nickname es-title">
            <span class="accent">{{ nicknameDisplay }}</span>
          </h1>
        </div>
        <van-image
          v-if="avatar"
          round
          width="48"
          height="48"
          :src="avatar"
          class="avatar"
        />
        <div v-else class="avatar avatar-fallback">{{ nicknameInitial }}</div>
      </div>

      <!-- 统计卡 — soft white surface, hairline dividers -->
      <div class="stats-card es-card">
        <div class="stat-col">
          <div class="stat-num study">{{ data.study_count }}</div>
          <div class="stat-label">待学习</div>
        </div>
        <div class="stat-divider"></div>
        <div class="stat-col">
          <div class="stat-num review">{{ data.review_count + data.strengthen_count }}</div>
          <div class="stat-label">待复习</div>
        </div>
        <div class="stat-divider"></div>
        <div class="stat-col">
          <div class="stat-num finish">{{ data.finished_words }}</div>
          <div class="stat-label">已掌握</div>
        </div>
      </div>
    </header>

    <!-- 内容区 -->
    <div class="content">
      <van-pull-refresh v-model="refreshing" @refresh="loadData">
        <!-- 进度条 -->
        <div class="progress-section es-card">
          <div class="progress-header">
            <span class="progress-title">学习进度</span>
            <span class="progress-percent">{{ progressPercent }}%</span>
          </div>
          <van-progress
            :percentage="progressPercent"
            :color="progressColor"
            track-color="#ebedf0"
            :show-pivot="false"
            stroke-width="8"
          />
          <p class="progress-tip">
            {{ progressTip }}
          </p>
        </div>

        <!-- 快速开始模式卡片 -->
        <div class="mode-section">
          <div class="section-head">
            <span class="es-eyebrow">PRACTICE</span>
            <h3 class="section-title">快速开始</h3>
          </div>
          <div class="mode-grid">
            <div
              v-for="mode in modes"
              :key="mode.path"
              class="mode-card"
              :class="mode.colorClass"
              :style="{ '--mode-color': mode.color, '--mode-bg': mode.bg }"
              @click="goPractice(mode.path)"
            >
              <div class="mode-card-bar"></div>
              <div class="mode-card-content">
                <div class="mode-card-name">{{ mode.name }}</div>
                <div class="mode-card-count">
                  {{ mode.count }}
                  <span class="mode-card-unit">个</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- 今日完成情况 -->
        <div class="today-section es-card">
          <div class="section-head">
            <span class="es-eyebrow">PROGRESS</span>
            <h3 class="section-title">今日已完成</h3>
          </div>
          <div class="today-grid">
            <div class="today-item">
              <div class="today-num">{{ data.today_studied }}</div>
              <div class="today-label">学习</div>
            </div>
            <div class="today-item">
              <div class="today-num">{{ data.today_reviewed }}</div>
              <div class="today-label">复习</div>
            </div>
            <div class="today-item">
              <div class="today-num">{{ data.today_strengthened }}</div>
              <div class="today-label">加强</div>
            </div>
            <div class="today-item">
              <div class="today-num">{{ todayTotal }}</div>
              <div class="today-label">合计</div>
            </div>
          </div>
        </div>

        <!-- 新用户引导 -->
        <div v-if="data.total_words === 0 && !loading" class="empty-guide es-card">
          <van-empty
            description="还没有添加单词，去添加吧"
            image="search"
          >
            <van-button round type="primary" @click="$router.push('/dictionary')">
              去添加单词
            </van-button>
          </van-empty>
        </div>
      </van-pull-refresh>
    </div>
  </div>
</template>

<script setup>
import { ref, reactive, computed, onMounted, onActivated } from 'vue'
import { useRouter } from 'vue-router'
import { showToast } from 'vant'
import { getDashboard } from '@/api/dashboard'
import { getUserInfo } from '@/utils/auth'
import { getResourceUrl } from '@/utils/request'

const router = useRouter()
const loading = ref(false)
const refreshing = ref(false)

const data = reactive({
  study_count: 0,
  review_count: 0,
  strengthen_count: 0,
  spot_count: 0,
  today_studied: 0,
  today_reviewed: 0,
  today_strengthened: 0,
  total_words: 0,
  finished_words: 0,
  progress_rate: 0
})

const userInfo = ref(getUserInfo() || {})

// 后端返回的字段是 name（不是 nickname / username）— 之前一直读错字段，所以永远显示"同学"
const nickname = computed(() => userInfo.value.name || userInfo.value.nickname || userInfo.value.username || '')
const nicknameDisplay = computed(() => nickname.value ? `${nickname.value} 同学` : '同学')
const nicknameInitial = computed(() => (nickname.value.charAt(0) || 'U').toUpperCase())
const avatar = computed(() => {
  const a = userInfo.value.avatar
  return a ? getResourceUrl(a) : ''
})

const greeting = computed(() => {
  const hour = new Date().getHours()
  if (hour < 11) return '早上好'
  if (hour < 14) return '中午好'
  if (hour < 18) return '下午好'
  return '晚上好'
})

const progressPercent = computed(() => Math.round((data.progress_rate || 0) * 100))

const progressColor = computed(() => {
  if (progressPercent.value >= 100) return '#07c160'
  if (progressPercent.value >= 50) return '#1989fa'
  return '#1989fa'
})

const progressTip = computed(() => {
  if (data.total_words === 0) return '尚未添加单词'
  if (progressPercent.value >= 100) return '太棒了，全部已掌握 🎉'
  const remaining = data.total_words - data.finished_words
  return `还有 ${remaining} 个单词等待掌握`
})

const todayTotal = computed(() =>
  data.today_studied + data.today_reviewed + data.today_strengthened
)

const modes = computed(() => [
  {
    name: '学习', path: '/practice/study',
    count: data.study_count,
    color: '#1989fa', bg: '#e3f2fd', colorClass: 'mode-study'
  },
  {
    name: '复习', path: '/practice/review',
    count: data.review_count,
    color: '#ff9800', bg: '#fff3e0', colorClass: 'mode-review'
  },
  {
    name: '加强', path: '/practice/strength',
    count: data.strengthen_count,
    color: '#ff5722', bg: '#fbe9e7', colorClass: 'mode-strength'
  },
  {
    name: '抽查', path: '/practice/spot',
    count: data.spot_count,
    color: '#7c4dff', bg: '#ede7f6', colorClass: 'mode-spot'
  }
])

const loadData = async () => {
  loading.value = true
  try {
    const resp = await getDashboard()
    if (resp.code === 0 && resp.data) {
      Object.assign(data, resp.data)
    } else if (resp.message) {
      showToast(resp.message)
    }
  } catch (e) {
    showToast('加载失败，请下拉刷新重试')
  } finally {
    loading.value = false
    refreshing.value = false
  }
}

const goPractice = (path) => {
  router.push(path)
}

onMounted(loadData)
onActivated(loadData)
</script>

<style scoped>
/* ============================================================
   EDITORIAL DASHBOARD — premium light, cool-blue brand only.
   Greeting on the global cool wash (transparent page bg),
   real content on soft white .es-card surfaces + hairlines.
   ============================================================ */
.dashboard-page {
  min-height: 100vh;
  /* let the global cool wash (#app) show through — no opaque flat bg */
  background: transparent;
}

/* ---- editorial greeting block (no colored header bar) ---- */
.greeting-header {
  padding: clamp(26px, 7vh, 44px) 20px 22px;
}

.greeting-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
}

.greeting-text {
  min-width: 0;
}

.hello {
  margin: 0 0 10px;
  /* small UPPERCASE letter-spaced eyebrow (es-eyebrow handles type) */
}

.nickname {
  margin: 0;
  font-size: clamp(30px, 9vw, 38px);
  line-height: 1.04;
  letter-spacing: -0.02em;
}
/* gradient-clipped accent inherited from .es-title .accent */

.avatar {
  flex: 0 0 auto;
  box-shadow: 0 8px 20px -8px rgba(25, 137, 250, 0.4);
}
:deep(.avatar .van-image__img),
:deep(.avatar img) {
  box-shadow: inset 0 0 0 2px rgba(255, 255, 255, 0.9);
}

.avatar-fallback {
  width: 48px;
  height: 48px;
  border-radius: 50%;
  background: var(--es-grad);
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 19px;
  font-weight: 800;
  color: #fff;
  box-shadow: 0 8px 20px -8px rgba(25, 137, 250, 0.5),
              inset 0 1px 0 rgba(255, 255, 255, 0.4);
}

/* ---- floating stats summary card ---- */
.stats-card {
  display: flex;
  align-items: center;
  justify-content: space-around;
  padding: 18px 8px;
  margin-top: 22px;
}

.stat-col {
  flex: 1;
  text-align: center;
}

.stat-num {
  font-size: 27px;
  font-weight: 800;
  line-height: 1.15;
  letter-spacing: -0.02em;
}

/* cool-brand recolor — review no longer orange */
.stat-num.study  { color: var(--es-primary); }
.stat-num.review { color: #6C7BF0; }
.stat-num.finish { color: #07c160; } /* semantic success green */

.stat-label {
  font-size: 12px;
  color: var(--es-ink-3);
  margin-top: 4px;
  letter-spacing: 0.02em;
}

.stat-divider {
  width: 1px;
  height: 30px;
  background: var(--es-hair);
}

/* ---- content area ---- */
.content {
  padding: 14px 16px 8px;
}

/* card rhythm */
.progress-section,
.today-section,
.empty-guide {
  margin-bottom: 16px;
}

/* ---- progress card ---- */
.progress-header {
  display: flex;
  justify-content: space-between;
  align-items: baseline;
  margin-bottom: 12px;
}

.progress-title {
  font-size: 15px;
  font-weight: 700;
  color: var(--es-ink);
  letter-spacing: -0.01em;
}

.progress-percent {
  font-size: 16px;
  font-weight: 800;
  letter-spacing: -0.01em;
  background: linear-gradient(120deg, var(--es-primary), var(--es-grad-b));
  -webkit-background-clip: text;
  background-clip: text;
  -webkit-text-fill-color: transparent;
}

/* restyle van-progress: soft track + cool gradient fill */
:deep(.van-progress) {
  border-radius: 999px;
  overflow: hidden;
  background: var(--es-hair-soft);
}
:deep(.van-progress__portion) {
  border-radius: 999px;
  /* cool brand gradient overlay on top of the bound :color */
  background-image: var(--es-grad);
}

.progress-tip {
  font-size: 12.5px;
  color: var(--es-ink-2);
  margin: 12px 0 0;
  letter-spacing: 0.01em;
}

/* ---- section heads (eyebrow + title) ---- */
.section-head {
  margin: 4px 0 14px;
}
.section-head .es-eyebrow {
  display: block;
  margin-bottom: 6px;
}

.section-title {
  font-size: 19px;
  font-weight: 800;
  color: var(--es-ink);
  letter-spacing: -0.02em;
  margin: 0;
  line-height: 1.1;
}

/* ---- mode shortcut cards (harmonized cool mode colors) ---- */
.mode-section {
  margin: 4px 0 16px;
}

.mode-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 12px;
}

.mode-card {
  position: relative;
  background: var(--es-surface);
  border-radius: var(--es-r-card);
  padding: 16px 16px 16px 20px;
  cursor: pointer;
  overflow: hidden;
  box-shadow: var(--es-shadow-soft);
  transition: transform 0.15s var(--es-ease), box-shadow 0.2s var(--es-ease);
}
/* faint tint wash keyed to each mode's harmonized color */
.mode-card::after {
  content: "";
  position: absolute;
  inset: 0;
  background: var(--mc, var(--es-primary));
  opacity: 0.06;
  pointer-events: none;
}

.mode-card:active {
  transform: scale(0.97);
}

.mode-card-bar {
  position: absolute;
  left: 0;
  top: 14px;
  bottom: 14px;
  width: 4px;
  background: var(--mc, var(--es-primary));
  border-radius: 0 4px 4px 0;
  z-index: 1;
}

.mode-card-content {
  position: relative;
  z-index: 1;
}

.mode-card-name {
  font-size: 14px;
  font-weight: 700;
  color: var(--es-ink);
  letter-spacing: 0.01em;
}

.mode-card-count {
  font-size: 24px;
  font-weight: 800;
  letter-spacing: -0.02em;
  color: var(--mc, var(--es-primary));
  margin-top: 6px;
}

.mode-card-unit {
  font-size: 12px;
  font-weight: 600;
  color: var(--es-ink-3);
  margin-left: 2px;
}

/* harmonized practice-mode palette (overrides the legacy inline colors) */
.mode-study    { --mc: #3DA5F4; }
.mode-review   { --mc: #6C7BF0; }
.mode-strength { --mc: #16C0CB; }
.mode-spot     { --mc: #9B6DFF; }

/* ---- today completion card ---- */
.today-grid {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 8px;
}

.today-item {
  text-align: center;
  padding: 8px 0;
  position: relative;
}
.today-item + .today-item::before {
  content: "";
  position: absolute;
  left: -4px;
  top: 50%;
  transform: translateY(-50%);
  width: 1px;
  height: 26px;
  background: var(--es-hair);
}

.today-num {
  font-size: 21px;
  font-weight: 800;
  letter-spacing: -0.02em;
  color: var(--es-primary);
}

/* harmonized cool recolor — no orange/red */
.today-item:nth-child(2) .today-num { color: #6C7BF0; }
.today-item:nth-child(3) .today-num { color: #16C0CB; }
.today-item:nth-child(4) .today-num { color: #07c160; } /* semantic total */

.today-label {
  font-size: 12px;
  color: var(--es-ink-3);
  margin-top: 4px;
  letter-spacing: 0.02em;
}

/* ---- new-user empty guide ---- */
.empty-guide {
  padding: 24px 18px;
}
:deep(.empty-guide .van-button) {
  font-weight: 700;
  letter-spacing: 0.08em;
  border: 0;
  background: linear-gradient(118deg, var(--es-grad-a) 0%, var(--es-primary) 56%, var(--es-teal) 130%);
  box-shadow: 0 10px 24px -8px rgba(25, 137, 250, 0.42),
              inset 0 1px 0 rgba(255, 255, 255, 0.36);
}

@media (prefers-reduced-motion: reduce) {
  .mode-card { transition: none; }
}
</style>
