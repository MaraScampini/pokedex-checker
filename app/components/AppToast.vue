<script setup lang="ts">
const { toast, hide } = useToast()
function run() {
  toast.value?.action?.run()
  hide()
}
</script>

<template>
  <div v-if="toast" class="toast" :class="{ error: toast.kind === 'error' }" role="status">
    <span>{{ toast.message }}</span>
    <button v-if="toast.action" class="toast-action" type="button" @click="run">{{ toast.action.label }}</button>
  </div>
</template>

<style scoped>
.toast { display: flex; align-items: center; gap: 12px; }
.toast span { flex: 1; }
.toast-action { background: none; border: 0; color: inherit; font-weight: 700; text-decoration: underline; padding: 4px; }
</style>
