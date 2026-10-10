import type { D1Database } from '@cloudflare/workers-types'
import type { H3Event } from 'h3'
import type { Entry } from '~~/shared/types'

interface Row extends Omit<Entry, 'owned' | 'indent'> { owned: number; indent: number }

const COLUMNS = 'id, dex, name, gen, position, owned, indent'
export const toEntry = (r: Row): Entry => ({ ...r, owned: r.owned === 1, indent: r.indent === 1 })

export function parseId(event: H3Event) {
  const id = Number(getRouterParam(event, 'id'))
  if (!Number.isInteger(id) || id < 1) throw createError({ statusCode: 400, message: 'Invalid entry id' })
  return id
}

export function parseName(v: unknown) {
  const name = typeof v === 'string' ? v.trim() : ''
  if (!name || name.length > 60) throw createError({ statusCode: 400, message: 'Name must be 1–60 characters' })
  return name
}

export function parseGen(v: unknown) {
  const gen = Number(v)
  if (!Number.isInteger(gen) || gen < 1 || gen > 9) throw createError({ statusCode: 400, message: 'Generation must be 1–9' })
  return gen
}

// Empty means "no Pokédex number".
export function parseDex(v: unknown) {
  if (v == null || v === '') return null
  const dex = Number(v)
  if (!Number.isInteger(dex) || dex < 1 || dex > 9999) throw createError({ statusCode: 400, message: 'Pokédex number must be a whole number from 1' })
  return dex
}

export function parseBool(v: unknown, field: string) {
  if (typeof v !== 'boolean') throw createError({ statusCode: 400, message: `${field} must be true or false` })
  return v
}

function parsePosition(v: unknown) {
  const p = Number(v)
  if (!Number.isInteger(p) || p < 1) throw createError({ statusCode: 400, message: 'Position must be a whole number from 1' })
  return p
}

const clamp = (n: number, lo: number, hi: number) => Math.min(Math.max(n, lo), hi)

async function countInGen(db: D1Database, gen: number) {
  const r = await db.prepare('SELECT COUNT(*) AS n FROM entries WHERE gen = ?').bind(gen).first<{ n: number }>()
  return r?.n ?? 0
}

export async function getEntry(db: D1Database, id: number) {
  const r = await db.prepare(`SELECT ${COLUMNS} FROM entries WHERE id = ?`).bind(id).first<Row>()
  if (!r) throw createError({ statusCode: 404, message: 'That Pokémon is no longer on the list' })
  return r
}

export async function listEntries(db: D1Database) {
  const { results } = await db.prepare(`SELECT ${COLUMNS} FROM entries ORDER BY gen, position`).all<Row>()
  return results.map(toEntry)
}

interface NewEntry { gen: number; name: string; dex: number | null; indent: boolean; position?: unknown }

// Inserts at `position` (1-based) inside the generation, shifting later
// entries down. No position, or one past the end, appends.
export async function insertEntry(db: D1Database, { gen, name, dex, indent, position }: NewEntry) {
  const n = await countInGen(db, gen)
  const pos = position == null || position === '' ? n + 1 : clamp(parsePosition(position), 1, n + 1)
  const [, inserted] = await db.batch<Row>([
    db.prepare('UPDATE entries SET position = position + 1 WHERE gen = ? AND position >= ?').bind(gen, pos),
    db.prepare(`INSERT INTO entries (dex, name, gen, position, indent) VALUES (?, ?, ?, ?, ?) RETURNING ${COLUMNS}`).bind(dex, name, gen, pos, indent ? 1 : 0)
  ])
  const row = inserted?.results[0]
  if (!row) throw createError({ statusCode: 500, message: 'Could not add that Pokémon' })
  return toEntry(row)
}

export async function moveEntry(db: D1Database, id: number, position: unknown) {
  const row = await getEntry(db, id)
  const to = clamp(parsePosition(position), 1, await countInGen(db, row.gen))
  if (to === row.position) return
  const shift = to < row.position
    ? db.prepare('UPDATE entries SET position = position + 1 WHERE gen = ? AND position >= ? AND position < ?').bind(row.gen, to, row.position)
    : db.prepare('UPDATE entries SET position = position - 1 WHERE gen = ? AND position > ? AND position <= ?').bind(row.gen, row.position, to)
  await db.batch([shift, db.prepare('UPDATE entries SET position = ? WHERE id = ?').bind(to, id)])
}

export async function deleteEntry(db: D1Database, id: number) {
  const row = await getEntry(db, id)
  await db.batch([
    db.prepare('DELETE FROM entries WHERE id = ?').bind(id),
    db.prepare('UPDATE entries SET position = position - 1 WHERE gen = ? AND position > ?').bind(row.gen, row.position)
  ])
}
