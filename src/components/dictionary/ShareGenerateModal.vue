<template>
  <van-popup
    v-model:show="visible"
    position="center"
    :style="{ width: '92%', maxWidth: '420px', borderRadius: '16px' }"
    :close-on-click-overlay="false"
    @close="onClose"
  >
    <div class="share-gen-modal">
      <div class="modal-header">
        <span class="modal-title">生成分享码</span>
        <van-icon name="cross" class="close-icon" @click="onClose" />
      </div>

      <div class="modal-body">
        <!-- 分享范围 -->
        <div class="field-row">
          <div class="field-label">分享范围</div>
          <van-radio-group v-model="form.shareType" direction="horizontal">
            <van-radio :name="0">全部</van-radio>
            <van-radio :name="1">按标签</van-radio>
          </van-radio-group>
        </div>

        <!-- 单词类型 -->
        <div class="field-row">
          <div class="field-label">类型</div>
          <van-radio-group v-model="form.wordType" direction="horizontal">
            <van-radio :name="0">全部</van-radio>
            <van-radio :name="1">单词</van-radio>
            <van-radio :name="2">短语</van-radio>
          </van-radio-group>
        </div>

        <!-- 标签选择（仅当按标签时） -->
        <div v-if="form.shareType === 1" class="field-row">
          <div class="field-label">选择标签</div>
          <div class="tag-list">
            <van-checkbox-group v-model="form.tagIds">
              <van-checkbox
                v-for="t in availableTags"
                :key="t.id"
                :name="t.id"
                shape="round"
                icon-size="14px"
                class="tag-checkbox"
              >
                <span class="tag-pill" :style="{ background: t.style || t.color || '#1989fa' }">{{ t.name }}</span>
              </van-checkbox>
            </van-checkbox-group>
            <p v-if="availableTags.length === 0" class="hint">你还没有创建过标签</p>
          </div>
        </div>

        <!-- 已生成的码 -->
        <div v-if="generatedToken" class="token-result">
          <div class="token-box">{{ generatedToken }}</div>
          <p class="token-tip">⏰ 5 分钟内有效，复制后发给朋友</p>
          <van-button block round type="primary" size="small" @click="copyToken">复制分享码</van-button>
        </div>
      </div>

      <div class="modal-footer">
        <van-button block round @click="onClose">关闭</van-button>
        <van-button
          v-if="!generatedToken"
          block round type="primary"
          :loading="loading"
          @click="onGenerate"
        >生成分享码</van-button>
        <van-button
          v-else
          block round type="default"
          @click="reset"
        >再生成一个</van-button>
      </div>
    </div>
  </van-popup>
</template>

<script setup>
import { ref, reactive, computed, watch, onMounted } from 'vue'
import { showToast } from 'vant'
import { generateShare } from '@/api/share'
import { getTagList } from '@/api/tag'

const props = defineProps({
  show: { type: Boolean, default: false }
})
const emit = defineEmits(['close'])

const visible = computed({
  get: () => props.show,
  set: (v) => { if (!v) emit('close') }
})

const form = reactive({
  shareType: 0,
  wordType: 0,
  tagIds: []
})

const availableTags = ref([])
const loading = ref(false)
const generatedToken = ref('')

const loadTags = async () => {
  try {
    const resp = await getTagList()
    if (resp.code === 0) availableTags.value = resp.data || []
  } catch (e) { /* ignore */ }
}

const onGenerate = async () => {
  if (form.shareType === 1 && form.tagIds.length === 0) {
    showToast('请至少选择一个标签')
    return
  }
  loading.value = true
  try {
    const resp = await generateShare({
      share_type: form.shareType,
      word_type: form.wordType,
      tag_ids: form.shareType === 1 ? form.tagIds : []
    })
    if (resp.code === 0) {
      generatedToken.value = resp.token
    } else {
      showToast(resp.message || '生成失败')
    }
  } catch (e) {
    showToast('网络错误')
  } finally {
    loading.value = false
  }
}

const copyToken = async () => {
  try {
    await navigator.clipboard.writeText(generatedToken.value)
    showToast({ message: '已复制', type: 'success' })
  } catch (e) {
    // 降级
    const ta = document.createElement('textarea')
    ta.value = generatedToken.value
    document.body.appendChild(ta)
    ta.select()
    document.execCommand('copy')
    document.body.removeChild(ta)
    showToast({ message: '已复制', type: 'success' })
  }
}

const reset = () => {
  generatedToken.value = ''
  form.tagIds = []
}

const onClose = () => {
  reset()
  form.shareType = 0
  form.wordType = 0
  emit('close')
}

watch(() => props.show, (val) => {
  if (val) loadTags()
})

onMounted(loadTags)
</script>

<style scoped>
.share-gen-modal {
  background: #fff;
  border-radius: 16px;
  overflow: hidden;
  display: flex;
  flex-direction: column;
}

.modal-header {
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 16px 20px 8px;
  position: relative;
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

.modal-body {
  padding: 12px 20px;
  max-height: 60vh;
  overflow-y: auto;
}

.field-row {
  margin: 14px 0;
}

.field-label {
  font-size: 13px;
  font-weight: 600;
  color: #646566;
  margin-bottom: 8px;
}

.tag-list {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}

.tag-checkbox {
  margin: 2px 0;
}

.tag-pill {
  display: inline-block;
  padding: 4px 10px;
  border-radius: 12px;
  color: #fff;
  font-size: 12px;
  margin-left: 4px;
}

.hint {
  font-size: 12px;
  color: #969799;
  margin: 4px 0;
}

.token-result {
  background: #f7f8fa;
  border-radius: 12px;
  padding: 12px;
  margin-top: 12px;
}

.token-box {
  font-family: 'Courier New', monospace;
  font-size: 12px;
  word-break: break-all;
  background: #fff;
  padding: 8px;
  border-radius: 8px;
  border: 1px dashed #1989fa;
  margin-bottom: 8px;
}

.token-tip {
  font-size: 12px;
  color: #969799;
  margin: 4px 0 8px;
}

.modal-footer {
  display: flex;
  gap: 10px;
  padding: 12px 20px 20px;
  border-top: 1px solid #ebedf0;
}
</style>
