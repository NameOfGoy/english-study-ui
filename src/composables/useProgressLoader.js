import { ref, onUnmounted, getCurrentInstance } from 'vue'

/**
 * Fake progress bar animation: quickly fills to 80%, then jumps to 100% on complete.
 * 修复：
 *  - showLoader 初始 false，避免冷渲染闪一下
 *  - 组件卸载时 clearInterval + clearTimeout，防止在已销毁的组件上 set ref.value
 */
export function useProgressLoader() {
  const showLoader = ref(false)
  const progress = ref(0)
  let timer = null
  let hideTimer = null

  const stopAll = () => {
    if (timer !== null) {
      clearInterval(timer)
      timer = null
    }
    if (hideTimer !== null) {
      clearTimeout(hideTimer)
      hideTimer = null
    }
  }

  const startProgress = () => {
    showLoader.value = true
    progress.value = 0
    stopAll()
    const duration = 1000
    const steps = 50
    const stepTime = duration / steps
    const increment = 80 / steps
    timer = setInterval(() => {
      progress.value = Math.min(80, Math.floor(progress.value + increment))
      if (progress.value >= 80) {
        clearInterval(timer)
        timer = null
      }
    }, stepTime)
  }

  const completeProgress = (hideDelay = 500) => {
    if (timer !== null) {
      clearInterval(timer)
      timer = null
    }
    progress.value = 100
    if (hideTimer !== null) {
      clearTimeout(hideTimer)
    }
    hideTimer = setTimeout(() => {
      showLoader.value = false
      hideTimer = null
    }, hideDelay)
  }

  // 仅在 Vue 组件 setup 上下文里挂 onUnmounted；放在普通函数里调用不会注册
  if (getCurrentInstance()) {
    onUnmounted(stopAll)
  }

  return { showLoader, progress, startProgress, completeProgress }
}
