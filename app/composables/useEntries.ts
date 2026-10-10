import type { Entry } from '~~/shared/types'

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

  async function rename(e: Entry, name: string) {
    const updated = await call($fetch<Entry>(`/api/entries/${e.id}`, { method: 'PATCH', body: { name } }))
    e.name = updated.name
  }

  // Moving, adding and removing shift other positions, so reload the list.
  async function move(e: Entry, position: number) {
    await call($fetch(`/api/entries/${e.id}`, { method: 'PATCH', body: { position } }))
    await load(true)
  }

  async function add(gen: number, name: string, position?: number) {
    const created = await call($fetch<Entry>('/api/entries', { method: 'POST', body: { gen, name, position } }))
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

  return { entries, loaded, load, setOwned, rename, move, add, remove, reset }
}
