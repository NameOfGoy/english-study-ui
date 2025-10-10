<template>
  <transition name="slide" appear>
    <div class="practice-page" 
         @touchstart="handleTouchStart" 
         @touchmove="handleTouchMove" 
         @touchend="handleTouchEnd">
      <!-- 头部 -->
      <div class="practice-header">
        <h1 class="page-title">英语练习</h1>
        <p class="page-subtitle">提升你的英语水平</p>
      </div>
      
      <!-- 内容区域 -->
      <div class="practice-content">
        <div class="coming-soon">
          <div class="icon">
            <svg width="80" height="80" viewBox="0 0 80 80" fill="none">
              <circle cx="40" cy="40" r="35" stroke="#1989fa" stroke-width="3" fill="none"/>
              <path d="M25 40L35 50L55 30" stroke="#1989fa" stroke-width="3" fill="none"/>
            </svg>
          </div>
          <h2>功能开发中</h2>
          <p>练习功能正在紧张开发中，敬请期待！</p>
        </div>
      </div>
    </div>
  </transition>
</template>

<script>
import { ref } from 'vue'
import { useRouter } from 'vue-router'

export default {
  name: 'Practice',
  setup() {
    const router = useRouter()
    const touchStartX = ref(0)
    const touchStartY = ref(0)
    const isSwipeGesture = ref(false)
    
    // 触摸开始
    const handleTouchStart = (e) => {
      touchStartX.value = e.touches[0].clientX
      touchStartY.value = e.touches[0].clientY
      isSwipeGesture.value = false
    }
    
    // 触摸移动
    const handleTouchMove = (e) => {
      if (!touchStartX.value) return
      
      const touchCurrentX = e.touches[0].clientX
      const touchCurrentY = e.touches[0].clientY
      const deltaX = touchCurrentX - touchStartX.value
      const deltaY = touchCurrentY - touchStartY.value
      
      // 判断是否为水平滑动（水平距离大于垂直距离）
      if (Math.abs(deltaX) > Math.abs(deltaY) && Math.abs(deltaX) > 30) {
        isSwipeGesture.value = true
        e.preventDefault() // 阻止默认滚动行为
      }
    }
    
    // 触摸结束
    const handleTouchEnd = (e) => {
      if (!touchStartX.value || !isSwipeGesture.value) return
      
      const touchEndX = e.changedTouches[0].clientX
      const deltaX = touchEndX - touchStartX.value
      const threshold = 80 // 滑动阈值
      
      // 左滑切换到词典页面
      if (deltaX < -threshold) {
        router.push('/dictionary')
      }
      
      // 重置状态
      touchStartX.value = 0
      touchStartY.value = 0
      isSwipeGesture.value = false
    }
    
    return {
      handleTouchStart,
      handleTouchMove,
      handleTouchEnd
    }
  }
}
</script>

<style lang="scss" scoped>
/* 滑动动画 */
.slide-enter-active {
  transition: all 0.35s cubic-bezier(0.23, 1, 0.32, 1);
}

.slide-leave-active {
  transition: all 0.25s cubic-bezier(0.55, 0.085, 0.68, 0.53);
}

.slide-enter-from {
  transform: translateX(100%);
  opacity: 0;
  filter: blur(2px);
}

.slide-leave-to {
  transform: translateX(-100%);
  opacity: 0;
  filter: blur(2px);
}

.slide-enter-to,
.slide-leave-from {
  transform: translateX(0);
  opacity: 1;
  filter: blur(0);
}

.practice-page {
  min-height: 100vh;
  background-color: #f8f9fa;
  position: relative;
  overflow-x: hidden;
}

.practice-header {
  background: linear-gradient(135deg, #1989fa 0%, #1976d2 100%);
  padding: 40px 20px 30px;
  text-align: center;
  color: white;
  
  .page-title {
    font-size: 24px;
    font-weight: bold;
    margin-bottom: 8px;
  }
  
  .page-subtitle {
    font-size: 14px;
    opacity: 0.9;
  }
}

.practice-content {
  padding: 40px 20px;
  
  .coming-soon {
    text-align: center;
    padding: 60px 20px;
    
    .icon {
      margin-bottom: 24px;
    }
    
    h2 {
      font-size: 20px;
      color: #323233;
      margin-bottom: 12px;
    }
    
    p {
      font-size: 14px;
      color: #646566;
      line-height: 1.5;
    }
  }
}
</style>