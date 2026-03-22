<template>
  <div class="practice-page practice-review">
    <PracticeHeader
      title="复习模式"
      subtitle="Review Mode"
      gradient="linear-gradient(135deg, #ff9800 0%, #e65100 100%)"
      :current="currentIndex + 1"
      :total="wordCards.length"
      @back="goBack"
    />

    <LoaderOverlay :visible="showLoader" :progress="progress" />

    <div v-if="error && !finishedAll" class="error-wrap">
      <van-empty image="error" :description="error" />
    </div>

    <CompletionOverlay
      :visible="finishedAll"
      :finish-reason="finishReason"
      :count="wordCards.length"
      mode-label="复习"
      empty-title="当前已没有需要复习的单词"
      completed-title="本次复习完成！"
      completed-sub="恭喜你，坚持完成了本次复习"
      @go-back="goBack"
      @reload="reloadList"
    />

    <div
      v-if="currentCard && !finishedAll"
      class="card-container"
      @touchstart.capture="handleCardTouchStart"
      @touchmove.capture="handleCardTouchMove"
      @touchend.capture="handleCardTouchEnd"
      @touchcancel.capture="handleCardTouchCancel"
    >
      <div class="word-card">
        <!-- Initial: show picture or translation -->
        <template v-if="reviewState === 'initial'">
          <ImageCarousel
            v-if="hasImages"
            :pictures="currentCard.picture"
            :touchable="imageSwipeTouchable"
            :disable-pointer="disableSwipePointer"
          />
          <div v-else class="section translation-section">
            <h3 class="section-label">中文释义</h3>
            <div class="translation" v-text="currentCard.translation" />
          </div>
        </template>

        <!-- Hint: picture + translation -->
        <template v-if="reviewState === 'hint'">
          <ImageCarousel
            :pictures="currentCard.picture"
            :touchable="imageSwipeTouchable"
            :disable-pointer="disableSwipePointer"
          />
          <div class="section translation-section">
            <h3 class="section-label">中文释义</h3>
            <div class="translation" v-text="currentCard.translation" />
          </div>
        </template>

        <!-- Full: everything -->
        <template v-if="reviewState === 'full'">
          <ImageCarousel
            v-if="hasImages"
            :pictures="currentCard.picture"
            :touchable="imageSwipeTouchable"
            :disable-pointer="disableSwipePointer"
          />
          <div class="section word-section">
            <h2 class="word">{{ currentCard.word }}</h2>
          </div>
          <PhoneticDisplay
            :word-type="currentCard.word_type"
            :uk-phonetic="currentCard.uk_phonetic"
            :us-phonetic="currentCard.us_phonetic"
            :uk-audio="currentCard.uk_audio"
            :us-audio="currentCard.us_audio"
            :playing-type="playingType"
            @play="(type) => playAudio(type, currentCard)"
          />
          <div class="section translation-section">
            <h3 class="section-label">中文释义</h3>
            <div class="translation" v-text="currentCard.translation" />
          </div>
          <ExampleCarousel
            :examples="parsedExamples"
            :touchable="exampleSwipeTouchable"
            :disable-pointer="disableSwipePointer"
          />
        </template>
      </div>

      <div class="action-bar">
        <template v-if="reviewState === 'initial'">
          <van-button v-if="hasImages" class="action-btn secondary" block @click="reviewState = 'hint'">中文提示</van-button>
          <van-button class="action-btn primary" block @click="reviewState = 'full'">查看答案</van-button>
        </template>
        <template v-else-if="reviewState === 'hint'">
          <van-button class="action-btn primary" block @click="reviewState = 'full'">查看答案</van-button>
        </template>
        <template v-else>
          <van-button class="action-btn success" block :loading="finishing" @click="onFinish(1)">已掌握</van-button>
          <van-button class="action-btn danger" block :loading="finishing" @click="onFinish(2)">不记得</van-button>
        </template>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, watch } from 'vue'
import { useRouter } from 'vue-router'
import { showToast } from 'vant'
import { getReviewWordCardList, finishReview } from '@/api/practise'

import PracticeHeader from '@/components/practice/PracticeHeader.vue'
import LoaderOverlay from '@/components/practice/LoaderOverlay.vue'
import CompletionOverlay from '@/components/practice/CompletionOverlay.vue'
import ImageCarousel from '@/components/practice/ImageCarousel.vue'
import PhoneticDisplay from '@/components/practice/PhoneticDisplay.vue'
import ExampleCarousel from '@/components/practice/ExampleCarousel.vue'

import { useAudioPlayer } from '@/composables/useAudioPlayer'
import { useParsedExamples } from '@/composables/useParsedExamples'
import { useSwipeTouchControl } from '@/composables/useSwipeTouchControl'
import { useProgressLoader } from '@/composables/useProgressLoader'
import { usePracticeCards } from '@/composables/usePracticeCards'

const router = useRouter()
const reviewState = ref('initial')

const { playingType, playAudio, stopAudio } = useAudioPlayer()
const { showLoader, progress, startProgress, completeProgress } = useProgressLoader()
const {
  imageSwipeTouchable, exampleSwipeTouchable, disableSwipePointer,
  handleCardTouchStart, handleCardTouchMove, handleCardTouchEnd, handleCardTouchCancel,
} = useSwipeTouchControl()

const {
  wordCards, currentIndex, currentCard, finishing, finishedAll, finishReason, error,
  loadCards, finishCard,
} = usePracticeCards({
  loadApiFn: getReviewWordCardList,
  finishApiFn: finishReview,
  modeLabel: '复习',
  loadParams: { count: 10, random: true },
  stopAudioFn: stopAudio,
})

const { parsedExamples } = useParsedExamples(currentCard)
const hasImages = computed(() => currentCard.value?.picture?.length > 0)

const goBack = () => { stopAudio(); router.push('/practice') }
const loadWordCards = async () => { startProgress(); reviewState.value = 'initial'; await loadCards(); completeProgress() }
const reloadList = () => loadWordCards()

const onFinish = async (operation) => {
  const result = await finishCard(operation)
  if (result === 'next') {
    reviewState.value = 'initial'
    showToast({ message: operation === 1 ? '已掌握' : '已标记为不记得', type: 'success' })
  } else if (result === 'done') {
    showToast({ message: '今日复习已完成', type: 'success' })
  }
}

watch([currentCard, reviewState], () => {})
onMounted(() => loadWordCards())
</script>

<style lang="scss" scoped>
@import '@/styles/practice-common.scss';
.practice-review {
  --mode-color: #ff9800;
  --mode-color-light: #fff3e0;
  --mode-gradient: linear-gradient(135deg, #fff3e0 0%, #fffaf0 50%, #ffffff 100%);
}
</style>
