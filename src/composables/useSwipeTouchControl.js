import { ref } from 'vue'

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
