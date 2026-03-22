import { computed } from 'vue'

/**
 * Parse heterogeneous example formats from card data.
 * @param {import('vue').Ref} currentCard - ref to the current card object
 * @returns {{ parsedExamples: import('vue').ComputedRef<Array<{example: string, translation: string}>> }}
 */
export function useParsedExamples(currentCard) {
  const parsedExamples = computed(() => {
    const card = currentCard.value
    if (!card) return []

    const collectFromItems = (items) => {
      const out = []
      for (const item of items) {
        let obj = null
        if (typeof item === 'string') {
          try {
            const parsed = JSON.parse(item)
            if (Array.isArray(parsed)) {
              out.push(...collectFromItems(parsed))
              continue
            } else if (parsed && typeof parsed === 'object') {
              obj = parsed
            }
          } catch (e) {
            // Non-JSON string, treat as plain text
          }
        } else if (typeof item === 'object' && item !== null) {
          obj = item
        }
        let exText = ''
        let exTrans = ''
        if (obj) {
          exText = obj.example || obj.sentence || obj.text || ''
          exTrans = obj.translation || obj.trans || obj.cn || obj.zh || ''
        } else if (typeof item === 'string') {
          exText = item
        }
        if (exText || exTrans) {
          out.push({ example: exText, translation: exTrans })
        }
      }
      return out
    }

    // 1) Prefer card.example
    if (card.example != null) {
      let items = []
      if (Array.isArray(card.example)) {
        items = card.example
      } else if (typeof card.example === 'string') {
        try {
          const parsed = JSON.parse(card.example)
          if (Array.isArray(parsed)) items = parsed
          else if (parsed && typeof parsed === 'object') items = [parsed]
          else items = [card.example]
        } catch (e) {
          items = [card.example]
        }
      } else if (typeof card.example === 'object') {
        items = [card.example]
      }
      const res = collectFromItems(items)
      if (res.length) return res
    }

    // 2) Fallback: collect from card.pos[].example
    if (Array.isArray(card.pos)) {
      const all = []
      for (const p of card.pos) {
        if (!p || p.example == null) continue
        if (Array.isArray(p.example)) {
          all.push(...p.example)
        } else {
          all.push(p.example)
        }
      }
      if (all.length) return collectFromItems(all)
    }

    return []
  })

  return { parsedExamples }
}
