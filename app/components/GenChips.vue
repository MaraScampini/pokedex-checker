<script setup lang="ts">
import { GENS } from '~~/shared/gens'
defineProps<{ current: number }>()
defineEmits<{ pick: [id: number] }>()
</script>

<template>
  <nav class="gens" aria-label="Generation">
    <button
      v-for="g in GENS"
      :key="g.id"
      type="button"
      class="chip"
      :class="{ on: g.id === current }"
      :aria-pressed="g.id === current"
      @click="$emit('pick', g.id)"
    >
      <b>{{ g.roman }}</b><small>{{ g.region }}</small>
    </button>
  </nav>
</template>
