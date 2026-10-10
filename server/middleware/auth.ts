const PUBLIC = new Set(['/api/login', '/api/session'])

export default defineEventHandler(async (event) => {
  const path = event.path.split('?')[0] ?? ''
  if (!path.startsWith('/api/') || PUBLIC.has(path)) return
  if (!(await isSignedIn(event))) {
    throw createError({ statusCode: 401, message: 'Sign in to continue' })
  }
})
