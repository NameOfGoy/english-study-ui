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
import { computed } from 'vue'
import { useRoute } from 'vue-router'
import TabBar from '@/components/TabBar.vue'

export default {
  name: 'App',
  components: {
    TabBar
  },
  setup() {
    const route = useRoute()
    const showTabbar = computed(() => route.meta.showTabbar)
    return { showTabbar }
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