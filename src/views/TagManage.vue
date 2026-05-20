<template>
  <div class="tag-manage-page">
    <!-- 顶部 -->
    <div class="page-header">
      <van-icon name="arrow-left" class="back-btn" @click="$router.back()" />
      <span class="page-title">我的标签</span>
      <van-icon name="plus" class="add-btn" @click="openCreateForm" />
    </div>

    <!-- 加载中 -->
    <van-loading v-if="loading" size="24px" vertical>加载中...</van-loading>

    <!-- 内容 -->
    <div v-else class="content">
      <!-- 系统默认标签 -->
      <div v-if="defaultTags.length > 0" class="section">
        <div class="section-header">
          <span class="section-title">系统标签</span>
          <span class="section-sub">所有用户共享，不可编辑</span>
        </div>
        <div class="tag-list">
          <div
            v-for="t in defaultTags"
            :key="t.id"
            class="tag-card readonly"
          >
            <span class="tag-pill" :style="{ background: t.style || '#969799' }">{{ t.name }}</span>
            <van-icon name="lock" class="lock-icon" />
          </div>
        </div>
      </div>

      <!-- 用户自定义标签 -->
      <div class="section">
        <div class="section-header">
          <span class="section-title">我的标签</span>
          <span class="section-sub">{{ userTags.length }} 个</span>
        </div>
        <div v-if="userTags.length === 0" class="empty-block">
          <van-icon name="label-o" size="36" color="#c8c9cc" />
          <p>还没有自定义标签</p>
          <van-button round size="small" type="primary" @click="openCreateForm">立即新建</van-button>
        </div>
        <div v-else class="tag-list">
          <div
            v-for="t in userTags"
            :key="t.id"
            class="tag-card"
          >
            <span class="tag-pill" :style="{ background: t.style || '#1989fa' }">{{ t.name }}</span>
            <div class="card-actions">
              <van-icon name="edit" class="action-icon" @click="openEditForm(t)" />
              <van-icon name="delete-o" class="action-icon danger" @click="confirmDelete(t)" />
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- 新建/编辑弹窗 -->
    <van-popup
      v-model:show="formVisible"
      position="bottom"
      :style="{ borderRadius: '16px 16px 0 0' }"
    >
      <div class="form-popup">
        <div class="form-header">
          <span class="form-title">{{ editingTag ? '编辑标签' : '新建标签' }}</span>
          <van-icon name="cross" class="close-icon" @click="closeForm" />
        </div>
        <div class="form-body">
          <van-field
            v-model="form.name"
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
                :class="{ active: form.style === c }"
                :style="{ background: c }"
                @click="form.style = c"
              ></span>
            </div>
          </div>
          <div class="form-preview">
            <span class="preview-label">预览</span>
            <span class="tag-pill" :style="{ background: form.style }">{{ form.name || '标签名' }}</span>
          </div>
        </div>
        <div class="form-actions">
          <van-button round @click="closeForm">取消</van-button>
          <van-button
            round type="primary"
            :loading="submitting"
            :disabled="!form.name.trim()"
            @click="submitForm"
          >{{ editingTag ? '保存' : '创建' }}</van-button>
        </div>
      </div>
    </van-popup>

    <!-- 删除确认 -->
    <van-dialog
      v-model:show="deleteVisible"
      title="确认删除"
      :message="deleteMessage"
      show-cancel-button
      confirm-button-text="删除"
      confirm-button-color="#ee0a24"
      @confirm="executeDelete"
    />
  </div>
</template>

<script setup>
import { ref, reactive, computed, onMounted } from 'vue'
import { showToast } from 'vant'
import { getTagList, addTag, updateTag, deleteTag } from '@/api/tag'

const loading = ref(true)
const allTags = ref([])
const formVisible = ref(false)
const editingTag = ref(null)
const submitting = ref(false)
const deleteVisible = ref(false)
const pendingDelete = ref(null)

const form = reactive({
  name: '',
  style: '#ff6b6b'
})

const colorPalette = [
  '#ff6b6b', '#ff9800', '#feca57', '#4ecdc4',
  '#45b7d1', '#1989fa', '#5f27cd', '#ab47bc',
  '#ff9ff3', '#54a0ff', '#07c160', '#969799'
]

const userId = computed(() => {
  // 系统默认标签的 user_id 在前端无法直接判断，靠 API 返回 style 区分？
  // 实际：我们这里通过 tag 是否在 'defaultNames' 集来兜底
  // 但更可靠的方式是让 API 返回 user_id；当前 Tag 类型没有
  // 实际处理：所有从 /v1/tag/list 返回的，先尝试编辑/删除，后端会以 user_id 校验，删默认会自动失败
  return 0
})

// 区分系统标签 vs 用户标签：依赖后端把默认标签放在前面（user_id=0 先来）
// 实际上 API 返回不区分，前端按名字 hardcode 一个默认列表是脆的
// 改用：先获取列表，发删除请求会返回成功（但实际不会删 user_id=0 因为后端有过滤）
// 这里前端用名称启发式区分（不完美但满足展示）
const DEFAULT_TAG_NAMES = new Set([
  '重点词汇', '高频词', '易错词', '考试词汇',
  '日常用词', '专业词汇', '口语词汇', '写作词汇'
])

const defaultTags = computed(() => allTags.value.filter(t => DEFAULT_TAG_NAMES.has(t.name)))
const userTags = computed(() => allTags.value.filter(t => !DEFAULT_TAG_NAMES.has(t.name)))

const loadTags = async () => {
  loading.value = true
  try {
    const resp = await getTagList()
    if (resp.code === 0) {
      allTags.value = resp.data || []
    } else {
      showToast(resp.message || '加载失败')
    }
  } catch (e) {
    showToast('网络错误')
  } finally {
    loading.value = false
  }
}

const openCreateForm = () => {
  editingTag.value = null
  form.name = ''
  form.style = '#ff6b6b'
  formVisible.value = true
}

const openEditForm = (tag) => {
  editingTag.value = tag
  form.name = tag.name
  form.style = tag.style || '#1989fa'
  formVisible.value = true
}

const closeForm = () => {
  formVisible.value = false
  editingTag.value = null
}

const submitForm = async () => {
  const name = form.name.trim()
  if (!name) return
  submitting.value = true
  try {
    let resp
    if (editingTag.value) {
      resp = await updateTag({
        id: editingTag.value.id,
        name,
        style: form.style
      })
    } else {
      resp = await addTag({ name, style: form.style })
    }
    if (resp.code === 0) {
      showToast({ message: editingTag.value ? '已更新' : '已创建', type: 'success' })
      closeForm()
      await loadTags()
    } else {
      showToast(resp.message || '操作失败')
    }
  } catch (e) {
    showToast('网络错误')
  } finally {
    submitting.value = false
  }
}

const deleteMessage = computed(() =>
  `确定删除标签「${pendingDelete.value?.name}」吗？关联到该标签的词条会失去这个标签。`
)

const confirmDelete = (tag) => {
  pendingDelete.value = tag
  deleteVisible.value = true
}

const executeDelete = async () => {
  if (!pendingDelete.value) return
  try {
    const resp = await deleteTag(pendingDelete.value.id)
    if (resp.code === 0) {
      showToast({ message: '已删除', type: 'success' })
      await loadTags()
    } else {
      showToast(resp.message || '删除失败')
    }
  } catch (e) {
    showToast('网络错误')
  } finally {
    pendingDelete.value = null
  }
}

onMounted(loadTags)
</script>

<style scoped>
.tag-manage-page {
  min-height: 100vh;
  background: #f8f9fa;
  padding-bottom: 30px;
}

.page-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 16px 16px;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: #fff;
}

.page-title {
  font-size: 17px;
  font-weight: 700;
}

.back-btn, .add-btn {
  font-size: 22px;
  cursor: pointer;
  padding: 4px;
}

.content {
  padding: 16px;
}

.section {
  margin-bottom: 18px;
}

.section-header {
  display: flex;
  align-items: baseline;
  justify-content: space-between;
  margin-bottom: 10px;
}

.section-title {
  font-size: 14px;
  font-weight: 700;
  color: #1a1a2e;
}

.section-sub {
  font-size: 12px;
  color: #969799;
}

.tag-list {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.tag-card {
  display: flex;
  align-items: center;
  justify-content: space-between;
  background: #fff;
  border-radius: 10px;
  padding: 12px 14px;
  box-shadow: 0 2px 6px rgba(0, 0, 0, 0.04);
}

.tag-card.readonly {
  background: #fafafa;
  opacity: 0.85;
}

.tag-pill {
  display: inline-block;
  padding: 5px 12px;
  border-radius: 14px;
  color: #fff;
  font-size: 13px;
  font-weight: 500;
}

.lock-icon {
  color: #c8c9cc;
  font-size: 16px;
}

.card-actions {
  display: flex;
  gap: 16px;
}

.action-icon {
  font-size: 18px;
  color: #646566;
  cursor: pointer;
  padding: 4px;

  &.danger {
    color: #ee0a24;
  }
}

.empty-block {
  background: #fff;
  border-radius: 10px;
  padding: 30px 20px;
  text-align: center;
  color: #969799;
}

.empty-block p {
  margin: 8px 0 14px;
  font-size: 13px;
}

/* 新建/编辑弹窗 */
.form-popup {
  background: #fff;
  border-radius: 16px 16px 0 0;
  overflow: hidden;
}

.form-header {
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 16px 20px 8px;
  position: relative;
}

.form-title {
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

.form-body {
  padding: 8px 20px;
}

.color-row {
  display: flex;
  align-items: center;
  padding: 12px 16px;
  background: #f7f8fa;
  border-radius: 8px;
  margin: 12px 0;
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
  gap: 8px;
  flex: 1;
}

.color-dot {
  width: 26px;
  height: 26px;
  border-radius: 50%;
  cursor: pointer;
  border: 2px solid transparent;
  transition: all 0.2s ease;

  &.active {
    border-color: #1a1a2e;
    transform: scale(1.15);
  }
}

.form-preview {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 12px 16px;
}

.preview-label {
  font-size: 13px;
  color: #646566;
  width: 50px;
  flex-shrink: 0;
}

.form-actions {
  display: flex;
  gap: 10px;
  padding: 12px 20px 24px;
}

.form-actions .van-button {
  flex: 1;
}
</style>
