<template>
  <div class="practice-page practice-study">
    <PracticeHeader
      title="学习模式"
      subtitle="Study Mode"
      gradient="linear-gradient(135deg, #3DA5F4 0%, #1E88E5 100%)"
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
          editable
          @edit="onEditPicture"
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
          <h3 class="section-label">
            中文释义
            <van-icon name="edit" class="edit-trans-btn" @click="openTransEdit" />
          </h3>
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

    <!-- 图片编辑模态 -->
    <PictureModal
      :show="picEditor.showPictureModal.value"
      :currentPicture="picEditor.currentPicture.value"
      :isWord="picEditor.isWord()"
      :generatingPicture="picEditor.generatingPicture.value"
      :uploadingImage="picEditor.uploadingImage.value"
      :hasPending="picEditor.hasPending.value"
      :applyingPicture="picEditor.applyingPicture.value"
      @close="picEditor.closePictureModal"
      @generate="picEditor.generatePicture"
      @upload="picEditor.openImageUpload"
      @search="picEditor.openImageSearch"
      @apply="picEditor.applyPicture"
      @restore="picEditor.restorePicture"
    />

    <!-- 图片裁剪 -->
    <ImageCropModal
      :show="picEditor.showCropModal.value"
      :imageSrc="picEditor.selectedImageSrc.value"
      :uploading="picEditor.uploadingImage.value"
      @close="picEditor.closeCropModal"
      @confirm="picEditor.confirmCrop"
    />

    <!-- 图片搜索 -->
    <ImageSearchModal
      :show="picEditor.showImageSearchModal.value"
      :defaultQuery="picEditor.imageSearchDefaultQuery.value"
      @close="picEditor.showImageSearchModal.value = false"
      @select="picEditor.onImageSearchSelect"
    />

    <!-- 释义编辑 -->
    <TranslationEditModal
      :show="showTransEdit"
      :word="currentCard?.word"
      :items="currentCard?.translation_items || []"
      :submitting="savingTrans"
      @close="showTransEdit = false"
      @submit="onSaveTranslation"
    />
  </div>
</template>

<script setup>
import { computed, onMounted, ref } from 'vue'
import { useRouter } from 'vue-router'
import { showToast } from 'vant'
import { getStudyWordCardList, finishStudy } from '@/api/practise'
import { updateWordTranslation, updateWordPhrase, getWordPhraseDetail } from '@/api/dictionary'
import { getPracticeTagFilter } from '@/utils/practiceTagFilter'

import PracticeHeader from '@/components/practice/PracticeHeader.vue'
import LoaderOverlay from '@/components/practice/LoaderOverlay.vue'
import CompletionOverlay from '@/components/practice/CompletionOverlay.vue'
import ImageCarousel from '@/components/practice/ImageCarousel.vue'
import PhoneticDisplay from '@/components/practice/PhoneticDisplay.vue'
import ExampleCarousel from '@/components/practice/ExampleCarousel.vue'

import PictureModal from '@/components/dictionary/PictureModal.vue'
import ImageCropModal from '@/components/dictionary/ImageCropModal.vue'
import ImageSearchModal from '@/components/dictionary/ImageSearchModal.vue'
import TranslationEditModal from '@/components/dictionary/TranslationEditModal.vue'

import { useAudioPlayer } from '@/composables/useAudioPlayer'
import { useParsedExamples } from '@/composables/useParsedExamples'
import { useSwipeTouchControl } from '@/composables/useSwipeTouchControl'
import { useProgressLoader } from '@/composables/useProgressLoader'
import { usePracticeCards } from '@/composables/usePracticeCards'
import { useCardPictureEditor } from '@/composables/useCardPictureEditor'

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
  // setup 期一次性读 localStorage; 用户改了标签后会回到 Practice 再点进, 组件重新 mount
  loadParams: { count: 5, random: true, tag_ids: getPracticeTagFilter() },
  stopAudioFn: stopAudio,
})

const { parsedExamples } = useParsedExamples(currentCard)

// 图片编辑能力
const picEditor = useCardPictureEditor()

// 应用新图后，把数据回写到 currentCard，保证刷新看到
picEditor.setOnApplied((picIndex, newPath) => {
  if (currentCard.value && currentCard.value.picture) {
    currentCard.value.picture[picIndex] = newPath
  }
})

const onEditPicture = (index) => {
  picEditor.openEdit(currentCard.value, index)
}

// 释义编辑
const showTransEdit = ref(false)
const savingTrans = ref(false)

const openTransEdit = () => {
  if (!currentCard.value?.translation_items?.length) {
    showToast('该词条无可编辑的释义')
    return
  }
  showTransEdit.value = true
}

// POS 缩写→中文（用于本地拼接翻译刷新展示）
const POS_SW_MAP = {
  1: 'n.', 2: 'vt.', 3: 'vi.', 4: 'adv.', 5: 'adj.',
  6: 'prep.', 7: 'conj.', 8: 'interj.', 9: 'aux.', 10: 'pron.',
  11: 'num.', 12: 'art.', 13: 'aux.'
}

const rebuildTranslationStr = (items) => {
  return items
    .filter(i => (i.translation || '').trim())
    .map(i => `${i.pos_label || POS_SW_MAP[i.pos] || ''} ${i.translation}`.trim())
    .join('\n') + (items.some(i => i.translation) ? '\n' : '')
}

const onSaveTranslation = async (newItems) => {
  if (!currentCard.value) return
  savingTrans.value = true
  try {
    let resp
    if (currentCard.value.word_type === 1) {
      // 单词: 调批量更新接口
      const payload = newItems.map(i => ({
        word_pos_id: i.id,
        translation: i.translation
      }))
      resp = await updateWordTranslation(payload)
    } else {
      // 短语: 复用现有 UpdateWordPhrase, 先 fetch 详情拿其他字段
      const detail = await getWordPhraseDetail(currentCard.value.id)
      if (detail.code !== 0 || !detail.data) {
        showToast(detail.message || '获取短语详情失败')
        return
      }
      resp = await updateWordPhrase({
        id: currentCard.value.id,
        phrase: detail.data.phrase,
        translation: newItems[0].translation,
        pronunciation: detail.data.pronunciation,
        example: detail.data.example || [],
        picture: detail.data.picture || ''
      })
    }
    if (resp.code === 0) {
      // 本地刷新当前卡片
      currentCard.value.translation_items = newItems
      currentCard.value.translation = rebuildTranslationStr(newItems)
      showToast({ message: '释义已更新', type: 'success' })
      showTransEdit.value = false
    } else {
      showToast(resp.message || '保存失败')
    }
  } catch (e) {
    showToast('网络错误')
  } finally {
    savingTrans.value = false
  }
}

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
  --mode-color: #3DA5F4;
  --mode-color-light: #EAF4FE;
  --mode-gradient: linear-gradient(135deg, #EAF4FE 0%, #F6FAFF 50%, #ffffff 100%);
}

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
.edit-trans-btn:active {
  background: rgba(25, 137, 250, 0.15);
}
</style>
