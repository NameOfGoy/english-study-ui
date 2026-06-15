<template>
  <van-popup
    v-model:show="visible"
    position="center"
    :style="{ width: '95%', maxWidth: '450px', borderRadius: '12px' }"
    :close-on-click-overlay="false"
  >
    <div class="crop-modal">
      <div class="modal-header">
        <h3>裁剪图片</h3>
        <van-icon name="cross" @click="$emit('close')" class="close-btn" />
      </div>

      <div class="modal-content">
        <div class="crop-container">
          <VueCropper
            v-if="imageSrc"
            ref="cropperRef"
            :img="imageSrc"
            :outputSize="1"
            :outputType="'png'"
            :info="true"
            :full="false"
            :fixed="true"
            :fixedNumber="[1, 1]"
            :canMove="true"
            :canMoveBox="true"
            :fixedBox="false"
            :original="false"
            :autoCrop="true"
            :autoCropWidth="300"
            :autoCropHeight="300"
            :centerBox="true"
            :high="true"
            class="cropper-component"
          />
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
          @click="handleConfirm"
          :loading="uploading"
          class="action-btn confirm-btn"
        >
          确认裁剪并上传
        </van-button>
      </div>
    </div>
  </van-popup>
</template>

<script setup>
import { ref, computed } from 'vue'
import { VueCropper } from 'vue-cropper'
import 'vue-cropper/dist/index.css'

const props = defineProps({
  show: { type: Boolean, default: false },
  imageSrc: { type: String, default: '' },
  uploading: { type: Boolean, default: false }
})

const emit = defineEmits(['close', 'confirm', 'update:show'])

const cropperRef = ref(null)

const visible = computed({
  get: () => props.show,
  set: (val) => { if (!val) emit('close') }
})

const handleConfirm = () => {
  if (!cropperRef.value) return
  emit('confirm', cropperRef.value)
}

// Expose the cropper ref so parent can access it if needed
defineExpose({ cropperRef })
</script>

<style lang="scss" scoped>
.crop-modal {
  background: var(--es-surface);
  border-radius: var(--es-r-card); padding: 0; overflow: hidden;
  box-shadow: var(--es-shadow-card);
  border: 1px solid var(--es-hair-soft); position: relative;
}

.crop-modal::before { display: none; }

.crop-modal .modal-header {
  background: var(--es-grad);
  color: #fff; padding: 18px 22px; margin: 0; border-bottom: none;
  position: relative; z-index: 1;
  display: flex; justify-content: space-between; align-items: center;
}

.crop-modal .modal-header::before {
  content: ''; position: absolute; top: 0; left: 0; right: 0; bottom: 0;
  background: linear-gradient(180deg, rgba(255,255,255,0.14) 0%, rgba(255,255,255,0) 62%);
  pointer-events: none;
}

.crop-modal .modal-header h3 {
  color: #fff; font-size: 19px; font-weight: 800; margin: 0;
  text-shadow: none; letter-spacing: 0.02em;
  position: relative; z-index: 1;
}

.crop-modal .close-btn {
  color: #fff; font-size: 20px; padding: 6px; border-radius: 50%;
  background: rgba(255, 255, 255, 0.16); backdrop-filter: blur(10px);
  border: 1px solid rgba(255, 255, 255, 0.24); transition: all 0.25s var(--es-ease);
  cursor: pointer; position: relative; z-index: 1;
}
.crop-modal .close-btn:hover { background: rgba(255, 255, 255, 0.26); transform: scale(1.08); }
.crop-modal .close-btn:active { transform: scale(0.95); }

.crop-modal .modal-content { padding: 22px; margin: 0; position: relative; z-index: 1; }

.crop-container {
  width: 100%; height: 300px; position: relative; overflow: hidden;
  border-radius: var(--es-r-card);
  background: var(--es-hair-soft);
  border: 1px solid var(--es-hair);
  box-shadow: inset 0 2px 4px rgba(20, 30, 50, 0.05);
}

.crop-container::before { display: none; }

.cropper-component { width: 100%; height: 100%; }
.crop-container .vue-cropper { width: 100% !important; height: 100% !important; }

.crop-modal .modal-actions {
  display: flex; padding: 18px 22px 22px;
  background: var(--es-surface);
  border-top: 1px solid var(--es-hair);
  gap: 14px; position: relative; z-index: 1; justify-content: center;
}

.crop-modal .action-btn {
  flex: 1; height: 48px; border-radius: var(--es-r-btn); font-weight: 700; font-size: 16px;
  letter-spacing: 0.02em; transition: all 0.25s var(--es-ease); border: none;
  position: relative; overflow: hidden;
}

.crop-modal .cancel-btn {
  background: var(--es-hair-soft);
  color: var(--es-ink-2); box-shadow: none;
  border: 1px solid var(--es-hair);
}
.crop-modal .cancel-btn:hover { transform: translateY(-1px); background: #e7eef7; }
.crop-modal .cancel-btn:active { transform: translateY(0); }

.crop-modal .confirm-btn {
  background: var(--es-grad);
  color: #fff; box-shadow: 0 8px 18px -6px rgba(25, 137, 250, 0.45);
}
.crop-modal .confirm-btn:hover { transform: translateY(-1px); box-shadow: 0 12px 24px -8px rgba(25, 137, 250, 0.5); }
.crop-modal .confirm-btn:active { transform: translateY(0); }

.crop-modal .action-btn::before {
  content: ''; position: absolute; top: 0; left: -100%; width: 100%; height: 100%;
  background: linear-gradient(90deg, transparent, rgba(255,255,255,0.2), transparent);
  transition: left 0.5s;
}
.crop-modal .action-btn:hover::before { left: 100%; }
</style>
