<template>
  <van-popup
    v-model:show="visible"
    position="center"
    :style="{ width: '92%', maxWidth: '420px', borderRadius: '16px' }"
    :close-on-click-overlay="false"
  >
    <div class="tag-modal">
      <div class="modal-header">
        <h3>编辑标签</h3>
        <van-icon name="cross" @click="$emit('close')" class="close-btn" />
      </div>

      <div class="modal-content">
        <div class="word-info">
          <h4>{{ word?.word }}</h4>
        </div>

        <!-- 当前已选 -->
        <div class="section">
          <div class="section-title">当前标签</div>
          <div class="tag-row">
            <span
              v-for="tag in localSelectedTags"
              :key="tag.id"
              class="tag-pill current"
              :style="{ backgroundColor: tag.style || tag.color || '#1989fa' }"
              @click="removeTag(tag.id)"
            >
              {{ tag.name }}
              <van-icon name="cross" class="remove-icon" />
            </span>
            <span v-if="localSelectedTags.length === 0" class="empty">暂无标签</span>
          </div>
        </div>

        <!-- 可选标签 -->
        <div class="section">
          <div class="section-title">可选标签</div>
          <div class="tag-row">
            <span
              v-for="tag in availableTags"
              :key="tag.id"
              class="tag-pill option"
              :class="{ selected: isSelected(tag.id) }"
              :style="{ backgroundColor: tag.style || tag.color || '#1989fa' }"
              @click="toggleTag(tag)"
            >
              {{ tag.name }}
            </span>
            <span
              class="tag-pill new-tag"
              @click="showCreateForm = true"
            >
              <van-icon name="plus" /> 新建
            </span>
          </div>
        </div>

        <!-- 新建标签子表单 -->
        <div v-if="showCreateForm" class="create-form">
          <van-field
            v-model="newTagName"
            label="名称"
            placeholder="不超过20字"
            maxlength="20"
            clearable
          />
          <div class="color-row">
            <span class="color-label">颜色</span>
            <div class="color-picker">
              <span
                v-for="c in colorPalette"
                :key="c"
                class="color-dot"
                :class="{ active: newTagColor === c }"
                :style="{ background: c }"
                @click="newTagColor = c"
              ></span>
            </div>
          </div>
          <div class="create-actions">
            <van-button size="small" round @click="cancelCreate">取消</van-button>
            <van-button
              size="small" round type="primary"
              :loading="creating"
              :disabled="!newTagName.trim()"
              @click="createTag"
            >创建</van-button>
          </div>
        </div>

        <div class="modal-actions">
          <van-button
            type="default"
            round
            @click="$emit('close')"
            class="action-btn"
          >取消</van-button>
          <van-button
            type="primary"
            round
            @click="handleSubmit"
            :loading="loading"
            :disabled="loading"
            class="action-btn"
          >保存</van-button>
        </div>
      </div>
    </div>
  </van-popup>
</template>

<script setup>
import { ref, computed, watch } from 'vue'
import { showToast } from 'vant'
import { addTag, getTagList } from '@/api/tag'

const props = defineProps({
  show: { type: Boolean, default: false },
  word: { type: Object, default: null },
  selectedTags: { type: Array, default: () => [] },
  availableTags: { type: Array, default: () => [] },
  loading: { type: Boolean, default: false }
})

const emit = defineEmits(['close', 'submit', 'tags-changed'])

const localSelectedTags = ref([])
const showCreateForm = ref(false)
const newTagName = ref('')
const newTagColor = ref('#ff6b6b')
const creating = ref(false)

const colorPalette = [
  '#ff6b6b', '#ff9800', '#feca57', '#4ecdc4',
  '#45b7d1', '#1989fa', '#5f27cd', '#ab47bc',
  '#ff9ff3', '#54a0ff', '#07c160', '#969799'
]

const visible = computed({
  get: () => props.show,
  set: (val) => { if (!val) emit('close') }
})

watch(() => props.show, (val) => {
  if (val) {
    localSelectedTags.value = [...props.selectedTags]
    showCreateForm.value = false
    newTagName.value = ''
    newTagColor.value = '#ff6b6b'
  }
})

watch(() => props.selectedTags, (val) => {
  if (props.show) {
    localSelectedTags.value = [...val]
  }
}, { deep: true })

const isSelected = (id) => localSelectedTags.value.some(t => t.id === id)

const toggleTag = (tag) => {
  const idx = localSelectedTags.value.findIndex(t => t.id === tag.id)
  if (idx > -1) localSelectedTags.value.splice(idx, 1)
  else localSelectedTags.value.push({ ...tag })
}

const removeTag = (id) => {
  const idx = localSelectedTags.value.findIndex(t => t.id === id)
  if (idx > -1) localSelectedTags.value.splice(idx, 1)
}

const cancelCreate = () => {
  showCreateForm.value = false
  newTagName.value = ''
}

const createTag = async () => {
  const name = newTagName.value.trim()
  if (!name) return
  creating.value = true
  try {
    const resp = await addTag({ name, style: newTagColor.value })
    if (resp.code === 0) {
      showToast({ message: '已新建', type: 'success' })
      // 刷新可用标签列表 → 通知父级
      const list = await getTagList()
      if (list.code === 0) {
        emit('tags-changed', list.data || [])
        // 自动选中刚新建的（按名字匹配）
        const justCreated = (list.data || []).find(t => t.name === name)
        if (justCreated && !isSelected(justCreated.id)) {
          localSelectedTags.value.push({ ...justCreated })
        }
      }
      cancelCreate()
    } else {
      showToast(resp.message || '创建失败')
    }
  } catch (e) {
    showToast('网络错误')
  } finally {
    creating.value = false
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
}

.modal-header {
  background: var(--es-grad);
  padding: 16px 20px;
  display: flex;
  justify-content: space-between;
  align-items: center;

  h3 {
    color: white;
    font-size: 18px;
    font-weight: 700;
    margin: 0;
  }

  .close-btn {
    color: white;
    font-size: 20px;
    cursor: pointer;
    padding: 4px;
  }
}

.modal-content {
  padding: 16px 20px 20px;
}

.word-info {
  text-align: center;
  margin-bottom: 16px;

  h4 {
    font-size: 20px;
    font-weight: 700;
    color: #2c3e50;
    margin: 0;
  }
}

.section {
  margin-bottom: 14px;
}

.section-title {
  font-size: 13px;
  font-weight: 600;
  color: #646566;
  margin-bottom: 8px;
}

.tag-row {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
}

.tag-pill {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  padding: 5px 10px;
  border-radius: 14px;
  font-size: 12px;
  color: white;
  cursor: pointer;
  transition: all 0.2s ease;

  &.current {
    .remove-icon {
      font-size: 11px;
      opacity: 0.85;
    }
  }

  &.option {
    opacity: 0.55;
    &:hover { opacity: 0.85; }
    &.selected {
      opacity: 1;
      box-shadow: 0 2px 8px rgba(0, 0, 0, 0.25);
      transform: translateY(-1px);
    }
  }

  &.new-tag {
    background: #f7f8fa !important;
    color: #1989fa;
    border: 1px dashed #1989fa;
  }
}

.empty {
  color: #c8c9cc;
  font-size: 12px;
  font-style: italic;
}

.create-form {
  background: #f7f8fa;
  border-radius: 8px;
  padding: 12px;
  margin: 10px 0;
}

.color-row {
  display: flex;
  align-items: center;
  margin-top: 10px;
}

.color-label {
  font-size: 13px;
  color: #646566;
  width: 50px;
  flex-shrink: 0;
}

.color-picker {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
  flex: 1;
}

.color-dot {
  width: 22px;
  height: 22px;
  border-radius: 50%;
  cursor: pointer;
  border: 2px solid transparent;
  transition: all 0.2s ease;

  &.active {
    border-color: #1a1a2e;
    transform: scale(1.15);
  }
}

.create-actions {
  display: flex;
  justify-content: flex-end;
  gap: 8px;
  margin-top: 10px;
}

.modal-actions {
  display: flex;
  gap: 10px;
  margin-top: 18px;

  .action-btn {
    flex: 1;
    height: 42px;
  }
}
</style>
