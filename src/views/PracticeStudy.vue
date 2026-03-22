<template>
  <div class="practice-page practice-study">
    <PracticeHeader
      title="学习模式"
      subtitle="Study Mode"
      gradient="linear-gradient(135deg, #1989fa 0%, #1565c0 100%)"
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
      mode-label="学习"
      empty-title="当前已没有需要学习的单词"
      completed-title="本次学习完成！"
      completed-sub="恭喜你，坚持完成了本次练习"
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
        <ImageCarousel
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
      </div>

      <div class="action-bar">
        <van-button class="action-btn primary" block :loading="finishing" @click="onFinish">
          完成学习
        </van-button>
      </div>
    </div>
  </div>
</template>

<script setup>
import { computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { showToast } from 'vant'
import { getStudyWordCardList, finishStudy } from '@/api/practise'

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
  loadApiFn: getStudyWordCardList,
  finishApiFn: finishStudy,
  modeLabel: '学习',
  loadParams: { count: 5, random: true },
  stopAudioFn: stopAudio,
})

const { parsedExamples } = useParsedExamples(currentCard)

const goBack = () => { stopAudio(); router.push('/practice') }
const loadWordCards = async () => { startProgress(); await loadCards(); completeProgress(200) }
const reloadList = () => loadWordCards()

const onFinish = async () => {
  const result = await finishCard(1)
  if (result === 'next') showToast({ message: '已完成学习', type: 'success' })
  else if (result === 'done') showToast({ message: '今日学习已完成', type: 'success' })
}

onMounted(() => loadWordCards())
</script>

<style lang="scss" scoped>
@import '@/styles/practice-common.scss';
.practice-study {
  --mode-color: #1989fa;
  --mode-color-light: #e3f2fd;
  --mode-gradient: linear-gradient(135deg, #e3f2fd 0%, #f5f9ff 50%, #ffffff 100%);
}
</style>
