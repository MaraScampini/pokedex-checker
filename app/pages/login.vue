<script setup lang="ts">
const password = ref('')
const error = ref('')
const busy = ref(false)
const route = useRoute()

async function submit() {
  busy.value = true
  error.value = ''
  try {
    await $fetch('/api/login', { method: 'POST', body: { password: password.value } })
    useState('signedIn').value = true
    const next = typeof route.query.next === 'string' && route.query.next.startsWith('/') && !route.query.next.startsWith('//') ? route.query.next : '/'
    await navigateTo(next)
  } catch (err: any) {
    error.value = err?.statusCode === 401 ? 'That password is not right. Try again.' : 'Could not reach the server. Check your connection and try again.'
  } finally {
    busy.value = false
  }
}
</script>

<template>
  <form class="login" @submit.prevent="submit">
    <h1>Binder Dex</h1>
    <p>Enter the household password.</p>
    <input
      id="password"
      v-model="password"
      class="field"
      type="password"
      autocomplete="current-password"
      aria-label="Password"
      required
    >
    <p v-if="error" class="err" role="alert">{{ error }}</p>
    <button class="btn primary" type="submit" :disabled="busy">{{ busy ? 'Signing in…' : 'Sign in' }}</button>
  </form>
</template>
