import type { Entry } from '~~/shared/types'

// Saves for reordering run one after another so quick drags reach the server
// in the order they happened.
let moveQueue: Promise<unknown> = Promise.resolve()

export function useEntries() {
  const entries = useState<Entry[]>('entries', () => [])
  const loaded = useState('entries-loaded', () => false)
  const { show } = useToast()

  async function call<T>(request: Promise<T>): Promise<T> {
    try {
      return await request
    } catch (err: any) {
      if (err?.statusCode === 401) {
        useState('signedIn').value = false
        await navigateTo('/login')
      } else {
        show(err?.data?.message || 'Could not reach the server. Check your connection and try again.', 'error')
      }
      throw err
    }
  }

  async function load(force = false) {
    if (loaded.value && !force) return
    entries.value = await call($fetch<Entry[]>('/api/entries'))
    loaded.value = true
  }

  async function setOwned(e: Entry, owned: boolean) {
    e.owned = owned
    try {
      await call($fetch(`/api/entries/${e.id}`, { method: 'PATCH', body: { owned } }))
    } catch {
      e.owned = !owned
    }
  }

  async function update(e: Entry, patch: Partial<Pick<Entry, 'name' | 'dex' | 'indent'>>) {
    const updated = await call($fetch<Entry>(`/api/entries/${e.id}`, { method: 'PATCH', body: patch }))
    Object.assign(e, updated)
  }

  // Reorders on screen right away, then saves. If saving fails, reload to
  // get back the real order.
  async function move(e: Entry, position: number) {
    const gen = entries.value.filter((x) => x.gen === e.gen)
    const from = gen.indexOf(e)
    const to = Math.min(Math.max(position, 1), gen.length) - 1
    if (from < 0 || from === to) return
    gen.splice(to, 0, ...gen.splice(from, 1))
    gen.forEach((x, i) => (x.position = i + 1))
    entries.value = entries.value
      .filter((x) => x.gen !== e.gen)
      .concat(gen)
      .sort((a, b) => a.gen - b.gen || a.position - b.position)
    const save = moveQueue.then(() => call($fetch(`/api/entries/${e.id}`, { method: 'PATCH', body: { position: to + 1 } })))
    moveQueue = save.catch(() => load(true).catch(() => {}))
    await moveQueue
  }

  // Adding and removing shift other positions, so reload the list.
  async function add(body: { gen: number; name: string; dex: number | null; indent: boolean; position?: number }) {
    const created = await call($fetch<Entry>('/api/entries', { method: 'POST', body }))
    await load(true)
    return created
  }

  async function remove(e: Entry) {
    await call($fetch(`/api/entries/${e.id}`, { method: 'DELETE' }))
    await load(true)
  }

  function reset() {
    entries.value = []
    loaded.value = false
  }

  return { entries, loaded, load, setOwned, update, move, add, remove, reset }
}
