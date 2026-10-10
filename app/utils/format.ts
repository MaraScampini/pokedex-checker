import type { Entry } from '~~/shared/types'

export const pad = (n: number) => String(n).padStart(3, '0')

// Lowercase, strip accents and unify apostrophes so "flabebe" finds Flabébé
// and "farfetch'd" finds Farfetch’d.
export const fold = (s: string) =>
  s.normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/[’‘]/g, "'").toLowerCase()

export function matches(e: Entry, query: string) {
  const q = fold(query.trim())
  const num = q.replace(/^#/, '')
  if (/^\d+$/.test(num)) return e.dex === Number(num)
  return fold(e.name).includes(q)
}

export const byName = new Intl.Collator('en', { sensitivity: 'base', numeric: true })
