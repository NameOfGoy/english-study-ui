<template>
  <div class="section example-section">
    <h3 class="section-title">例句</h3>
    <div v-if="examples.length > 0" class="example-carousel">
      <div v-if="disablePointer" class="swipe-mask"></div>
      <van-swipe
        ref="swipeRef"
        :show-indicators="true"
        :loop="false"
        :touchable="touchable"
        :stop-propagation="false"
        :class="['example-swipe', { 'disable-pointer': disablePointer }]"
      >
        <van-swipe-item v-for="(ex, idx) in examples" :key="idx">
          <div class="example-item">
            <div class="example-text">{{ ex.example }}</div>
            <div v-if="ex.translation" class="example-translation" v-text="ex.translation" />
          </div>
        </van-swipe-item>
      </van-swipe>
      <div v-if="examples.length > 1" class="below-controls">
        <button class="ctrl-btn" @click="prev"><van-icon name="arrow-left" /></button>
        <button class="ctrl-btn" @click="next"><van-icon name="arrow" /></button>
      </div>
    </div>
    <div v-else class="no-content">暂无例句</div>
  </div>
</template>

<script setup>
import { ref } from 'vue'

defineProps({
  examples: { type: Array, default: () => [] },
  touchable: { type: Boolean, default: true },
  disablePointer: { type: Boolean, default: false },
})

const swipeRef = ref(null)

const prev = () => swipeRef.value?.prev?.()
const next = () => swipeRef.value?.next?.()

defineExpose({ prev, next })
</script>

<style lang="scss" scoped>
.section { margin-bottom: 20px; }
.section-title { font-size: 15px; color: #646566; margin-bottom: 12px; text-align: center; font-weight: 600; letter-spacing: 0.5px; }
.example-carousel { position: relative; }
.example-swipe {
  width: 100%; min-height: 120px; background: #fff;
  border-radius: 12px; overflow: hidden; box-shadow: 0 2px 12px rgba(0,0,0,0.1);
}
.example-item { padding: 20px; display: flex; flex-direction: column; justify-content: center; min-height: 120px; }
.example-text { font-size: 16px; color: #323233; line-height: 1.7; margin-bottom: 12px; font-weight: 500; }
.example-translation { font-size: 14px; color: #646566; white-space: pre-line; line-height: 1.6; font-style: italic; }
.below-controls { display: flex; justify-content: center; gap: 8px; margin-top: 10px; }
.ctrl-btn {
  width: 36px; height: 36px; border-radius: 50%; border: none;
  background: rgba(0,0,0,0.6); color: #fff; font-size: 18px; cursor: pointer;
  transition: all 0.2s ease; display: flex; align-items: center; justify-content: center;
  padding: 0; line-height: 1; box-sizing: border-box;
}
.ctrl-btn .van-icon { font-size: 18px; line-height: 1; display: inline-block; }
.ctrl-btn:hover { background: rgba(0,0,0,0.8); transform: scale(1.1); }
.swipe-mask { position: absolute; inset: 0; z-index: 10; background: transparent; }
.disable-pointer { pointer-events: none; }
.no-content { text-align: center; color: #969799; font-size: 14px; padding: 20px; }
</style>
