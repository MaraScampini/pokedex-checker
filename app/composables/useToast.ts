interface Toast {
  message: string
  kind: 'info' | 'error'
  action?: { label: string; run: () => void }
}

let timer: ReturnType<typeof setTimeout> | undefined

export function useToast() {
  const toast = useState<Toast | null>('toast', () => null)
  function show(message: string, kind: Toast['kind'] = 'info', action?: Toast['action']) {
    toast.value = { message, kind, action }
    clearTimeout(timer)
    timer = setTimeout(() => (toast.value = null), action ? 5000 : 3000)
  }
  const hide = () => (toast.value = null)
  return { toast, show, hide }
}
