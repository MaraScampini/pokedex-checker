<script setup lang="ts">
import { GENS } from '~~/shared/gens'
defineProps<{ current: number; all?: boolean }>()
defineEmits<{ pick: [id: number] }>()
</script>

<template>
  <nav class="gens" aria-label="Generation">
    <button
      v-if="all"
      type="button"
      class="chip"
      :class="{ on: current === 0 }"
      :aria-pressed="current === 0"
      @click="$emit('pick', 0)"
    >
      <b>All</b><small>I–IX</small>
    </button>
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
