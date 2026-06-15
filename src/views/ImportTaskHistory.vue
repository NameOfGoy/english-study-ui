<template>
  <div class="task-history-page">
    <!-- 顶部 -->
    <header class="page-header">
      <van-icon name="arrow-left" class="back-btn" @click="$router.back()" />
      <div class="header-text">
        <span class="es-eyebrow">IMPORT HISTORY</span>
        <h1 class="page-title es-title">导入<span class="accent">任务历史</span></h1>
      </div>
      <span class="placeholder"></span>
    </header>

    <!-- 时间范围筛选 -->
    <section class="filter-bar">
      <span class="filter-eyebrow es-eyebrow">时间范围</span>
      <div class="quick-tabs">
        <span
          v-for="q in quickRanges"
          :key="q.days"
          class="quick-tab"
          :class="{ active: activeDays === q.days && !customMode }"
          @click="onQuickRange(q.days)"
        >{{ q.label }}</span>
        <span
          class="quick-tab"
          :class="{ active: customMode }"
          @click="customMode = true"
        >自定义</span>
      </div>

      <div v-if="customMode" class="custom-range">
        <div class="range-row">
          <span class="range-label">起</span>
          <span class="range-value" @click="openPicker('start')">
            {{ startDate || '请选择' }}
          </span>
          <span class="range-label">止</span>
          <span class="range-value" @click="openPicker('end')">
            {{ endDate || '请选择' }}
          </span>
          <van-button size="small" type="primary" round @click="applyCustom">应用</van-button>
        </div>
      </div>
    </section>

    <!-- 任务列表 -->
    <section class="content">
      <div v-if="loading" class="state-wrap">
        <van-loading size="24px" vertical>加载中...</van-loading>
      </div>

      <div v-else-if="tasks.length === 0" class="state-wrap">
        <van-empty description="该时段无导入任务" image="search" />
      </div>

      <div v-else class="task-cards">
        <article v-for="task in tasks" :key="task.id" class="task-card es-card" :class="statusClass(task.status)">
          <span class="accent-rail" aria-hidden="true"></span>
          <div class="task-header">
            <div class="task-name">{{ task.file_name }}</div>
            <div class="task-status es-pill" :class="statusClass(task.status)">{{ statusText(task.status) }}</div>
          </div>

          <div v-if="task.status === 1" class="task-progress">
            <div class="progress-info">
              <span>{{ task.current }} / {{ task.total }}</span>
              <span v-if="task.current_word" class="current-word">{{ task.current_word }}</span>
            </div>
            <van-progress
              :percentage="Math.round((task.current / (task.total || 1)) * 100)"
              stroke-width="6"
              :show-pivot="false"
              color="linear-gradient(90deg, #1989fa, #07c160)"
            />
          </div>

          <div class="task-stats">
            <span class="stat success" v-if="task.success_count > 0">成功 {{ task.success_count }}</span>
            <span class="stat fail" v-if="task.fail_count > 0">失败 {{ task.fail_count }}</span>
            <span class="stat total">共 {{ task.total }} 个</span>
          </div>

          <div v-if="task.fail_count > 0 && task.fail_words" class="fail-section">
            <div class="fail-toggle" @click="toggleFailWords(task.id)">
              <span>失败词列表</span>
              <van-icon :name="expandedFails[task.id] ? 'arrow-up' : 'arrow-down'" size="12" />
            </div>
            <div v-if="expandedFails[task.id]" class="fail-words">
              <span v-for="(w, i) in parseFailWords(task.fail_words)" :key="i" class="fail-word">{{ w }}</span>
            </div>
          </div>

          <div class="task-time">{{ task.created_at }}</div>
        </article>
      </div>
    </section>

    <!-- 日期选择弹窗 -->
    <van-popup v-model:show="pickerVisible" position="bottom" round>
      <van-date-picker
        v-model="pickerValue"
        :min-date="minDate"
        :max-date="maxDate"
        @confirm="onPickerConfirm"
        @cancel="pickerVisible = false"
      />
    </van-popup>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted } from 'vue'
import { showToast } from 'vant'
import { getImportTaskList } from '@/api/dictionary'

const tasks = ref([])
const loading = ref(false)
const expandedFails = ref({})

const quickRanges = [
  { label: '今天', days: 1 },
  { label: '近 3 天', days: 3 },
  { label: '近 7 天', days: 7 },
  { label: '近 30 天', days: 30 }
]

const activeDays = ref(3)
const customMode = ref(false)
const startDate = ref('')
const endDate = ref('')

const pickerVisible = ref(false)
const pickerTarget = ref('start')
const pickerValue = ref([])
const minDate = new Date(2020, 0, 1)
const maxDate = new Date()

const statusText = (s) => ({ 0: '待处理', 1: '进行中', 2: '已完成', 3: '失败' })[s] || '未知'
const statusClass = (s) => ({ 0: 'pending', 1: 'running', 2: 'done', 3: 'failed' })[s] || ''

const parseFailWords = (json) => {
  try { return JSON.parse(json) } catch { return [] }
}

const toggleFailWords = (id) => {
  expandedFails.value[id] = !expandedFails.value[id]
}

const formatDate = (arr) => {
  if (!arr || arr.length < 3) return ''
  return `${arr[0]}-${String(arr[1]).padStart(2, '0')}-${String(arr[2]).padStart(2, '0')}`
}

const today = () => {
  const d = new Date()
  return [String(d.getFullYear()), String(d.getMonth() + 1).padStart(2, '0'), String(d.getDate()).padStart(2, '0')]
}

const openPicker = (target) => {
  pickerTarget.value = target
  const current = target === 'start' ? startDate.value : endDate.value
  if (current) {
    const [y, m, d] = current.split('-')
    pickerValue.value = [y, m, d]
  } else {
    pickerValue.value = today()
  }
  pickerVisible.value = true
}

const onPickerConfirm = ({ selectedValues }) => {
  const val = formatDate(selectedValues)
  if (pickerTarget.value === 'start') startDate.value = val
  else endDate.value = val
  pickerVisible.value = false
}

const loadTasks = async (params) => {
  loading.value = true
  try {
    const resp = await getImportTaskList(params)
    if (resp.code === 0) {
      tasks.value = resp.tasks || []
    } else {
      showToast(resp.message || '加载失败')
    }
  } catch (e) {
    showToast('网络错误')
  } finally {
    loading.value = false
  }
}

const onQuickRange = (days) => {
  customMode.value = false
  activeDays.value = days
  loadTasks({ days })
}

const applyCustom = () => {
  if (!startDate.value && !endDate.value) {
    showToast('请至少选择起止日期之一')
    return
  }
  if (startDate.value && endDate.value && startDate.value > endDate.value) {
    showToast('起始日期不能晚于结束日期')
    return
  }
  loadTasks({
    start_date: startDate.value,
    end_date: endDate.value
  })
}

onMounted(() => {
  loadTasks({ days: 3 })
})
</script>

<style lang="scss" scoped>
/* ============================================================
   EDITORIAL — import task history
   Transparent page on the global cool wash, hairline header,
   refined pill tabs, soft es-cards with a status-tinted accent
   rail + .es-pill status badge, file meta in muted ink.
   ============================================================ */
$ok:    #16A34A;   // semantic success green
$danger:#E11D48;   // semantic danger red
$amber: #D97706;   // semantic warning amber

.task-history-page {
  min-height: 100vh;
  background: transparent;          // let the global wash show
  padding-bottom: 30px;
}

/* ---- editorial header ---- */
.page-header {
  display: flex;
  align-items: flex-start;
  gap: 6px;
  padding: clamp(18px, 5vw, 26px) 20px 18px;
}

.back-btn {
  flex: 0 0 auto;
  font-size: 22px;
  cursor: pointer;
  padding: 6px;
  margin-top: 2px;
  color: var(--es-ink-2);
  border-radius: 10px;
  transition: color .2s var(--es-ease), background .2s var(--es-ease);

  &:active {
    color: var(--es-primary);
    background: var(--es-hair-soft);
  }
}

.header-text {
  flex: 1 1 auto;
  min-width: 0;
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.filter-eyebrow {
  display: block;
}

.page-title {
  margin: 0;
  font-size: clamp(24px, 7vw, 30px);
}

.placeholder {
  flex: 0 0 auto;
  width: 28px;
}

/* ---- filter bar ---- */
.filter-bar {
  padding: 4px 20px 18px;
}

.filter-eyebrow {
  margin-bottom: 10px;
}

.quick-tabs {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}

.quick-tab {
  padding: 7px 16px;
  background: var(--es-surface);
  border: 1px solid var(--es-hair);
  border-radius: 999px;
  font-size: 13px;
  font-weight: 600;
  color: var(--es-ink-2);
  cursor: pointer;
  transition: all .22s var(--es-ease);

  &:active { transform: scale(.97); }

  &.active {
    color: #fff;
    border-color: transparent;
    background: var(--es-grad);
    box-shadow: 0 6px 14px -4px rgba(25, 137, 250, .45);
  }
}

.custom-range {
  margin-top: 14px;
}

.range-row {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 13px;
}

.range-label {
  color: var(--es-ink-3);
  font-weight: 600;
  flex-shrink: 0;
}

.range-value {
  flex: 1;
  min-width: 0;
  background: var(--es-surface);
  border: 1px solid var(--es-hair);
  padding: 8px 10px;
  border-radius: var(--es-r-btn);
  color: var(--es-ink);
  cursor: pointer;
  text-align: center;
  transition: border-color .2s var(--es-ease), background .2s var(--es-ease);

  &:active {
    border-color: var(--es-grad-a);
    background: var(--es-hair-soft);
  }
}

/* ---- content / states ---- */
.content {
  padding: 4px 20px 0;
}

.state-wrap {
  padding: 48px 0;
  display: flex;
  justify-content: center;

  :deep(.van-loading__text) { color: var(--es-ink-2); }
  :deep(.van-empty__description) { color: var(--es-ink-3); }
}

.task-cards {
  display: flex;
  flex-direction: column;
  gap: 14px;
}

/* ---- task card (soft editorial surface) ---- */
.task-card {
  position: relative;
  padding: 16px 16px 14px 18px;
  overflow: hidden;

  .accent-rail {
    position: absolute;
    left: 0;
    top: 0;
    bottom: 0;
    width: 3px;
    border-radius: 0 3px 3px 0;
    background: var(--es-hair);
  }

  &.running .accent-rail { background: var(--es-grad); }
  &.done    .accent-rail { background: $ok; }
  &.failed  .accent-rail { background: $danger; }
  &.pending .accent-rail { background: $amber; }
}

.task-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 10px;
  margin-bottom: 10px;
}

.task-name {
  font-size: 15px;
  font-weight: 700;
  color: var(--es-ink);
  flex: 1;
  min-width: 0;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

/* status badge — .es-pill tinted by status */
.task-status {
  flex: 0 0 auto;
  height: 24px;
  padding: 0 12px;
  font-size: 12px;

  &.pending { color: $amber;  background: rgba(217, 119, 6, .12); }
  &.running { color: var(--es-primary); background: rgba(25, 137, 250, .12); }
  &.done    { color: $ok;     background: rgba(22, 163, 74, .12); }
  &.failed  { color: $danger; background: rgba(225, 29, 72, .12); }
}

.task-progress {
  margin-bottom: 10px;

  .progress-info {
    display: flex;
    justify-content: space-between;
    gap: 10px;
    font-size: 12px;
    color: var(--es-ink-2);
    margin-bottom: 6px;
  }

  .current-word {
    color: var(--es-primary);
    font-weight: 600;
    max-width: 140px;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }

  :deep(.van-progress) {
    border-radius: 999px;
    overflow: hidden;
  }
}

.task-stats {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  margin-bottom: 4px;

  .stat {
    font-size: 12px;
    font-weight: 600;
    padding: 3px 10px;
    border-radius: 999px;
    color: var(--es-ink-2);
    background: var(--es-hair-soft);

    &.success { color: $ok;     background: rgba(22, 163, 74, .10); }
    &.fail    { color: $danger; background: rgba(225, 29, 72, .10); }
    &.total   { color: var(--es-ink-3); }
  }
}

.fail-section {
  margin-top: 12px;
  padding-top: 12px;
  border-top: 1px solid var(--es-hair);

  .fail-toggle {
    display: inline-flex;
    align-items: center;
    gap: 4px;
    font-size: 12px;
    font-weight: 600;
    color: $danger;
    cursor: pointer;
    margin-bottom: 8px;
  }

  .fail-words {
    display: flex;
    flex-wrap: wrap;
    gap: 6px;
  }

  .fail-word {
    font-size: 11px;
    background: rgba(225, 29, 72, .10);
    color: $danger;
    padding: 3px 8px;
    border-radius: 999px;
  }
}

.task-time {
  margin-top: 10px;
  font-size: 11px;
  letter-spacing: .02em;
  color: var(--es-ink-3);
  text-align: right;
}

/* ---- restyle the date picker popup chrome ---- */
:deep(.van-picker__confirm) { color: var(--es-primary); }
:deep(.van-picker__title)   { color: var(--es-ink); font-weight: 700; }

@media (prefers-reduced-motion: reduce) {
  .quick-tab,
  .range-value,
  .back-btn { transition: none; }
}
</style>
