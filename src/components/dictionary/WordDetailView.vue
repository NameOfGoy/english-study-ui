<template>
  <div class="word-detail">
    <!-- 自定义美化导航栏 -->
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
        <h1 class="nav-title">单词详情</h1>
        <div class="nav-subtitle">Word Details</div>
      </div>
      <div class="nav-right">
        <!-- 可以添加其他操作按钮 -->
      </div>
    </div>

    <van-card class="word-card">
      <template #title>
        <div class="word-title">
          <h2>{{ selectedWord.word }}</h2>
        </div>
      </template>

      <template #desc>
        <!-- 音标和发音 -->
        <div class="phonetic-section">
          <div v-if="selectedWord.uk_phonetic" class="phonetic-item">
            <span class="phonetic-label">英式:</span>
            <span class="phonetic-text">{{ selectedWord.uk_phonetic }}</span>
            <div v-if="selectedWord.uk_audio" class="audio-btn-container">
              <van-button
                size="mini"
                type="default"
                @click="$emit('play-audio', selectedWord.uk_audio, 'uk')"
                class="play-btn"
                :class="{ 'playing': audioPlaying['uk'] }"
              >
                🔊
              </van-button>
              <div v-if="audioPlaying['uk']" class="sound-waves">
                <div class="wave wave-1"></div>
                <div class="wave wave-2"></div>
                <div class="wave wave-3"></div>
              </div>
            </div>
          </div>

          <div v-if="selectedWord.us_phonetic" class="phonetic-item">
            <span class="phonetic-label">美式:</span>
            <span class="phonetic-text">{{ selectedWord.us_phonetic }}</span>
            <div v-if="selectedWord.us_audio" class="audio-btn-container">
              <van-button
                size="mini"
                type="default"
                @click="$emit('play-audio', selectedWord.us_audio, 'us')"
                class="play-btn"
                :class="{ 'playing': audioPlaying['us'] }"
              >
                🔊
              </van-button>
              <div v-if="audioPlaying['us']" class="sound-waves">
                <div class="wave wave-1"></div>
                <div class="wave wave-2"></div>
                <div class="wave wave-3"></div>
              </div>
            </div>
          </div>
        </div>

        <!-- 词性列表 -->
        <div v-if="selectedWord.pos && selectedWord.pos.length" class="pos-section">
          <h3>
            词性释义
            <van-icon name="edit" class="edit-trans-btn" @click="openTransEdit" />
          </h3>
          <div v-for="(pos, index) in selectedWord.pos" :key="index" class="pos-item">
            <div class="pos-header">
              <div class="pos-type">{{ getPosName(pos.pos) }}</div>
              <div class="pos-translation">{{ pos.translation }}</div>
            </div>

            <!-- 变化形式展示 -->
            <div v-if="pos.exchange && Object.keys(pos.exchange).length > 0" class="exchange-section">
              <h4 class="exchange-title">变化形式</h4>
              <div class="exchange-list">
                <div v-for="(value, key) in pos.exchange" :key="key" class="exchange-item">
                  <span class="exchange-label">{{ getExchangeName(key) }}:</span>
                  <span class="exchange-value">{{ value }}</span>
                </div>
              </div>
            </div>

            <!-- 例句展示 -->
            <div v-if="pos.example && pos.example.length" class="examples-section">
              <h4 class="examples-title">例句</h4>
              <div v-for="(example, exIndex) in pos.example" :key="exIndex" class="example-item">
                <p class="example-text">{{ example.example }}</p>
                <p class="example-translation">{{ example.translation }}</p>
              </div>
            </div>

            <!-- 图片按钮 -->
            <div class="picture-action">
              <van-button
                size="small"
                type="primary"
                plain
                @click="$emit('open-picture', index)"
                class="picture-toggle-btn"
                icon="photo-o"
              >
                查看图片
              </van-button>
            </div>
          </div>
        </div>
      </template>
    </van-card>

    <TranslationEditModal
      :show="showTransEdit"
      :word="selectedWord.word"
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
import { updateWordTranslation } from '@/api/dictionary'
import TranslationEditModal from '@/components/dictionary/TranslationEditModal.vue'

const props = defineProps({
  selectedWord: {
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

const transItems = computed(() =>
  (props.selectedWord.pos || []).map(p => ({
    id: p.id,
    pos: p.pos,
    pos_label: posEnglishMap[p.pos] || '',
    translation: p.translation || ''
  }))
)

const openTransEdit = () => {
  if (!transItems.value.length) {
    showToast('该词条无可编辑的释义')
    return
  }
  showTransEdit.value = true
}

const onSaveTranslation = async (newItems) => {
  savingTrans.value = true
  try {
    const resp = await updateWordTranslation(
      newItems.map(i => ({ word_pos_id: i.id, translation: i.translation }))
    )
    if (resp.code === 0) {
      // 本地更新 selectedWord.pos[i].translation
      newItems.forEach(it => {
        const pos = (props.selectedWord.pos || []).find(p => p.id === it.id)
        if (pos) pos.translation = it.translation
      })
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

// 词性映射 - 根据后端数字定义
const posChineseMap = {
  0: '未知', 1: '名词', 2: '及物动词', 3: '不及物动词', 4: '副词',
  5: '形容词', 6: '介词', 7: '连词', 8: '感叹词', 9: '助词',
  10: '代词', 11: '数词', 12: '冠词', 13: '辅助动词'
}

const posEnglishMap = {
  0: 'unknown', 1: 'n.', 2: 'vt.', 3: 'vi.', 4: 'adv.',
  5: 'adj.', 6: 'prep.', 7: 'conj.', 8: 'interj.', 9: 'part.',
  10: 'pron.', 11: 'num.', 12: 'art.', 13: 'aux.'
}

const exchangeChineseMap = {
  'p': '过去式', 'd': '过去分词', 'i': '现在分词',
  '3': '第三人称单数', 'r': '形容词比较级', 't': '形容词最高级', 's': '名词复数形式'
}

const getPosName = (pos) => {
  const chinese = posChineseMap[pos] || posChineseMap[0]
  const english = posEnglishMap[pos] || posEnglishMap[0]
  return `${chinese} (${english})`
}

const getExchangeName = (exchangeKey) => {
  return exchangeChineseMap[exchangeKey] || exchangeKey
}
</script>

<style lang="scss" scoped>
.word-detail {
  background: white;
  border-radius: 16px;
  overflow: hidden;
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.1);
  width: 100%;
  min-height: 400px;
  will-change: transform, opacity;
  backface-visibility: hidden;
  -webkit-backface-visibility: hidden;
}

/* 自定义导航栏样式 */
.custom-nav-bar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 16px 20px;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
  position: relative;
  overflow: hidden;
}

.custom-nav-bar::before {
  content: '';
  position: absolute;
  top: 0; left: 0; right: 0; bottom: 0;
  background: linear-gradient(45deg, rgba(255,255,255,0.1) 0%, rgba(255,255,255,0.05) 100%);
  pointer-events: none;
}

.nav-left { flex: 1; display: flex; align-items: center; }

.back-btn {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 6px 10px;
  border-radius: 16px;
  background: rgba(255, 255, 255, 0.15);
  backdrop-filter: blur(10px);
  border: 1px solid rgba(255, 255, 255, 0.2);
  cursor: pointer;
  transition: all 0.3s ease;
  user-select: none;
}

.back-btn:hover {
  background: rgba(255, 255, 255, 0.25);
  transform: translateY(-1px);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
}

.back-btn:active {
  transform: translateY(0);
  background: rgba(255, 255, 255, 0.2);
}

.back-icon {
  width: 16px; height: 16px;
  color: white;
  transition: transform 0.3s ease;
}

.back-btn:hover .back-icon { transform: translateX(-2px); }

.back-text { font-size: 13px; font-weight: 500; color: white; }

.nav-center { flex: 2; text-align: center; position: relative; z-index: 1; }

.nav-title {
  font-size: 20px; font-weight: 700; margin: 0; color: white;
  text-shadow: 0 2px 4px rgba(0, 0, 0, 0.1); letter-spacing: 0.5px;
}

.nav-subtitle {
  font-size: 12px; color: rgba(255, 255, 255, 0.8); margin-top: 2px;
  font-weight: 400; letter-spacing: 1px; text-transform: uppercase;
}

.nav-right { flex: 1; display: flex; justify-content: flex-end; align-items: center; }

.word-card {
  padding: 24px;
  background: linear-gradient(145deg, #ffffff 0%, #f8f9fa 100%);
  border-radius: 0 0 16px 16px;
}

.word-title {
  text-align: center; margin-bottom: 20px; padding: 20px 0;
  background: linear-gradient(135deg, #f8f9fa 0%, #e9ecef 100%);
  border-radius: 12px; position: relative; overflow: hidden;
}

.word-title::before {
  content: '';
  position: absolute; top: 0; left: 0; right: 0; bottom: 0;
  background: linear-gradient(45deg, rgba(102, 126, 234, 0.05) 0%, rgba(118, 75, 162, 0.05) 100%);
  pointer-events: none;
}

.word-title h2 {
  color: #2c3e50; font-size: 36px; font-weight: 800; margin: 0;
  text-align: center; position: relative; z-index: 1;
  text-shadow: 0 2px 4px rgba(0, 0, 0, 0.1); letter-spacing: 1px;
}

/* 音标部分样式 */
.phonetic-section {
  margin: 24px 0; padding: 20px;
  background: linear-gradient(135deg, #e3f2fd 0%, #f3e5f5 100%);
  border-radius: 16px;
  border: 1px solid rgba(102, 126, 234, 0.1);
  box-shadow: 0 4px 16px rgba(102, 126, 234, 0.08);
  position: relative; overflow: hidden;
}

.phonetic-section::before {
  content: '';
  position: absolute; top: 0; left: 0; right: 0; bottom: 0;
  background: linear-gradient(45deg, rgba(255, 255, 255, 0.3) 0%, rgba(255, 255, 255, 0.1) 100%);
  pointer-events: none;
}

.phonetic-item {
  display: flex; align-items: center; margin-bottom: 10px; gap: 10px;
}
.phonetic-item:last-child { margin-bottom: 0; }

.phonetic-label { font-weight: bold; color: #666; min-width: 50px; }

.phonetic-text { font-family: 'Times New Roman', serif; font-size: 18px; color: #1989fa; font-weight: bold; }

.audio-btn-container { position: relative; display: inline-block; }

.play-btn {
  min-width: 40px; height: 32px;
  background: transparent !important; border: none !important;
  box-shadow: none !important; transition: all 0.3s ease; padding: 0 !important;
}
.play-btn:hover { background: transparent !important; color: #1989fa !important; transform: scale(1.1); }
.play-btn.playing { animation: pulse 1s infinite; color: #52c41a !important; background: transparent !important; }
.play-btn:active { background: transparent !important; }
.play-btn:focus { background: transparent !important; outline: none !important; }

@keyframes pulse {
  0% { transform: scale(1); opacity: 1; }
  50% { transform: scale(1.1); opacity: 0.8; }
  100% { transform: scale(1); opacity: 1; }
}

.sound-waves {
  position: absolute; top: 50%; left: 50%;
  transform: translate(-50%, -50%); pointer-events: none; z-index: -1;
}

.wave {
  position: absolute; top: 50%; left: 50%;
  transform: translate(-50%, -50%);
  border: 2px solid #52c41a; border-radius: 50%; opacity: 0;
  animation: soundWave 2s infinite;
}
.wave-1 { animation-delay: 0s; }
.wave-2 { animation-delay: 0.4s; }
.wave-3 { animation-delay: 0.8s; }

@keyframes soundWave {
  0% { width: 20px; height: 20px; opacity: 1; }
  50% { width: 60px; height: 60px; opacity: 0.5; }
  100% { width: 100px; height: 100px; opacity: 0; }
}

/* 词性部分样式 */
.pos-section { margin-top: 24px; }

.pos-section h3 {
  color: white; font-size: 22px; font-weight: 700; margin-bottom: 20px;
  padding: 16px 20px;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  border-radius: 12px; text-align: center;
  text-shadow: 0 2px 4px rgba(0, 0, 0, 0.2); letter-spacing: 0.5px;
  box-shadow: 0 4px 16px rgba(102, 126, 234, 0.2);
}

.pos-item {
  margin-bottom: 24px; padding: 20px;
  background: linear-gradient(145deg, #ffffff 0%, #f8f9fa 100%);
  border-radius: 16px; border: 1px solid rgba(102, 126, 234, 0.1);
  box-shadow: 0 6px 20px rgba(0, 0, 0, 0.08);
  position: relative; overflow: hidden; transition: all 0.3s ease;
}

.pos-item::before {
  content: '';
  position: absolute; top: 0; left: 0; width: 4px; height: 100%;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
}

.pos-item:hover {
  transform: translateY(-2px);
  box-shadow: 0 8px 25px rgba(0, 0, 0, 0.12);
}

.pos-header { margin-bottom: 10px; }
.pos-header .pos-type { margin-bottom: 8px; }
.pos-header .pos-translation { margin-left: 0; }

.pos-type {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white; padding: 8px 16px; border-radius: 25px;
  font-size: 14px; font-weight: 600; display: inline-block;
  box-shadow: 0 3px 10px rgba(102, 126, 234, 0.3);
  text-shadow: 0 1px 2px rgba(0, 0, 0, 0.1); letter-spacing: 0.5px;
  position: relative; z-index: 1;
}

.pos-translation { font-size: 17px; color: #2c3e50; font-weight: 600; line-height: 1.5; margin-top: 8px; }
.edit-trans-btn {
  margin-left: 8px;
  font-size: 14px;
  color: #1989fa;
  cursor: pointer;
  vertical-align: middle;
  padding: 2px 6px;
  border-radius: 6px;
  transition: background 0.2s;
}
.edit-trans-btn:active { background: rgba(25, 137, 250, 0.15); }

/* 变化形式样式 */
.exchange-section { margin-top: 15px; background: white; border-radius: 8px; padding: 15px; }

.exchange-title {
  color: #333; font-size: 16px; font-weight: bold;
  margin: 0 0 10px 0; border-bottom: 1px solid #eee; padding-bottom: 5px;
}

.exchange-list { display: flex; flex-wrap: wrap; gap: 12px; }

.exchange-item {
  background: #f0f9ff; border: 1px solid #bae6fd;
  border-radius: 6px; padding: 6px 12px; font-size: 14px;
}

.exchange-label { color: #0369a1; font-weight: 500; margin-right: 4px; }
.exchange-value { color: #1e40af; font-weight: bold; }

/* 例句样式 */
.examples-section { margin-top: 15px; background: white; border-radius: 8px; padding: 15px; }

.examples-title {
  color: #333; font-size: 16px; font-weight: bold;
  margin: 0 0 10px 0; border-bottom: 1px solid #eee; padding-bottom: 5px;
}

.example-item {
  margin-bottom: 15px; padding-bottom: 15px; border-bottom: 1px solid #eee;
}
.example-item:last-child { margin-bottom: 0; padding-bottom: 0; border-bottom: none; }

.example-text { font-style: italic; color: #333; margin-bottom: 5px; line-height: 1.6; }
.example-translation { color: #666; font-size: 14px; margin: 0; }

/* 图片按钮样式 */
.picture-action { margin-top: 15px; text-align: center; padding: 10px 0; }

.picture-toggle-btn {
  border-radius: 20px; font-size: 14px; padding: 8px 16px;
  box-shadow: 0 2px 8px rgba(25, 137, 250, 0.2); transition: all 0.3s ease;
}
.picture-toggle-btn:hover {
  transform: translateY(-1px);
  box-shadow: 0 4px 12px rgba(25, 137, 250, 0.3);
}
</style>
