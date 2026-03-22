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
  background: linear-gradient(145deg, #ffffff 0%, #f8f9fa 100%);
  border-radius: 20px; padding: 0; overflow: hidden;
  box-shadow: 0 20px 60px rgba(0, 0, 0, 0.15);
  border: 1px solid rgba(102, 126, 234, 0.1); position: relative;
}

.crop-modal::before {
  content: ''; position: absolute; top: 0; left: 0; right: 0; bottom: 0;
  background: linear-gradient(45deg, rgba(102, 126, 234, 0.02) 0%, rgba(118, 75, 162, 0.02) 100%);
  pointer-events: none; z-index: 0;
}

.crop-modal .modal-header {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white; padding: 20px 24px; margin: 0; border-bottom: none;
  position: relative; z-index: 1;
  display: flex; justify-content: space-between; align-items: center;
}

.crop-modal .modal-header::before {
  content: ''; position: absolute; top: 0; left: 0; right: 0; bottom: 0;
  background: linear-gradient(45deg, rgba(255,255,255,0.1) 0%, rgba(255,255,255,0.05) 100%);
  pointer-events: none;
}

.crop-modal .modal-header h3 {
  color: white; font-size: 20px; font-weight: 700; margin: 0;
  text-shadow: 0 2px 4px rgba(0, 0, 0, 0.1); letter-spacing: 0.5px;
  position: relative; z-index: 1;
}

.crop-modal .close-btn {
  color: white; font-size: 22px; padding: 8px; border-radius: 50%;
  background: rgba(255, 255, 255, 0.15); backdrop-filter: blur(10px);
  border: 1px solid rgba(255, 255, 255, 0.2); transition: all 0.3s ease;
  cursor: pointer; position: relative; z-index: 1;
}
.crop-modal .close-btn:hover { background: rgba(255, 255, 255, 0.25); transform: scale(1.1); box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15); }
.crop-modal .close-btn:active { transform: scale(0.95); }

.crop-modal .modal-content { padding: 24px; margin: 0; position: relative; z-index: 1; }

.crop-container {
  width: 100%; height: 300px; position: relative; overflow: hidden;
  border-radius: 16px;
  background: linear-gradient(145deg, #f8f9fa 0%, #e9ecef 100%);
  border: 2px solid rgba(102, 126, 234, 0.1);
  box-shadow: inset 0 2px 4px rgba(0, 0, 0, 0.06), 0 8px 24px rgba(102, 126, 234, 0.1);
}

.crop-container::before {
  content: ''; position: absolute; top: 0; left: 0; right: 0; bottom: 0;
  background: linear-gradient(45deg, rgba(102, 126, 234, 0.03) 0%, rgba(118, 75, 162, 0.03) 100%);
  pointer-events: none; z-index: 0;
}

.cropper-component { width: 100%; height: 100%; }
.crop-container .vue-cropper { width: 100% !important; height: 100% !important; }

.crop-modal .modal-actions {
  display: flex; padding: 20px 24px 24px;
  background: linear-gradient(145deg, #f8f9fa 0%, #ffffff 100%);
  border-top: 1px solid rgba(102, 126, 234, 0.1);
  gap: 16px; position: relative; z-index: 1; justify-content: center;
}

.crop-modal .action-btn {
  flex: 1; height: 48px; border-radius: 24px; font-weight: 600; font-size: 16px;
  letter-spacing: 0.5px; transition: all 0.3s ease; border: none;
  position: relative; overflow: hidden;
}

.crop-modal .cancel-btn {
  background: linear-gradient(135deg, #6c757d 0%, #495057 100%);
  color: white; box-shadow: 0 4px 16px rgba(108, 117, 125, 0.3);
}
.crop-modal .cancel-btn:hover { transform: translateY(-2px); box-shadow: 0 8px 24px rgba(108, 117, 125, 0.4); }
.crop-modal .cancel-btn:active { transform: translateY(0); }

.crop-modal .confirm-btn {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white; box-shadow: 0 4px 16px rgba(102, 126, 234, 0.3);
}
.crop-modal .confirm-btn:hover { transform: translateY(-2px); box-shadow: 0 8px 24px rgba(102, 126, 234, 0.4); }
.crop-modal .confirm-btn:active { transform: translateY(0); }

.crop-modal .action-btn::before {
  content: ''; position: absolute; top: 0; left: -100%; width: 100%; height: 100%;
  background: linear-gradient(90deg, transparent, rgba(255,255,255,0.2), transparent);
  transition: left 0.5s;
}
.crop-modal .action-btn:hover::before { left: 100%; }
</style>
