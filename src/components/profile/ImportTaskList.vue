<template>
  <div class="import-task-list">
    <div class="section-header" @click="expanded = !expanded">
      <div class="header-left">
        <van-icon name="description" size="18" />
        <span>导入任务</span>
        <span v-if="hasRunning" class="running-badge">进行中</span>
      </div>
      <van-icon :name="expanded ? 'arrow-up' : 'arrow-down'" size="16" color="#999" />
    </div>

    <div v-if="expanded" class="task-content">
      <van-loading v-if="loading && tasks.length === 0" size="24px" vertical>加载中...</van-loading>

      <van-empty v-else-if="tasks.length === 0" description="暂无导入任务" image="search" />

      <div v-else class="task-cards">
        <div v-for="task in tasks" :key="task.id" class="task-card" :class="statusClass(task.status)">
          <div class="task-header">
            <div class="task-name">{{ task.file_name }}</div>
            <div class="task-status" :class="statusClass(task.status)">{{ statusText(task.status) }}</div>
          </div>

          <!-- Progress -->
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

          <!-- Stats -->
          <div class="task-stats">
            <span class="stat success" v-if="task.success_count > 0">成功 {{ task.success_count }}</span>
            <span class="stat fail" v-if="task.fail_count > 0">失败 {{ task.fail_count }}</span>
            <span class="stat total">共 {{ task.total }} 个</span>
          </div>

          <!-- Failed words (expandable) -->
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
  </div>
</template>

<script setup>
import { ref, computed, onMounted, onUnmounted } from 'vue'
import { getImportTaskList } from '@/api/dictionary'

const tasks = ref([])
const loading = ref(false)
const expanded = ref(true)
const expandedFails = ref({})
let pollTimer = null

const hasRunning = computed(() => tasks.value.some(t => t.status === 0 || t.status === 1))

const statusText = (status) => {
  return { 0: '待处理', 1: '进行中', 2: '已完成', 3: '失败' }[status] || '未知'
}

const statusClass = (status) => {
  return { 0: 'pending', 1: 'running', 2: 'done', 3: 'failed' }[status] || ''
}

const parseFailWords = (json) => {
  try { return JSON.parse(json) } catch { return [] }
}

const toggleFailWords = (id) => {
  expandedFails.value[id] = !expandedFails.value[id]
}

const loadTasks = async () => {
  try {
    loading.value = true
    const resp = await getImportTaskList()
    if (resp.code === 0) {
      tasks.value = resp.tasks || []
    }
  } catch (e) {
    console.error('加载任务列表失败:', e)
  } finally {
    loading.value = false
  }
}

const startPolling = () => {
  stopPolling()
  pollTimer = setInterval(() => {
    if (hasRunning.value) {
      loadTasks()
    }
  }, 3000)
}

const stopPolling = () => {
  if (pollTimer) {
    clearInterval(pollTimer)
    pollTimer = null
  }
}

onMounted(() => {
  loadTasks()
  startPolling()
})

onUnmounted(() => {
  stopPolling()
})
</script>

<style lang="scss" scoped>
.import-task-list {
  margin-top: 12px;
  background: #fff;
  border-radius: 8px;
  overflow: hidden;
}

.section-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 14px 16px;
  cursor: pointer;
  user-select: none;

  .header-left {
    display: flex;
    align-items: center;
    gap: 8px;
    font-size: 15px;
    font-weight: 500;
    color: #323233;
  }

  .running-badge {
    font-size: 11px;
    background: #1989fa;
    color: #fff;
    padding: 1px 6px;
    border-radius: 8px;
    font-weight: 600;
  }
}

.task-content {
  padding: 0 16px 16px;
}

.task-cards {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.task-card {
  background: #f7f8fa;
  border-radius: 10px;
  padding: 14px;
  border-left: 3px solid #ddd;

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
