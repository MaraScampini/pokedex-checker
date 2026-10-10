// useState that also remembers its value on this device.
export function usePersisted<T>(key: string, initial: T) {
  const state = useState<T>(`persisted:${key}`, () => {
    try {
      const raw = localStorage.getItem(key)
      if (raw != null) return JSON.parse(raw) as T
    } catch {}
    return initial
  })
  watch(state, (v) => {
    try { localStorage.setItem(key, JSON.stringify(v)) } catch {}
  })
  return state
}
