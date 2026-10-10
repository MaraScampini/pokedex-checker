export default defineEventHandler(async (event) => {
  await deleteEntry(useDb(event), parseId(event))
  return { ok: true }
})
