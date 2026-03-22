<template>
  <Dictionary :defaultType="'word'" />
</template>
<script>
import Dictionary from './Dictionary.vue'
export default {
  name: 'DictionaryWords',
  components: { Dictionary }
}
</script>
