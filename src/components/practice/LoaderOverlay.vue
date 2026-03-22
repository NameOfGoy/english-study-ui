<template>
  <div v-if="visible" class="loader-overlay">
    <div class="loader-content">
      <van-loading size="24px" vertical>正在加载单词卡片...</van-loading>
      <div class="progress-wrap">
        <van-progress :percentage="progress" stroke-width="8" pivot-text="" />
        <div class="progress-text">{{ progress }}%</div>
      </div>
    </div>
  </div>
</template>

<script setup>
defineProps({
  visible: { type: Boolean, default: false },
  progress: { type: Number, default: 0 },
})
</script>

<style lang="scss" scoped>
.loader-overlay {
  position: fixed; inset: 0;
  background: rgba(255,255,255,0.9);
  display: flex; align-items: center; justify-content: center;
  z-index: 999;
}
.loader-content { width: 80%; max-width: 420px; text-align: center; }
.progress-wrap { margin-top: 16px; }
.progress-text { margin-top: 8px; font-size: 14px; color: #646566; }
</style>
