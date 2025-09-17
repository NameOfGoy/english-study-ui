<template>
  <div id="app">
    <!-- 主要内容区域 -->
    <div class="main-content" :class="{ 'with-tabbar': showTabbar }">
      <router-view />
    </div>
    
    <!-- 底部导航栏 -->
    <TabBar v-if="showTabbar" />
  </div>
</template>

<script>
import { computed, watch } from 'vue'
import { useRoute } from 'vue-router'
import TabBar from '@/components/TabBar.vue'

// 全局调试信息
console.log('🔥 App.vue 脚本开始执行', new Date().toLocaleTimeString())

export default {
  name: 'App',
  components: {
    TabBar
  },
  setup() {
    console.log('🎯 App setup() 函数开始执行')
    const route = useRoute()
    
    // 监听路由变化
    watch(() => route.path, (newPath) => {
      console.log('🚀 路由变化:', newPath)
    }, { immediate: true })
    
    // 计算是否显示底部导航栏
    const showTabbar = computed(() => {
      const show = route.meta.showTabbar
      console.log('📱 是否显示TabBar:', show, '当前路由:', route.path)
      return show
    })
    
    return {
      showTabbar
    }
  }
}
</script>

<style lang="scss">
#app {
  height: 100vh;
  display: flex;
  flex-direction: column;
  background-color: #f8f9fa;
}

.main-content {
  flex: 1;
  overflow-y: auto;
  
  &.with-tabbar {
    padding-bottom: 50px;
  }
}
</style>