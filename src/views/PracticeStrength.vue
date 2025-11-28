<template>
  <div class="practice-strength">
    <!-- 顶部导航栏 -->
    <van-nav-bar
      title="强化练习"
      left-text="返回"
      left-arrow
      @click-left="onClickLeft"
    >
      <template #right>
        <div class="progress-text">
          {{ currentWordIndex + 1 }} / {{ wordList.length }}
        </div>
      </template>
    </van-nav-bar>

    <!-- 进度条 -->
    <div class="progress-bar">
      <div 
        class="progress-fill" 
        :style="{ width: progressPercentage + '%' }"
      ></div>
    </div>

    <!-- 主要内容区域 -->
    <div class="content-area" v-if="!loading && !finishedAll && wordList.length > 0">
      <!-- 图片轮播组件 -->
      <div class="picture-carousel">
        <van-swipe 
          ref="imageSwipeInitial" 
          @change="onImageChange"
          :show-indicators="currentWord.images.length > 1"
          :loop="false"
          class="swipe-container"
        >
          <van-swipe-item 
            v-for="(image, index) in currentWord.images" 
            :key="index"
            class="swipe-item"
          >
            <div class="image-container">
              <img 
                :src="image" 
                :alt="currentWord.word"
                class="word-image"
                @error="onImageError"
              />
            </div>
          </van-swipe-item>
        </van-swipe>
        
        <!-- 左右切换按钮 -->
        <div class="carousel-controls" v-if="currentWord.images.length > 1">
          <div class="ctrl-btn prev-btn" @click="prevImage">
            <van-icon name="arrow-left" />
          </div>
          <div class="ctrl-btn next-btn" @click="nextImage">
            <van-icon name="arrow" />
          </div>
        </div>
      </div>

      <!-- 单词信息展示 -->
      <div class="word-info">
        <!-- 选择阶段 - 只显示中文释义 -->
        <div v-if="strengthState === 'choice'" class="choice-mode">
          <div class="translation">
            {{ currentWord.translation }}
          </div>

          <!-- 选择阶段按钮（跟随内容最后显示） -->
          <div class="choice-buttons">
            <van-button 
              type="success" 
              size="large" 
              @click="handleMemoryChoice(1)"
              class="remember-btn"
            >
              记得
            </van-button>
            <van-button 
              type="danger" 
              size="large" 
              @click="handleMemoryChoice(2)"
              class="forget-btn"
            >
              不记得
            </van-button>
          </div>
        </div>

        <!-- 完整展示阶段 -->
        <div v-else class="full-mode">
          <div class="word-header">
            <div class="word-text">{{ currentWord.word }}</div>
            <div class="phonetics">
              <div class="phonetic-line" v-if="currentWord.wordType === 1">
                <span class="phonetic-item" v-if="currentWord.ukPhonetic">
                  <span class="label">英式：</span>
                  <span class="value">{{ currentWord.ukPhonetic }}</span>
                  <van-button size="small" round type="primary" class="audio-btn" @click="playAudio('uk')">
                    <van-icon name="volume-o" :class="{ playing: playingType === 'uk' }" />
                  </van-button>
                </span>
                <span class="phonetic-item" v-if="currentWord.usPhonetic">
                  <span class="label">美式：</span>
                  <span class="value">{{ currentWord.usPhonetic }}</span>
                  <van-button size="small" round type="primary" class="audio-btn" @click="playAudio('us')">
                    <van-icon name="volume-o" :class="{ playing: playingType === 'us' }" />
                  </van-button>
                </span>
              </div>
              <div class="phonetic-line" v-else-if="currentWord.wordType === 2">
                <span class="phonetic-item" v-if="currentWord.ukPhonetic">
                  <span class="value">{{ currentWord.ukPhonetic }}</span>
                  <van-button size="small" round type="primary" class="audio-btn" @click="playAudio('uk')">
                    <van-icon name="volume-o" :class="{ playing: playingType === 'uk' }" />
                  </van-button>
                </span>
              </div>
            </div>
            
            <div class="part-of-speech" v-if="currentWord.partOfSpeech">
              {{ currentWord.partOfSpeech }}
            </div>
          </div>

          <div class="translation">
            {{ currentWord.translation }}
          </div>

          <!-- 例句 -->
          <div class="examples" v-if="currentWord.examples && currentWord.examples.length > 0">
            <div class="examples-title">例句：</div>
            <div 
              v-for="(example, index) in currentWord.examples" 
              :key="index"
              class="example-item"
            >
              <div class="example-sentence">{{ example.sentence }}</div>
              <div class="example-translation">{{ example.translation }}</div>
            </div>
          </div>



          <!-- 展示阶段按钮（跟随内容最后显示） -->
          <div class="full-buttons">
            <van-button 
              type="primary" 
              size="large" 
              @click="nextWord"
              class="next-btn"
            >
              下一个
            </van-button>
          </div>
        </div>
      </div>
    </div>

    

    <!-- 完成状态 -->
    <div v-if="finishedAll" class="completion-overlay">
      <div class="completion-card">
        <div class="trophy" v-if="finishReason === 'completed'">
          <svg viewBox="0 0 64 64" xmlns="http://www.w3.org/2000/svg">
            <path d="M16 12h32v8c0 8.837-7.163 16-16 16s-16-7.163-16-16v-8z" fill="#ffc107"/>
            <path d="M20 12H12c0 8 6 14 12 14V12zM44 12h8c0 8-6 14-12 14V12z" fill="#ffab00"/>
            <rect x="28" y="36" width="8" height="10" rx="2" fill="#795548"/>
            <rect x="22" y="46" width="20" height="6" rx="3" fill="#a1887f"/>
          </svg>
        </div>
        <div class="trophy" v-else>
          <svg viewBox="0 0 64 64" xmlns="http://www.w3.org/2000/svg">
            <circle cx="32" cy="32" r="20" fill="#e0f2fe"/>
            <text x="32" y="38" text-anchor="middle" font-size="24" fill="#1976d2">i</text>
          </svg>
        </div>
        <h2 class="completion-title">{{ finishReason === 'empty' ? '当前已没有需要强化的词语' : '本次强化完成！' }}</h2>
        <p class="completion-sub">
          <span v-if="finishReason === 'completed'">🎉 恭喜你，坚持完成了本次强化</span>
          <span v-else>👏 当前任务已清空，可稍后再来或切换模式</span>
        </p>
        <div class="completion-stats" v-if="finishReason === 'completed'">
          本次共强化 <span class="number">{{ wordList.length }}</span> 个词语
        </div>
        <div class="completion-stats" v-else>
          当前强化列表为空
        </div>
        <div class="completion-actions">
          <van-button type="primary" round block @click="goBack">返回练习主页</van-button>
          <van-button v-if="finishReason === 'completed'" type="success" round block @click="reloadStrengthList">再来一组</van-button>
        </div>
      </div>
      <div class="confetti" v-if="finishReason === 'completed'">
        <span v-for="n in 20" :key="n" class="piece" :style="{ left: (n*5)%100 + '%', animationDelay: (n*0.05)+'s', backgroundColor: n%2 ? '#ff6b6b' : '#4ecdc4' }"></span>
      </div>
    </div>

    <!-- 加载状态 -->
    <div v-if="loading" class="loading-container">
      <van-loading size="50px" vertical>加载中...</van-loading>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { 
  NavBar, 
  Button, 
  Icon, 
  Swipe, 
  SwipeItem, 
  Loading, 
  Empty,
  showToast,
  showDialog 
} from 'vant'
import { getStrengthWordCardList, finishStrength } from '@/api/practise.js'
import { getResourceUrl } from '@/utils/request.js'

const router = useRouter()

// 状态管理
const strengthState = ref('choice') // 'choice' | 'full'
const currentWordIndex = ref(0)
const wordList = ref([])
const loading = ref(false)
const error = ref('')

// 图片轮播状态
const imageSwipeInitial = ref(null)
const imageActiveIndex = ref(0)
const isPlaying = ref(false)
const audioEl = ref(null)
const playingType = ref(null)
const finishedAll = ref(false)
const finishReason = ref('none') // 'empty' | 'completed' | 'none'

// 计算属性
const currentWord = computed(() => {
  return wordList.value[currentWordIndex.value] || {
    word: '',
    phonetic: '',
    audio: '',
    translation: '',
    partOfSpeech: '',
    examples: [],
    images: []
  }
})

const progressPercentage = computed(() => {
  if (wordList.value.length === 0) return 0
  return ((currentWordIndex.value + 1) / wordList.value.length) * 100
})

// 生命周期
onMounted(() => {
  loadStrengthList()
})

// 方法定义
const loadStrengthList = async () => {
  loading.value = true
  try {
    const response = await getStrengthWordCardList({ random: true })
    // 兼容返回结构：既支持 { data: [...] }，也支持 { data: { data: [...] } }
    const raw = response?.data
    const list = Array.isArray(raw)
      ? raw
      : (Array.isArray(raw?.data) ? raw.data : [])

    // 将接口数据映射为组件内部使用的结构
    wordList.value = list.map((item) => {
      // 处理图片字段：接口为 picture 数组
      const images = Array.isArray(item.picture)
        ? item.picture.map((p) => getResourceUrl(p))
        : []

      const ukAudioRaw = (item.uk_audio || '').trim()
      const usAudioRaw = (item.us_audio || '').trim()
      const ukAudio = ukAudioRaw ? getResourceUrl(ukAudioRaw.replace(/^`|`$/g, '')) : ''
      const usAudio = usAudioRaw ? getResourceUrl(usAudioRaw.replace(/^`|`$/g, '')) : ''

      // 处理音标：分别提取英式/美式
      const ukPhonetic = item.uk_phonetic || ''
      const usPhonetic = item.us_phonetic || ''

      // 处理例句：接口 example 为字符串化 JSON 数组，需要解析
      const examples = []
      if (Array.isArray(item.example)) {
        item.example.forEach((entry) => {
          try {
            // entry 可能是字符串，如 "[{...}]"，也可能是对象，做双层兼容
            const parsed = typeof entry === 'string' ? JSON.parse(entry) : entry
            // 统一为数组进行迭代
            const arr = Array.isArray(parsed) ? parsed : [parsed]
            arr.forEach((ex) => {
              if (ex && (ex.example || ex.sentence)) {
                examples.push({
                  sentence: ex.example || ex.sentence || '',
                  translation: ex.translation || ''
                })
              }
            })
          } catch (_) {
            // 忽略单个解析错误，避免阻断整体加载
          }
        })
      }

      return {
        id: item.id,
        wordType: item.word_type || 1,
        word: item.word || '',
        ukPhonetic,
        usPhonetic,
        ukAudio,
        usAudio,
        translation: item.translation || '',
        partOfSpeech: item.part_of_speech || item.pos || '',
        examples,
        images
      }
    })
    if (wordList.value.length === 0) {
      finishedAll.value = true
      finishReason.value = 'empty'
    } else {
      finishedAll.value = false
      finishReason.value = 'none'
    }
  } catch (err) {
    error.value = '加载失败，请重试'
    showToast('加载失败，请重试')
  } finally {
    loading.value = false
  }
}

const handleMemoryChoice = async (operation) => {
  try {
    await finishStrength({
      word_id: currentWord.value.id,
      word_type: currentWord.value.wordType || 1,
      operation
    })
    strengthState.value = 'full' // 切换到完整展示状态
  } catch (err) {
    showToast('操作失败，请重试')
  }
}

const nextWord = () => {
  if (currentWordIndex.value < wordList.value.length - 1) {
    currentWordIndex.value++
    strengthState.value = 'choice' // 重置到选择状态
    imageActiveIndex.value = 0 // 重置图片索引
  } else {
    finishedAll.value = true
    finishReason.value = 'completed'
  }
}

const prevImage = () => {
  const swipe = imageSwipeInitial.value
  if (swipe && currentWord.value.images.length > 1) {
    swipe.prev()
  }
}

const nextImage = () => {
  const swipe = imageSwipeInitial.value
  if (swipe && currentWord.value.images.length > 1) {
    swipe.next()
  }
}

const onImageChange = (index) => {
  imageActiveIndex.value = index
}

const playAudio = (type) => {
  const uk = currentWord.value.ukAudio
  const us = currentWord.value.usAudio
  const src = type === 'uk' ? uk : us
  if (!src) {
    showToast('暂无音频')
    return
  }
  let a = audioEl.value
  if (a && playingType.value === type && !a.paused) {
    try {
      a.pause()
      a.currentTime = 0
    } catch (_) {}
    isPlaying.value = false
    playingType.value = null
    return
  }
  try {
    a = new Audio(src)
    audioEl.value = a
    playingType.value = type
    isPlaying.value = true
    a.play().catch(() => {
      isPlaying.value = false
      playingType.value = null
      showToast('音频播放失败')
    })
    a.onended = () => {
      isPlaying.value = false
      playingType.value = null
    }
    a.onerror = () => {
      isPlaying.value = false
      playingType.value = null
      showToast('音频播放失败')
    }
  } catch (_) {
    isPlaying.value = false
    playingType.value = null
    showToast('音频资源错误')
  }
}

const onImageError = (event) => {
  event.target.src = 'https://via.placeholder.com/300x200?text=图片加载失败'
}

const onClickLeft = () => {
  router.back()
}

const goBack = () => {
  router.push('/practice')
}

const reloadStrengthList = () => {
  loadStrengthList()
}
</script>

<style scoped lang="scss">
.practice-strength {
  min-height: 100vh;
  background-color: #f5f5f5;
  display: flex;
  flex-direction: column;
}

.progress-bar {
  height: 4px;
  background-color: #e0e0e0;
  position: relative;
  overflow: hidden;
}

.progress-fill {
  height: 100%;
  background: linear-gradient(90deg, #ff6b35, #ff8c42);
  transition: width 0.3s ease;
}

.progress-text {
  color: #666;
  font-size: 14px;
}

.content-area {
  flex: 1;
  padding: 20px;
  overflow-y: auto;
}

.picture-carousel {
  position: relative;
  margin-bottom: 20px;
  background: white;
  border-radius: 12px;
  overflow: hidden;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
}

.swipe-container {
  height: 300px;
}

.swipe-item {
  display: flex;
  align-items: center;
  justify-content: center;
}

.image-container {
  width: 100%;
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  background: #f8f8f8;
}

.word-image {
  max-width: 100%;
  max-height: 100%;
  object-fit: contain;
  border-radius: 8px;
}

/* 图片下方左右按钮，统一与学习/复习模块 */
.below-controls { display: flex; justify-content: center; gap: 8px; margin-top: 10px; }
.ctrl-btn { width: 30px; height: 30px; border-radius: 50%; border: none; background: rgba(0,0,0,0.35); color: #fff; font-size: 16px; cursor: pointer; }
.ctrl-btn:hover { background: rgba(0,0,0,0.8); transform: scale(1.1); }
.ctrl-btn:active { transform: scale(0.95); }

.word-info {
  background: white;
  border-radius: 12px;
  padding: 24px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
  margin-bottom: 20px;
}

.choice-mode {
  text-align: center;
}

.translation { white-space: pre-line; font-size: 16px; color: #323233; line-height: 1.6; }

.full-mode {
  text-align: center;
}

.word-header {
  margin-bottom: 20px;
}

.word-text {
  font-size: 24px;
  font-weight: bold;
  color: #ff6b35;
  margin-bottom: 8px;
}

.phonetics { text-align: center; }
.phonetic-line { display: inline-flex; gap: 16px; align-items: center; justify-content: center; flex-wrap: wrap; }
.phonetic-item { display: inline-flex; align-items: center; gap: 6px; }
.phonetic-item .label { font-size: 13px; color: #646566; font-weight: 500; }
.phonetic-item .value { font-size: 16px; color: #323233; font-family: 'Times New Roman', serif; }
.audio-btn { display: inline-flex; align-items: center; gap: 4px; min-width: auto; padding: 6px 10px; height: 30px; }
.audio-btn :deep(.van-icon) { font-size: 16px; }
.audio-btn :deep(.van-icon.playing) { color: #ff9800; animation: pulse 1s infinite; }

@keyframes pulse {
  0%, 100% { transform: scale(1); }
  50% { transform: scale(1.1); }
}


.part-of-speech {
  font-size: 14px;
  color: #999;
  font-style: italic;
}

.examples {
  text-align: left;
  margin-top: 20px;
}

.examples-title {
  font-size: 16px;
  font-weight: bold;
  color: #333;
  margin-bottom: 12px;
}

.example-item {
  margin-bottom: 16px;
  padding: 12px;
  background: #f8f8f8;
  border-radius: 8px;
}

.example-sentence {
  font-size: 14px;
  color: #333;
  margin-bottom: 8px;
  line-height: 1.5;
}

.example-translation {
  font-size: 13px;
  color: #666;
  line-height: 1.4;
}

.audio-controls {
  text-align: center;
  margin-top: 20px;
}

/* 图片下方左右切换控制，跟随内容流，不固定 */
.carousel-controls { display: flex; justify-content: center; gap: 8px; margin-top: 10px; }

.choice-buttons { display: flex; gap: 16px; margin-top: 20px; }

.remember-btn {
  flex: 1;
  background: linear-gradient(135deg, #4caf50, #45a049);
  border: none;
  border-radius: 8px;
  font-size: 16px;
  font-weight: bold;
  box-shadow: 0 4px 12px rgba(76, 175, 80, 0.3);
}

.forget-btn {
  flex: 1;
  background: linear-gradient(135deg, #f44336, #d32f2f);
  border: none;
  border-radius: 8px;
  font-size: 16px;
  font-weight: bold;
  box-shadow: 0 4px 12px rgba(244, 67, 54, 0.3);
}

.full-buttons { display: flex; justify-content: center; margin-top: 20px; }

.full-buttons .next-btn {
  background: linear-gradient(135deg, #ff6b35, #ff8c42);
  border: none;
  border-radius: 8px;
  font-size: 16px;
  font-weight: bold;
  min-width: 120px;
  box-shadow: 0 4px 12px rgba(255, 107, 53, 0.3);
}

.loading-container {
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  background: white;
}

.empty-container {
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  background: white;
}

// 响应式设计
@media (max-width: 768px) {
  .content-area {
    padding: 16px;
  }
  
  .swipe-container {
    height: 250px;
  }
  
  .word-text {
    font-size: 20px;
  }
  
  .translation {
    font-size: 16px;
  }
}
</style>
// 完成态样式
.completion-overlay { position: fixed; inset: 0; background: rgba(255,255,255,0.95); display: grid; place-items: center; padding: 16px; z-index: 1000; }
.completion-card { background: white; border-radius: 16px; padding: 24px; text-align: center; box-shadow: 0 8px 32px rgba(0,0,0,0.1); max-width: 360px; width: 92%; margin: 0 auto; }
.trophy { width: 80px; height: 80px; margin: 0 auto 16px; }
.trophy svg { width: 100%; height: 100%; }
.completion-title { font-size: 20px; font-weight: 700; color: #334155; margin: 6px 0; }
.completion-sub { font-size: 14px; color: #64748b; margin-bottom: 10px; }
.completion-stats { font-size: 14px; color: #475569; margin-bottom: 16px; }
.completion-stats .number { font-weight: 700; color: #ff9800; }
.completion-actions { display: flex; flex-direction: column; gap: 12px; align-items: center; }
.completion-actions .van-button { width: 100%; height: 44px; border-radius: 22px; font-size: 16px; font-weight: 600; }
.confetti { position: fixed; inset: 0; pointer-events: none; z-index: 999; }
.piece { position: absolute; width: 8px; height: 8px; animation: confetti-fall 3s linear infinite; }
@keyframes confetti-fall { 0% { transform: translateY(-100vh) rotate(0deg); opacity: 1; } 100% { transform: translateY(100vh) rotate(720deg); opacity: 0; } }
