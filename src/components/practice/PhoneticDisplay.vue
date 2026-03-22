<template>
  <div class="section phonetic-section">
    <div class="phonetic-line">
      <!-- word_type=2 (phrase): only show play button -->
      <template v-if="wordType === 2">
        <span v-if="ukAudio" class="phonetic-item">
          <van-button size="small" round type="primary" class="audio-btn" @click="$emit('play', 'uk')">
            <van-icon name="volume-o" :class="{ playing: playingType === 'uk' }" />
            <span class="btn-text">发音</span>
          </van-button>
        </span>
        <span v-else class="no-content">暂无发音</span>
      </template>
      <!-- word_type=1 (word): show full phonetics -->
      <template v-else>
        <span v-if="ukPhonetic" class="phonetic-item">
          <span class="label">英式：</span>
          <span class="value">{{ ukPhonetic }}</span>
          <van-button size="small" round type="primary" class="audio-btn" @click="$emit('play', 'uk')">
            <van-icon name="volume-o" :class="{ playing: playingType === 'uk' }" />
          </van-button>
        </span>
        <span v-if="usPhonetic" class="phonetic-item">
          <span class="label">美式：</span>
          <span class="value">{{ usPhonetic }}</span>
          <van-button size="small" round type="primary" class="audio-btn" @click="$emit('play', 'us')">
            <van-icon name="volume-o" :class="{ playing: playingType === 'us' }" />
          </van-button>
        </span>
        <span v-if="!ukPhonetic && !usPhonetic" class="no-content">暂无发音</span>
      </template>
    </div>
  </div>
</template>

<script setup>
defineProps({
  wordType: { type: Number, default: 1 },
  ukPhonetic: { type: String, default: '' },
  usPhonetic: { type: String, default: '' },
  ukAudio: { type: String, default: '' },
  usAudio: { type: String, default: '' },
  playingType: { type: String, default: null },
})
defineEmits(['play'])
</script>

<style lang="scss" scoped>
.section { margin-bottom: 20px; }
.phonetic-section { text-align: center; padding: 12px 0; }
.phonetic-line { display: inline-flex; gap: 20px; align-items: center; justify-content: center; flex-wrap: wrap; }
.phonetic-item { display: flex; align-items: center; gap: 8px; }
.phonetic-item .label { font-size: 13px; color: #646566; font-weight: 500; }
.phonetic-item .value { font-size: 16px; color: #323233; font-family: 'Times New Roman', serif; }
.audio-btn {
  display: inline-flex; align-items: center; gap: 4px;
  min-width: auto; padding: 6px 12px; height: 32px;
}
.audio-btn .btn-text { font-size: 12px; }
.audio-btn :deep(.van-icon) { font-size: 16px; }
.audio-btn :deep(.van-icon.playing) { color: #ff9800; animation: pulse 1s infinite; }
.no-content { text-align: center; color: #969799; font-size: 14px; }
@keyframes pulse {
  0%, 100% { transform: scale(1); }
  50% { transform: scale(1.1); }
}
</style>
