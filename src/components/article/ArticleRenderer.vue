<template>
  <div class="article-renderer" :class="{ 'has-archive': showArchive }">
    <!-- 头部: 标题 + 标签 -->
    <div class="ar-header">
      <h2 class="ar-title-en">{{ article.title_en }}</h2>
      <p v-if="article.title_zh" class="ar-title-zh">{{ article.title_zh }}</p>
      <div v-if="article.tags && article.tags.length" class="ar-tags">
        <span
          v-for="t in article.tags"
          :key="t.tag_id"
          class="ar-tag"
          :style="{ background: t.style || '#1989fa' }"
        >{{ t.name }}</span>
      </div>
    </div>

    <!-- 双语正文: 英文(含高亮可点) 上, 中文整句 下 -->
    <div class="ar-body">
      <div v-for="(s, i) in sentenceSegs" :key="i" class="ar-sentence">
        <p class="ar-en">
          <template v-for="(seg, j) in s.segs" :key="j">
            <span
              v-if="seg.word"
              class="ar-hl"
              @click="openBubble(seg, $event)"
            >{{ seg.text }}</span>
            <span v-else>{{ seg.text }}</span>
          </template>
        </p>
        <p v-if="s.zh" class="ar-zh">{{ s.zh }}</p>
      </div>
    </div>

    <!-- 收录 + 返回(仅即时文章) -->
    <div v-if="showArchive" class="ar-archive-bar">
      <van-button class="ar-back-btn" round @click="$emit('home')">返回练习</van-button>
      <van-button
        class="ar-archive-btn"
        type="primary"
        round
        :loading="archiving"
        :disabled="archived"
        @click="$emit('archive')"
      >{{ archived ? '已收录' : '收录这篇文章' }}</van-button>
    </div>

    <!-- 词语气泡卡(teleport 到 body, 避免被祖先 overflow 裁剪) -->
    <teleport to="body">
      <div v-if="bubble.visible" class="ar-bubble-overlay" @click="closeBubble"></div>
      <div
        v-if="bubble.visible"
        ref="bubbleRef"
        class="ar-bubble"
        :style="{ top: bubble.top + 'px', left: bubble.left + 'px' }"
      >
        <template v-if="bubble.senses && bubble.senses.length">
          <div v-for="(s, i) in bubble.senses" :key="i" class="bub-sense">
            <span v-if="s.pos_label" class="bub-pos">{{ s.pos_label }}</span>
            <span class="bub-val">{{ s.meaning }}</span>
          </div>
        </template>
        <div v-else class="bub-sense">
          <span class="bub-val">{{ bubble.found ? (bubble.meaning || '—') : '（词库中未找到）' }}</span>
        </div>
        <div class="bub-phon"><span class="bub-pos">音标</span><span class="bub-val">{{ bubble.phonetic || '—' }}</span></div>
      </div>
    </teleport>
  </div>
</template>

<script setup>
import { reactive, computed, ref, nextTick } from 'vue'
import { buildSegments, wordKey } from '@/utils/articleHighlight'

const props = defineProps({
  // { id, title_en, title_zh, tags:[{tag_id,name,style}], sentences:[{en,zh}],
  //   used_words:[{word_id,word_type,word,surfaces,pos_label,meaning,phonetic,found}] }
  article: { type: Object, required: true },
  showArchive: { type: Boolean, default: false },
  archiving: { type: Boolean, default: false },
  archived: { type: Boolean, default: false }
})
defineEmits(['archive', 'home'])

const bubbleRef = ref(null)
const bubble = reactive({ visible: false, top: 0, left: 0, posLabel: '', meaning: '', senses: [], phonetic: '', found: true })
let anchorRect = null

const wordMap = computed(() => {
  const map = {}
  for (const u of props.article.used_words || []) {
    map[wordKey(u.word, u.word_type)] = u
  }
  return map
})

const sentenceSegs = computed(() =>
  (props.article.sentences || []).map((s) => ({
    zh: s.zh,
    segs: buildSegments(s.en, props.article.used_words || [])
  }))
)

const openBubble = async (seg, ev) => {
  const info = wordMap.value[wordKey(seg.word, seg.type)] || {}
  bubble.posLabel = info.pos_label || ''
  bubble.meaning = info.meaning || ''
  bubble.senses = info.senses || []
  bubble.phonetic = info.phonetic || ''
  bubble.found = info.found !== false
  anchorRect = ev.currentTarget.getBoundingClientRect()
  bubble.visible = true
  await nextTick()
  positionBubble()
}

const positionBubble = () => {
  if (!anchorRect) return
  const el = bubbleRef.value
  const bw = el ? el.offsetWidth : 220
  const bh = el ? el.offsetHeight : 90
  const vw = window.innerWidth
  let left = anchorRect.left
  if (left + bw + 8 > vw) left = vw - bw - 8
  if (left < 8) left = 8
  // 优先上方, 不够则下方
  let top = anchorRect.top - bh - 8
  if (top < 8) top = anchorRect.bottom + 8
  bubble.left = left
  bubble.top = top
}

const closeBubble = () => {
  bubble.visible = false
}
</script>

<style lang="scss" scoped>
.article-renderer {
  padding: 16px;

  &.has-archive {
    padding-bottom: 90px; // 给固定收录栏留位
  }
}

.ar-header {
  margin-bottom: 16px;

  .ar-title-en {
    font-size: 20px;
    font-weight: 700;
    color: #323233;
    margin: 0;
    line-height: 1.4;
  }
  .ar-title-zh {
    font-size: 15px;
    color: #646566;
    margin: 4px 0 0;
  }
  .ar-tags {
    display: flex;
    flex-wrap: wrap;
    gap: 6px;
    margin-top: 10px;
  }
  .ar-tag {
    color: #fff;
    font-size: 12px;
    padding: 2px 10px;
    border-radius: 12px;
  }
}

.ar-body {
  .ar-sentence {
    margin-bottom: 14px;
  }
  .ar-en {
    font-size: 16px;
    line-height: 1.7;
    color: #323233;
    margin: 0;
    word-break: break-word;
  }
  .ar-hl {
    color: #1989fa;
    text-decoration: underline;
    text-underline-offset: 2px;
    cursor: pointer;
    &:active {
      background: rgba(25, 137, 250, 0.12);
    }
  }
  .ar-zh {
    font-size: 13px;
    color: #646566;
    margin: 4px 0 0;
    line-height: 1.6;
    word-break: break-word;
  }
}

.ar-archive-bar {
  position: fixed;
  left: 0;
  right: 0;
  bottom: 0;
  padding: 10px 16px calc(10px + env(safe-area-inset-bottom));
  background: #fff;
  box-shadow: 0 -2px 10px rgba(0, 0, 0, 0.06);
  z-index: 100;
  display: flex;
  align-items: center;
  gap: 12px;
}
.ar-back-btn {
  flex: 0 0 104px;
}
.ar-archive-btn {
  flex: 1;
}
</style>

<style lang="scss">
/* 气泡卡 teleport 到 body, 用全局样式(非 scoped) */
.ar-bubble-overlay {
  position: fixed;
  inset: 0;
  z-index: 2999;
  background: transparent;
}
.ar-bubble {
  position: fixed;
  z-index: 3000;
  width: 244px;
  max-width: calc(100vw - 16px);
  background: #fff;
  border-radius: 10px;
  box-shadow: 0 6px 24px rgba(0, 0, 0, 0.18);
  padding: 10px 12px;

  .bub-sense {
    display: flex;
    gap: 6px;
    font-size: 13px;
    line-height: 1.6;
    margin-bottom: 3px;
  }
  .bub-pos {
    color: #1989fa;
    flex: none;
    min-width: 28px;
    font-weight: 600;
  }
  .bub-phon {
    display: flex;
    gap: 6px;
    font-size: 13px;
    line-height: 1.6;
    margin-top: 4px;
    padding-top: 4px;
    border-top: 1px solid #f2f3f5;

    .bub-pos {
      color: #969799;
      font-weight: normal;
    }
  }
  .bub-val {
    color: #323233;
    flex: 1;
    word-break: break-word;
  }
}
</style>
