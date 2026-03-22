<template>
  <van-popup
    v-model:show="visible"
    position="center"
    :style="{ width: '90%', maxWidth: '400px', borderRadius: '16px' }"
    :close-on-click-overlay="false"
  >
    <div class="add-word-modal">
      <div class="modal-header">
        <h3>添加短语</h3>
        <van-icon name="cross" @click="$emit('close')" class="close-btn" />
      </div>

      <div class="modal-content">
        <van-form @submit="handleSubmit">
          <van-field
            v-model="form.phrase"
            name="phrase"
            label="短语"
            placeholder="请输入英文短语"
            :rules="[{ required: true, message: '请输入短语' }]"
            clearable
          />

          <van-field name="generatePhrasePicture" label="生成图片">
            <template #input>
              <van-checkbox v-model="form.isGeneratePicture">自动生成图片</van-checkbox>
            </template>
          </van-field>

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
              native-type="submit"
              :loading="loading"
              :disabled="loading"
              class="action-btn submit-btn"
            >
              添加
            </van-button>
          </div>
        </van-form>
      </div>
    </div>
  </van-popup>
</template>

<script setup>
import { reactive, computed, watch } from 'vue'

const props = defineProps({
  show: { type: Boolean, default: false },
  loading: { type: Boolean, default: false }
})

const emit = defineEmits(['close', 'submit', 'update:show'])

const form = reactive({
  phrase: '',
  isGeneratePicture: false
})

const visible = computed({
  get: () => props.show,
  set: (val) => { if (!val) emit('close') }
})

// Reset form when modal opens
watch(() => props.show, (val) => {
  if (val) {
    form.phrase = ''
    form.isGeneratePicture = false
  }
})

const handleSubmit = () => {
  if (!form.phrase.trim()) return
  emit('submit', {
    phrase: form.phrase.trim(),
    isGeneratePicture: form.isGeneratePicture
  })
}
</script>

<style lang="scss" scoped>
.add-word-modal {
  background: white;
  border-radius: 16px;
  overflow: hidden;
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'PingFang SC', 'Hiragino Sans GB', 'Microsoft YaHei', 'Helvetica Neue', Helvetica, Arial, sans-serif;

  .modal-header {
    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
    padding: 20px; display: flex; justify-content: space-between; align-items: center;

    h3 {
      color: white; font-size: 20px; font-weight: 700; margin: 0;
      letter-spacing: 0.5px; text-shadow: 0 1px 2px rgba(0, 0, 0, 0.1);
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'PingFang SC', 'Hiragino Sans GB', 'Microsoft YaHei', sans-serif;
    }

    .close-btn {
      color: white; font-size: 22px; cursor: pointer; padding: 4px;
      border-radius: 50%; transition: all 0.2s ease;
      &:hover { background-color: rgba(255, 255, 255, 0.15); transform: scale(1.1); }
    }
  }

  .modal-content {
    padding: 24px;

    .van-field {
      margin-bottom: 20px;
      :deep(.van-field__label) { color: #2c3e50; font-weight: 600; font-size: 15px; letter-spacing: 0.3px; }
      :deep(.van-field__control) { border-radius: 8px; font-size: 16px; font-weight: 400; color: #34495e; line-height: 1.5; }
      :deep(.van-field__control::placeholder) { color: #95a5a6; font-weight: 400; font-style: italic; }
    }

    .van-checkbox {
      :deep(.van-checkbox__label) { color: #5a6c7d; font-size: 15px; font-weight: 500; letter-spacing: 0.2px; }
    }
  }

  .modal-actions {
    display: flex; gap: 12px; margin-top: 28px;

    .action-btn {
      flex: 1; height: 46px; border-radius: 10px; font-weight: 600; font-size: 16px;
      letter-spacing: 0.5px; transition: all 0.3s ease;

      &.cancel-btn {
        background: #ecf0f1; color: #7f8c8d; border: none;
        &:hover { background: #d5dbdb; color: #5a6c7d; transform: translateY(-1px); }
      }

      &.submit-btn {
        background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
        border: none; color: white; text-shadow: 0 1px 2px rgba(0, 0, 0, 0.1);
        &:hover:not(:disabled) { opacity: 0.9; transform: translateY(-1px); box-shadow: 0 4px 12px rgba(102, 126, 234, 0.3); }
        &:disabled {
          background: linear-gradient(135deg, #bdc3c7 0%, #95a5a6 100%) !important;
          color: #7f8c8d !important; text-shadow: none !important; opacity: 1 !important;
          transform: none !important; box-shadow: 0 2px 8px rgba(189, 195, 199, 0.3) !important; cursor: not-allowed !important;
        }
      }
    }
  }
}
</style>
