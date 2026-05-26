<template>
  <van-popup
    v-model:show="visible"
    position="bottom"
    :style="{ height: '90vh', borderRadius: '16px 16px 0 0' }"
    :close-on-click-overlay="false"
    @close="onClose"
  >
    <div class="share-import-modal">
      <div class="modal-header">
        <span class="modal-title">使用分享码导入</span>
        <van-icon name="cross" class="close-icon" @click="onClose" />
      </div>

      <!-- 第一步：输入码 -->
      <div v-if="!previewData && !importResult" class="step-input">
        <van-field
          v-model="token"
          type="textarea"
          rows="3"
          autosize
          placeholder="粘贴朋友发给你的分享码"
          class="token-input"
        />
        <p class="hint">⏰ 分享码 5 分钟内有效</p>
        <div class="action-row">
          <van-button block round @click="onClose">关闭</van-button>
          <van-button
            block round type="primary"
            :disabled="!token.trim()"
            :loading="loading"
            @click="onPreview"
          >预览</van-button>
        </div>
      </div>

      <!-- 第二步：预览内容 -->
      <div v-else-if="previewData && !importResult" class="step-preview">
        <!-- 摘要 -->
        <div class="preview-summary">
          <div class="summary-row">
            <span class="summary-label">来自</span>
            <span class="summary-value">{{ previewData.from_username }}</span>
          </div>
          <div class="summary-row">
            <span class="summary-label">数量</span>
            <span class="summary-value">
              <span v-if="previewData.word_count > 0">{{ previewData.word_count }} 单词</span>
              <span v-if="previewData.word_count > 0 && previewData.phrase_count > 0">&nbsp;·&nbsp;</span>
              <span v-if="previewData.phrase_count > 0">{{ previewData.phrase_count }} 短语</span>
            </span>
          </div>
          <div v-if="previewData.tags && previewData.tags.length" class="summary-row">
            <span class="summary-label">标签</span>
            <div class="summary-tags">
              <span v-for="(t, i) in previewData.tags" :key="i" class="tag-chip">{{ t.name }}</span>
            </div>
          </div>
        </div>

        <!-- 标签导入模式: 不带 / 仅系统 / 全部 -->
        <div v-if="previewData.tags && previewData.tags.length" class="import-tags-toggle">
          <div class="import-tags-title">标签导入</div>
          <van-radio-group v-model="tagImportMode" direction="horizontal">
            <van-radio :name="0" icon-size="16px">不带</van-radio>
            <van-radio :name="1" icon-size="16px">仅系统</van-radio>
            <van-radio :name="2" icon-size="16px">全部</van-radio>
          </van-radio-group>
        </div>

        <!-- 词条列表 -->
        <div class="items-section">
          <div class="items-section-title">词条列表（点击查看详情）</div>
          <div class="items-list">
            <div
              v-for="item in previewData.items"
              :key="`${item.word_type}_${item.id}`"
              class="word-item"
              @click="onItemClick(item)"
            >
              <div class="item-main">
                <div class="item-text">
                  <span class="item-text-main">{{ item.text }}</span>
                  <van-tag v-if="item.word_type === 2" plain size="mini" type="primary">短语</van-tag>
                </div>
                <div v-if="item.translation" class="item-translation">{{ item.translation }}</div>
                <div v-if="item.tag_names && item.tag_names.length" class="item-tags">
                  <span v-for="(t, i) in item.tag_names" :key="i" class="tag-pill-mini">{{ t }}</span>
                </div>
              </div>
              <van-icon name="arrow" class="item-arrow" />
            </div>
          </div>
        </div>

        <!-- 底部固定操作栏 -->
        <div class="bottom-bar">
          <van-button block round @click="reset">重新输入</van-button>
          <van-button
            block round type="primary"
            :loading="submitting"
            @click="onConfirm"
          >确认导入</van-button>
        </div>
      </div>

      <!-- 第三步：导入结果 -->
      <div v-else-if="importResult" class="step-result">
        <van-icon name="success" color="#07c160" size="56" />
        <p class="result-title">导入成功</p>
        <div class="result-detail">
          <div>单词 +{{ importResult.word_imported }}<span v-if="importResult.word_skipped > 0" class="skip">（跳过 {{ importResult.word_skipped }}）</span></div>
          <div>短语 +{{ importResult.phrase_imported }}<span v-if="importResult.phrase_skipped > 0" class="skip">（跳过 {{ importResult.phrase_skipped }}）</span></div>
          <div v-if="importResult.tag_imported > 0">新标签 +{{ importResult.tag_imported }}</div>
        </div>
        <van-button block round type="primary" @click="onClose">完成</van-button>
      </div>
    </div>
  </van-popup>

  <!-- 词条详情弹窗（嵌套，单词/短语共用） -->
  <van-popup
    v-model:show="detailVisible"
    position="bottom"
    :style="{ maxHeight: '80vh', borderRadius: '16px 16px 0 0' }"
  >
    <div class="detail-popup">
      <div class="detail-header">
        <span class="detail-title">{{ detailCurrent?.text || '详情' }}</span>
        <van-icon name="cross" class="close-icon" @click="detailVisible = false" />
      </div>
      <div v-if="detailLoading" class="detail-loading">
        <van-loading size="24px" vertical>加载中...</van-loading>
      </div>
      <div v-else-if="detailData" class="detail-body">
        <!-- 单词详情 -->
        <template v-if="detailData.word">
          <div class="phonetic-row">
            <span v-if="detailData.word.uk_phonetic" class="phonetic">英 {{ detailData.word.uk_phonetic }}</span>
            <span v-if="detailData.word.us_phonetic" class="phonetic">美 {{ detailData.word.us_phonetic }}</span>
          </div>
          <div v-for="(pos, i) in detailData.word.pos" :key="i" class="pos-block">
            <div class="pos-label">{{ getPosLabel(pos.pos) }}</div>
            <div class="pos-translation">{{ pos.translation }}</div>
            <van-image
              v-if="pos.picture"
              :src="getResourceUrl(pos.picture)"
              fit="cover"
              width="100%"
              radius="8"
              class="pos-picture"
            />
            <div v-if="pos.example && pos.example.length" class="examples">
              <div v-for="(ex, j) in pos.example" :key="j" class="example-row">
                <div class="example-en">{{ ex.example }}</div>
                <div class="example-cn">{{ ex.translation }}</div>
              </div>
            </div>
          </div>
        </template>
        <!-- 短语详情 -->
        <template v-else-if="detailData.phrase">
          <div v-if="detailData.phrase.translation" class="pos-translation">{{ detailData.phrase.translation }}</div>
          <van-image
            v-if="detailData.phrase.picture"
            :src="getResourceUrl(detailData.phrase.picture)"
            fit="cover"
            width="100%"
            radius="8"
            class="pos-picture"
          />
          <div v-if="detailData.phrase.example && detailData.phrase.example.length" class="examples">
            <div v-for="(ex, j) in detailData.phrase.example" :key="j" class="example-row">
              <div class="example-en">{{ ex.example }}</div>
              <div class="example-cn">{{ ex.translation }}</div>
            </div>
          </div>
        </template>
      </div>
    </div>
  </van-popup>
</template>

<script setup>
import { ref, computed, watch } from 'vue'
import { showToast } from 'vant'
import { previewShare, importShare, getShareWordDetail } from '@/api/share'
import { getResourceUrl } from '@/utils/request'

const props = defineProps({
  show: { type: Boolean, default: false }
})
const emit = defineEmits(['close', 'imported'])

const visible = computed({
  get: () => props.show,
  set: (v) => { if (!v) emit('close') }
})

const token = ref('')
const previewData = ref(null)
const importResult = ref(null)
// 标签导入模式: 0 不带 (默认) / 1 仅系统 / 2 全部. 与后端 TagImportMode 约定一致.
const tagImportMode = ref(0)
const loading = ref(false)
const submitting = ref(false)

// 详情弹窗
const detailVisible = ref(false)
const detailLoading = ref(false)
const detailData = ref(null)
const detailCurrent = ref(null)

const POS_LABELS = {
  1: '名词', 2: '及物动词', 3: '不及物动词', 4: '副词', 5: '形容词',
  6: '介词', 7: '连词', 8: '感叹词', 9: '助词', 10: '代词',
  11: '数词', 12: '冠词', 13: '辅助动词'
}
const getPosLabel = (n) => POS_LABELS[n] || '词性'

const onPreview = async () => {
  loading.value = true
  try {
    const resp = await previewShare(token.value.trim())
    if (resp.code === 0) {
      previewData.value = resp
    } else {
      showToast(resp.message || '分享码无效')
    }
  } catch (e) {
    showToast('网络错误')
  } finally {
    loading.value = false
  }
}

const onItemClick = async (item) => {
  detailCurrent.value = item
  detailLoading.value = true
  detailData.value = null
  detailVisible.value = true
  try {
    const resp = await getShareWordDetail({
      token: token.value.trim(),
      word_id: item.id,
      word_type: item.word_type
    })
    if (resp.code === 0) {
      detailData.value = resp
    } else {
      showToast(resp.message || '加载详情失败')
      detailVisible.value = false
    }
  } catch (e) {
    showToast('网络错误')
    detailVisible.value = false
  } finally {
    detailLoading.value = false
  }
}

const onConfirm = async () => {
  submitting.value = true
  try {
    const resp = await importShare({
      token: token.value.trim(),
      tag_import_mode: tagImportMode.value
    })
    if (resp.code === 0) {
      importResult.value = resp
      emit('imported')
    } else {
      showToast(resp.message || '导入失败')
    }
  } catch (e) {
    showToast('网络错误')
  } finally {
    submitting.value = false
  }
}

const reset = () => {
  token.value = ''
  previewData.value = null
  importResult.value = null
  tagImportMode.value = 0
  loading.value = false
  submitting.value = false
  detailVisible.value = false
  detailData.value = null
}

const onClose = () => {
  reset()
  emit('close')
}

watch(() => props.show, (val) => {
  if (!val) reset()
})
</script>

<style scoped>
.share-import-modal {
  display: flex;
  flex-direction: column;
  height: 90vh;
  background: #fff;
  border-radius: 16px 16px 0 0;
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

/* 输入步骤 */
.step-input {
  padding: 20px;
}

.token-input :deep(textarea) {
  font-family: 'Courier New', monospace;
  font-size: 12px;
}

.hint {
  font-size: 12px;
  color: #969799;
  margin: 8px 0 20px;
}

.action-row {
  display: flex;
  gap: 10px;
}

/* 预览步骤 */
.step-preview {
  flex: 1;
  display: flex;
  flex-direction: column;
  overflow: hidden;
}

.preview-summary {
  padding: 0 20px;
  flex-shrink: 0;
}

.summary-row {
  display: flex;
  align-items: flex-start;
  padding: 8px 0;
  gap: 12px;
  border-bottom: 1px solid #f0f0f0;
}

.summary-label {
  flex-shrink: 0;
  font-size: 13px;
  color: #969799;
  width: 50px;
}

.summary-value {
  flex: 1;
  font-size: 14px;
  font-weight: 600;
  color: #1a1a2e;
}

.summary-tags {
  flex: 1;
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
}

.tag-chip {
  background: #fff3e0;
  color: #ff9800;
  padding: 2px 8px;
  border-radius: 10px;
  font-size: 12px;
}

.import-tags-toggle {
  padding: 10px 20px;
  background: #f7f8fa;
  flex-shrink: 0;
}

.import-tags-title {
  font-size: 13px;
  color: #646566;
  margin-bottom: 8px;
}

.items-section {
  flex: 1;
  display: flex;
  flex-direction: column;
  overflow: hidden;
  min-height: 0;
}

.items-section-title {
  padding: 12px 20px 8px;
  font-size: 13px;
  color: #646566;
  font-weight: 600;
  border-top: 1px solid #ebedf0;
  flex-shrink: 0;
}

.items-list {
  flex: 1;
  overflow-y: auto;
  padding: 0 20px 100px;
}

.word-item {
  display: flex;
  align-items: center;
  padding: 12px 0;
  border-bottom: 1px solid #f0f0f0;
  cursor: pointer;
  gap: 10px;
}

.word-item:active {
  background: #f7f8fa;
}

.item-main {
  flex: 1;
  min-width: 0;
}

.item-text {
  display: flex;
  align-items: center;
  gap: 6px;
  flex-wrap: wrap;
}

.item-text-main {
  font-size: 15px;
  font-weight: 600;
  color: #1a1a2e;
}

.item-translation {
  font-size: 12px;
  color: #646566;
  margin-top: 3px;
  line-height: 1.4;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}

.item-tags {
  display: flex;
  flex-wrap: wrap;
  gap: 4px;
  margin-top: 5px;
}

.tag-pill-mini {
  background: #f0f6ff;
  color: #1989fa;
  padding: 1px 8px;
  border-radius: 10px;
  font-size: 11px;
}

.item-arrow {
  color: #c8c9cc;
  font-size: 16px;
  flex-shrink: 0;
}

.bottom-bar {
  position: absolute;
  bottom: 0;
  left: 0;
  right: 0;
  display: flex;
  gap: 10px;
  padding: 12px 20px 20px;
  background: #fff;
  border-top: 1px solid #ebedf0;
  box-shadow: 0 -4px 16px rgba(0, 0, 0, 0.06);
}

/* 结果步骤 */
.step-result {
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 40px 20px;
  gap: 16px;
}

.result-title {
  font-size: 18px;
  font-weight: 700;
  color: #07c160;
  margin: 0;
}

.result-detail {
  text-align: center;
  font-size: 14px;
  color: #323233;
  line-height: 2;
}

.skip {
  color: #969799;
  font-size: 12px;
  margin-left: 4px;
}

/* 详情弹窗 */
.detail-popup {
  background: #fff;
  display: flex;
  flex-direction: column;
  max-height: 80vh;
}

.detail-header {
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 16px 20px 8px;
  position: relative;
  flex-shrink: 0;
  border-bottom: 1px solid #ebedf0;
}

.detail-title {
  font-size: 17px;
  font-weight: 700;
  color: #1a1a2e;
}

.detail-loading {
  padding: 40px 0;
}

.detail-body {
  padding: 16px 20px;
  overflow-y: auto;
}

.phonetic-row {
  display: flex;
  gap: 12px;
  margin-bottom: 12px;
}

.phonetic {
  font-size: 13px;
  color: #646566;
  font-family: 'Times New Roman', serif;
}

.pos-block {
  margin-bottom: 16px;
  padding-bottom: 12px;
  border-bottom: 1px solid #f0f0f0;
}

.pos-block:last-child {
  border-bottom: none;
}

.pos-label {
  display: inline-block;
  background: #f0f6ff;
  color: #1989fa;
  padding: 2px 8px;
  border-radius: 10px;
  font-size: 12px;
  margin-bottom: 6px;
}

.pos-translation {
  font-size: 14px;
  color: #323233;
  line-height: 1.6;
  margin-bottom: 8px;
}

.pos-picture {
  margin: 8px 0;
}

.examples {
  margin-top: 10px;
}

.example-row {
  margin: 6px 0;
  padding-left: 8px;
  border-left: 2px solid #1989fa;
}

.example-en {
  font-size: 13px;
  color: #323233;
  margin-bottom: 2px;
}

.example-cn {
  font-size: 12px;
  color: #969799;
}
</style>
