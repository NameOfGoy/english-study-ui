<template>
  <van-tabbar v-model="active" @change="onChange" fixed>
    <van-tabbar-item name="practice" to="/practice">
      <template #icon="{ active }">
        <img class="tab-icon" :class="{ active }" 
             :src="active ? practiceActiveIcon : practiceIcon" 
             alt="练习" />
      </template>
      练习
    </van-tabbar-item>
    
    <van-tabbar-item name="dictionary" to="/dictionary">
      <template #icon="{ active }">
        <img class="tab-icon" :class="{ active }" 
             :src="active ? dictionaryActiveIcon : dictionaryIcon" 
             alt="词典" />
      </template>
      词典
    </van-tabbar-item>
    
    <van-tabbar-item name="profile" to="/profile">
      <template #icon="{ active }">
        <img class="tab-icon" :class="{ active }" 
             :src="active ? profileActiveIcon : profileIcon" 
             alt="我的" />
      </template>
      我的
    </van-tabbar-item>
  </van-tabbar>
</template>

<script>
import { ref, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'

// 导入图标资源
import practiceIcon from '@/images/tab/practice.jpg'
import practiceActiveIcon from '@/images/tab/practice_active.jpg'
import dictionaryIcon from '@/images/tab/dictionary.png'
import dictionaryActiveIcon from '@/images/tab/dictionary_active.png'
import profileIcon from '@/images/tab/profile.png'
import profileActiveIcon from '@/images/tab/profile_active.png'

export default {
  name: 'TabBar',
  setup() {
    const route = useRoute()
    const router = useRouter()
    const active = ref('practice')

    // 监听路由变化
    watch(() => route.path, (newPath) => {
      let newActive = 'practice'
      if (newPath === '/practice') {
        newActive = 'practice'
      } else if (newPath === '/dictionary') {
        newActive = 'dictionary'
      } else if (newPath === '/profile') {
        newActive = 'profile'
      }
      active.value = newActive
    }, { immediate: true })

    const onChange = (name) => {
      active.value = name
      router.push(`/${name}`)
    }

    return {
      active,
      onChange,
      practiceIcon,
      practiceActiveIcon,
      dictionaryIcon,
      dictionaryActiveIcon,
      profileIcon,
      profileActiveIcon
    }
  }
}
</script>

<style lang="scss" scoped>
.tab-icon {
  width: 24px;
  height: 24px;
  transition: all 0.3s cubic-bezier(0.25, 0.46, 0.45, 0.94);
  position: relative;
  z-index: 2;
  
  &.active {
    transform: scale(1.15) translateY(-2px);
    filter: drop-shadow(0 2px 4px rgba(76, 175, 80, 0.3));
  }
}

:deep(.van-tabbar) {
  background: white;
  box-shadow: 0 -2px 8px rgba(0, 0, 0, 0.1);
  border-top: 1px solid #eee;
  position: relative;
  overflow: hidden;
  
  &::before {
    content: '';
    position: absolute;
    top: 0;
    left: 0;
    width: 33.33%;
    height: 3px;
    background: linear-gradient(90deg, #4CAF50, #45a049);
    transform: translateX(calc(var(--active-index, 0) * 100%));
    transition: transform 0.3s cubic-bezier(0.25, 0.46, 0.45, 0.94);
    z-index: 1;
  }
}

:deep(.van-tabbar-item) {
  font-size: 12px;
  position: relative;
  transition: all 0.3s cubic-bezier(0.25, 0.46, 0.45, 0.94);
  
  .van-tabbar-item__text {
    transition: all 0.3s cubic-bezier(0.25, 0.46, 0.45, 0.94);
    position: relative;
    z-index: 2;
  }
  
  &:not(.van-tabbar-item--active) {
    .tab-icon {
      transform: scale(1);
      opacity: 0.7;
    }
    
    .van-tabbar-item__text {
      opacity: 0.7;
    }
  }
  
  &:active {
    transform: scale(0.95);
  }
}

:deep(.van-tabbar-item--active) {
  color: #1989fa;
  
  .van-tabbar-item__text {
    font-weight: 600;
    transform: translateY(-1px);
  }
  
  &::after {
    content: '';
    position: absolute;
    bottom: 0;
    left: 50%;
    width: 40px;
    height: 40px;
    background: radial-gradient(circle, rgba(76, 175, 80, 0.1) 0%, transparent 70%);
    transform: translateX(-50%);
    border-radius: 50%;
    animation: ripple 0.6s ease-out;
  }
}

@keyframes ripple {
  0% {
    transform: translateX(-50%) scale(0);
    opacity: 1;
  }
  100% {
    transform: translateX(-50%) scale(1);
    opacity: 0;
  }
}
</style>