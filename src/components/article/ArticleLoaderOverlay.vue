<template>
  <div v-if="visible" class="article-loader-overlay">
    <div class="alo-card">
      <van-loading vertical size="32">正在生成文章…</van-loading>
      <div class="alo-timer">{{ seconds }}s</div>
      <div v-if="seconds >= 20" class="alo-hint">生成较长文章可能需要 30~60 秒，请耐心等待</div>
    </div>
  </div>
</template>

<script setup>
defineProps({
  visible: { type: Boolean, default: false },
  seconds: { type: Number, default: 0 }
})
</script>

<style lang="scss" scoped>
.article-loader-overlay {
  position: fixed;
  inset: 0;
  z-index: 2000;
  display: flex;
  align-items: center;
  justify-content: center;
  background: rgba(0, 0, 0, 0.45);
}
.alo-card {
  background: #fff;
  border-radius: 14px;
  padding: 26px 32px;
  min-width: 180px;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 10px;
}
.alo-timer {
  font-size: 26px;
  font-weight: 700;
  color: #1989fa;
  font-variant-numeric: tabular-nums;
}
.alo-hint {
  font-size: 12px;
  color: #969799;
  text-align: center;
  max-width: 200px;
  line-height: 1.5;
}
</style>
