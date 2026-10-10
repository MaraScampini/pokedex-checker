// Accepts any of: owned, name, dex, indent, position.
export default defineEventHandler(async (event) => {
  const db = useDb(event)
  const id = parseId(event)
  const body = await readBody<{ owned?: unknown; name?: unknown; dex?: unknown; indent?: unknown; position?: unknown }>(event)

  const sets: string[] = []
  const values: unknown[] = []
  if (body.owned !== undefined) { sets.push('owned = ?'); values.push(parseBool(body.owned, 'owned') ? 1 : 0) }
  if (body.indent !== undefined) { sets.push('indent = ?'); values.push(parseBool(body.indent, 'indent') ? 1 : 0) }
  if (body.name !== undefined) { sets.push('name = ?'); values.push(parseName(body.name)) }
  if (body.dex !== undefined) { sets.push('dex = ?'); values.push(parseDex(body.dex)) }
  if (sets.length) await db.prepare(`UPDATE entries SET ${sets.join(', ')} WHERE id = ?`).bind(...values, id).run()
  if (body.position !== undefined) await moveEntry(db, id, body.position)

  return toEntry(await getEntry(db, id))
})
