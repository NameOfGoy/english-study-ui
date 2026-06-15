<template>
  <div class="tag-manage-page">
    <!-- 顶部 -->
    <header class="page-header">
      <button type="button" class="nav-btn" aria-label="返回" @click="$router.back()">
        <van-icon name="arrow-left" />
      </button>
      <div class="head-copy">
        <span class="es-eyebrow">My&nbsp;Tags</span>
        <h1 class="es-title">我的<span class="accent">标签</span></h1>
      </div>
      <button type="button" class="nav-btn add" aria-label="新建标签" @click="openCreateForm">
        <van-icon name="plus" />
      </button>
    </header>

    <!-- 加载中 -->
    <div v-if="loading" class="loading-wrap">
      <van-loading size="24px" vertical>加载中...</van-loading>
    </div>

    <!-- 内容 -->
    <div v-else class="content">
      <!-- 系统标签 (普通用户没有编辑/删除按钮即代表不能改, 不再用锁图标+文字额外说明) -->
      <section v-if="defaultTags.length > 0" class="section">
        <div class="section-header">
          <span class="es-eyebrow section-title">系统标签</span>
          <span class="section-sub">{{ defaultTags.length }} 个</span>
        </div>
        <div class="es-card tag-list">
          <div
            v-for="t in defaultTags"
            :key="t.id"
            class="tag-card es-hairline-item"
          >
            <span class="tag-pill" :style="{ background: t.style || '#969799' }">{{ t.name }}</span>
            <div v-if="admin" class="card-actions">
              <van-icon name="edit" class="action-icon" @click="openEditForm(t)" />
              <van-icon name="delete-o" class="action-icon danger" @click="confirmDelete(t)" />
            </div>
          </div>
        </div>
      </section>

      <!-- 用户自定义标签 -->
      <section class="section">
        <div class="section-header">
          <span class="es-eyebrow section-title">我的标签</span>
          <span class="section-sub">{{ userTags.length }} 个</span>
        </div>
        <div v-if="userTags.length === 0" class="es-card empty-block">
          <span class="empty-icon">
            <van-icon name="label-o" size="34" color="var(--es-ink-3)" />
          </span>
          <p>还没有自定义标签</p>
          <van-button round size="small" type="primary" @click="openCreateForm">立即新建</van-button>
        </div>
        <div v-else class="es-card tag-list">
          <div
            v-for="t in userTags"
            :key="t.id"
            class="tag-card es-hairline-item"
          >
            <span class="tag-pill" :style="{ background: t.style || '#1989fa' }">{{ t.name }}</span>
            <div class="card-actions">
              <van-icon name="edit" class="action-icon" @click="openEditForm(t)" />
              <van-icon name="delete-o" class="action-icon danger" @click="confirmDelete(t)" />
            </div>
          </div>
        </div>
      </section>
    </div>

    <!-- 新建/编辑弹窗 -->
    <van-popup
      v-model:show="formVisible"
      position="bottom"
      :style="{ borderRadius: '16px 16px 0 0' }"
    >
      <div class="form-popup">
        <div class="form-grabber" aria-hidden="true"></div>
        <div class="form-header">
          <span class="es-eyebrow form-eyebrow">{{ editingTag ? 'Edit' : 'Create' }}</span>
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
          <!-- 仅超管新建时显示: 是否系统标签 -->
          <div v-if="admin && !editingTag" class="system-toggle-row">
            <div class="toggle-copy">
              <span class="color-label">系统标签</span>
              <span class="toggle-hint">对全部用户可见</span>
            </div>
            <van-switch v-model="form.isSystem" size="20px" />
          </div>
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
          <van-button round class="btn-cancel" @click="closeForm">取消</van-button>
          <van-button
            round type="primary" class="btn-confirm"
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
import { isAdmin } from '@/utils/auth'

const loading = ref(true)
const allTags = ref([])
const formVisible = ref(false)
const editingTag = ref(null)
const submitting = ref(false)
const deleteVisible = ref(false)
const pendingDelete = ref(null)
// 超管标记; UI 显隐用 (新建系统标签 + 编辑系统标签按钮); 真鉴权在服务端
const admin = computed(() => isAdmin())

const form = reactive({
  name: '',
  style: '#ff6b6b',
  isSystem: false // 仅当 admin 且勾选时, 创建为系统标签
})

const colorPalette = [
  '#ff6b6b', '#ff9800', '#feca57', '#4ecdc4',
  '#45b7d1', '#1989fa', '#5f27cd', '#ab47bc',
  '#ff9ff3', '#54a0ff', '#07c160', '#969799'
]

// 后端 /api/v1/tag/list 现在每条 tag 都带 is_system 字段, 不再用启发式名称匹配
const defaultTags = computed(() => allTags.value.filter(t => t.is_system))
const userTags = computed(() => allTags.value.filter(t => !t.is_system))

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
  form.isSystem = false
  formVisible.value = true
}

const openEditForm = (tag) => {
  editingTag.value = tag
  form.name = tag.name
  form.style = tag.style || '#1989fa'
  form.isSystem = !!tag.is_system // 编辑时锁住归属, 服务端也不会让你跨归属修改
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
      resp = await addTag({ name, style: form.style, is_system: !!(admin.value && form.isSystem) })
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
/* ============================================================
   EDITORIAL — 我的标签 tag CRUD
   Cool-blue brand, hairline rows on soft white cards,
   uppercase eyebrow section labels, gradient CTA.
   ============================================================ */
.tag-manage-page {
  min-height: 100vh;
  /* transparent — let the global cool wash show through */
  background: transparent;
  padding-bottom: 30px;
  color: var(--es-ink);
}

/* ---- header: editorial title, no heavy color bar ---- */
.page-header {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: clamp(20px, 5vh, 34px) 20px 14px;
}

.head-copy {
  flex: 1 1 auto;
  min-width: 0;
  display: flex;
  flex-direction: column;
  gap: 4px;
}
.head-copy .es-eyebrow {
  letter-spacing: .26em;
}
.head-copy .es-title {
  font-size: 28px;
}

.nav-btn {
  flex: 0 0 auto;
  width: 42px;
  height: 42px;
  border: 1px solid var(--es-hair);
  background: var(--es-surface);
  border-radius: 13px;
  display: grid;
  place-items: center;
  color: var(--es-ink-2);
  font-size: 20px;
  cursor: pointer;
  box-shadow: var(--es-shadow-soft);
  transition: transform .18s var(--es-ease), color .18s var(--es-ease), box-shadow .25s var(--es-ease);
}
.nav-btn:active {
  transform: translateY(1px) scale(.97);
}
.nav-btn.add {
  border-color: transparent;
  color: #fff;
  background: var(--es-grad);
  box-shadow: 0 8px 18px rgba(25, 137, 250, .30), inset 0 1px 0 rgba(255, 255, 255, .36);
}

.loading-wrap {
  padding: 60px 0;
  display: flex;
  justify-content: center;
}

.content {
  padding: 8px 20px 0;
}

/* ---- sections ---- */
.section {
  margin-bottom: 26px;
}

.section-header {
  display: flex;
  align-items: baseline;
  justify-content: space-between;
  margin: 0 4px 12px;
}

.section-title {
  letter-spacing: .2em;
}

.section-sub {
  font-size: 12px;
  font-weight: 600;
  color: var(--es-ink-3);
}

/* card holds hairline-separated rows */
.tag-list {
  padding: 4px 16px;
}

.tag-card {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
}

.tag-pill {
  display: inline-flex;
  align-items: center;
  max-width: 100%;
  padding: 6px 14px;
  border-radius: 999px;
  color: #fff;
  font-size: 13px;
  font-weight: 600;
  letter-spacing: .01em;
  line-height: 1.2;
  box-shadow: 0 4px 12px -4px rgba(20, 30, 50, .35), inset 0 1px 0 rgba(255, 255, 255, .25);
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.card-actions {
  display: flex;
  align-items: center;
  gap: 6px;
  flex: 0 0 auto;
}

.action-icon {
  font-size: 18px;
  color: var(--es-ink-3);
  cursor: pointer;
  padding: 7px;
  border-radius: 10px;
  transition: background .18s var(--es-ease), color .18s var(--es-ease);
}
.action-icon:active {
  background: var(--es-hair-soft);
  color: var(--es-ink-2);
}
.action-icon.danger {
  color: #ee0a24;
}
.action-icon.danger:active {
  background: rgba(238, 10, 36, .08);
}

/* ---- empty state ---- */
.empty-block {
  padding: 38px 20px;
  text-align: center;
  color: var(--es-ink-2);
}
.empty-icon {
  display: inline-grid;
  place-items: center;
  width: 64px;
  height: 64px;
  border-radius: 50%;
  background: var(--es-hair-soft);
  margin-bottom: 14px;
}
.empty-block p {
  margin: 0 0 16px;
  font-size: 13px;
  color: var(--es-ink-3);
}

/* ============================================================
   新建/编辑弹窗 — editorial popup form
   ============================================================ */
.form-popup {
  background: var(--es-surface);
  border-radius: 16px 16px 0 0;
  overflow: hidden;
  padding-bottom: 4px;
}

.form-grabber {
  width: 38px;
  height: 4px;
  border-radius: 999px;
  background: var(--es-hair);
  margin: 10px auto 2px;
}

.form-header {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 2px;
  padding: 8px 20px 6px;
  position: relative;
}
.form-eyebrow {
  letter-spacing: .26em;
}
.form-title {
  font-size: 19px;
  font-weight: 800;
  letter-spacing: -.01em;
  color: var(--es-ink);
}
.close-icon {
  position: absolute;
  top: 8px;
  right: 16px;
  font-size: 20px;
  color: var(--es-ink-3);
  cursor: pointer;
  padding: 6px;
  border-radius: 10px;
  transition: background .18s var(--es-ease), color .18s var(--es-ease);
}
.close-icon:active {
  background: var(--es-hair-soft);
  color: var(--es-ink-2);
}

.form-body {
  padding: 8px 20px 4px;
}

/* name field — borderless hairline */
.form-body :deep(.van-field) {
  padding: 12px 0;
  border-bottom: 1px solid var(--es-hair);
}
.form-body :deep(.van-field__label) {
  font-size: 11px;
  letter-spacing: .14em;
  text-transform: uppercase;
  font-weight: 600;
  color: var(--es-ink-3);
  width: auto;
  margin-right: 14px;
}
.form-body :deep(.van-field__control) {
  font-size: 16px;
  color: var(--es-ink);
}
.form-body :deep(.van-field__control::placeholder) {
  color: var(--es-ink-3);
}

.system-toggle-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  padding: 14px 16px;
  background: var(--es-hair-soft);
  border-radius: var(--es-r-card);
  margin: 16px 0;
}
.toggle-copy {
  display: flex;
  flex-direction: column;
  gap: 2px;
  min-width: 0;
}
.toggle-hint {
  font-size: 11px;
  color: var(--es-ink-3);
}
.system-toggle-row :deep(.van-switch--on) {
  background: var(--es-primary);
}

.color-row {
  display: flex;
  align-items: center;
  padding: 16px;
  background: var(--es-hair-soft);
  border-radius: var(--es-r-card);
  margin: 16px 0;
}

.color-label {
  font-size: 13px;
  font-weight: 600;
  color: var(--es-ink);
  width: 56px;
  flex-shrink: 0;
}

.color-picker {
  display: flex;
  flex-wrap: wrap;
  gap: 10px;
  flex: 1;
  min-width: 0;
}

.color-dot {
  width: 26px;
  height: 26px;
  border-radius: 50%;
  cursor: pointer;
  border: 2px solid transparent;
  box-shadow: 0 2px 6px -2px rgba(20, 30, 50, .3);
  transition: transform .2s var(--es-ease), box-shadow .2s var(--es-ease);
}
.color-dot.active {
  border-color: var(--es-surface);
  transform: scale(1.14);
  box-shadow: 0 0 0 2px var(--es-primary), 0 4px 10px -2px rgba(20, 30, 50, .35);
}

.form-preview {
  display: flex;
  align-items: center;
  gap: 14px;
  padding: 12px 4px 4px;
}

.preview-label {
  font-size: 11px;
  letter-spacing: .14em;
  text-transform: uppercase;
  font-weight: 600;
  color: var(--es-ink-3);
  width: 56px;
  flex-shrink: 0;
}

.form-actions {
  display: flex;
  gap: 12px;
  padding: 14px 20px 24px;
}

.form-actions :deep(.van-button) {
  flex: 1;
  height: 46px;
  font-weight: 700;
  letter-spacing: .06em;
}

/* secondary (cancel) — hairline ghost */
.form-actions :deep(.btn-cancel) {
  background: var(--es-surface);
  border: 1px solid var(--es-hair);
  color: var(--es-ink-2);
}

/* primary (create/save) — brand gradient */
.form-actions :deep(.btn-confirm) {
  border: 0;
  color: #fff;
  background: var(--es-grad);
  box-shadow: 0 10px 22px -8px rgba(25, 137, 250, .55), inset 0 1px 0 rgba(255, 255, 255, .36);
}
.form-actions :deep(.btn-confirm.van-button--disabled) {
  opacity: .5;
}

@media (prefers-reduced-motion: reduce) {
  .nav-btn, .action-icon, .color-dot, .close-icon {
    transition: none;
  }
}
</style>
