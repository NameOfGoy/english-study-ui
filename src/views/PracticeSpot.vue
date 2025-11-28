<template>
  <div class="review-page">
    <div class="review-header">
      <div class="header-left" @click="goBack">
        <svg class="back-icon" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
          <path d="M15 18L9 12L15 6" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
        </svg>
        <span>返回</span>
      </div>
      <div class="header-center">
        <h1>抽查模式</h1>
        <p>Spot Mode</p>
      </div>
      <div class="header-right"></div>
    </div>

    <div v-if="showLoader" class="loader-overlay">
      <div class="loader-content">
        <van-loading size="24px" vertical>正在加载单词卡片...</van-loading>
        <div class="progress-wrap">
          <van-progress :percentage="progress" stroke-width="8" pivot-text="" />
          <div class="progress-text">{{ progress }}%</div>
        </div>
      </div>
    </div>

    <div v-if="error && !finishedAll" class="error-wrap">
      <van-empty image="error" :description="error" />
    </div>

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
        <h2 class="completion-title">{{ finishReason === 'empty' ? '当前已没有需要抽查的单词' : '本次抽查完成！' }}</h2>
        <p class="completion-sub">
          <span v-if="finishReason === 'completed'">🎉 恭喜你，坚持完成了本次抽查</span>
          <span v-else>👏 当前任务已清空，可稍后再来或切换模式</span>
        </p>
        <div class="completion-stats" v-if="finishReason === 'completed'">
          本次共抽查 <span class="number">{{ wordCards.length }}</span> 个单词
        </div>
        <div class="completion-stats" v-else>
          当前抽查列表为空
        </div>
        <div class="completion-actions">
          <van-button type="primary" round block @click="goBack">返回练习主页</van-button>
          <van-button v-if="finishReason === 'completed'" type="success" round block @click="reloadSpotList">再来一组</van-button>
        </div>
      </div>
      <div class="confetti" v-if="finishReason === 'completed'">
        <span v-for="n in 20" :key="n" class="piece" :style="{ left: (n*5)%100 + '%', animationDelay: (n*0.05)+'s', backgroundColor: n%2 ? '#ff6b6b' : '#4ecdc4' }"></span>
      </div>
    </div>

    <div 
      v-if="currentCard && !finishedAll" 
      class="card-container"
      @touchstart.capture="handleCardTouchStart"
      @touchmove.capture="handleCardTouchMove"
      @touchend.capture="handleCardTouchEnd"
      @touchcancel.capture="handleCardTouchCancel"
    >
      <div v-if="reviewState === 'initial'" class="review-initial">
        <div v-if="hasImages" class="section picture-section">
          <h3 class="section-title">图片</h3>
          <div class="picture-carousel">
            <van-swipe
              ref="imageSwipeInitial"
              :show-indicators="true"
              :loop="false"
              :touchable="imageSwipeTouchable"
              :stop-propagation="false"
              :class="['image-swipe', { 'disable-pointer': disableSwipePointer }]"
              @change="onImageSwipeChange"
            >
              <div v-if="disableSwipePointer" class="swipe-mask"></div>
              <van-swipe-item v-for="(pic, idx) in currentCard.picture" :key="idx">
                <img :src="getResourceUrl(pic)" class="picture" alt="单词图片" />
              </van-swipe-item>
            </van-swipe>
            <div v-if="currentCard.picture && currentCard.picture.length > 1" class="below-controls">
              <button class="ctrl-btn" @click="prevImage"><van-icon name="arrow-left" /></button>
              <button class="ctrl-btn" @click="nextImage"><van-icon name="arrow" /></button>
            </div>
          </div>
        </div>

        <div v-if="!hasImages" class="section translation-section">
          <h3 class="section-title">中文释义</h3>
          <div class="translation" v-text="currentCard.translation" />
        </div>

        <div class="section actions-section">
          <van-button v-if="hasImages" type="warning" block @click="showChineseHint">中文提示</van-button>
          <van-button type="primary" block @click="showFullCard">查看</van-button>
        </div>
      </div>

      <div v-if="reviewState === 'hint'" class="review-hint">
        <div class="section picture-section">
          <h3 class="section-title">图片</h3>
          <div class="picture-carousel">
            <van-swipe
              ref="imageSwipeHint"
              :show-indicators="true"
              :loop="false"
              :touchable="imageSwipeTouchable"
              :stop-propagation="false"
              :class="['image-swipe', { 'disable-pointer': disableSwipePointer }]"
              @change="onImageSwipeChange"
            >
              <div v-if="disableSwipePointer" class="swipe-mask"></div>
              <van-swipe-item v-for="(pic, idx) in currentCard.picture" :key="idx">
                <img :src="getResourceUrl(pic)" class="picture" alt="单词图片" />
              </van-swipe-item>
            </van-swipe>
            <div v-if="currentCard.picture && currentCard.picture.length > 1" class="below-controls">
              <button class="ctrl-btn" @click="prevImage"><van-icon name="arrow-left" /></button>
              <button class="ctrl-btn" @click="nextImage"><van-icon name="arrow" /></button>
            </div>
          </div>
        </div>

        <div class="section translation-section">
          <h3 class="section-title">中文释义</h3>
          <div class="translation" v-text="currentCard.translation" />
        </div>

        <div class="section actions-section">
          <van-button type="primary" block @click="showFullCard">查看</van-button>
        </div>
      </div>

      <div v-if="reviewState === 'full'" class="review-full">
        <div class="section picture-section" v-if="hasImages">
          <h3 class="section-title">图片</h3>
          <div class="picture-carousel">
            <van-swipe
              ref="imageSwipeFull"
              :show-indicators="true"
              :loop="false"
              :touchable="imageSwipeTouchable"
              :stop-propagation="false"
              :class="['image-swipe', { 'disable-pointer': disableSwipePointer }]"
              @change="onImageSwipeChange"
            >
              <div v-if="disableSwipePointer" class="swipe-mask"></div>
              <van-swipe-item v-for="(pic, idx) in currentCard.picture" :key="idx">
                <img :src="getResourceUrl(pic)" class="picture" alt="单词图片" />
              </van-swipe-item>
            </van-swipe>
            <div v-if="currentCard.picture && currentCard.picture.length > 1" class="below-controls">
              <button class="ctrl-btn" @click="prevImage"><van-icon name="arrow-left" /></button>
              <button class="ctrl-btn" @click="nextImage"><van-icon name="arrow" /></button>
            </div>
          </div>
        </div>

        <div class="section word-section">
          <h2 class="word">{{ currentCard.word }}</h2>
        </div>

        <div class="section phonetic-section">
          <div class="phonetic-line">
            <template v-if="currentCard.word_type === 2">
              <span v-if="currentCard.uk_audio" class="phonetic-item">
                <van-button size="small" round type="primary" class="audio-btn" @click="playAudio('uk')">
                  <van-icon name="volume-o" :class="{ playing: playingType === 'uk' }" />
                  <span class="btn-text"></span>
                </van-button>
              </span>
              <span v-else class="no-content">暂无发音</span>
            </template>
            <template v-else>
              <span v-if="currentCard.uk_phonetic" class="phonetic-item">
                <span class="label">英式：</span>
                <span class="value">{{ currentCard.uk_phonetic }}</span>
                <van-button size="small" round type="primary" class="audio-btn" @click="playAudio('uk')">
                  <van-icon name="volume-o" :class="{ playing: playingType === 'uk' }" />
                </van-button>
              </span>
              <span v-if="currentCard.us_phonetic" class="phonetic-item">
                <span class="label">美式：</span>
                <span class="value">{{ currentCard.us_phonetic }}</span>
                <van-button size="small" round type="primary" class="audio-btn" @click="playAudio('us')">
                  <van-icon name="volume-o" :class="{ playing: playingType === 'us' }" />
                </van-button>
              </span>
              <span v-if="!currentCard.uk_phonetic && !currentCard.us_phonetic" class="no-content">暂无发音</span>
            </template>
          </div>
        </div>

        <div class="section translation-section">
          <h3 class="section-title">中文释义</h3>
          <div class="translation" v-text="currentCard.translation" />
        </div>

        <div class="section example-section">
          <h3 class="section-title">例句</h3>
          <div v-if="(parsedExamples.length > 0)" class="example-carousel">
            <div v-if="disableSwipePointer" class="swipe-mask"></div>
            <van-swipe
              ref="exampleSwipe"
              :show-indicators="true"
              :loop="false"
              :touchable="exampleSwipeTouchable"
              :stop-propagation="false"
              :class="['example-swipe', { 'disable-pointer': disableSwipePointer }]"
            >
              <van-swipe-item v-for="(ex, idx) in parsedExamples" :key="idx">
                <div class="example-item">
                  <div class="example-text">{{ ex.example }}</div>
                  <div v-if="ex.translation" class="example-translation" v-text="ex.translation" />
                </div>
              </van-swipe-item>
            </van-swipe>
            <div v-if="parsedExamples.length > 1" class="below-controls">
              <button class="ctrl-btn" @click="prevExample"><van-icon name="arrow-left" /></button>
              <button class="ctrl-btn" @click="nextExample"><van-icon name="arrow" /></button>
            </div>
          </div>
          <div v-else class="no-content">暂无例句</div>
        </div>

        <div class="section actions-section">
          <van-button type="success" block :loading="finishing" @click="onFinishSpot(1)">下一个</van-button>
          <van-button type="danger" block :loading="finishing" @click="onFinishSpot(2)">不通过</van-button>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import { ref, reactive, onMounted, nextTick, computed, watch } from 'vue'
import { useRouter } from 'vue-router'
import { showToast } from 'vant'
import { getSpotWordCardList, finishSpot, PRACTISE_OPERATION } from '@/api/practise'
import { getResourceUrl } from '@/utils/request'

export default {
  name: 'PracticeSpot',
  setup() {
    const router = useRouter()

    const showLoader = ref(true)
    const progress = ref(0)
    const error = ref('')
    const timer = ref(null)

    const wordCards = ref([])
    const currentIndex = ref(0)
    const currentCard = ref(null)
    const finishing = ref(false)
    const finishedAll = ref(false)
    const finishReason = ref('none')

    const reviewState = ref('initial')

    const imageSwipeInitial = ref(null)
    const imageSwipeHint = ref(null)
    const imageSwipeFull = ref(null)
    const exampleSwipe = ref(null)
    const imageSwipeTouchable = ref(true)
    const exampleSwipeTouchable = ref(true)
    const disableSwipePointer = ref(false)
    const touchStartX = ref(0)
    const touchStartY = ref(0)
    const imageActiveIndex = ref(0)

    const currentAudio = ref(null)
    const playingType = ref(null)

    const hasImages = computed(() => {
      return currentCard.value && currentCard.value.picture && currentCard.value.picture.length > 0
    })

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
                out.push(...collectFromItems(parsed))
                continue
              } else if (parsed && typeof parsed === 'object') {
                obj = parsed
              }
            } catch (e) {}
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

    const goBack = () => {
      stopAudio()
      router.push('/practice')
    }

    const loadWordCards = async () => {
      try {
        showLoader.value = true
        error.value = ''
        startProgress()

        const response = await getSpotWordCardList({ count: 10, random: true })

        if (response.data && response.data.length > 0) {
          wordCards.value = response.data
          currentIndex.value = 0
          currentCard.value = wordCards.value[0]
          reviewState.value = 'initial'
          finishedAll.value = false
          finishReason.value = 'none'
        } else {
          finishedAll.value = true
          finishReason.value = 'empty'
          currentCard.value = null
        }
      } catch (e) {
        console.error('加载抽查列表失败:', e)
        error.value = '加载失败，请重试'
      } finally {
        completeProgress()
        setTimeout(() => {
          showLoader.value = false
        }, 500)
      }
    }

    const reloadSpotList = () => {
      loadWordCards()
    }

    const startProgress = () => {
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

    const completeProgress = () => {
      clearInterval(timer.value)
      progress.value = 100
    }

    const showChineseHint = () => {
      reviewState.value = 'hint'
    }
    const showFullCard = () => {
      reviewState.value = 'full'
    }

    const handleCardTouchStart = (e) => {
      const t = e.touches[0]
      touchStartX.value = t.clientX
      touchStartY.value = t.clientY
      imageSwipeTouchable.value = true
      exampleSwipeTouchable.value = true
      disableSwipePointer.value = false
    }
    const handleCardTouchMove = (e) => {
      const t = e.touches[0]
      const dx = t.clientX - touchStartX.value
      const dy = t.clientY - touchStartY.value
      const absX = Math.abs(dx)
      const absY = Math.abs(dy)
      const verticalIntent = absY > absX && absY > 6
      const horizontalIntent = absX > absY && absX > 6
      if (verticalIntent) {
        imageSwipeTouchable.value = false
        exampleSwipeTouchable.value = false
        disableSwipePointer.value = true
      } else if (horizontalIntent) {
        imageSwipeTouchable.value = true
        exampleSwipeTouchable.value = true
        disableSwipePointer.value = false
      }
    }
    const handleCardTouchEnd = () => {
      imageSwipeTouchable.value = true
      exampleSwipeTouchable.value = true
      touchStartX.value = 0
      touchStartY.value = 0
      disableSwipePointer.value = false
    }
    const handleCardTouchCancel = () => {
      imageSwipeTouchable.value = true
      exampleSwipeTouchable.value = true
      touchStartX.value = 0
      touchStartY.value = 0
      disableSwipePointer.value = false
    }

    const getImageSwipe = () => {
      if (reviewState.value === 'initial') return imageSwipeInitial.value
      if (reviewState.value === 'hint') return imageSwipeHint.value
      if (reviewState.value === 'full') return imageSwipeFull.value
      return imageSwipeFull.value || imageSwipeHint.value || imageSwipeInitial.value
    }
    const onImageSwipeChange = (index) => {
      imageActiveIndex.value = Number(index) || 0
    }
    const clampIndex = (idx, max) => Math.min(Math.max(idx, 0), max)
    const prevImage = () => {
      const len = (currentCard.value?.picture?.length || 0) - 1
      if (len < 1) return
      const nextIdx = clampIndex(imageActiveIndex.value - 1, len)
      const swipe = getImageSwipe()
      if (swipe && typeof swipe.swipeTo === 'function') {
        swipe.swipeTo(nextIdx)
      } else if (swipe && typeof swipe.prev === 'function') {
        swipe.prev()
      }
    }
    const nextImage = () => {
      const len = (currentCard.value?.picture?.length || 0) - 1
      if (len < 1) return
      const nextIdx = clampIndex(imageActiveIndex.value + 1, len)
      const swipe = getImageSwipe()
      if (swipe && typeof swipe.swipeTo === 'function') {
        swipe.swipeTo(nextIdx)
      } else if (swipe && typeof swipe.next === 'function') {
        swipe.next()
      }
    }
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
      if (currentAudio.value && playingType.value === type && !currentAudio.value.paused) {
        stopAudio()
        return
      }
      stopAudio()
      try {
        currentAudio.value = new Audio(url)
        playingType.value = type
        currentAudio.value.play().catch(err => {
          console.error('音频播放失败:', err)
          showToast({ message: '音频播放失败', type: 'fail' })
          playingType.value = null
        })
        currentAudio.value.onended = () => { playingType.value = null }
      } catch (e) {
        console.error('创建音频失败:', e)
        showToast({ message: '音频资源错误', type: 'fail' })
        playingType.value = null
      }
    }

    const onFinishSpot = async (operation) => {
      if (!currentCard.value) return
      try {
        finishing.value = true
        const rawWordType = Number(currentCard.value.word_type)
        const safeWordType = (rawWordType === 1 || rawWordType === 2) ? rawWordType : 1
        const payload = {
          word_id: currentCard.value.id,
          word_type: safeWordType,
          operation
        }
        await finishSpot(payload)
        const message = operation === PRACTISE_OPERATION.COMPLETE ? '已完成抽查' : '已标记为不通过'
        showToast({ message, type: 'success' })
        if (currentIndex.value < (wordCards.value.length - 1)) {
          currentIndex.value += 1
          currentCard.value = wordCards.value[currentIndex.value]
          reviewState.value = 'initial'
          stopAudio()
          await nextTick()
        } else {
          finishedAll.value = true
          finishReason.value = 'completed'
          currentCard.value = null
          stopAudio()
        }
      } catch (e) {
        console.error('完成抽查失败:', e)
        showToast({ message: '完成抽查失败', type: 'fail' })
      } finally {
        finishing.value = false
      }
    }

    onMounted(() => {
      loadWordCards()
    })

    watch([currentCard, reviewState], () => {
      imageActiveIndex.value = 0
    })

    return {
      goBack,
      showLoader,
      progress,
      error,
      currentCard,
      finishing,
      finishedAll,
      finishReason,
      wordCards,
      reviewState,
      hasImages,
      showChineseHint,
      showFullCard,
      imageSwipeInitial,
      imageSwipeHint,
      imageSwipeFull,
      exampleSwipe,
      imageSwipeTouchable,
      exampleSwipeTouchable,
      disableSwipePointer,
      prevImage,
      nextImage,
      onImageSwipeChange,
      prevExample,
      nextExample,
      parsedExamples,
      handleCardTouchStart,
      handleCardTouchMove,
      handleCardTouchEnd,
      handleCardTouchCancel,
      playAudio,
      playingType,
      onFinishSpot,
      reloadSpotList,
      getResourceUrl
    }
  }
}
</script>

<style lang="scss" scoped>
.review-page { min-height: 100vh; background: linear-gradient(135deg, #fff3e0 0%, #ffffff 100%); }
.review-header { display: flex; align-items: center; justify-content: space-between; padding: 14px 16px; background: linear-gradient(135deg, #ff9800 0%, #f57c00 100%); color: white; }
.review-header .header-left { display: flex; align-items: center; gap: 6px; cursor: pointer; }
.review-header .back-icon { width: 20px; height: 20px; }
.review-header .header-center { text-align: center; flex: 1; }
.review-header .header-center h1 { font-size: 18px; margin: 0; }
.review-header .header-center p { font-size: 12px; margin: 2px 0 0; opacity: 0.9; }
.loader-overlay { position: fixed; inset: 0; background: rgba(255,255,255,0.9); display: flex; align-items: center; justify-content: center; z-index: 999; }
.loader-content { width: 80%; max-width: 420px; text-align: center; }
.progress-wrap { margin-top: 16px; }
.progress-text { margin-top: 8px; font-size: 14px; color: #646566; }
.error-wrap { padding: 20px; }
.card-container { padding: 20px 16px; overscroll-behavior-y: contain; max-width: 480px; margin: 0 auto; }
.section { margin-bottom: 20px; }
.section-title { font-size: 15px; color: #646566; margin-bottom: 12px; text-align: center; font-weight: 600; letter-spacing: 0.5px; }
.picture-carousel { position: relative; }
.image-swipe { width: 100%; height: 220px; background: #fff; border-radius: 12px; overflow: hidden; box-shadow: 0 2px 12px rgba(0,0,0,0.1); }
.picture { width: 100%; height: 100%; object-fit: cover; }
.below-controls { display: flex; justify-content: center; gap: 8px; margin-top: 10px; }
.ctrl-btn { width: 36px; height: 36px; border-radius: 50%; border: none; background: rgba(0,0,0,0.6); color: #fff; font-size: 18px; cursor: pointer; transition: all 0.2s ease; display: flex; align-items: center; justify-content: center; padding: 0; line-height: 1; text-align: center; box-sizing: border-box; }
.ctrl-btn .van-icon { font-size: 18px; line-height: 1; display: inline-block; }
.ctrl-btn:hover { background: rgba(0,0,0,0.8); transform: scale(1.1); }
.swipe-mask { position: absolute; top: 0; left: 0; right: 0; bottom: 0; z-index: 10; background: transparent; }
.disable-pointer { pointer-events: none; }
.word-section { text-align: center; }
.word { font-size: 24px; font-weight: 700; color: #323233; }
.phonetic-section { text-align: center; padding: 12px 0; }
.phonetic-line { display: inline-flex; gap: 20px; align-items: center; justify-content: center; flex-wrap: wrap; }
.phonetic-item { display: flex; align-items: center; gap: 8px; }
.phonetic-item .label { font-size: 13px; color: #646566; font-weight: 500; }
.phonetic-item .value { font-size: 16px; color: #323233; font-family: 'Times New Roman', serif; }
.audio-btn { display: inline-flex; align-items: center; gap: 4px; min-width: auto; padding: 6px 12px; height: 32px; }
.audio-btn .btn-text { font-size: 12px; }
.audio-btn :deep(.van-icon) { font-size: 16px; }
.audio-btn :deep(.van-icon.playing) { color: #ff9800; animation: pulse 1s infinite; }
@keyframes pulse { 0%, 100% { transform: scale(1); } 50% { transform: scale(1.1); } }
.translation-section { background: #fff; border-radius: 12px; padding: 12px; }
.translation { white-space: pre-line; font-size: 16px; color: #323233; line-height: 1.6; }
.example-carousel { position: relative; }
.example-swipe { width: 100%; min-height: 120px; background: #fff; border-radius: 12px; overflow: hidden; box-shadow: 0 2px 12px rgba(0,0,0,0.1); }
.example-item { padding: 20px; display: flex; flex-direction: column; justify-content: center; min-height: 120px; }
.example-text { font-size: 16px; color: #323233; line-height: 1.7; margin-bottom: 12px; font-weight: 500; }
.example-translation { font-size: 14px; color: #646566; white-space: pre-line; line-height: 1.6; font-style: italic; }
.actions-section { display: flex; flex-direction: column; gap: 16px; padding-top: 8px; }
.actions-section .van-button { margin-bottom: 0; height: 48px; font-size: 16px; font-weight: 600; border-radius: 12px; box-shadow: 0 2px 8px rgba(0,0,0,0.1); transition: all 0.2s ease; }
.actions-section .van-button:active { transform: translateY(1px); }
.no-content { text-align: center; color: #969799; font-size: 14px; padding: 20px; }
.completion-overlay { position: fixed; inset: 0; background: rgba(255,255,255,0.95); display: flex; align-items: center; justify-content: center; z-index: 1000; }
.completion-card { background: white; border-radius: 16px; padding: 24px; text-align: center; box-shadow: 0 8px 32px rgba(0,0,0,0.1); max-width: 320px; width: 90%; }
.trophy { width: 80px; height: 80px; margin: 0 auto 16px; }
.trophy svg { width: 100%; height: 100%; }
.completion-title { font-size: 20px; font-weight: 700; color: #334155; margin: 6px 0; }
.completion-sub { font-size: 14px; color: #64748b; margin-bottom: 10px; }
.completion-stats { font-size: 14px; color: #475569; margin-bottom: 16px; }
.completion-stats .number { font-weight: 700; color: #ff9800; }
.completion-actions { display: flex; flex-direction: column; gap: 8px; }
.confetti { position: fixed; inset: 0; pointer-events: none; z-index: 999; }
.piece { position: absolute; width: 8px; height: 8px; animation: confetti-fall 3s linear infinite; }
@keyframes confetti-fall { 0% { transform: translateY(-100vh) rotate(0deg); opacity: 1; } 100% { transform: translateY(100vh) rotate(720deg); opacity: 0; } }
</style>
