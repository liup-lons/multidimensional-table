<script setup lang="ts">
import { onMounted } from 'vue'
import { useTableStore } from './store/table'
import { useThemeStore } from './store/theme'

const store = useTableStore()
const themeStore = useThemeStore()

onMounted(() => {
  store.initStore()
  themeStore.initTheme()
})
</script>

<template>
  <router-view />
</template>

<style scoped>
</style>