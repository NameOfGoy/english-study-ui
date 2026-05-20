<template>
  <van-popup
    v-model:show="visible"
    position="center"
    :style="{ width: '92%', maxWidth: '440px', maxHeight: '80vh', borderRadius: '16px', overflow: 'hidden' }"
    :close-on-click-overlay="false"
  >
    <div class="trans-modal">
      <div class="modal-header">
        <span class="modal-title">编辑释义</span>
        <van-icon name="cross" class="close-icon" @click="onClose" />
      </div>

      <div class="word-display" v-if="word">{{ word }}</div>

      <div class="modal-body">
        <div
          v-for="item in localItems"
          :key="item.id"
          class="trans-row"
        >
          <div v-if="item.pos_label" class="pos-tag">{{ item.pos_label }}</div>
          <van-field
            v-model="item.translation"
            type="textarea"
            rows="2"
            autosize
            placeholder="请输入释义"
            maxlength="200"
            show-word-limit
            class="trans-field"
          />
        </div>
        <p v-if="hint" class="hint">{{ hint }}</p>
      </div>

      <div class="modal-actions">
        <van-button round @click="onClose">取消</van-button>
        <van-button
          round type="primary"
          :loading="submitting"
          :disabled="!canSubmit"
          @click="onSubmit"
        >保存</van-button>
      </div>
    </div>
  </van-popup>
</template>

<script setup>
import { ref, computed, watch } from 'vue'

const props = defineProps({
  show: { type: Boolean, default: false },
  word: { type: String, default: '' },
  items: { type: Array, default: () => [] },
  submitting: { type: Boolean, default: false }
})

const emit = defineEmits(['close', 'submit'])

const localItems = ref([])

const visible = computed({
  get: () => props.show,
  set: (v) => { if (!v) emit('close') }
})

watch(() => props.show, (val) => {
  if (val) {
    localItems.value = (props.items || []).map(i => ({ ...i }))
  }
})

const canSubmit = computed(() =>
  localItems.value.some(i => (i.translation || '').trim().length > 0)
)

const hint = computed(() => {
  if (!canSubmit.value) return '至少保留一条非空释义'
  return ''
})

const onClose = () => emit('close')

const onSubmit = () => {
  if (!canSubmit.value) return
  const result = localItems.value.map(i => ({
    ...i,
    translation: (i.translation || '').trim()
  }))
  emit('submit', result)
}
</script>

<style scoped>
.trans-modal {
  display: flex;
  flex-direction: column;
  max-height: 80vh;
  background: #fff;
  border-radius: 16px;
  overflow: hidden;
}

.modal-header {
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 14px 20px 6px;
  position: relative;
  flex-shrink: 0;
  border-bottom: 1px solid #f0f0f0;
}

.modal-title {
  font-size: 17px;
  font-weight: 700;
  color: #1a1a2e;
}

.close-icon {
  position: absolute;
  right: 16px;
  top: 50%;
  transform: translateY(-50%);
  font-size: 22px;
  color: #969799;
  cursor: pointer;
  padding: 8px;
  z-index: 2;
}

.word-display {
  text-align: center;
  font-size: 22px;
  font-weight: 700;
  color: #1989fa;
  padding: 10px 20px;
  flex-shrink: 0;
  border-bottom: 1px solid #f7f8fa;
}

.modal-body {
  flex: 1;
  min-height: 0;
  overflow-y: auto;
  padding: 14px 20px 14px;
  -webkit-overflow-scrolling: touch;
}

.trans-row {
  margin-bottom: 14px;
}

.pos-tag {
  display: inline-block;
  background: #f0f6ff;
  color: #1989fa;
  padding: 2px 10px;
  border-radius: 10px;
  font-size: 12px;
  font-weight: 600;
  margin-bottom: 6px;
}

.trans-field {
  background: #f7f8fa;
  border-radius: 8px;
}

.trans-field :deep(.van-field__body) {
  font-size: 14px;
}

.hint {
  color: #ee0a24;
  font-size: 12px;
  margin: 8px 0 0;
}

.modal-actions {
  display: flex;
  gap: 10px;
  padding: 12px 20px 20px;
  border-top: 1px solid #ebedf0;
  flex-shrink: 0;
  background: #fff;
}

.modal-actions .van-button {
  flex: 1;
}
</style>
