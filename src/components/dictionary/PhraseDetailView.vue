<template>
  <div class="phrase-detail">
    <div class="custom-nav-bar">
      <div class="nav-left" @click="$emit('back')">
        <div class="back-btn">
          <svg class="back-icon" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M15 18L9 12L15 6" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
          </svg>
          <span class="back-text">返回</span>
        </div>
      </div>
      <div class="nav-center">
        <h1 class="nav-title">短语详情</h1>
        <div class="nav-subtitle">Phrase Details</div>
      </div>
      <div class="nav-right"></div>
    </div>

    <van-card class="word-card">
      <template #title>
        <div class="word-title">
          <h2>{{ selectedPhrase.word }}</h2>
        </div>
      </template>

      <template #desc>
        <div class="phrase-detail-section">
          <div v-if="selectedPhrase.pronunciation" class="phrase-pronunciation-section">
            <h3 class="phrase-section-title">发音</h3>
            <div class="pronunciation-row">
              <div class="audio-btn-container">
                <van-button
                  size="mini"
                  type="default"
                  @click="$emit('play-audio', selectedPhrase.pronunciation, 'phrase')"
                  class="play-btn"
                  :class="{ 'playing': audioPlaying['phrase'] }"
                >
                  🔊
                </van-button>
                <div v-if="audioPlaying['phrase']" class="sound-waves">
                  <div class="wave wave-1"></div>
                  <div class="wave wave-2"></div>
                  <div class="wave wave-3"></div>
                </div>
              </div>
            </div>
          </div>
          <div class="phrase-translation-section">
            <h3 class="phrase-section-title">
              释义
              <van-icon name="edit" class="edit-trans-btn" @click="openTransEdit" />
            </h3>
            <p class="definition-text">{{ selectedPhrase.translation || '暂无释义' }}</p>
          </div>

          <div class="picture-action">
            <van-button
              size="small"
              round
              type="primary"
              class="picture-toggle-btn"
              icon="photo-o"
              @click="$emit('open-picture')"
            >
              查看图片
            </van-button>
          </div>

          <div v-if="selectedPhrase.example && selectedPhrase.example.length" class="examples-section">
            <h4 class="examples-title">例句</h4>
            <div v-for="(example, exIndex) in selectedPhrase.example" :key="exIndex" class="example-item">
              <p class="example-text">{{ example.example }}</p>
              <p class="example-translation">{{ example.translation }}</p>
            </div>
          </div>

          <div v-if="selectedPhrase.picture" class="picture-section">
            <van-image :src="getResourceUrl(selectedPhrase.picture)" fit="cover" class="modal-picture" />
          </div>
        </div>
      </template>
    </van-card>

    <TranslationEditModal
      :show="showTransEdit"
      :word="selectedPhrase.word"
      :items="transItems"
      :submitting="savingTrans"
      @close="showTransEdit = false"
      @submit="onSaveTranslation"
    />
  </div>
</template>

<script setup>
import { ref, computed } from 'vue'
import { showToast } from 'vant'
import { getResourceUrl } from '@/utils/request'
import { updateWordPhrase, getWordPhraseDetail } from '@/api/dictionary'
import TranslationEditModal from '@/components/dictionary/TranslationEditModal.vue'

const props = defineProps({
  selectedPhrase: {
    type: Object,
    required: true
  },
  audioPlaying: {
    type: Object,
    default: () => ({})
  }
})

const emit = defineEmits(['back', 'play-audio', 'open-picture', 'translation-updated'])

const showTransEdit = ref(false)
const savingTrans = ref(false)

const transItems = computed(() => [{
  id: props.selectedPhrase.id,
  pos: 0,
  pos_label: '',
  translation: props.selectedPhrase.translation || ''
}])

const openTransEdit = () => {
  showTransEdit.value = true
}

const onSaveTranslation = async (newItems) => {
  if (!newItems.length) return
  savingTrans.value = true
  try {
    // 短语复用 UpdateWordPhrase，但需要先 fetch 详情拿完整字段
    const detail = await getWordPhraseDetail(props.selectedPhrase.id)
    if (detail.code !== 0 || !detail.data) {
      showToast(detail.message || '获取短语详情失败')
      return
    }
    const resp = await updateWordPhrase({
      id: props.selectedPhrase.id,
      phrase: detail.data.phrase,
      translation: newItems[0].translation,
      pronunciation: detail.data.pronunciation,
      example: detail.data.example || [],
      picture: detail.data.picture || ''
    })
    if (resp.code === 0) {
      props.selectedPhrase.translation = newItems[0].translation
      showToast({ message: '释义已更新', type: 'success' })
      showTransEdit.value = false
      emit('translation-updated')
    } else {
      showToast(resp.message || '保存失败')
    }
  } catch (e) {
    showToast('网络错误')
  } finally {
    savingTrans.value = false
  }
}
</script>

<style lang="scss" scoped>
.edit-trans-btn {
  margin-left: 8px;
  font-size: 14px;
  color: var(--es-primary);
  cursor: pointer;
  vertical-align: middle;
  padding: 2px 6px;
  border-radius: 6px;
  transition: background 0.2s;
}
.edit-trans-btn:active { background: rgba(25, 137, 250, 0.15); }

.phrase-detail {
  background: var(--es-surface);
  border-radius: var(--es-r-card);
  overflow: hidden;
  box-shadow: var(--es-shadow-card);
  border: 1px solid var(--es-hair-soft);
  width: 100%;
  min-height: 400px;
  will-change: transform, opacity;
  backface-visibility: hidden;
  -webkit-backface-visibility: hidden;
}

/* 顶部导航 — 冷蓝渐变, 与练习页头部一致 */
.custom-nav-bar {
  display: flex; align-items: center; justify-content: space-between;
  padding: 18px 20px;
  background: var(--es-grad);
  color: #fff; position: relative; overflow: hidden;
}
.custom-nav-bar::before {
  content: ''; position: absolute; top: 0; left: 0; right: 0; bottom: 0;
  background: linear-gradient(180deg, rgba(255,255,255,0.14) 0%, rgba(255,255,255,0) 62%);
  pointer-events: none;
}
.nav-left { flex: 1; display: flex; align-items: center; }
.back-btn {
  display: flex; align-items: center; gap: 6px; padding: 6px 12px;
  border-radius: 999px; background: rgba(255, 255, 255, 0.16);
  backdrop-filter: blur(10px); border: 1px solid rgba(255, 255, 255, 0.24);
  cursor: pointer; transition: all 0.25s var(--es-ease); user-select: none;
}
.back-btn:hover { background: rgba(255, 255, 255, 0.26); transform: translateY(-1px); box-shadow: 0 6px 16px rgba(20, 30, 50, 0.18); }
.back-btn:active { transform: translateY(0); background: rgba(255, 255, 255, 0.2); }
.back-icon { width: 16px; height: 16px; color: #fff; transition: transform 0.25s var(--es-ease); }
.back-btn:hover .back-icon { transform: translateX(-2px); }
.back-text { font-size: 13px; font-weight: 600; color: #fff; }
.nav-center { flex: 2; text-align: center; position: relative; z-index: 1; }
.nav-title { font-size: 19px; font-weight: 800; margin: 0; color: #fff; letter-spacing: 0.02em; }
.nav-subtitle { font-size: 11px; color: rgba(255, 255, 255, 0.82); margin-top: 3px; font-weight: 600; letter-spacing: 0.18em; text-transform: uppercase; }
.nav-right { flex: 1; display: flex; justify-content: flex-end; align-items: center; }

.word-card { padding: 22px 20px 26px; background: var(--es-surface); border-radius: 0; }

.word-title {
  text-align: center; margin-bottom: 22px; padding: 8px 0 22px;
  background: transparent;
  border-radius: 0; border-bottom: 1px solid var(--es-hair);
  position: relative; overflow: visible;
}
.word-title::before { display: none; }
.word-title h2 {
  color: var(--es-ink); font-size: 36px; font-weight: 800; margin: 0; text-align: center;
  position: relative; z-index: 1; text-shadow: none; letter-spacing: -0.01em; line-height: 1.1;
}

.phrase-detail-section {
  margin-top: 18px; padding: 16px 18px; border-radius: var(--es-r-card);
  background: var(--es-hair-soft);
  box-shadow: none;
  border: 1px solid var(--es-hair);
}

.phrase-pronunciation-section,
.phrase-translation-section {
  margin-top: 12px; background: var(--es-surface); border-radius: 12px; padding: 12px 14px;
  border: 1px solid var(--es-hair); box-shadow: var(--es-shadow-soft);
}

/* 小标题 — eyebrow + 竖条 accent */
.phrase-section-title {
  display: flex; align-items: center; gap: 9px;
  color: var(--es-ink); font-size: 15px; font-weight: 800; margin: 0 0 10px 0; padding: 0;
  background: transparent;
  border-radius: 0; text-align: left;
  text-shadow: none; letter-spacing: 0.01em; box-shadow: none;
}
.phrase-section-title::before {
  content: '';
  width: 4px; height: 16px; border-radius: 2px;
  background: var(--es-grad);
}

.pronunciation-row { display: flex; align-items: center; justify-content: flex-start; gap: 8px; padding: 4px 0; }

.definition-text { font-size: 16px; color: var(--es-ink); font-weight: 600; line-height: 1.5; margin: 0; }

.audio-btn-container { position: relative; display: inline-block; }

.play-btn {
  min-width: 40px; height: 32px;
  background: transparent !important; border: none !important;
  box-shadow: none !important; transition: all 0.3s ease; padding: 0 !important;
}
.play-btn:hover { background: transparent !important; color: var(--es-primary) !important; transform: scale(1.1); }
.play-btn.playing { animation: pulse 1s infinite; color: #52c41a !important; background: transparent !important; }
.play-btn:active { background: transparent !important; }
.play-btn:focus { background: transparent !important; outline: none !important; }

@keyframes pulse {
  0% { transform: scale(1); opacity: 1; }
  50% { transform: scale(1.1); opacity: 0.8; }
  100% { transform: scale(1); opacity: 1; }
}

.sound-waves { position: absolute; top: 50%; left: 50%; transform: translate(-50%, -50%); pointer-events: none; z-index: -1; }
.wave { position: absolute; top: 50%; left: 50%; transform: translate(-50%, -50%); border: 2px solid #52c41a; border-radius: 50%; opacity: 0; animation: soundWave 2s infinite; }
.wave-1 { animation-delay: 0s; }
.wave-2 { animation-delay: 0.4s; }
.wave-3 { animation-delay: 0.8s; }

@keyframes soundWave {
  0% { width: 20px; height: 20px; opacity: 1; }
  50% { width: 60px; height: 60px; opacity: 0.5; }
  100% { width: 100px; height: 100px; opacity: 0; }
}

.picture-action { margin: 10px 0 2px; display: flex; justify-content: flex-start; }

.picture-toggle-btn { height: 30px; padding: 0 16px; border-radius: 999px; box-shadow: 0 4px 12px -4px rgba(25, 137, 250, 0.3); transition: all 0.25s var(--es-ease); }
.picture-toggle-btn:hover { transform: translateY(-1px); box-shadow: 0 8px 18px -6px rgba(25, 137, 250, 0.4); }

/* 例句样式 */
.examples-section { margin-top: 15px; background: var(--es-hair-soft); border-radius: 12px; padding: 14px; border: 1px solid var(--es-hair); }
.examples-title { color: var(--es-ink); font-size: 15px; font-weight: 700; margin: 0 0 10px 0; border-bottom: 1px solid var(--es-hair); padding-bottom: 6px; }
.example-item { margin-bottom: 14px; padding-bottom: 14px; border-bottom: 1px solid var(--es-hair); }
.example-item:last-child { margin-bottom: 0; padding-bottom: 0; border-bottom: none; }
.example-text { font-style: italic; color: var(--es-ink); margin-bottom: 5px; line-height: 1.6; }
.example-translation { color: var(--es-ink-2); font-size: 14px; margin: 0; }

/* 图片样式 */
.picture-section { margin-top: 15px; text-align: center; }
.modal-picture { width: 100%; aspect-ratio: 1; border-radius: 12px; box-shadow: var(--es-shadow-soft); }
</style>
