export default defineEventHandler(async (event) => {
  const body = await readBody<{ gen?: unknown; name?: unknown; position?: unknown }>(event)
  setResponseStatus(event, 201)
  return insertEntry(useDb(event), parseGen(body.gen), parseName(body.name), body.position)
})
