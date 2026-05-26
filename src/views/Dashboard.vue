<template>
  <div class="dashboard-page">
    <!-- 顶部问候区 -->
    <div class="greeting-header">
      <div class="greeting-row">
        <div class="greeting-text">
          <p class="hello">{{ greeting }}</p>
          <h1 class="nickname">{{ nicknameDisplay }}</h1>
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

      <!-- 悬浮统计卡 -->
      <div class="stats-card">
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
    </div>

    <!-- 内容区 -->
    <div class="content">
      <van-pull-refresh v-model="refreshing" @refresh="loadData">
        <!-- 进度条 -->
        <div class="progress-section">
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
          <h3 class="section-title">快速开始</h3>
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
        <div class="today-section">
          <h3 class="section-title">今日已完成</h3>
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
        <div v-if="data.total_words === 0 && !loading" class="empty-guide">
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
.dashboard-page {
  min-height: 100vh;
  background: #f8f9fa;
  padding-bottom: 70px;
}

.greeting-header {
  background: linear-gradient(135deg, #1989fa 0%, #1565c0 100%);
  padding: 32px 20px 60px;
  color: #fff;
  position: relative;
}

.greeting-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.hello {
  font-size: 14px;
  opacity: 0.9;
  margin: 0 0 4px;
}

.nickname {
  font-size: 22px;
  font-weight: 700;
  margin: 0;
}

.avatar {
  border: 2px solid rgba(255, 255, 255, 0.5);
}

.avatar-fallback {
  width: 48px;
  height: 48px;
  border-radius: 50%;
  background: rgba(255, 255, 255, 0.25);
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 20px;
  font-weight: 700;
  border: 2px solid rgba(255, 255, 255, 0.5);
}

.stats-card {
  background: #fff;
  border-radius: 16px;
  box-shadow: 0 8px 24px rgba(0, 0, 0, 0.08);
  display: flex;
  align-items: center;
  justify-content: space-around;
  padding: 18px 8px;
  margin: 24px 4px -40px;
  position: relative;
}

.stat-col {
  flex: 1;
  text-align: center;
}

.stat-num {
  font-size: 26px;
  font-weight: 800;
  line-height: 1.2;
}

.stat-num.study { color: #1989fa; }
.stat-num.review { color: #ff9800; }
.stat-num.finish { color: #07c160; }

.stat-label {
  font-size: 12px;
  color: #969799;
  margin-top: 2px;
}

.stat-divider {
  width: 1px;
  height: 30px;
  background: #ebedf0;
}

.content {
  padding: 50px 16px 20px;
}

.progress-section {
  background: #fff;
  border-radius: 12px;
  padding: 16px;
  margin-bottom: 16px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.04);
}

.progress-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 10px;
}

.progress-title {
  font-size: 14px;
  font-weight: 600;
  color: #323233;
}

.progress-percent {
  font-size: 14px;
  font-weight: 700;
  color: #1989fa;
}

.progress-tip {
  font-size: 12px;
  color: #969799;
  margin: 8px 0 0;
}

.section-title {
  font-size: 16px;
  font-weight: 700;
  color: #1a1a2e;
  margin: 16px 0 12px;
}

.mode-section {
  margin-bottom: 16px;
}

.mode-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 10px;
}

.mode-card {
  position: relative;
  background: var(--mode-bg);
  border-radius: 12px;
  padding: 14px 14px 14px 18px;
  cursor: pointer;
  overflow: hidden;
  transition: transform 0.15s ease;
}

.mode-card:active {
  transform: scale(0.97);
}

.mode-card-bar {
  position: absolute;
  left: 0;
  top: 12px;
  bottom: 12px;
  width: 4px;
  background: var(--mode-color);
  border-radius: 0 4px 4px 0;
}

.mode-card-name {
  font-size: 14px;
  font-weight: 600;
  color: #323233;
}

.mode-card-count {
  font-size: 22px;
  font-weight: 800;
  color: var(--mode-color);
  margin-top: 4px;
}

.mode-card-unit {
  font-size: 12px;
  font-weight: 500;
  color: #969799;
  margin-left: 2px;
}

.today-section {
  background: #fff;
  border-radius: 12px;
  padding: 16px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.04);
}

.today-grid {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 8px;
}

.today-item {
  text-align: center;
  padding: 8px 0;
}

.today-num {
  font-size: 20px;
  font-weight: 800;
  color: #1989fa;
}

.today-item:nth-child(2) .today-num { color: #ff9800; }
.today-item:nth-child(3) .today-num { color: #ff5722; }
.today-item:nth-child(4) .today-num { color: #07c160; }

.today-label {
  font-size: 12px;
  color: #969799;
  margin-top: 2px;
}

.empty-guide {
  margin-top: 30px;
}
</style>
