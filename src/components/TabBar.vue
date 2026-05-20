<template>
  <van-tabbar v-model="active" @change="onChange" fixed active-color="#1989fa" inactive-color="#969799">
    <van-tabbar-item name="dashboard" to="/dashboard">
      <template #icon="{ active }">
        <van-icon name="wap-home-o" class="tab-icon" :class="{ active }" />
      </template>
      首页
    </van-tabbar-item>

    <van-tabbar-item name="practice" to="/practice">
      <template #icon="{ active }">
        <van-icon name="bulb-o" class="tab-icon" :class="{ active }" />
      </template>
      练习
    </van-tabbar-item>

    <van-tabbar-item name="dictionary" to="/dictionary">
      <template #icon="{ active }">
        <van-icon name="notes-o" class="tab-icon" :class="{ active }" />
      </template>
      词典
    </van-tabbar-item>

    <van-tabbar-item name="profile" to="/profile">
      <template #icon="{ active }">
        <van-icon name="user-o" class="tab-icon" :class="{ active }" />
      </template>
      我的
    </van-tabbar-item>
  </van-tabbar>
</template>

<script>
import { ref, watch, computed } from 'vue'
import { useRoute, useRouter } from 'vue-router'

export default {
  name: 'TabBar',
  setup() {
    const route = useRoute()
    const router = useRouter()
    const active = ref('dashboard')

    const tabs = ['dashboard', 'practice', 'dictionary', 'profile']

    const activeIndex = computed(() => Math.max(0, tabs.indexOf(active.value)))

    // 监听路由变化
    watch(() => route.path, (newPath) => {
      let newActive = 'dashboard'
      if (newPath.startsWith('/dashboard')) {
        newActive = 'dashboard'
      } else if (newPath.startsWith('/practice')) {
        newActive = 'practice'
      } else if (newPath.startsWith('/dictionary')) {
        newActive = 'dictionary'
      } else if (newPath.startsWith('/profile')) {
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
      activeIndex,
      onChange
    }
  }
}
</script>

<style lang="scss" scoped>
.tab-icon {
  font-size: 22px;
  transition: all 0.3s cubic-bezier(0.25, 0.46, 0.45, 0.94);
  position: relative;
  z-index: 2;

  &.active {
    transform: scale(1.18) translateY(-2px);
    filter: drop-shadow(0 2px 6px rgba(25, 137, 250, 0.35));
  }
}

:deep(.van-tabbar) {
  background: rgba(255, 255, 255, 0.95);
  backdrop-filter: blur(12px);
  -webkit-backdrop-filter: blur(12px);
  box-shadow: 0 -2px 12px rgba(0, 0, 0, 0.06);
  border-top: 1px solid rgba(0, 0, 0, 0.04);
  position: fixed;
  overflow: hidden;
}

:deep(.van-tabbar-item) {
  font-size: 12px;
  transition: all 0.3s cubic-bezier(0.25, 0.46, 0.45, 0.94);

  .van-tabbar-item__text {
    transition: all 0.3s cubic-bezier(0.25, 0.46, 0.45, 0.94);
    position: relative;
    z-index: 2;
    margin-top: 2px;
  }

  &:not(.van-tabbar-item--active) {
    .tab-icon {
      transform: scale(1);
      opacity: 0.75;
    }

    .van-tabbar-item__text {
      opacity: 0.75;
    }
  }

  &:active {
    transform: scale(0.94);
  }
}

:deep(.van-tabbar-item--active) {
  .van-tabbar-item__text {
    font-weight: 600;
    transform: translateY(-1px);
  }

  &::before {
    content: '';
    position: absolute;
    top: 6px;
    left: 50%;
    width: 6px;
    height: 6px;
    background: #1989fa;
    border-radius: 50%;
    transform: translateX(-50%);
    animation: dotPop 0.32s cubic-bezier(0.34, 1.56, 0.64, 1);
    opacity: 0.9;
  }

  &::after {
    content: '';
    position: absolute;
    bottom: 8px;
    left: 50%;
    width: 36px;
    height: 36px;
    background: radial-gradient(circle, rgba(25, 137, 250, 0.12) 0%, transparent 70%);
    transform: translateX(-50%);
    border-radius: 50%;
    animation: ripple 0.6s ease-out;
    pointer-events: none;
  }
}

@keyframes dotPop {
  0%   { transform: translateX(-50%) scale(0); opacity: 0; }
  60%  { transform: translateX(-50%) scale(1.3); opacity: 1; }
  100% { transform: translateX(-50%) scale(1); opacity: 0.9; }
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
