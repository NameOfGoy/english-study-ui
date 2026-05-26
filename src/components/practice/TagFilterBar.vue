<template>
  <div class="tag-filter-bar">
    <div class="filter-header" @click="expanded = !expanded">
      <div class="filter-summary">
        <van-icon name="label-o" />
        <span class="filter-title">标签筛选</span>
        <span class="filter-summary-text">{{ summaryText }}</span>
      </div>
      <van-icon :name="expanded ? 'arrow-up' : 'arrow-down'" class="caret" />
    </div>

    <div v-if="expanded" class="filter-body">
      <div v-if="loading" class="filter-loading">
        <van-loading size="16" />
      </div>
      <template v-else>
        <!-- "全部" 单独一行, 与具体标签互斥 -->
        <div class="all-row" :class="{ active: isAllSelected }" @click="selectAll">
          <van-icon :name="isAllSelected ? 'success' : 'circle'" :class="{ checked: isAllSelected }" />
          <span>全部 (不筛选)</span>
        </div>
        <div v-if="allTags.length > 0" class="tag-grid">
          <div
            v-for="t in allTags"
            :key="t.id"
            class="tag-chip"
            :class="{ active: selectedIds.includes(t.id), system: t.is_system }"
            :style="selectedIds.includes(t.id) ? { background: t.style || '#1989fa' } : {}"
            @click="toggleTag(t.id)"
          >
            <span class="tag-name">{{ t.name }}</span>
            <van-icon v-if="t.is_system" name="lock" class="sys-icon" />
          </div>
        </div>
        <div v-else class="tag-empty">还没有标签, 去词典创建一个吧</div>
      </template>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { getTagList } from '@/api/tag'
import { getPracticeTagFilter, setPracticeTagFilter, clearPracticeTagFilter } from '@/utils/practiceTagFilter'

const expanded = ref(false)
const allTags = ref([])
const loading = ref(false)
const selectedIds = ref(getPracticeTagFilter())

const isAllSelected = computed(() => selectedIds.value.length === 0)

const summaryText = computed(() => {
  if (selectedIds.value.length === 0) return '全部'
  if (selectedIds.value.length <= 2) {
    const names = allTags.value.filter((t) => selectedIds.value.includes(t.id)).map((t) => t.name)
    return names.length === 0 ? `已选 ${selectedIds.value.length} 个` : names.join('、')
  }
  return `已选 ${selectedIds.value.length} 个`
})

const loadTags = async () => {
  loading.value = true
  try {
    const resp = await getTagList()
    if (resp.code === 0) {
      allTags.value = resp.data || []
      // 清理 stale 选中: 标签可能已删
      const validIDs = new Set(allTags.value.map((t) => t.id))
      const cleaned = selectedIds.value.filter((id) => validIDs.has(id))
      if (cleaned.length !== selectedIds.value.length) {
        selectedIds.value = cleaned
        setPracticeTagFilter(cleaned)
      }
    }
  } finally {
    loading.value = false
  }
}

const selectAll = () => {
  selectedIds.value = []
  clearPracticeTagFilter()
}

const toggleTag = (id) => {
  // 勾任何具体标签 → 自动取消"全部" (互斥)
  const idx = selectedIds.value.indexOf(id)
  if (idx >= 0) {
    selectedIds.value = selectedIds.value.filter((x) => x !== id)
  } else {
    selectedIds.value = [...selectedIds.value, id]
  }
  setPracticeTagFilter(selectedIds.value)
}

onMounted(loadTags)
</script>

<style lang="scss" scoped>
.tag-filter-bar {
  margin: 12px 16px 0;
  background: #fff;
  border-radius: 10px;
  border: 1px solid #ebedf0;
  overflow: hidden;
}
.filter-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 10px 14px;
  cursor: pointer;
}
.filter-summary {
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 14px;
  color: #323233;
}
.filter-summary-text {
  color: #969799;
  font-size: 13px;
  margin-left: 4px;
}
.caret {
  color: #c8c9cc;
}
.filter-body {
  padding: 8px 14px 14px;
  border-top: 1px solid #f2f3f5;
}
.filter-loading {
  display: flex;
  justify-content: center;
  padding: 12px 0;
}
.all-row {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 8px 0;
  color: #646566;
  font-size: 13px;
  border-bottom: 1px dashed #f2f3f5;
  margin-bottom: 8px;

  .checked {
    color: #07c160;
  }

  &.active {
    color: #07c160;
    font-weight: 500;
  }
}
.tag-grid {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
}
.tag-chip {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  padding: 4px 10px;
  border-radius: 12px;
  background: #f2f3f5;
  color: #646566;
  font-size: 12px;
  transition: background 0.15s;

  &.active {
    color: #fff;
  }

  &.system {
    border: 1px dashed #ffb800;
  }
}
.sys-icon {
  font-size: 10px;
}
.tag-empty {
  text-align: center;
  color: #969799;
  font-size: 13px;
  padding: 10px 0;
}
</style>
