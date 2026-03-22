<template>
  <Dictionary :defaultType="'phrase'" />
</template>
<script>
import Dictionary from './Dictionary.vue'
export default {
  name: 'DictionaryPhrases',
  components: { Dictionary }
}
</script>
