// Accepts any of: { owned: boolean }, { name: string }, { position: number }.
export default defineEventHandler(async (event) => {
  const db = useDb(event)
  const id = parseId(event)
  const body = await readBody<{ owned?: unknown; name?: unknown; position?: unknown }>(event)

  if (body.owned !== undefined) {
    if (typeof body.owned !== 'boolean') throw createError({ statusCode: 400, message: 'owned must be true or false' })
    await db.prepare('UPDATE entries SET owned = ? WHERE id = ?').bind(body.owned ? 1 : 0, id).run()
  }
  if (body.name !== undefined) {
    await db.prepare('UPDATE entries SET name = ? WHERE id = ?').bind(parseName(body.name), id).run()
  }
  if (body.position !== undefined) await moveEntry(db, id, body.position)

  return toEntry(await getEntry(db, id))
})
