<template>
  <div class="practice-page practice-spot">
    <PracticeHeader
      title="抽查模式"
      subtitle="Spot Check"
      gradient="linear-gradient(135deg, #7c4dff 0%, #651fff 100%)"
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
      mode-label="抽查"
      empty-title="当前已没有需要抽查的单词"
      completed-title="本次抽查完成！"
      completed-sub="恭喜你，坚持完成了本次抽查"
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
          <van-button class="action-btn success" block :loading="finishing" @click="onFinish(1)">通过</van-button>
          <van-button class="action-btn danger" block :loading="finishing" @click="onFinish(2)">不通过</van-button>
        </template>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { showToast } from 'vant'
import { getSpotWordCardList, finishSpot } from '@/api/practise'

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
  loadApiFn: getSpotWordCardList,
  finishApiFn: finishSpot,
  modeLabel: '抽查',
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
    showToast({ message: operation === 1 ? '已通过' : '已标记为不通过', type: 'success' })
  } else if (result === 'done') {
    showToast({ message: '本次抽查已完成', type: 'success' })
  }
}

onMounted(() => loadWordCards())
</script>

<style lang="scss" scoped>
@import '@/styles/practice-common.scss';
.practice-spot {
  --mode-color: #7c4dff;
  --mode-color-light: #ede7f6;
  --mode-gradient: linear-gradient(135deg, #ede7f6 0%, #f5f0ff 50%, #ffffff 100%);
}
</style>
