<template>
  <div class="practice-header" :style="{ background: gradient }">
    <div class="header-top">
      <div class="header-left" @click="$emit('back')">
        <svg class="back-icon" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
          <path d="M15 18L9 12L15 6" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
        </svg>
        <span>返回</span>
      </div>
      <div class="header-center">
        <h1>{{ title }}</h1>
        <p v-if="subtitle">{{ subtitle }}</p>
      </div>
      <div class="header-right">
        <span v-if="total > 0" class="progress-counter">{{ current }} / {{ total }}</span>
      </div>
    </div>
    <!-- Progress bar -->
    <div v-if="total > 0" class="header-progress">
      <div class="header-progress-fill" :style="{ width: progressPercent + '%' }"></div>
    </div>
  </div>
</template>

<script setup>
import { computed } from 'vue'

const props = defineProps({
  title: { type: String, required: true },
  subtitle: { type: String, default: '' },
  gradient: { type: String, default: 'linear-gradient(135deg, #1989fa 0%, #1976d2 100%)' },
  current: { type: Number, default: 0 },
  total: { type: Number, default: 0 },
})
defineEmits(['back'])

const progressPercent = computed(() => {
  if (props.total <= 0) return 0
  return Math.min(100, (props.current / props.total) * 100)
})
</script>

<style lang="scss" scoped>
.practice-header {
  color: white;
  position: relative;

  .header-top {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 14px 16px;
  }
  .header-left { display: flex; align-items: center; gap: 6px; cursor: pointer; min-width: 60px; }
  .back-icon { width: 20px; height: 20px; }
  .header-center { text-align: center; flex: 1; }
  .header-center h1 { font-size: 18px; margin: 0; font-weight: 700; letter-spacing: 0.5px; }
  .header-center p { font-size: 12px; margin: 2px 0 0; opacity: 0.85; }
  .header-right { min-width: 60px; text-align: right; }
  .progress-counter {
    font-size: 13px;
    font-weight: 600;
    opacity: 0.9;
    background: rgba(255,255,255,0.2);
    padding: 2px 10px;
    border-radius: 10px;
  }
}

.header-progress {
  height: 3px;
  background: rgba(255,255,255,0.25);
}
.header-progress-fill {
  height: 100%;
  background: rgba(255,255,255,0.85);
  transition: width 0.4s ease;
  border-radius: 0 2px 2px 0;
}
</style>
