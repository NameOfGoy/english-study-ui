import { ref, onMounted, onBeforeUnmount } from 'vue'

/**
 * Touch gesture control for distinguishing vertical scroll from horizontal swipe.
 * Prevents van-swipe carousels from capturing vertical scrolls on iOS Safari.
 */
export function useSwipeTouchControl() {
  const imageSwipeTouchable = ref(true)
  const exampleSwipeTouchable = ref(true)
  const disableSwipePointer = ref(false)
  const touchStartX = ref(0)
  const touchStartY = ref(0)

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

  const resetTouch = () => {
    imageSwipeTouchable.value = true
    exampleSwipeTouchable.value = true
    touchStartX.value = 0
    touchStartY.value = 0
    disableSwipePointer.value = false
  }

  const handleCardTouchEnd = () => resetTouch()
  const handleCardTouchCancel = () => resetTouch()

  // 修复微信 iOS WebView 切回聊天再回前台后, touchend/touchcancel 不再 fire,
  // 导致 disableSwipePointer/imageSwipeTouchable 停留在垂直滚动期间的"受限态",
  // 表现为某些区域 pointer-events 卡住. 回前台时强制 reset.
  const onVisibility = () => {
    if (typeof document !== 'undefined' && document.visibilityState === 'visible') {
      resetTouch()
    }
  }
  onMounted(() => {
    if (typeof document !== 'undefined') {
      document.addEventListener('visibilitychange', onVisibility)
    }
  })
  onBeforeUnmount(() => {
    if (typeof document !== 'undefined') {
      document.removeEventListener('visibilitychange', onVisibility)
    }
  })

  return {
    imageSwipeTouchable,
    exampleSwipeTouchable,
    disableSwipePointer,
    handleCardTouchStart,
    handleCardTouchMove,
    handleCardTouchEnd,
    handleCardTouchCancel,
  }
}
