<template>
  <van-popup v-model:show="visible" position="center" :style="{ width: '92%', maxWidth: '420px', borderRadius: '16px' }" :close-on-click-overlay="false">
    <div class="search-modal">
      <div class="modal-header">
        <h3>搜索</h3>
        <van-icon name="cross" @click="onClose" class="close-btn" />
      </div>
      <div class="modal-content">
        <van-field v-model="query" label="前缀" placeholder="输入英文前缀" clearable @input="handleInput" />
        <div class="search-results">
          <van-loading v-if="loading" size="20px" vertical>搜索中...</van-loading>
          <van-empty v-else-if="query && results.length === 0" description="暂无结果" />
          <div v-else>
            <van-cell v-for="item in results" :key="item.id" :title="item.word" is-link @click="emitSelect(item)" class="word-item" />
          </div>
        </div>
      </div>
    </div>
  </van-popup>
</template>
<script>
import { ref, watch } from 'vue'
import { getWordList, getWordPhraseList } from '@/api/dictionary'
export default {
  name: 'SearchModal',
  props: {
    show: { type: Boolean, default: false },
    type: { type: String, default: 'word' }
  },
  emits: ['close', 'select'],
  setup(props, { emit }) {
    const visible = ref(props.show)
    const query = ref('')
    const results = ref([])
    const loading = ref(false)
    let timer = null
    watch(() => props.show, v => { visible.value = v })
    const handleInput = () => {
      if (timer) { clearTimeout(timer) }
      if (!query.value) { results.value = []; return }
      timer = setTimeout(async () => {
        try {
          loading.value = true
          let resp
          if (props.type === 'word') {
            resp = await getWordList({ word_prefix: query.value, limit: 50 })
          } else {
            resp = await getWordPhraseList({ phrase_prefix: query.value, limit: 50 })
          }
          const list = resp?.data || Array.isArray(resp) ? (Array.isArray(resp) ? resp : []) : []
          results.value = list.length ? list : (resp?.data || [])
        } finally {
          loading.value = false
        }
      }, 500)
    }
    const onClose = () => {
      if (timer) { clearTimeout(timer); timer = null }
      query.value = ''
      results.value = []
      loading.value = false
      emit('close')
    }
    const emitSelect = (item) => { emit('select', item) }
    return { visible, query, results, loading, handleInput, onClose, emitSelect }
  }
}
</script>
<style scoped>
.search-modal{background:#fff;border-radius:16px}
.modal-header{display:flex;justify-content:space-between;align-items:center;padding:16px;border-bottom:1px solid #eee}
.close-btn{font-size:20px;color:#999}
.modal-content{padding:16px}
.search-results{margin-top:12px}
</style>
