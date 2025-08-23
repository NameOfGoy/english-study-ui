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
    
    // 根据当前路由设置激活的tab
    const setActiveTab = () => {
      const routeName = route.name
      if (routeName === 'Practice') {
        active.value = 'practice'
      } else if (routeName === 'Dictionary') {
        active.value = 'dictionary'
      } else if (routeName === 'Profile') {
        active.value = 'profile'
      }
    }
    
    // 监听路由变化
    watch(() => route.name, setActiveTab, { immediate: true })
    
    // tab切换事件
    const onChange = (name) => {
      active.value = name
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
  transition: all 0.3s ease;
  
  &.active {
    transform: scale(1.1);
  }
}

:deep(.van-tabbar) {
  background-color: #fff;
  border-top: 1px solid #ebedf0;
  box-shadow: 0 -2px 8px rgba(0, 0, 0, 0.08);
}

:deep(.van-tabbar-item) {
  font-size: 12px;
}

:deep(.van-tabbar-item--active) {
  color: #1989fa;
}
</style>