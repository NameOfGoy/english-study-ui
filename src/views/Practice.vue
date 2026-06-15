<template>
  <div class="practice-page"
       @touchstart="handleTouchStart"
       @touchmove="handleTouchMove"
       @touchend="handleTouchEnd">
    <!-- one slow-drifting orb — the single restrained accent gesture -->
    <div class="orb" aria-hidden="true"></div>

    <!-- ===== EDITORIAL HEADER ===== -->
    <header class="practice-header">
      <span class="eyebrow">PRACTICE&nbsp;HUB</span>
      <h1 class="page-title">练习<span class="accent">中心</span></h1>
      <p class="page-subtitle"><span class="rule" aria-hidden="true"></span>选择学习模式开始练习</p>
    </header>

    <!-- 内容区域 -->
    <div class="practice-content">
      <!-- 词语练习 -->
      <div class="section">
        <div class="section-head">
          <div class="section-title">词语练习</div>
          <div class="section-hint">标签筛选仅作用于下方四种词语练习</div>
        </div>

        <!-- 标签筛选 (仅作用于词语练习的四个模式, 持久化在 localStorage) -->
        <TagFilterBar />

        <div class="mode-grid">
          <!-- 学习 -->
          <div class="mode-card study" @click="enterMode('study')">
            <span class="mode-emblem" aria-hidden="true">📘</span>
            <div class="mode-body">
              <div class="mode-title">学习</div>
              <div class="mode-desc">进入学习模式，开始新单词的学习</div>
            </div>
            <button class="mode-btn primary">
              进入
              <svg viewBox="0 0 24 24" fill="none" aria-hidden="true">
                <path d="M5 12h13" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>
                <path d="M13 6.5 18.5 12 13 17.5" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
              </svg>
            </button>
          </div>

          <!-- 复习 -->
          <div class="mode-card review" @click="enterMode('review')">
            <span class="mode-emblem" aria-hidden="true">🔁</span>
            <div class="mode-body">
              <div class="mode-title">复习</div>
              <div class="mode-desc">巩固已学单词，提升记忆稳定性</div>
            </div>
            <button class="mode-btn primary">
              进入
              <svg viewBox="0 0 24 24" fill="none" aria-hidden="true">
                <path d="M5 12h13" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>
                <path d="M13 6.5 18.5 12 13 17.5" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
              </svg>
            </button>
          </div>

          <!-- 强化 -->
          <div class="mode-card strength" @click="enterMode('strength')">
            <span class="mode-emblem" aria-hidden="true">💪</span>
            <div class="mode-body">
              <div class="mode-title">强化</div>
              <div class="mode-desc">针对薄弱单词进行专注强化</div>
            </div>
            <button class="mode-btn primary">
              进入
              <svg viewBox="0 0 24 24" fill="none" aria-hidden="true">
                <path d="M5 12h13" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>
                <path d="M13 6.5 18.5 12 13 17.5" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
              </svg>
            </button>
          </div>

          <!-- 抽查 -->
          <div class="mode-card spot" @click="enterMode('spot')">
            <span class="mode-emblem" aria-hidden="true">🎯</span>
            <div class="mode-body">
              <div class="mode-title">抽查</div>
              <div class="mode-desc">随机抽查单词，检测学习效果</div>
            </div>
            <button class="mode-btn primary">
              进入
              <svg viewBox="0 0 24 24" fill="none" aria-hidden="true">
                <path d="M5 12h13" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>
                <path d="M13 6.5 18.5 12 13 17.5" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
              </svg>
            </button>
          </div>
        </div>
      </div>

      <!-- 文章练习 -->
      <div class="section">
        <div class="section-head">
          <div class="section-title">文章练习</div>
          <div class="section-hint">用你的词库生成场景小短文，在语境中记忆</div>
        </div>

        <div class="article-grid">
          <div class="mode-card article-instant" @click="enterArticle('instant')">
            <span class="mode-emblem" aria-hidden="true">⚡</span>
            <div class="mode-body">
              <div class="mode-title">即时文章</div>
              <div class="mode-desc">挑选词语，AI 即时生成一篇趣味短文</div>
            </div>
            <button class="mode-btn primary">
              进入
              <svg viewBox="0 0 24 24" fill="none" aria-hidden="true">
                <path d="M5 12h13" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>
                <path d="M13 6.5 18.5 12 13 17.5" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
              </svg>
            </button>
          </div>

          <div class="mode-card article-library" @click="enterArticle('library')">
            <span class="mode-emblem" aria-hidden="true">📚</span>
            <div class="mode-body">
              <div class="mode-title">收录文章</div>
              <div class="mode-desc">浏览已收录的文章，随时重温</div>
            </div>
            <button class="mode-btn primary">
              进入
              <svg viewBox="0 0 24 24" fill="none" aria-hidden="true">
                <path d="M5 12h13" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>
                <path d="M13 6.5 18.5 12 13 17.5" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
              </svg>
            </button>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import { showToast } from 'vant'
import TagFilterBar from '@/components/practice/TagFilterBar.vue'

export default {
  name: 'Practice',
  components: { TagFilterBar },
  setup() {
    const router = useRouter()
    const touchStartX = ref(0)
    const touchStartY = ref(0)
    const isSwipeGesture = ref(false)

    // 触摸开始
    const handleTouchStart = (e) => {
      touchStartX.value = e.touches[0].clientX
      touchStartY.value = e.touches[0].clientY
      isSwipeGesture.value = false
    }

    // 触摸移动
    const handleTouchMove = (e) => {
      if (!touchStartX.value) return

      const touchCurrentX = e.touches[0].clientX
      const touchCurrentY = e.touches[0].clientY
      const deltaX = touchCurrentX - touchStartX.value
      const deltaY = touchCurrentY - touchStartY.value

      // 判断是否为水平滑动（水平距离大于垂直距离）
      if (Math.abs(deltaX) > Math.abs(deltaY) && Math.abs(deltaX) > 30) {
        isSwipeGesture.value = true
        e.preventDefault() // 阻止默认滚动行为
      }
    }

    // 触摸结束
    const handleTouchEnd = (e) => {
      if (!touchStartX.value || !isSwipeGesture.value) return

      const touchEndX = e.changedTouches[0].clientX
      const deltaX = touchEndX - touchStartX.value
      const threshold = 80 // 滑动阈值

      // 左滑切换到词典页面
      if (deltaX < -threshold) {
        router.push('/dictionary')
      }

      // 重置状态
      touchStartX.value = 0
      touchStartY.value = 0
      isSwipeGesture.value = false
    }

    // 进入不同词语练习模式
    const enterMode = (mode) => {
      if (mode === 'study') {
        router.push('/practice/study')
      } else if (mode === 'review') {
        router.push('/practice/review')
      } else if (mode === 'strength') {
        router.push('/practice/strength')
      } else if (mode === 'spot') {
        router.push('/practice/spot')
      } else {
        showToast({ message: '功能开发中，敬请期待', type: 'primary' })
      }
    }

    // 进入文章练习
    const enterArticle = (kind) => {
      if (kind === 'instant') {
        router.push('/practice/article/instant')
      } else if (kind === 'library') {
        router.push('/practice/article/library')
      }
    }

    return {
      handleTouchStart,
      handleTouchMove,
      handleTouchEnd,
      enterMode,
      enterArticle
    }
  }
}
</script>

<style lang="scss" scoped>
/* ============================================================
   EDITORIAL — 练习中心 hub
   Cool-blue brand, oversized title + eyebrow, soft white es-cards
   with harmonized per-mode accent emblems. Page sits on the
   global wash (transparent bg). Hairline rhythm, layered shadows.
   ============================================================ */

/* slide transition hooks (kept for router/transition compatibility) */
.slide-enter-active { transition: all 0.35s cubic-bezier(0.23, 1, 0.32, 1); }
.slide-leave-active { transition: all 0.25s cubic-bezier(0.55, 0.085, 0.68, 0.53); }
.slide-enter-from { transform: translateX(100%); opacity: 0; filter: blur(2px); }
.slide-leave-to { transform: translateX(-100%); opacity: 0; filter: blur(2px); }
.slide-enter-to,
.slide-leave-from { transform: translateX(0); opacity: 1; filter: blur(0); }

.practice-page {
  position: relative;
  min-height: 100vh;
  /* let the global cool wash show through — no opaque flat gray */
  background: transparent;
  overflow-x: hidden;
  color: var(--es-ink);
}

/* one slow-drifting orb — the single restrained accent gesture */
.orb {
  position: absolute;
  top: -64px;
  right: -54px;
  width: 200px;
  height: 200px;
  border-radius: 50%;
  pointer-events: none;
  z-index: 0;
  opacity: .5;
  filter: blur(2px);
  background: radial-gradient(circle at 30% 30%, rgba(91, 200, 234, .34), rgba(61, 165, 244, .10) 62%, transparent 72%);
  animation: orbDrift 17s var(--es-ease) infinite alternate;
}
@keyframes orbDrift {
  from { transform: translate(0, 0) scale(1); }
  to   { transform: translate(-24px, 28px) scale(1.08); }
}

/* ===== editorial header ===== */
.practice-header {
  position: relative;
  z-index: 1;
  padding: clamp(34px, 8vh, 52px) 24px 18px;
}
.practice-header .eyebrow {
  display: inline-block;
  font-size: 11px;
  letter-spacing: .26em;
  text-transform: uppercase;
  font-weight: 600;
  color: var(--es-ink-3);
  margin-bottom: 14px;
}
.practice-header .page-title {
  font-size: clamp(34px, 11vw, 44px);
  line-height: 1.02;
  font-weight: 800;
  letter-spacing: -0.02em;
  color: var(--es-ink);
  margin-bottom: 14px;
}
.practice-header .page-title .accent {
  background: linear-gradient(120deg, var(--es-primary) 0%, var(--es-grad-b) 100%);
  -webkit-background-clip: text;
  background-clip: text;
  -webkit-text-fill-color: transparent;
  color: var(--es-primary);
}
.practice-header .page-subtitle {
  display: flex;
  align-items: center;
  gap: 12px;
  font-size: 14.5px;
  color: var(--es-ink-2);
  letter-spacing: .02em;
}
.practice-header .page-subtitle .rule {
  flex: 0 0 auto;
  width: 30px;
  height: 2px;
  border-radius: 2px;
  background: linear-gradient(90deg, var(--es-primary), var(--es-grad-b));
}

/* ===== content ===== */
.practice-content {
  position: relative;
  z-index: 1;
  padding: 8px 0 28px;

  .section {
    margin-bottom: 28px;
  }

  .section-head {
    padding: 0 24px;
    margin-bottom: 12px;
  }

  .section-title {
    display: flex;
    align-items: center;
    font-size: 12px;
    font-weight: 700;
    letter-spacing: .16em;
    text-transform: uppercase;
    color: var(--es-ink);

    &::before {
      content: '';
      display: inline-block;
      width: 18px;
      height: 2px;
      border-radius: 2px;
      background: linear-gradient(90deg, var(--es-primary), var(--es-grad-b));
      margin-right: 10px;
    }
  }

  .section-hint {
    font-size: 12.5px;
    color: var(--es-ink-3);
    letter-spacing: .01em;
    padding: 6px 0 0 28px;
  }

  .mode-grid,
  .article-grid {
    display: grid;
    grid-template-columns: repeat(2, 1fr);
    gap: 14px;
    padding: 4px 16px 0;
  }

  /* premium soft-white card with harmonized accent emblem */
  .mode-card {
    position: relative;
    display: flex;
    flex-direction: column;
    align-items: flex-start;
    min-height: 178px;
    padding: 18px 16px 16px;
    background: var(--es-surface);
    border-radius: var(--es-r-card);
    box-shadow: var(--es-shadow-card);
    cursor: pointer;
    overflow: hidden;
    transition: transform .22s var(--es-ease), box-shadow .25s var(--es-ease);

    /* left accent rail tinted per mode (--accent set on each variant) */
    &::before {
      content: '';
      position: absolute;
      top: 16px;
      bottom: 16px;
      left: 0;
      width: 3px;
      border-radius: 0 3px 3px 0;
      background: var(--accent, var(--es-primary));
      opacity: .9;
    }

    &:hover {
      transform: translateY(-2px);
      box-shadow: 0 22px 46px -20px rgba(20, 30, 50, .26), 0 1px 0 rgba(20, 30, 50, .03);
    }
    &:active { transform: translateY(0) scale(.992); }

    .mode-emblem {
      width: 44px;
      height: 44px;
      border-radius: 13px;
      display: grid;
      place-items: center;
      font-size: 22px;
      line-height: 1;
      /* soft tinted wash of the mode accent */
      background: color-mix(in srgb, var(--accent, var(--es-primary)) 14%, #fff);
      box-shadow: inset 0 0 0 1px color-mix(in srgb, var(--accent, var(--es-primary)) 22%, transparent);
    }

    .mode-body {
      flex: 1 1 auto;
      margin-top: 14px;
    }

    .mode-title {
      font-size: 18px;
      font-weight: 800;
      letter-spacing: -.01em;
      color: var(--es-ink);
    }
    .mode-desc {
      font-size: 12.5px;
      line-height: 1.45;
      color: var(--es-ink-2);
      margin-top: 6px;
    }

    .mode-btn {
      margin-top: 14px;
      width: 100%;
      height: 38px;
      border: 0;
      border-radius: var(--es-r-btn);
      font: inherit;
      font-size: 14px;
      font-weight: 700;
      letter-spacing: .08em;
      cursor: pointer;
      display: inline-flex;
      align-items: center;
      justify-content: center;
      gap: 7px;
      transition: filter .2s var(--es-ease), box-shadow .25s var(--es-ease);

      svg { width: 15px; height: 15px; }
    }

    /* accent-driven CTA: tinted ghost button that picks up the mode color */
    .mode-btn.primary {
      color: var(--accent, var(--es-primary));
      background: color-mix(in srgb, var(--accent, var(--es-primary)) 12%, #fff);
      box-shadow: inset 0 0 0 1px color-mix(in srgb, var(--accent, var(--es-primary)) 22%, transparent);
    }
    &:hover .mode-btn.primary {
      filter: saturate(1.05);
      box-shadow: inset 0 0 0 1px color-mix(in srgb, var(--accent, var(--es-primary)) 36%, transparent);
    }
    .mode-btn.disabled {
      color: var(--es-ink-3);
      background: var(--es-hair-soft);
      box-shadow: none;
      cursor: not-allowed;
    }
  }

  /* harmonized practice-mode accents */
  .mode-card.study    { --accent: #3DA5F4; }
  .mode-card.review   { --accent: #6C7BF0; }
  .mode-card.strength { --accent: #16C0CB; }
  .mode-card.spot     { --accent: #9B6DFF; }

  /* article entries — refined secondary pair, cool-blue family */
  .mode-card.article-instant { --accent: var(--es-primary); }
  .mode-card.article-library { --accent: var(--es-teal); }
}

@media (prefers-reduced-motion: reduce) {
  .orb { animation: none !important; }
  .mode-card { transition: none !important; }
}
</style>
