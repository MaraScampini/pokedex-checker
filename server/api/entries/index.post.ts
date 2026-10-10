export default defineEventHandler(async (event) => {
  const body = await readBody<{ gen?: unknown; name?: unknown; dex?: unknown; indent?: unknown; position?: unknown }>(event)
  setResponseStatus(event, 201)
  return insertEntry(useDb(event), {
    gen: parseGen(body.gen),
    name: parseName(body.name),
    dex: parseDex(body.dex),
    indent: body.indent === undefined ? false : parseBool(body.indent, 'indent'),
    position: body.position
  })
})
