<template>
  <van-popup
    v-model:show="visible"
    position="center"
    :style="{ width: '90%', maxWidth: '400px', borderRadius: '12px' }"
  >
    <div class="picture-modal">
      <div class="modal-header">
        <h3>{{ isWord ? '词性图片' : '短语图片' }}</h3>
        <van-icon name="cross" @click="$emit('close')" class="close-btn" />
      </div>

      <div class="modal-content">
        <!-- 当前图片展示 -->
        <div v-if="currentPicture" class="current-picture">
          <van-image
            :src="getResourceUrl(currentPicture)"
            fit="cover"
            class="modal-picture"
            error-icon="photo-fail"
          />
          <!-- 待应用提示标签 -->
          <div v-if="hasPending" class="pending-badge">新图片待确认</div>
        </div>

        <!-- 无图片提示 -->
        <div v-else class="no-picture">
          <van-empty image="search" description="未配置图片" />
        </div>
      </div>

      <!-- 待应用状态：显示应用/恢复按钮 -->
      <div v-if="hasPending" class="modal-actions pending-actions">
        <van-button
          type="success"
          round
          block
          @click="$emit('apply')"
          :loading="applyingPicture"
          icon="success"
        >
          应用新图片
        </van-button>
        <van-button
          type="default"
          round
          block
          @click="$emit('restore')"
          icon="revoke"
        >
          恢复原图
        </van-button>
      </div>

      <!-- 正常状态：显示操作按钮 -->
      <div v-else class="modal-actions">
        <van-button
          type="primary"
          @click="$emit('generate')"
          :loading="generatingPicture"
          class="action-btn"
        >
          生成图片
        </van-button>
        <van-button
          type="primary"
          plain
          @click="$emit('upload')"
          :loading="uploadingImage"
          class="action-btn"
          icon="photograph"
        >
          上传图片
        </van-button>
        <van-button
          type="primary"
          plain
          @click="$emit('search')"
          class="action-btn"
          icon="search"
        >
          搜索图片
        </van-button>
      </div>
    </div>
  </van-popup>
</template>

<script setup>
import { computed } from 'vue'
import { getResourceUrl } from '@/utils/request'

const props = defineProps({
  show: { type: Boolean, default: false },
  currentPicture: { type: String, default: '' },
  isWord: { type: Boolean, default: true },
  generatingPicture: { type: Boolean, default: false },
  uploadingImage: { type: Boolean, default: false },
  hasPending: { type: Boolean, default: false },
  applyingPicture: { type: Boolean, default: false },
})

const emit = defineEmits(['close', 'generate', 'upload', 'search', 'apply', 'restore', 'update:show'])

const visible = computed({
  get: () => props.show,
  set: (val) => { if (!val) emit('close') }
})
</script>

<style lang="scss" scoped>
.picture-modal {
  padding: 20px;
  background: white;
  border-radius: 12px;
}

.modal-header {
  display: flex; justify-content: space-between; align-items: center;
  margin-bottom: 16px; padding-bottom: 12px; border-bottom: 1px solid #eee;
}
.modal-header h3 { margin: 0; font-size: 18px; font-weight: 600; color: #333; }

.close-btn {
  font-size: 20px; color: #999; cursor: pointer; transition: color 0.3s ease;
}
.close-btn:hover { color: #666; }

.modal-content { margin-bottom: 20px; position: relative; }

.current-picture { position: relative; }
.current-picture .van-image { width: 100%; aspect-ratio: 1; border-radius: 8px; }

.modal-picture {
  width: 100%; aspect-ratio: 1; border-radius: 8px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
}

.pending-badge {
  position: absolute;
  top: 10px;
  left: 10px;
  background: linear-gradient(135deg, #07c160, #06ad56);
  color: white;
  font-size: 12px;
  font-weight: 600;
  padding: 4px 12px;
  border-radius: 12px;
  box-shadow: 0 2px 8px rgba(7, 193, 96, 0.4);
}

.no-picture { padding: 40px 20px; text-align: center; }

.modal-actions { display: flex; flex-direction: column; gap: 10px; }

.action-btn { width: 100%; border-radius: 20px; font-weight: 500; }

.pending-actions .van-button {
  height: 44px;
  font-size: 15px;
  font-weight: 600;
}
</style>
