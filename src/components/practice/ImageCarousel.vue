<template>
  <div class="section picture-section" v-if="pictures && pictures.length > 0">
    <h3 v-if="showTitle" class="section-title">图片</h3>
    <div class="picture-carousel">
      <van-swipe
        ref="swipeRef"
        :show-indicators="true"
        :loop="false"
        :touchable="touchable"
        :stop-propagation="false"
        :class="['image-swipe', { 'disable-pointer': disablePointer }]"
        @change="onSwipeChange"
      >
        <div v-if="disablePointer" class="swipe-mask"></div>
        <van-swipe-item v-for="(pic, idx) in pictures" :key="idx">
          <img :src="getResourceUrl(pic)" class="picture" alt="单词图片" />
        </van-swipe-item>
      </van-swipe>
      <div v-if="pictures.length > 1" class="below-controls">
        <button class="ctrl-btn" @click="prev"><van-icon name="arrow-left" /></button>
        <button class="ctrl-btn" @click="next"><van-icon name="arrow" /></button>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref } from 'vue'
import { getResourceUrl } from '@/utils/request'

const props = defineProps({
  pictures: { type: Array, default: () => [] },
  touchable: { type: Boolean, default: true },
  disablePointer: { type: Boolean, default: false },
  showTitle: { type: Boolean, default: true },
})

const emit = defineEmits(['change'])

const swipeRef = ref(null)
const activeIndex = ref(0)

const onSwipeChange = (index) => {
  activeIndex.value = Number(index) || 0
  emit('change', activeIndex.value)
}

const clamp = (idx, max) => Math.min(Math.max(idx, 0), max)

const prev = () => {
  const len = (props.pictures?.length || 0) - 1
  if (len < 1) return
  const idx = clamp(activeIndex.value - 1, len)
  swipeRef.value?.swipeTo?.(idx) || swipeRef.value?.prev?.()
}

const next = () => {
  const len = (props.pictures?.length || 0) - 1
  if (len < 1) return
  const idx = clamp(activeIndex.value + 1, len)
  swipeRef.value?.swipeTo?.(idx) || swipeRef.value?.next?.()
}

const swipeTo = (index) => {
  swipeRef.value?.swipeTo?.(index)
}

defineExpose({ prev, next, swipeTo })
</script>

<style lang="scss" scoped>
.section { margin-bottom: 20px; }
.section-title { font-size: 15px; color: #646566; margin-bottom: 12px; text-align: center; font-weight: 600; letter-spacing: 0.5px; }
.picture-carousel { position: relative; }
.image-swipe { width: 100%; height: 220px; background: #fff; border-radius: 12px; overflow: hidden; box-shadow: 0 2px 12px rgba(0,0,0,0.1); }
.picture { width: 100%; height: 100%; object-fit: cover; }
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
</style>
