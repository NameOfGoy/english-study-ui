<template>
  <div class="practice-page practice-strength">
    <PracticeHeader
      title="强化模式"
      subtitle="Strengthen"
      gradient="linear-gradient(135deg, #16C0CB 0%, #0E9AA3 100%)"
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
      mode-label="强化"
      word-label="词语"
      empty-title="当前已没有需要强化的词语"
      completed-title="本次强化完成！"
      completed-sub="恭喜你，坚持完成了本次强化"
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

        <!-- Choice phase: translation only -->
        <template v-if="strengthState === 'choice'">
          <div class="section translation-section">
            <h3 class="section-label">中文释义</h3>
            <div class="translation" v-text="currentCard.translation" />
          </div>
        </template>

        <!-- Full reveal phase -->
        <template v-else>
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
        <template v-if="strengthState === 'choice'">
          <van-button class="action-btn success" block @click="handleChoice(1)">记得</van-button>
          <van-button class="action-btn danger" block @click="handleChoice(2)">不记得</van-button>
        </template>
        <template v-else>
          <van-button class="action-btn primary" block @click="nextWord">下一个</van-button>
        </template>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { showToast } from 'vant'
import { getStrengthWordCardList, finishStrength } from '@/api/practise'
import { getPracticeTagFilter } from '@/utils/practiceTagFilter'

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
const strengthState = ref('choice') // 'choice' | 'full'

const { playingType, playAudio, stopAudio } = useAudioPlayer()
const { showLoader, progress, startProgress, completeProgress } = useProgressLoader()
const {
  imageSwipeTouchable, exampleSwipeTouchable, disableSwipePointer,
  handleCardTouchStart, handleCardTouchMove, handleCardTouchEnd, handleCardTouchCancel,
} = useSwipeTouchControl()

const {
  wordCards, currentIndex, currentCard, finishedAll, finishReason, error,
  loadCards,
} = usePracticeCards({
  loadApiFn: getStrengthWordCardList,
  finishApiFn: finishStrength,
  modeLabel: '强化',
  loadParams: { random: true, tag_ids: getPracticeTagFilter() },
  stopAudioFn: stopAudio,
})

const { parsedExamples } = useParsedExamples(currentCard)

const goBack = () => { stopAudio(); router.push('/practice') }
const loadWordCards = async () => { startProgress(); await loadCards(); completeProgress() }
const reloadList = () => loadWordCards()

// Strength is special: finish API is called on choice, but we stay on the same card for full reveal.
// "下一个" button advances manually.
const handleChoice = async (operation) => {
  if (!currentCard.value) return
  try {
    const rawWordType = Number(currentCard.value.word_type)
    const safeWordType = (rawWordType === 1 || rawWordType === 2) ? rawWordType : 1
    await finishStrength({
      word_id: currentCard.value.id,
      word_type: safeWordType,
      operation,
    })
    strengthState.value = 'full'
  } catch (err) {
    showToast('操作失败，请重试')
  }
}

const nextWord = () => {
  if (currentIndex.value < wordCards.value.length - 1) {
    currentIndex.value++
    currentCard.value = wordCards.value[currentIndex.value]
    strengthState.value = 'choice'
    stopAudio()
  } else {
    finishedAll.value = true
    finishReason.value = 'completed'
  }
}

onMounted(() => loadWordCards())
</script>

<style lang="scss" scoped>
@import '@/styles/practice-common.scss';
.practice-strength {
  --mode-color: #16C0CB;
  --mode-color-light: #E2F7F9;
  --mode-gradient: linear-gradient(135deg, #E2F7F9 0%, #F1FBFC 50%, #ffffff 100%);
}
</style>
