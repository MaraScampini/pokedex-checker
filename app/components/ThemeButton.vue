<script setup lang="ts">
const { theme, toggle } = useTheme()
</script>

<template>
  <button
    type="button"
    class="btn icon"
    :aria-label="theme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'"
    :title="theme === 'dark' ? 'Light mode' : 'Dark mode'"
    @click="toggle"
  >
    {{ theme === 'dark' ? '☀' : '☾' }}
  </button>
</template>
