<template>
  <div class="task-history-page">
    <!-- 顶部 -->
    <div class="page-header">
      <van-icon name="arrow-left" class="back-btn" @click="$router.back()" />
      <span class="page-title">导入任务历史</span>
      <span class="placeholder"></span>
    </div>

    <!-- 时间范围筛选 -->
    <div class="filter-bar">
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
    </div>

    <!-- 任务列表 -->
    <div class="content">
      <van-loading v-if="loading" size="24px" vertical>加载中...</van-loading>

      <van-empty v-else-if="tasks.length === 0" description="该时段无导入任务" image="search" />

      <div v-else class="task-cards">
        <div v-for="task in tasks" :key="task.id" class="task-card" :class="statusClass(task.status)">
          <div class="task-header">
            <div class="task-name">{{ task.file_name }}</div>
            <div class="task-status" :class="statusClass(task.status)">{{ statusText(task.status) }}</div>
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
        </div>
      </div>
    </div>

    <!-- 日期选择弹窗 -->
    <van-popup v-model:show="pickerVisible" position="bottom">
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
.task-history-page {
  min-height: 100vh;
  background: #f8f9fa;
  padding-bottom: 30px;
}

.page-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 16px;
  background: linear-gradient(135deg, #1989fa 0%, #1565c0 100%);
  color: #fff;
}

.page-title {
  font-size: 17px;
  font-weight: 700;
}

.back-btn {
  font-size: 22px;
  cursor: pointer;
  padding: 4px;
}

.placeholder {
  width: 30px;
}

.filter-bar {
  background: #fff;
  padding: 10px 16px;
  border-bottom: 1px solid #ebedf0;
}

.quick-tabs {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}

.quick-tab {
  padding: 6px 14px;
  background: #f0f0f0;
  border-radius: 14px;
  font-size: 13px;
  color: #646566;
  cursor: pointer;
  transition: all 0.2s;

  &.active {
    background: #1989fa;
    color: #fff;
    font-weight: 600;
  }
}

.custom-range {
  margin-top: 10px;
}

.range-row {
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 13px;
}

.range-label {
  color: #969799;
  flex-shrink: 0;
}

.range-value {
  flex: 1;
  background: #f7f8fa;
  padding: 6px 10px;
  border-radius: 8px;
  color: #1a1a2e;
  cursor: pointer;
  text-align: center;

  &:active {
    background: #e8eaf0;
  }
}

.content {
  padding: 16px;
}

.task-cards {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.task-card {
  background: #fff;
  border-radius: 10px;
  padding: 14px;
  border-left: 3px solid #ddd;
  box-shadow: 0 2px 6px rgba(0, 0, 0, 0.04);

  &.running { border-left-color: #1989fa; }
  &.done { border-left-color: #07c160; }
  &.failed { border-left-color: #ee0a24; }
  &.pending { border-left-color: #ff976a; }
}

.task-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 8px;
}

.task-name {
  font-size: 14px;
  font-weight: 600;
  color: #323233;
  flex: 1;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  margin-right: 8px;
}

.task-status {
  font-size: 12px;
  font-weight: 600;
  padding: 2px 8px;
  border-radius: 4px;

  &.pending { color: #ff976a; background: #fff3e0; }
  &.running { color: #1989fa; background: #e3f2fd; }
  &.done { color: #07c160; background: #e8f5e9; }
  &.failed { color: #ee0a24; background: #fce4ec; }
}

.task-progress {
  margin-bottom: 8px;

  .progress-info {
    display: flex;
    justify-content: space-between;
    font-size: 12px;
    color: #646566;
    margin-bottom: 4px;
  }

  .current-word {
    color: #1989fa;
    font-weight: 500;
    max-width: 120px;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }
}

.task-stats {
  display: flex;
  gap: 12px;
  margin-bottom: 6px;

  .stat {
    font-size: 12px;
    color: #969799;
    &.success { color: #07c160; }
    &.fail { color: #ee0a24; }
  }
}

.fail-section {
  margin-top: 6px;

  .fail-toggle {
    display: flex;
    align-items: center;
    gap: 4px;
    font-size: 12px;
    color: #ee0a24;
    cursor: pointer;
    margin-bottom: 4px;
  }

  .fail-words {
    display: flex;
    flex-wrap: wrap;
    gap: 4px;
  }

  .fail-word {
    font-size: 11px;
    background: #fce4ec;
    color: #ee0a24;
    padding: 2px 6px;
    border-radius: 4px;
  }
}

.task-time {
  font-size: 11px;
  color: #c8c9cc;
  text-align: right;
}
</style>
