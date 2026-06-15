import { ref, onUnmounted } from 'vue'

// 真实经过秒数计时(用于同步生成时给用户的耗时反馈), 区别于 useProgressLoader 的假进度.
export function useElapsedTimer() {
  const seconds = ref(0)
  const running = ref(false)
  let timer = null

  const clear = () => {
    if (timer) {
      clearInterval(timer)
      timer = null
    }
  }

  const start = () => {
    seconds.value = 0
    running.value = true
    clear()
    timer = setInterval(() => {
      seconds.value += 1
    }, 1000)
  }

  const stop = () => {
    running.value = false
    clear()
  }

  onUnmounted(clear)

  return { seconds, running, start, stop }
}
