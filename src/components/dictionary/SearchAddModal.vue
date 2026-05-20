<template>
  <van-popup
    v-model:show="visible"
    position="bottom"
    :style="{ height: '90vh', borderRadius: '16px 16px 0 0' }"
    :close-on-click-overlay="true"
    @close="onClose"
  >
    <div class="search-add-modal">
      <!-- 顶部标题栏 -->
      <div class="modal-header">
        <span class="modal-title">中文搜索添加</span>
        <van-icon name="cross" class="close-icon" @click="onClose" />
      </div>

      <!-- 搜索框 -->
      <div class="search-bar">
        <van-search
          v-model="keyword"
          placeholder="输入中文，如：短暂、放弃..."
          shape="round"
          background="transparent"
          @input="onInput"
          @compositionstart="isComposing = true"
          @compositionend="onCompositionEnd"
          @clear="onClear"
        />
      </div>

      <!-- 提示文字（未搜索时） -->
      <div v-if="!keyword && !results.length" class="empty-hint">
        <van-icon name="search" size="48" color="#c8c9cc" />
        <p>输入中文释义关键词搜索词库</p>
        <p class="hint-sub">例如：搜索"短暂"找到 ephemeral、transient 等</p>
      </div>

      <!-- 加载中 -->
      <div v-else-if="loading" class="loading-wrap">
        <van-loading size="24px" vertical>搜索中...</van-loading>
      </div>

      <!-- 无结果 -->
      <van-empty
        v-else-if="!loading && keyword && results.length === 0"
        image="search"
        description="未找到相关词汇"
      />

      <!-- 结果列表 -->
      <div v-else class="result-list">
        <!-- 全选 & 已选提示 -->
        <div class="list-toolbar">
          <span class="result-count">共 {{ results.length }} 条结果</span>
          <van-checkbox
            v-if="selectableCount > 0"
            v-model="allSelected"
            @change="toggleAll"
            shape="square"
            icon-size="16px"
          >全选可添加</van-checkbox>
        </div>

        <van-checkbox-group v-model="selectedSws">
          <div
            v-for="item in results"
            :key="item.sw"
            class="result-item"
            :class="{ 'is-added': item.is_added }"
          >
            <van-checkbox
              v-if="!item.is_added"
              :name="item.sw"
              shape="square"
              icon-size="18px"
              class="item-checkbox"
            />
            <div class="item-info" :class="{ 'no-checkbox': item.is_added }">
              <div class="item-top">
                <span class="item-sw">{{ item.sw }}</span>
                <van-tag v-if="item.word_type === 2" plain type="primary" size="mini" class="type-tag">短语</van-tag>
                <van-tag v-if="item.is_added" type="success" size="mini" class="added-tag">已添加</van-tag>
              </div>
              <div class="item-phonetic" v-if="item.phonetic">{{ item.phonetic }}</div>
              <div class="item-translation">{{ item.translation }}</div>
            </div>
          </div>
        </van-checkbox-group>
      </div>

      <!-- 底部操作栏 -->
      <div class="bottom-bar" v-if="selectableCount > 0">
        <van-button
          type="primary"
          block
          round
          :disabled="selectedSws.length === 0 || submitting"
          :loading="submitting"
          loading-text="提交中..."
          @click="onSubmit"
        >
          {{ selectedSws.length > 0 ? `批量添加 (${selectedSws.length})` : '请勾选词汇' }}
        </van-button>
      </div>
    </div>
  </van-popup>
</template>

<script setup>
import { ref, computed, watch } from 'vue'
import { showToast } from 'vant'
import { searchStardict, batchAddStardict } from '@/api/dictionary'

const props = defineProps({
  show: {
    type: Boolean,
    default: false
  }
})

const emit = defineEmits(['close', 'added'])

const visible = computed({
  get: () => props.show,
  set: (val) => { if (!val) emit('close') }
})

const keyword = ref('')
const results = ref([])
const loading = ref(false)
const submitting = ref(false)
const selectedSws = ref([])
const isComposing = ref(false)
let debounceTimer = null

const selectableCount = computed(() => results.value.filter(r => !r.is_added).length)

const allSelected = computed({
  get: () => selectableCount.value > 0 && selectedSws.value.length === selectableCount.value,
  set: () => {}
})

const toggleAll = (checked) => {
  if (checked) {
    selectedSws.value = results.value.filter(r => !r.is_added).map(r => r.sw)
  } else {
    selectedSws.value = []
  }
}

const doSearch = async (kw) => {
  if (!kw.trim()) {
    results.value = []
    return
  }
  loading.value = true
  selectedSws.value = []
  try {
    const resp = await searchStardict({ keyword: kw.trim(), limit: 30 })
    if (resp.code === 0) {
      results.value = resp.data || []
    } else {
      showToast(resp.message || '搜索失败')
      results.value = []
    }
  } catch (e) {
    showToast('网络错误，请重试')
    results.value = []
  } finally {
    loading.value = false
  }
}

const onInput = () => {
  if (isComposing.value) return
  clearTimeout(debounceTimer)
  debounceTimer = setTimeout(() => doSearch(keyword.value), 300)
}

const onCompositionEnd = (e) => {
  isComposing.value = false
  keyword.value = e.target.value
  clearTimeout(debounceTimer)
  debounceTimer = setTimeout(() => doSearch(keyword.value), 300)
}

const onClear = () => {
  results.value = []
  selectedSws.value = []
}

const onSubmit = async () => {
  if (selectedSws.value.length === 0) return
  submitting.value = true
  try {
    const items = selectedSws.value.map(sw => {
      const item = results.value.find(r => r.sw === sw)
      return { sw, word_type: item?.word_type || 1 }
    })
    const resp = await batchAddStardict({ items })
    if (resp.code === 0) {
      const n = resp.submitted || selectedSws.value.length
      showToast({ message: `已后台添加 ${n} 个词，稍后可在词典中查看`, type: 'success', duration: 3000 })
      // 标记已提交的词为已添加
      const submittedSet = new Set(selectedSws.value)
      results.value = results.value.map(r =>
        submittedSet.has(r.sw) ? { ...r, is_added: true } : r
      )
      selectedSws.value = []
      emit('added')
    } else {
      showToast(resp.message || '提交失败，请重试')
    }
  } catch (e) {
    showToast('网络错误，请重试')
  } finally {
    submitting.value = false
  }
}

const onClose = () => {
  clearTimeout(debounceTimer)
  keyword.value = ''
  results.value = []
  selectedSws.value = []
  loading.value = false
  submitting.value = false
  emit('close')
}

// 每次弹出时重置
watch(() => props.show, (val) => {
  if (!val) onClose()
})
</script>

<style scoped>
.search-add-modal {
  display: flex;
  flex-direction: column;
  height: 90vh;
  background: #fff;
  border-radius: 16px 16px 0 0;
  overflow: hidden;
}

.modal-header {
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 16px 20px 8px;
  position: relative;
  flex-shrink: 0;
}

.modal-title {
  font-size: 17px;
  font-weight: 700;
  color: #1a1a2e;
}

.close-icon {
  position: absolute;
  right: 20px;
  font-size: 20px;
  color: #969799;
  cursor: pointer;
}

.search-bar {
  padding: 0 8px 4px;
  flex-shrink: 0;
}

.empty-hint {
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  color: #969799;
  gap: 10px;
  padding: 40px 20px;
}

.empty-hint p {
  margin: 0;
  font-size: 14px;
}

.hint-sub {
  font-size: 12px !important;
  color: #c8c9cc;
  text-align: center;
}

.loading-wrap {
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
}

.result-list {
  flex: 1;
  overflow-y: auto;
  padding: 0 0 80px;
}

.list-toolbar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 8px 16px;
  background: #f7f8fa;
  border-bottom: 1px solid #ebedf0;
  flex-shrink: 0;
}

.result-count {
  font-size: 12px;
  color: #969799;
}

.result-item {
  display: flex;
  align-items: flex-start;
  padding: 12px 16px;
  border-bottom: 1px solid #f0f0f0;
  gap: 10px;
}

.result-item.is-added {
  background: #fafafa;
  opacity: 0.75;
}

.item-checkbox {
  margin-top: 2px;
  flex-shrink: 0;
}

.item-info {
  flex: 1;
  min-width: 0;
}

.item-info.no-checkbox {
  padding-left: 28px;
}

.item-top {
  display: flex;
  align-items: center;
  gap: 6px;
  flex-wrap: wrap;
}

.item-sw {
  font-size: 16px;
  font-weight: 600;
  color: #1a1a2e;
}

.type-tag {
  transform: scale(0.9);
}

.added-tag {
  transform: scale(0.9);
}

.item-phonetic {
  font-size: 12px;
  color: #969799;
  margin-top: 2px;
}

.item-translation {
  font-size: 13px;
  color: #646566;
  margin-top: 3px;
  line-height: 1.4;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}

.bottom-bar {
  position: absolute;
  bottom: 0;
  left: 0;
  right: 0;
  padding: 12px 20px 20px;
  background: #fff;
  border-top: 1px solid #ebedf0;
  box-shadow: 0 -4px 16px rgba(0, 0, 0, 0.06);
}
</style>
