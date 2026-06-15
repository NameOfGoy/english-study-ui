<template>
  <van-popup
    v-model:show="visible"
    position="center"
    :style="{ width: '90%', maxWidth: '400px', borderRadius: '16px' }"
    :close-on-click-overlay="false"
  >
    <div class="status-modal">
      <div class="modal-header">
        <h3>{{ editType === 'phrase' ? '编辑短语状态' : '编辑单词状态' }}</h3>
        <van-icon name="cross" @click="$emit('close')" class="close-btn" />
      </div>

      <div class="modal-content">
        <div class="word-info">
          <h4>{{ word?.word }}</h4>
        </div>

        <van-form @submit="handleSubmit">
          <van-field name="status" :label="editType === 'phrase' ? '短语状态' : '单词状态'">
            <template #input>
              <van-radio-group v-model="statusValue" direction="vertical">
                <van-radio name="1" class="status-radio">
                  <template #icon="props">
                    <div class="radio-icon" :class="{ checked: props.checked }">
                      <span class="status-dot study"></span>
                    </div>
                  </template>
                  学习
                </van-radio>
                <van-radio name="2" class="status-radio">
                  <template #icon="props">
                    <div class="radio-icon" :class="{ checked: props.checked }">
                      <span class="status-dot review"></span>
                    </div>
                  </template>
                  复习
                </van-radio>
                <van-radio name="3" class="status-radio">
                  <template #icon="props">
                    <div class="radio-icon" :class="{ checked: props.checked }">
                      <span class="status-dot strengthen"></span>
                    </div>
                  </template>
                  强化
                </van-radio>
                <van-radio name="4" class="status-radio">
                  <template #icon="props">
                    <div class="radio-icon" :class="{ checked: props.checked }">
                      <span class="status-dot finish"></span>
                    </div>
                  </template>
                  完成
                </van-radio>
              </van-radio-group>
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
              保存
            </van-button>
          </div>
        </van-form>
      </div>
    </div>
  </van-popup>
</template>

<script setup>
import { ref, computed, watch } from 'vue'

const props = defineProps({
  show: { type: Boolean, default: false },
  word: { type: Object, default: null },
  editType: { type: String, default: 'word' },
  loading: { type: Boolean, default: false }
})

const emit = defineEmits(['close', 'submit', 'update:show'])

const statusValue = ref('1')

const visible = computed({
  get: () => props.show,
  set: (val) => { if (!val) emit('close') }
})

// Sync status value when word changes or modal opens
watch(() => props.show, (val) => {
  if (val && props.word) {
    statusValue.value = props.word.status > 0 ? props.word.status.toString() : '1'
  }
})

watch(() => props.word, (val) => {
  if (val && props.show) {
    statusValue.value = val.status > 0 ? val.status.toString() : '1'
  }
})

const handleSubmit = () => {
  emit('submit', { status: statusValue.value })
}
</script>

<style lang="scss" scoped>
.status-modal {
  background: var(--es-surface);
  border-radius: var(--es-r-card);
  overflow: hidden;

  .modal-header {
    background: var(--es-grad);
    padding: 20px; display: flex; justify-content: space-between; align-items: center;

    h3 { color: #fff; font-size: 20px; font-weight: 800; margin: 0; letter-spacing: 0.02em; }

    .close-btn {
      color: #fff; font-size: 22px; cursor: pointer; padding: 4px;
      border-radius: 50%; transition: all 0.2s var(--es-ease);
      &:hover { background-color: rgba(255, 255, 255, 0.16); }
    }
  }

  .modal-content {
    padding: 24px;

    .word-info {
      text-align: center; margin-bottom: 24px;
      h4 { font-size: 24px; font-weight: 800; color: var(--es-ink); margin: 0 0 8px 0; letter-spacing: -0.01em; }
      .word-subtitle { color: var(--es-ink-3); font-size: 14px; margin: 0; }
    }

    .status-radio {
      margin-bottom: 16px;

      .radio-icon {
        display: flex; align-items: center; justify-content: center;
        width: 20px; height: 20px; border: 2px solid var(--es-hair); border-radius: 50%; margin-right: 12px;

        &.checked { border-color: var(--es-primary); background: var(--es-primary); }

        .status-dot {
          width: 10px; height: 10px; border-radius: 50%;
          box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);

          &.unknown { background: linear-gradient(135deg, #6c757d 0%, #495057 100%); }
          &.study { background: linear-gradient(135deg, #2196f3 0%, #1976d2 100%); box-shadow: 0 2px 8px rgba(33, 150, 243, 0.3); }
          &.review { background: linear-gradient(135deg, #ff9800 0%, #f57c00 100%); box-shadow: 0 2px 8px rgba(255, 152, 0, 0.3); }
          &.strengthen { background: linear-gradient(135deg, #ff5722 0%, #d84315 100%); box-shadow: 0 2px 8px rgba(255, 87, 34, 0.3); }
          &.finish { background: linear-gradient(135deg, #4caf50 0%, #388e3c 100%); box-shadow: 0 2px 8px rgba(76, 175, 80, 0.3); }
        }
      }
    }

    .modal-actions {
      display: flex; gap: 12px; margin-top: 24px;

      .action-btn {
        flex: 1; height: 48px; border-radius: var(--es-r-btn); font-weight: 700; font-size: 16px;
        border: none; cursor: pointer; transition: all 0.25s var(--es-ease);

        &.cancel-btn { background: var(--es-hair-soft); color: var(--es-ink-2); &:hover { background: #e7eef7; } }

        &.submit-btn {
          background: var(--es-grad); color: #fff;
          &:hover { transform: translateY(-1px); box-shadow: 0 10px 22px -8px rgba(25, 137, 250, 0.45); }
        }
      }
    }
  }
}
</style>
