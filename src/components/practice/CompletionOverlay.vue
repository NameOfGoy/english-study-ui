<template>
  <div v-if="visible" class="completion-overlay">
    <div class="completion-card">
      <!-- Trophy icon for completed, info icon for empty -->
      <div class="trophy" v-if="finishReason === 'completed'">
        <svg viewBox="0 0 64 64" xmlns="http://www.w3.org/2000/svg">
          <path d="M16 12h32v8c0 8.837-7.163 16-16 16s-16-7.163-16-16v-8z" fill="#ffc107"/>
          <path d="M20 12H12c0 8 6 14 12 14V12zM44 12h8c0 8-6 14-12 14V12z" fill="#ffab00"/>
          <rect x="28" y="36" width="8" height="10" rx="2" fill="#795548"/>
          <rect x="22" y="46" width="20" height="6" rx="3" fill="#a1887f"/>
        </svg>
      </div>
      <div class="trophy" v-else>
        <svg viewBox="0 0 64 64" xmlns="http://www.w3.org/2000/svg">
          <circle cx="32" cy="32" r="20" fill="#e0f2fe"/>
          <text x="32" y="38" text-anchor="middle" font-size="24" fill="#1976d2">i</text>
        </svg>
      </div>

      <h2 class="completion-title">{{ finishReason === 'empty' ? emptyTitle : completedTitle }}</h2>
      <p class="completion-sub">
        <span v-if="finishReason === 'completed'">{{ completedSub }}</span>
        <span v-else>{{ emptySub }}</span>
      </p>
      <div class="completion-stats" v-if="finishReason === 'completed'">
        本次共{{ modeLabel }} <span class="number">{{ count }}</span> 个{{ wordLabel }}
      </div>
      <div class="completion-stats" v-else>
        当前{{ modeLabel }}列表为空
      </div>
      <div class="completion-actions">
        <van-button type="primary" round block @click="$emit('go-back')">返回练习主页</van-button>
        <van-button v-if="finishReason === 'completed'" type="success" round block @click="$emit('reload')">再来一组</van-button>
      </div>
    </div>
    <div class="confetti" v-if="finishReason === 'completed'">
      <span v-for="n in 20" :key="n" class="piece" :style="{ left: (n*5)%100 + '%', animationDelay: (n*0.05)+'s', backgroundColor: n%2 ? '#ff6b6b' : '#4ecdc4' }"></span>
    </div>
  </div>
</template>

<script setup>
defineProps({
  visible: { type: Boolean, default: false },
  finishReason: { type: String, default: 'none' }, // 'empty' | 'completed'
  count: { type: Number, default: 0 },
  modeLabel: { type: String, default: '练习' },     // e.g. '学习', '复习', '强化', '抽查'
  wordLabel: { type: String, default: '单词' },
  emptyTitle: { type: String, default: '当前已没有需要练习的单词' },
  completedTitle: { type: String, default: '本次练习完成！' },
  emptySub: { type: String, default: '当前任务已清空，可稍后再来或切换模式' },
  completedSub: { type: String, default: '恭喜你，坚持完成了本次练习' },
})

defineEmits(['go-back', 'reload'])
</script>

<style lang="scss" scoped>
.completion-overlay {
  position: fixed;
  inset: 0;
  background: rgba(255,255,255,0.95);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
}
.completion-card {
  background: white;
  border-radius: 16px;
  padding: 24px;
  text-align: center;
  box-shadow: 0 8px 32px rgba(0,0,0,0.1);
  max-width: 320px;
  width: 90%;
}
.trophy { width: 80px; height: 80px; margin: 0 auto 16px; }
.trophy svg { width: 100%; height: 100%; }
.completion-title { font-size: 20px; font-weight: 700; color: #334155; margin: 6px 0; }
.completion-sub { font-size: 14px; color: #64748b; margin-bottom: 10px; }
.completion-stats { font-size: 14px; color: #475569; margin-bottom: 16px; }
.completion-stats .number { font-weight: 700; color: #ff9800; }
.completion-actions { display: flex; flex-direction: column; gap: 8px; }
.confetti { position: fixed; inset: 0; pointer-events: none; z-index: 999; }
.piece { position: absolute; width: 8px; height: 8px; animation: confetti-fall 3s linear infinite; }
@keyframes confetti-fall {
  0% { transform: translateY(-100vh) rotate(0deg); opacity: 1; }
  100% { transform: translateY(100vh) rotate(720deg); opacity: 0; }
}
</style>
