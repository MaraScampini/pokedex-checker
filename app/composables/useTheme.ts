export function useTheme() {
  const theme = useState<'light' | 'dark'>('theme', () => {
    const set = document.documentElement.dataset.theme
    if (set === 'light' || set === 'dark') return set
    return matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light'
  })
  function toggle() {
    theme.value = theme.value === 'dark' ? 'light' : 'dark'
    document.documentElement.dataset.theme = theme.value
    try { localStorage.setItem('theme', theme.value) } catch {}
  }
  return { theme, toggle }
}
