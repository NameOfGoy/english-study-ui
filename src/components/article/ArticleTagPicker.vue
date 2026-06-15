<template>
  <div class="article-tag-picker">
    <div v-if="loading" class="atp-loading">
      <van-loading size="16" />
    </div>
    <template v-else>
      <div v-if="tags.length" class="atp-grid">
        <div
          v-for="t in tags"
          :key="t.id"
          class="atp-chip"
          :class="{ active: isSelected(t.id) }"
          :style="isSelected(t.id) ? { background: t.style || '#1989fa' } : {}"
          @click="toggle(t.id)"
        >
          {{ t.name }}
        </div>
      </div>
      <div v-else class="atp-empty">还没有标签，去词典创建一个吧</div>
    </template>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { getTagList } from '@/api/tag'

// 受控标签多选: 不落 localStorage(与 TagFilterBar 区分开), 纯 v-model.
const props = defineProps({
  modelValue: { type: Array, default: () => [] },
  multiple: { type: Boolean, default: true }
})
const emit = defineEmits(['update:modelValue'])

const tags = ref([])
const loading = ref(false)

const isSelected = (id) => props.modelValue.includes(id)

const toggle = (id) => {
  let next
  if (props.multiple) {
    next = props.modelValue.includes(id)
      ? props.modelValue.filter((x) => x !== id)
      : [...props.modelValue, id]
  } else {
    next = props.modelValue.includes(id) ? [] : [id]
  }
  emit('update:modelValue', next)
}

const load = async () => {
  loading.value = true
  try {
    const resp = await getTagList()
    if (resp.code === 0) tags.value = resp.data || []
  } catch (e) {
    // 失败已由拦截器 toast
  } finally {
    loading.value = false
  }
}

onMounted(load)
</script>

<style lang="scss" scoped>
.article-tag-picker {
  width: 100%;
}
.atp-loading {
  display: flex;
  justify-content: center;
  padding: 10px 0;
}
.atp-grid {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
}
.atp-chip {
  display: inline-flex;
  align-items: center;
  padding: 4px 10px;
  border-radius: 12px;
  background: #f2f3f5;
  color: #646566;
  font-size: 12px;
  transition: background 0.15s;

  &.active {
    color: #fff;
  }
}
.atp-empty {
  text-align: center;
  color: #969799;
  font-size: 13px;
  padding: 10px 0;
}
</style>
