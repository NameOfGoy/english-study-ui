<template>
  <div class="study-page">
    <!-- 顶部导航 -->
    <div class="study-header">
      <div class="header-left" @click="goBack">
        <svg class="back-icon" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
          <path d="M15 18L9 12L15 6" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
        </svg>
        <span>返回</span>
      </div>
      <div class="header-center">
        <h1>学习模式</h1>
        <p>Study Mode</p>
      </div>
      <div class="header-right"></div>
    </div>

    <!-- 加载进度遮罩 -->
    <div v-if="showLoader" class="loader-overlay">
      <div class="loader-content">
        <van-loading size="24px" vertical>正在加载单词卡片...</van-loading>
        <div class="progress-wrap">
          <van-progress :percentage="progress" stroke-width="8" pivot-text="" />
          <div class="progress-text">{{ progress }}%</div>
        </div>
      </div>
    </div>

    <!-- 错误状态 -->
    <div v-if="error && !finishedAll" class="error-wrap">
      <van-empty image="error" :description="error" />
    </div>

    <!-- 完成态：当本次学习已全部完成或当前列表为空时显示 -->
    <div v-if="finishedAll" class="completion-overlay">
      <div class="completion-card">
        <!-- 图标：完成显示奖杯；为空显示信息图标 -->
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
        <h2 class="completion-title">{{ finishReason === 'empty' ? '当前已没有需要学习的单词' : '本次学习完成！' }}</h2>
        <p class="completion-sub">
          <span v-if="finishReason === 'completed'">🎉 恭喜你，坚持完成了本次练习</span>
          <span v-else>👏 当前任务已清空，可稍后再来或切换模式</span>
        </p>
        <div class="completion-stats" v-if="finishReason === 'completed'">
          本次共学习 <span class="number">{{ wordCards.length }}</span> 个单词
        </div>
        <div class="completion-stats" v-else>
          当前学习列表为空
        </div>
        <div class="completion-actions">
          <van-button type="primary" round @click="goBack">返回练习主页</van-button>
          <van-button type="success" round @click="reloadStudyList">再来一组</van-button>
        </div>
      </div>
      <div class="confetti" v-if="finishReason === 'completed'">
        <span v-for="n in 20" :key="n" class="piece" :style="{ left: (n*5)%100 + '%', animationDelay: (n*0.05)+'s', backgroundColor: n%2 ? '#ff6b6b' : '#4ecdc4' }"></span>
      </div>
    </div>

    <!-- 单词卡片展示 -->
    <div v-if="currentCard && !finishedAll" class="card-container">
      <!-- 图片轮播 -->
      <div class="section picture-section">
        <h3 class="section-title">图片</h3>
        <div v-if="(currentCard.picture && currentCard.picture.length > 0)" class="picture-carousel">
          <van-swipe ref="imageSwipe" :show-indicators="true" :loop="false" class="image-swipe">
            <van-swipe-item v-for="(pic, idx) in currentCard.picture" :key="idx">
              <img :src="getResourceUrl(pic)" class="picture" alt="单词图片" />
            </van-swipe-item>
          </van-swipe>
          <div v-if="currentCard.picture && currentCard.picture.length > 1" class="below-controls">
            <button class="ctrl-btn" @click="prevImage">‹</button>
            <button class="ctrl-btn" @click="nextImage">›</button>
          </div>
        </div>
        <div v-else class="no-content">暂无图片</div>
      </div>

      <!-- 单词全拼 -->
      <div class="section word-section">
        <h2 class="word">{{ currentCard.word }}</h2>
      </div>

      <!-- 音标显示 -->
      <div class="section phonetic-section">
        <div class="phonetic-line">
          <span v-if="currentCard.uk_phonetic" class="phonetic-item">
            <span class="label">英式：</span>
            <span class="value">{{ currentCard.uk_phonetic }}</span>
            <van-button size="small" round type="primary" class="audio-btn" @click="playAudio('uk')">
              <van-icon name="volume-o" :class="{ playing: playingType === 'uk' }" />
              <span class="btn-text">{{ playingType === 'uk' ? '' : '' }}</span>
            </van-button>
          </span>
          <span v-if="currentCard.us_phonetic" class="phonetic-item">
            <span class="label">美式：</span>
            <span class="value">{{ currentCard.us_phonetic }}</span>
            <van-button size="small" round type="primary" class="audio-btn" @click="playAudio('us')">
              <van-icon name="volume-o" :class="{ playing: playingType === 'us' }" />
              <span class="btn-text">{{ playingType === 'us' ? '' : '' }}</span>
            </van-button>
          </span>
          <span v-if="!currentCard.uk_phonetic && !currentCard.us_phonetic" class="no-content">暂无音标</span>
        </div>
      </div>

      <!-- 翻译（支持换行） -->
      <div class="section translation-section">
        <div class="translation" v-text="currentCard.translation" />
      </div>

      <!-- 例句轮播 -->
      <div class="section example-section">
        <h3 class="section-title">例句</h3>
        <div v-if="(parsedExamples.length > 0)" class="example-carousel">
          <van-swipe ref="exampleSwipe" :show-indicators="true" :loop="false" class="example-swipe">
            <van-swipe-item v-for="(ex, idx) in parsedExamples" :key="idx">
              <div class="example-item">
                <div class="example-text">{{ ex.example }}</div>
                <div v-if="ex.translation" class="example-translation" v-text="ex.translation" />
              </div>
            </van-swipe-item>
          </van-swipe>
          <div v-if="parsedExamples.length > 1" class="below-controls">
            <button class="ctrl-btn" @click="prevExample">‹</button>
            <button class="ctrl-btn" @click="nextExample">›</button>
          </div>
        </div>
        <div v-else class="no-content">暂无例句</div>
      </div>
      <!-- 操作按钮 -->
      <div class="section actions-section">
        <van-button type="success" block :loading="finishing" @click="onFinishStudy">完成学习</van-button>
      </div>
    </div>
  </div>
</template>

<script>
import { ref, reactive, onMounted, nextTick, computed } from 'vue'
import { useRouter } from 'vue-router'
import { showToast } from 'vant'
import { getStudyWordCardList, finishStudy, PRACTISE_OPERATION } from '@/api/practise'
import { getResourceUrl } from '@/utils/request'

export default {
  name: 'PracticeStudy',
  setup() {
    const router = useRouter()

    // 加载与进度
    const showLoader = ref(true)
    const progress = ref(0)
    const error = ref('')
    const timer = ref(null)

    // 数据
    const wordCards = ref([])
    const currentIndex = ref(0)
    const currentCard = ref(null)
    const finishing = ref(false)
    const finishedAll = ref(false)
    const finishReason = ref('none') // 'empty' | 'completed' | 'none'

    // 轮播引用
    const imageSwipe = ref(null)
    const exampleSwipe = ref(null)

    // 音频播放
    const currentAudio = ref(null)
    const playingType = ref(null) // 'uk' | 'us' | null

    // 解析例句：example可能是JSON字符串、对象或数组，提取example与translation
    const parsedExamples = computed(() => {
      const card = currentCard.value
      if (!card) return []

      const collectFromItems = (items) => {
        const out = []
        for (const item of items) {
          let obj = null
          if (typeof item === 'string') {
            try {
              const parsed = JSON.parse(item)
              if (Array.isArray(parsed)) {
                // 如果解析到数组，递归收集
                out.push(...collectFromItems(parsed))
                continue
              } else if (parsed && typeof parsed === 'object') {
                obj = parsed
              } else {
                // 纯文本字符串
              }
            } catch (e) {
              // 非JSON字符串，作为纯文本例句
            }
          } else if (typeof item === 'object' && item !== null) {
            obj = item
          }
          let exText = ''
          let exTrans = ''
          if (obj) {
            exText = obj.example || obj.sentence || obj.text || ''
            exTrans = obj.translation || obj.trans || obj.cn || obj.zh || ''
          } else if (typeof item === 'string') {
            exText = item
          }
          if (exText || exTrans) {
            out.push({ example: exText, translation: exTrans })
          }
        }
        return out
      }

      // 1) 优先使用 card.example
      if (card.example != null) {
        let items = []
        if (Array.isArray(card.example)) {
          items = card.example
        } else if (typeof card.example === 'string') {
          try {
            const parsed = JSON.parse(card.example)
            if (Array.isArray(parsed)) items = parsed
            else if (parsed && typeof parsed === 'object') items = [parsed]
            else items = [card.example]
          } catch (e) {
            items = [card.example]
          }
        } else if (typeof card.example === 'object') {
          items = [card.example]
        }
        const res = collectFromItems(items)
        if (res.length) return res
      }

      // 2) 备选：从 card.pos[].example 收集
      if (Array.isArray(card.pos)) {
        const all = []
        for (const p of card.pos) {
          if (!p || p.example == null) continue
          if (Array.isArray(p.example)) {
            all.push(...p.example)
          } else {
            all.push(p.example)
          }
        }
        if (all.length) return collectFromItems(all)
      }

      return []
    })

    const goBack = () => router.push('/practice')

    const startFakeProgress = () => {
      // 1秒内到80%
      const duration = 1000
      const steps = 50
      const stepTime = duration / steps
      const increment = 80 / steps
      progress.value = 0
      clearInterval(timer.value)
      timer.value = setInterval(() => {
        progress.value = Math.min(80, Math.floor(progress.value + increment))
        if (progress.value >= 80) {
          clearInterval(timer.value)
        }
      }, stepTime)
    }

    const finishProgress = () => {
      progress.value = 100
      // 稍作延迟以便用户感知完成
      setTimeout(() => {
        showLoader.value = false
      }, 200)
    }

    const loadWordCards = async () => {
      try {
        startFakeProgress()
        const resp = await getStudyWordCardList({ count: 5, random: true })
        wordCards.value = resp.data || []
        if (wordCards.value.length === 0) {
          // 无数据：提示当前无需学习
          finishedAll.value = true
          finishReason.value = 'empty'
          error.value = ''
          currentCard.value = null
          finishProgress()
          return
        }
        currentIndex.value = 0
        currentCard.value = wordCards.value[0]
        await nextTick()
        finishProgress()
      } catch (e) {
        console.error('加载学习列表失败:', e)
        error.value = e.message || '加载失败'
        finishProgress()
      }
    }

    const reloadStudyList = async () => {
      showLoader.value = true
      finishedAll.value = false
      error.value = ''
      await loadWordCards()
    }

    // 图片轮播控制
    const prevImage = () => imageSwipe.value?.prev && imageSwipe.value.prev()
    const nextImage = () => imageSwipe.value?.next && imageSwipe.value.next()

    // 例句轮播控制
    const prevExample = () => exampleSwipe.value?.prev && exampleSwipe.value.prev()
    const nextExample = () => exampleSwipe.value?.next && exampleSwipe.value.next()

    const stopAudio = () => {
      if (currentAudio.value) {
        try {
          currentAudio.value.pause()
          currentAudio.value.currentTime = 0
        } catch (e) {}
      }
      playingType.value = null
    }

    const playAudio = (type) => {
      if (!currentCard.value) return
      const path = type === 'uk' ? currentCard.value.uk_audio : currentCard.value.us_audio
      if (!path) {
        showToast({ message: '暂无音频', type: 'fail' })
        return
      }
      const url = getResourceUrl(path)
      // 如果正在播放同一种，切换为暂停
      if (currentAudio.value && playingType.value === type && !currentAudio.value.paused) {
        stopAudio()
        return
      }
      // 切换音频或首次播放
      stopAudio()
      try {
        currentAudio.value = new Audio(url)
        playingType.value = type
        currentAudio.value.play().catch(err => {
          console.error('音频播放失败:', err)
          showToast({ message: '音频播放失败', type: 'fail' })
          playingType.value = null
        })
        currentAudio.value.onended = () => {
          playingType.value = null
        }
      } catch (e) {
        console.error('创建音频失败:', e)
        showToast({ message: '音频资源错误', type: 'fail' })
        playingType.value = null
      }
    }

    onMounted(() => {
      loadWordCards()
    })

    const onFinishStudy = async () => {
      if (!currentCard.value) return
      try {
        finishing.value = true
        const payload = {
          word_id: currentCard.value.id,
          op: PRACTISE_OPERATION.COMPLETE
        }
        await finishStudy(payload)
        showToast({ message: '已完成学习', type: 'success' })
        if (currentIndex.value < (wordCards.value.length - 1)) {
          currentIndex.value += 1
          currentCard.value = wordCards.value[currentIndex.value]
          stopAudio()
          await nextTick()
        } else {
          showToast({ message: '今日学习已完成', type: 'success' })
          finishedAll.value = true
          finishReason.value = 'completed'
          currentCard.value = null
          stopAudio()
        }
      } catch (e) {
        console.error('完成学习失败:', e)
        showToast({ message: '完成学习失败', type: 'fail' })
      } finally {
        finishing.value = false
      }
    }

    return {
      // 导航
      goBack,
      // 加载
      showLoader,
      progress,
      error,
      // 数据
      currentCard,
      finishing,
      finishedAll,
      finishReason,
      wordCards,
      // 轮播
      imageSwipe,
      exampleSwipe,
      prevImage,
      nextImage,
      prevExample,
      nextExample,
      parsedExamples,
      // 音频
      playAudio,
      playingType,
      onFinishStudy,
      reloadStudyList,
      // 工具
      getResourceUrl
    }
  }
}
</script>

<style lang="scss" scoped>
.study-page {
  min-height: 100vh;
  background: linear-gradient(135deg, #e0f2ff 0%, #ffffff 100%);
}

.study-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 14px 16px;
  background: linear-gradient(135deg, #1989fa 0%, #1976d2 100%);
  color: white;

  .header-left { display: flex; align-items: center; gap: 6px; cursor: pointer; }
  .back-icon { width: 20px; height: 20px; }
  .header-center { text-align: center; flex: 1; }
  .header-center h1 { font-size: 18px; margin: 0; }
  .header-center p { font-size: 12px; margin: 2px 0 0; opacity: 0.9; }
}

.loader-overlay {
  position: fixed;
  inset: 0;
  background: rgba(255,255,255,0.9);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 999;
}
.loader-content { width: 80%; max-width: 420px; text-align: center; }
.progress-wrap { margin-top: 16px; }
.progress-text { margin-top: 8px; font-size: 14px; color: #646566; }

.error-wrap { padding: 20px; }

.card-container {
  padding: 16px;
}

.section { margin-bottom: 16px; }
.section-title { font-size: 14px; color: #646566; margin-bottom: 8px; text-align: center; }

.picture-carousel { position: relative; }
.image-swipe { width: 100%; height: 220px; background: #fff; border-radius: 12px; overflow: hidden; }
.picture { width: 100%; height: 100%; object-fit: cover; }
.below-controls { display: flex; justify-content: center; gap: 8px; margin-top: 10px; }
.ctrl-btn { width: 30px; height: 30px; border-radius: 50%; border: none; background: rgba(0,0,0,0.35); color: #fff; font-size: 16px; cursor: pointer; }

.word-section { text-align: center; }
.word { font-size: 24px; font-weight: 700; color: #323233; }

.phonetic-section { text-align: center; }
.phonetic-line { display: inline-flex; gap: 16px; align-items: baseline; }
.phonetic-item .label { font-size: 12px; color: #646566; margin-right: 4px; }
.phonetic-item .value { font-size: 16px; color: #323233; }
.audio-btn { margin-left: 8px; display: inline-flex; align-items: center; gap: 6px; }
.audio-btn :deep(.van-icon) { font-size: 16px; }
.audio-btn :deep(.van-icon.playing) { color: #ff9800; }
.audio-btn .btn-text { font-size: 12px; }

.translation-section { background: #fff; border-radius: 12px; padding: 12px; }
.translation { white-space: pre-line; font-size: 16px; color: #323233; line-height: 1.6; }

.example-carousel { position: relative; }
.example-swipe { width: 100%; min-height: 120px; background: #fff; border-radius: 12px; overflow: hidden; }
.example-item { padding: 16px; }
.example-text { font-size: 15px; color: #323233; line-height: 1.6; margin-bottom: 6px; }
.example-translation { font-size: 14px; color: #646566; white-space: pre-line; line-height: 1.6; }

.no-content { text-align: center; color: #969799; padding: 16px; background: #fff; border-radius: 12px; }

/* 完成态样式 */
.completion-overlay {
  padding: 20px; text-align: center; position: relative;
}
.completion-card {
  margin: 0 auto; max-width: 460px; background: #fff; border-radius: 16px;
  box-shadow: 0 12px 28px rgba(102, 126, 234, 0.18);
  padding: 24px 20px;
  background-image: linear-gradient(135deg, rgba(102,126,234,0.08), rgba(118,75,162,0.08));
}
.trophy { width: 80px; height: 80px; margin: 0 auto 12px; }
.trophy svg { width: 100%; height: 100%; }
.completion-title { font-size: 20px; font-weight: 700; color: #334155; margin: 6px 0; }
.completion-sub { font-size: 14px; color: #64748b; margin-bottom: 10px; }
.completion-stats { font-size: 14px; color: #475569; margin-bottom: 16px; }
.completion-stats .number { font-weight: 700; color: #1e3a8a; }
.completion-actions { display: flex; justify-content: center; gap: 12px; }

.confetti { pointer-events: none; position: absolute; inset: 0; overflow: hidden; }
.confetti .piece {
  position: absolute; top: -10px; width: 8px; height: 14px; border-radius: 2px;
  animation: fall 2.2s linear forwards;
}
@keyframes fall {
  0% { transform: translateY(0) rotate(0deg); opacity: 0.9; }
  100% { transform: translateY(120vh) rotate(360deg); opacity: 0; }
}

.actions-section { margin-top: 8px; }
</style>