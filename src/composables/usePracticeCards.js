import { ref, nextTick } from 'vue'
import { showToast } from 'vant'

/**
 * Shared card deck management: load cards, advance, finish.
 * @param {Object} options
 * @param {Function} options.loadApiFn - API function to load card list, receives params, returns { data: [...] }
 * @param {Function} options.finishApiFn - API function to finish a card, receives payload
 * @param {string} options.modeLabel - Display label for toasts (e.g. '复习', '学习')
 * @param {Object} [options.loadParams] - Default params for loadApiFn
 * @param {Function} [options.stopAudioFn] - Called when advancing cards
 */
export function usePracticeCards({ loadApiFn, finishApiFn, modeLabel, loadParams = {}, stopAudioFn }) {
  const wordCards = ref([])
  const currentIndex = ref(0)
  const currentCard = ref(null)
  const finishing = ref(false)
  const finishedAll = ref(false)
  const finishReason = ref('none') // 'empty' | 'completed' | 'none'
  const error = ref('')

  const loadCards = async (params) => {
    try {
      error.value = ''
      const response = await loadApiFn({ ...loadParams, ...params })
      const data = response.data
      if (data && data.length > 0) {
        wordCards.value = data
        currentIndex.value = 0
        currentCard.value = data[0]
        finishedAll.value = false
        finishReason.value = 'none'
      } else {
        finishedAll.value = true
        finishReason.value = 'empty'
        currentCard.value = null
      }
    } catch (e) {
      console.error(`加载${modeLabel}列表失败:`, e)
      error.value = '加载失败，请重试'
    }
  }

  const finishCard = async (operation) => {
    // 入口守卫: 双击仍可能在 disabled 状态生效前进来, 必须再 check 一次
    if (finishing.value || !currentCard.value) return
    try {
      finishing.value = true
      const rawWordType = Number(currentCard.value.word_type)
      const safeWordType = (rawWordType === 1 || rawWordType === 2) ? rawWordType : 1
      const payload = {
        word_id: currentCard.value.id,
        word_type: safeWordType,
        operation,
      }
      await finishApiFn(payload)

      if (currentIndex.value < wordCards.value.length - 1) {
        currentIndex.value += 1
        currentCard.value = wordCards.value[currentIndex.value]
        stopAudioFn?.()
        await nextTick()
        return 'next'
      } else {
        finishedAll.value = true
        finishReason.value = 'completed'
        currentCard.value = null
        stopAudioFn?.()
        return 'done'
      }
    } catch (e) {
      console.error(`完成${modeLabel}失败:`, e)
      showToast({ message: `完成${modeLabel}失败`, type: 'fail' })
      return 'error'
    } finally {
      finishing.value = false
    }
  }

  return {
    wordCards,
    currentIndex,
    currentCard,
    finishing,
    finishedAll,
    finishReason,
    error,
    loadCards,
    finishCard,
  }
}
