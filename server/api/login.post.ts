export default defineEventHandler(async (event) => {
  const { password } = await readBody<{ password?: unknown }>(event)
  if (typeof password !== 'string' || !(await checkPassword(event, password))) {
    throw createError({ statusCode: 401, message: 'That password is not right' })
  }
  await startSession(event)
  return { ok: true }
})
