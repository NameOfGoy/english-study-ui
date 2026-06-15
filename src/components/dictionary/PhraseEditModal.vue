<template>
  <van-popup
    v-model:show="visible"
    position="center"
    :style="{ width: '90%', maxWidth: '500px', borderRadius: '16px' }"
    :close-on-click-overlay="false"
  >
    <div class="phrase-modal">
      <div class="modal-header">
        <h3>{{ editing ? '编辑短语' : '添加短语' }}</h3>
        <van-icon name="cross" @click="$emit('close')" class="close-btn" />
      </div>

      <div class="modal-content">
        <van-form @submit="handleSubmit">
          <van-field
            v-model="localForm.phrase"
            name="phrase"
            label="短语"
            placeholder="请输入英文短语"
            :rules="[{ required: true, message: '请输入短语' }]"
            clearable
          />

          <van-field
            v-model="localForm.translation"
            name="translation"
            label="中文翻译"
            type="textarea"
            placeholder="请输入中文释义"
            autosize
            clearable
          />

          <van-field
            v-model="localForm.pronunciation"
            name="pronunciation"
            label="发音"
            placeholder="如 /ˈfreɪz/"
            clearable
          />

          <div class="examples-section">
            <h5>例句</h5>
            <div v-for="(ex, idx) in localForm.example" :key="idx" class="example-row">
              <van-field v-model="ex.example" :name="`example-${idx}`" label="英文" placeholder="示例英文句子" />
              <van-field v-model="ex.translation" :name="`translation-${idx}`" label="中文" placeholder="对应中文翻译" />
              <van-button size="small" type="danger" plain @click="removeExample(idx)">删除</van-button>
            </div>
            <van-button size="small" type="primary" plain @click="addExample">添加例句</van-button>
          </div>

          <div class="picture-section">
            <h5>图片</h5>
            <div class="picture-preview" v-if="localForm.picture">
              <img :src="getResourceUrl(localForm.picture)" alt="短语图片" />
            </div>
            <div class="picture-actions">
              <van-button size="small" type="primary" plain @click="$emit('select-image')">选择并上传图片</van-button>
              <van-checkbox v-model="localForm.isGeneratePicture">自动生成图片</van-checkbox>
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
              native-type="submit"
              class="action-btn submit-btn"
            >
              {{ editing ? '保存' : '添加' }}
            </van-button>
          </div>
        </van-form>

        <div v-if="editing" class="danger-zone">
          <van-button type="danger" plain @click="$emit('delete')">删除该短语</van-button>
        </div>
      </div>
    </div>
  </van-popup>
</template>

<script setup>
import { reactive, computed, watch } from 'vue'
import { getResourceUrl } from '@/utils/request'

const props = defineProps({
  show: { type: Boolean, default: false },
  editing: { type: Boolean, default: false },
  form: {
    type: Object,
    default: () => ({
      id: null, phrase: '', translation: '', pronunciation: '',
      example: [], picture: '', isGeneratePicture: false
    })
  }
})

const emit = defineEmits(['close', 'submit', 'delete', 'select-image', 'update:show'])

const localForm = reactive({
  id: null,
  phrase: '',
  translation: '',
  pronunciation: '',
  example: [],
  picture: '',
  isGeneratePicture: false
})

const visible = computed({
  get: () => props.show,
  set: (val) => { if (!val) emit('close') }
})

// Sync local form when props change
watch(() => props.form, (val) => {
  if (val) {
    localForm.id = val.id
    localForm.phrase = val.phrase || ''
    localForm.translation = val.translation || ''
    localForm.pronunciation = val.pronunciation || ''
    localForm.example = (val.example || []).map(e => ({ ...e }))
    localForm.picture = val.picture || ''
    localForm.isGeneratePicture = val.isGeneratePicture || false
  }
}, { deep: true, immediate: true })

// Sync picture back from parent (for upload results)
watch(() => props.form.picture, (val) => {
  if (val !== undefined) {
    localForm.picture = val
  }
})

const addExample = () => {
  localForm.example.push({ example: '', translation: '' })
}

const removeExample = (index) => {
  if (index >= 0 && index < localForm.example.length) {
    localForm.example.splice(index, 1)
  }
}

const handleSubmit = () => {
  emit('submit', {
    id: localForm.id,
    phrase: localForm.phrase,
    translation: localForm.translation,
    pronunciation: localForm.pronunciation,
    example: localForm.example.map(e => ({ example: e.example || '', translation: e.translation || '' })),
    picture: localForm.picture,
    isGeneratePicture: localForm.isGeneratePicture
  })
}
</script>

<style lang="scss" scoped>
.phrase-modal {
  background: white;
  border-radius: 16px;
  overflow: hidden;

  .modal-header {
    background: var(--es-grad);
    padding: 20px; display: flex; justify-content: space-between; align-items: center;
    margin-bottom: 0; border-bottom: none;

    h3 { color: white; font-size: 20px; font-weight: 700; margin: 0; letter-spacing: 0.5px; }

    .close-btn {
      color: white; font-size: 22px; cursor: pointer; padding: 4px;
      border-radius: 50%; transition: all 0.2s ease;
      &:hover { background-color: rgba(255, 255, 255, 0.15); }
    }
  }

  .modal-content {
    padding: 24px;
    max-height: 60vh;
    overflow-y: auto;
  }

  .examples-section {
    margin-top: 15px; background: white; border-radius: 8px; padding: 15px;

    h5 { font-size: 16px; font-weight: 600; color: #2c3e50; margin: 0 0 12px 0; }

    .example-row { margin-bottom: 12px; padding-bottom: 12px; border-bottom: 1px solid #eee; }
  }

  .picture-section {
    margin-top: 15px; text-align: center;

    h5 { font-size: 16px; font-weight: 600; color: #2c3e50; margin: 0 0 12px 0; text-align: left; }

    .picture-preview {
      margin-bottom: 12px;
      img { max-width: 100%; border-radius: 8px; }
    }

    .picture-actions {
      display: flex; align-items: center; gap: 12px; flex-wrap: wrap;
    }
  }

  .modal-actions {
    display: flex; gap: 12px; margin-top: 24px;

    .action-btn {
      flex: 1; height: 48px; border-radius: 24px; font-weight: 600; font-size: 16px;
      border: none; cursor: pointer; transition: all 0.3s ease;

      &.cancel-btn { background: #6c757d; color: white; &:hover { background: #5a6268; } }

      &.submit-btn {
        background: var(--es-grad); color: white;
        &:hover { transform: translateY(-1px); box-shadow: 0 10px 22px -8px rgba(25, 137, 250, 0.45); }
      }
    }
  }

  .danger-zone {
    margin-top: 20px; padding-top: 16px; border-top: 1px solid #eee; text-align: center;
  }
}
</style>
