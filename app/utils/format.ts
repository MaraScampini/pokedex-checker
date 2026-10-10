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
  return fold(e.name).includes(q) || fold(listName(e.name)).includes(q)
}

// The list shows the region after the name ("Diglett Alolan"), so A–Z keeps
// each regional form next to its base Pokémon instead of grouping them all
// under A, G, H or P.
const REGIONAL = /^(Alolan|Galarian|Hisuian|Paldean)\s+(.+)$/i
export const listName = (name: string) => name.replace(REGIONAL, '$2 $1')

export const byName = new Intl.Collator('en', { sensitivity: 'base', numeric: true })
