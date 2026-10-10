export default defineNuxtRouteMiddleware(async (to) => {
  const signedIn = useState<boolean | null>('signedIn', () => null)
  if (signedIn.value === null) {
    try {
      signedIn.value = (await $fetch<{ signedIn: boolean }>('/api/session')).signedIn
    } catch {
      signedIn.value = false
    }
  }
  if (to.path === '/login') return signedIn.value ? navigateTo('/') : undefined
  if (!signedIn.value) {
    return navigateTo({ path: '/login', query: to.fullPath === '/' ? {} : { next: to.fullPath } })
  }
})
