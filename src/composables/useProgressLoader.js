import { ref } from 'vue'

/**
 * Fake progress bar animation: quickly fills to 80%, then jumps to 100% on complete.
 */
export function useProgressLoader() {
  const showLoader = ref(true)
  const progress = ref(0)
  let timer = null

  const startProgress = () => {
    showLoader.value = true
    progress.value = 0
    clearInterval(timer)
    const duration = 1000
    const steps = 50
    const stepTime = duration / steps
    const increment = 80 / steps
    timer = setInterval(() => {
      progress.value = Math.min(80, Math.floor(progress.value + increment))
      if (progress.value >= 80) {
        clearInterval(timer)
      }
    }, stepTime)
  }

  const completeProgress = (hideDelay = 500) => {
    clearInterval(timer)
    progress.value = 100
    setTimeout(() => {
      showLoader.value = false
    }, hideDelay)
  }

  return { showLoader, progress, startProgress, completeProgress }
}
