<template>
  <van-popup
    v-model:show="visible"
    position="center"
    :style="{ width: '90%', maxWidth: '400px', borderRadius: '16px' }"
    :close-on-click-overlay="false"
  >
    <div class="tag-modal">
      <div class="modal-header">
        <h3>编辑单词标签</h3>
        <van-icon name="cross" @click="$emit('close')" class="close-btn" />
      </div>

      <div class="modal-content">
        <div class="word-info">
          <h4>{{ word?.word }}</h4>
          <p class="word-subtitle">Word Tags</p>
        </div>

        <!-- 当前标签 -->
        <div class="current-tags-section">
          <h5>当前标签</h5>
          <div class="current-tags">
            <span
              v-for="tag in localSelectedTags"
              :key="tag.id"
              class="tag-item current"
              :style="{ backgroundColor: tag.color }"
              @click="handleRemoveTag(tag.id)"
            >
              {{ tag.name }}
              <van-icon name="cross" class="remove-icon" />
            </span>
            <span v-if="localSelectedTags.length === 0" class="no-tags">暂无标签</span>
          </div>
        </div>

        <!-- 预设标签 -->
        <div class="preset-tags-section">
          <h5>选择标签</h5>
          <div class="preset-tags">
            <span
              v-for="tag in availableTags"
              :key="tag.id"
              class="tag-item preset"
              :class="{ selected: isTagSelected(tag.id) }"
              :style="{ backgroundColor: tag.color }"
              @click="handleToggleTag(tag)"
            >
              {{ tag.name }}
            </span>
          </div>
        </div>

        <div class="modal-actions">
          <van-button
            type="default"
            @click="$emit('close')"
            class="action-btn cancel-btn"
          >
            取消
          </van-button>
          <van-button
            type="primary"
            @click="handleSubmit"
            :loading="loading"
            :disabled="loading"
            class="action-btn submit-btn"
          >
            保存
          </van-button>
        </div>
      </div>
    </div>
  </van-popup>
</template>

<script setup>
import { ref, computed, watch } from 'vue'

const props = defineProps({
  show: { type: Boolean, default: false },
  word: { type: Object, default: null },
  selectedTags: { type: Array, default: () => [] },
  availableTags: { type: Array, default: () => [] },
  loading: { type: Boolean, default: false }
})

const emit = defineEmits(['close', 'submit', 'update:show'])

// Local copy of selected tags for manipulation
const localSelectedTags = ref([])

const visible = computed({
  get: () => props.show,
  set: (val) => { if (!val) emit('close') }
})

// Sync local tags when modal opens or selectedTags prop changes
watch(() => props.show, (val) => {
  if (val) {
    localSelectedTags.value = [...props.selectedTags]
  }
})

watch(() => props.selectedTags, (val) => {
  if (props.show) {
    localSelectedTags.value = [...val]
  }
}, { deep: true })

const isTagSelected = (tagId) => {
  return localSelectedTags.value.some(tag => tag.id === tagId)
}

const handleToggleTag = (tag) => {
  const index = localSelectedTags.value.findIndex(t => t.id === tag.id)
  if (index > -1) {
    localSelectedTags.value.splice(index, 1)
  } else {
    localSelectedTags.value.push(tag)
  }
}

const handleRemoveTag = (tagId) => {
  const index = localSelectedTags.value.findIndex(t => t.id === tagId)
  if (index > -1) {
    localSelectedTags.value.splice(index, 1)
  }
}

const handleSubmit = () => {
  emit('submit', [...localSelectedTags.value])
}
</script>

<style lang="scss" scoped>
.tag-modal {
  background: white;
  border-radius: 16px;
  overflow: hidden;

  .modal-header {
    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
    padding: 20px; display: flex; justify-content: space-between; align-items: center;

    h3 { color: white; font-size: 20px; font-weight: 700; margin: 0; letter-spacing: 0.5px; }

    .close-btn {
      color: white; font-size: 22px; cursor: pointer; padding: 4px;
      border-radius: 50%; transition: all 0.2s ease;
      &:hover { background-color: rgba(255, 255, 255, 0.15); }
    }
  }

  .modal-content {
    padding: 24px;

    .word-info {
      text-align: center; margin-bottom: 24px;
      h4 { font-size: 24px; font-weight: 700; color: #2c3e50; margin: 0 0 8px 0; }
      .word-subtitle { color: #7f8c8d; font-size: 14px; margin: 0; }
    }

    .current-tags-section, .preset-tags-section {
      margin-bottom: 20px;
      h5 { font-size: 16px; font-weight: 600; color: #2c3e50; margin: 0 0 12px 0; }
    }

    .current-tags, .preset-tags {
      display: flex; flex-wrap: wrap; gap: 8px;

      .tag-item {
        padding: 6px 12px; border-radius: 16px; font-size: 14px;
        color: white; font-weight: 500; cursor: pointer; transition: all 0.3s ease;
        display: flex; align-items: center; gap: 6px;

        &.current {
          .remove-icon { font-size: 12px; opacity: 0.8; &:hover { opacity: 1; } }
        }

        &.preset {
          opacity: 0.7;
          &:hover { opacity: 0.9; transform: translateY(-2px); }
          &.selected { opacity: 1; box-shadow: 0 4px 12px rgba(0, 0, 0, 0.2); }
        }
      }

      .no-tags { color: #95a5a6; font-style: italic; padding: 8px 0; }
    }

    .modal-actions {
      display: flex; gap: 12px; margin-top: 24px;

      .action-btn {
        flex: 1; height: 48px; border-radius: 24px; font-weight: 600; font-size: 16px;
        border: none; cursor: pointer; transition: all 0.3s ease;

        &.cancel-btn { background: #6c757d; color: white; &:hover { background: #5a6268; } }

        &.submit-btn {
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white;
          &:hover { transform: translateY(-2px); box-shadow: 0 8px 24px rgba(102, 126, 234, 0.4); }
        }
      }
    }
  }
}
</style>
