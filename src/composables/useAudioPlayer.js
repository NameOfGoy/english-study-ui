import { ref } from 'vue'
import { showToast } from 'vant'
import { getResourceUrl } from '@/utils/request'

export function useAudioPlayer() {
  const currentAudio = ref(null)
  const playingType = ref(null) // 'uk' | 'us' | null

  const stopAudio = () => {
    if (currentAudio.value) {
      try {
        currentAudio.value.pause()
        currentAudio.value.currentTime = 0
      } catch (e) {}
    }
    playingType.value = null
  }

  /**
   * Play audio by type. Accepts either a card object (reads uk_audio/us_audio)
   * or a direct URL string.
   */
  const playAudio = (type, cardOrUrl) => {
    let url
    if (typeof cardOrUrl === 'string') {
      url = cardOrUrl
    } else if (cardOrUrl) {
      const path = type === 'uk' ? cardOrUrl.uk_audio : cardOrUrl.us_audio
      if (!path) {
        showToast({ message: '暂无音频', type: 'fail' })
        return
      }
      url = getResourceUrl(path)
    } else {
      return
    }

    // Toggle off if same type is playing
    if (currentAudio.value && playingType.value === type && !currentAudio.value.paused) {
      stopAudio()
      return
    }

    stopAudio()
    try {
      currentAudio.value = new Audio(url)
      playingType.value = type
      currentAudio.value.play().catch(() => {
        showToast({ message: '音频播放失败', type: 'fail' })
        playingType.value = null
      })
      currentAudio.value.onended = () => {
        playingType.value = null
      }
      // Audio 元素自身的 error 事件 (网络 / 解码错误), 防止 UI 卡在"播放中"状态
      currentAudio.value.onerror = () => {
        playingType.value = null
      }
    } catch (e) {
      showToast({ message: '音频资源错误', type: 'fail' })
      playingType.value = null
    }
  }

  return { playingType, playAudio, stopAudio }
}
