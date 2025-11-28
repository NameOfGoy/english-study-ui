<template>
  <div class="practice-page" 
       @touchstart="handleTouchStart" 
       @touchmove="handleTouchMove" 
       @touchend="handleTouchEnd">
      <!-- 头部 -->
      <div class="practice-header">
        <h1 class="page-title">英语练习</h1>
        <p class="page-subtitle">选择学习模式开始练习</p>
      </div>
      
      <!-- 内容区域 -->
      <div class="practice-content">
        <div class="mode-grid">
          <!-- 学习 -->
          <div class="mode-card study" @click="enterMode('study')">
            <div class="mode-icon">📘</div>
            <div class="mode-title">学习</div>
            <div class="mode-desc">进入学习模式，开始新单词的学习</div>
            <button class="mode-btn primary">进入</button>
          </div>

          <!-- 复习 -->
          <div class="mode-card review" @click="enterMode('review')">
            <div class="mode-icon">🔁</div>
            <div class="mode-title">复习</div>
            <div class="mode-desc">巩固已学单词，提升记忆稳定性</div>
            <button class="mode-btn primary">进入</button>
          </div>

          <!-- 强化 -->
          <div class="mode-card strength" @click="enterMode('strength')">
            <div class="mode-icon">💪</div>
            <div class="mode-title">强化</div>
            <div class="mode-desc">针对薄弱单词进行专注强化</div>
            <button class="mode-btn primary">进入</button>
          </div>

          <!-- 抽查 -->
          <div class="mode-card spot" @click="enterMode('spot')">
            <div class="mode-icon">🎯</div>
            <div class="mode-title">抽查</div>
            <div class="mode-desc">随机抽查单词，检测学习效果</div>
            <button class="mode-btn primary">进入</button>
          </div>
        </div>
      </div>
  </div>
</template>

<script>
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import { showToast } from 'vant'

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

    // 进入不同练习模式
    const enterMode = (mode) => {
      if (mode === 'study') {
        router.push('/practice/study')
      } else if (mode === 'review') {
        router.push('/practice/review')
      } else if (mode === 'strength') {
        router.push('/practice/strength')
      } else if (mode === 'spot') {
        router.push('/practice/spot')
      } else {
        showToast({ message: '功能开发中，敬请期待', type: 'primary' })
      }
    }
    
    return {
      handleTouchStart,
      handleTouchMove,
      handleTouchEnd,
      enterMode
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

  .mode-grid {
    display: grid;
    grid-template-columns: repeat(2, 1fr);
    gap: 16px;
  }

  .mode-card {
    background: white;
    border-radius: 16px;
    padding: 16px;
    box-shadow: 0 8px 24px rgba(0,0,0,0.08);
    text-align: center;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: space-between;
    min-height: 160px;
    cursor: pointer;
    transition: transform 0.2s ease, box-shadow 0.2s ease;

    &:hover { transform: translateY(-2px); box-shadow: 0 10px 28px rgba(0,0,0,0.1); }

    .mode-icon { font-size: 28px; }
    .mode-title { font-size: 18px; font-weight: 700; color: #323233; margin-top: 8px; }
    .mode-desc { font-size: 13px; color: #646566; margin-top: 4px; }

    .mode-btn {
      margin-top: 12px;
      width: 100%;
      height: 36px;
      border-radius: 18px;
      border: none;
      font-weight: 600;
      cursor: pointer;
    }

    .mode-btn.primary { background: linear-gradient(135deg, #1989fa 0%, #1976d2 100%); color: white; }
    .mode-btn.disabled { background: #f0f0f0; color: #969799; cursor: not-allowed; }
  }
}
</style>
