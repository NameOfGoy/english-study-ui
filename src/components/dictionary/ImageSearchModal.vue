<template>
  <van-popup
    v-model:show="visible"
    position="bottom"
    :style="{ height: '85%', borderRadius: '16px 16px 0 0' }"
    :close-on-click-overlay="true"
  >
    <div class="image-search-modal">
      <!-- Header -->
      <div class="modal-header">
        <h3>搜索图片</h3>
        <van-icon name="cross" @click="$emit('close')" class="close-btn" />
      </div>

      <!-- Search bar -->
      <div class="search-bar">
        <van-search
          v-model="query"
          placeholder="输入关键词搜索图片"
          show-action
          @search="onSearch"
          @keypress.enter="onSearch"
        >
          <template #action>
            <div @click="onSearch">搜索</div>
          </template>
        </van-search>
      </div>

      <!-- Image grid -->
      <div class="image-grid-container" ref="scrollContainer" @scroll="onScroll">
        <!-- Loading first page -->
        <div v-if="loading && images.length === 0" class="loading-wrap">
          <van-loading size="32px" vertical>搜索中...</van-loading>
        </div>

        <!-- Empty state -->
        <div v-else-if="!loading && searched && images.length === 0" class="empty-wrap">
          <van-empty description="未找到相关图片" />
        </div>

        <!-- Image grid -->
        <div v-else class="image-grid">
          <div
            v-for="(img, idx) in images"
            :key="idx"
            class="image-item"
            :class="{ selected: selectedIndex === idx }"
            @click="selectImage(idx)"
          >
            <img
              :src="img.thumb_url"
              referrerpolicy="no-referrer"
              crossorigin="anonymous"
              loading="lazy"
              class="grid-image"
              @error="(e) => e.target.style.display = 'none'"
            />
            <div v-if="selectedIndex === idx" class="check-mark">
              <van-icon name="success" color="#fff" size="20" />
            </div>
          </div>
        </div>

        <!-- Loading more -->
        <div v-if="loading && images.length > 0" class="loading-more">
          <van-loading size="20px">加载更多...</van-loading>
        </div>

        <!-- No more -->
        <div v-if="!loading && !hasMore && images.length > 0" class="no-more">
          <van-divider>没有更多了</van-divider>
        </div>
      </div>

      <!-- Bottom action -->
      <div class="modal-footer" v-if="selectedIndex !== null">
        <van-button type="primary" block round @click="onConfirm">
          确定使用该图片
        </van-button>
      </div>
    </div>
  </van-popup>
</template>

<script setup>
import { ref, computed, watch } from 'vue'
import { showToast } from 'vant'
import { searchImages } from '@/api/file'

const props = defineProps({
  show: { type: Boolean, default: false },
  defaultQuery: { type: String, default: '' },
})

const emit = defineEmits(['close', 'select', 'update:show'])

const visible = computed({
  get: () => props.show,
  set: (val) => { if (!val) emit('close') }
})

const query = ref('')
const images = ref([])
const loading = ref(false)
const searched = ref(false)
const hasMore = ref(true)
const offset = ref(0)
const selectedIndex = ref(null)
const scrollContainer = ref(null)
const PAGE_SIZE = 20

// Reset state when modal opens
watch(() => props.show, (val) => {
  if (val) {
    query.value = props.defaultQuery || ''
    images.value = []
    selectedIndex.value = null
    searched.value = false
    hasMore.value = true
    offset.value = 0
    if (query.value) {
      onSearch()
    }
  }
})

const onSearch = async () => {
  if (!query.value.trim()) {
    showToast('请输入搜索关键词')
    return
  }
  // Reset for new search
  images.value = []
  offset.value = 0
  hasMore.value = true
  selectedIndex.value = null
  searched.value = true
  await loadImages()
}

const loadImages = async () => {
  if (loading.value || !hasMore.value) return
  loading.value = true
  try {
    const resp = await searchImages(query.value, offset.value, PAGE_SIZE)
    const list = resp.images || []
    if (list.length < PAGE_SIZE) {
      hasMore.value = false
    }
    images.value = [...images.value, ...list]
    offset.value += list.length
  } catch (e) {
    console.error('搜索图片失败:', e)
    showToast('搜索失败，请重试')
  } finally {
    loading.value = false
  }
}

const onScroll = () => {
  const el = scrollContainer.value
  if (!el) return
  const { scrollTop, scrollHeight, clientHeight } = el
  if (scrollTop + clientHeight >= scrollHeight - 100) {
    loadImages()
  }
}

const selectImage = (idx) => {
  selectedIndex.value = selectedIndex.value === idx ? null : idx
}

const onConfirm = () => {
  if (selectedIndex.value === null) return
  const img = images.value[selectedIndex.value]
  emit('select', img.url)
}
</script>

<style lang="scss" scoped>
.image-search-modal {
  display: flex;
  flex-direction: column;
  height: 100%;
  background: #fff;
}

.modal-header {
  display: flex; justify-content: space-between; align-items: center;
  padding: 16px 20px 12px; border-bottom: 1px solid #eee; flex-shrink: 0;
}
.modal-header h3 { margin: 0; font-size: 18px; font-weight: 600; color: #333; }
.close-btn { font-size: 20px; color: #999; cursor: pointer; }

.search-bar { flex-shrink: 0; }

.image-grid-container {
  flex: 1; overflow-y: auto; padding: 12px;
  -webkit-overflow-scrolling: touch;
}

.loading-wrap, .empty-wrap {
  display: flex; justify-content: center; align-items: center;
  min-height: 200px;
}

.image-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 8px;
}

.image-item {
  position: relative;
  border-radius: 8px;
  overflow: hidden;
  cursor: pointer;
  border: 3px solid transparent;
  transition: border-color 0.2s ease;
  aspect-ratio: 1;
}

.image-item.selected {
  border-color: #1989fa;
}

.grid-image {
  width: 100%;
  height: 100%;
}

.check-mark {
  position: absolute;
  top: 6px;
  right: 6px;
  width: 28px;
  height: 28px;
  border-radius: 50%;
  background: #1989fa;
  display: flex;
  align-items: center;
  justify-content: center;
  box-shadow: 0 2px 6px rgba(0,0,0,0.3);
}

.loading-more {
  display: flex; justify-content: center; padding: 16px 0;
}

.no-more {
  padding: 8px 0;
}

.modal-footer {
  flex-shrink: 0;
  padding: 12px 20px;
  padding-bottom: calc(12px + env(safe-area-inset-bottom));
  border-top: 1px solid #eee;
  background: #fff;
}
</style>
