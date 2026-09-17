import { AlertTriangle, CheckCircle2, Info } from 'lucide-react'
import { useStore } from '../store'

export function Toasts() {
  const toasts = useStore((s) => s.toasts)
  const dismiss = useStore((s) => s.dismissToast)
  return (
    <div className="toasts" role="status" aria-live="polite">
      {toasts.map((t) => (
        <button type="button" key={t.id} className={`toast toast-${t.kind}`} onClick={() => dismiss(t.id)}>
          {t.kind === 'ok' ? <CheckCircle2 size={16} /> : t.kind === 'error' ? <AlertTriangle size={16} /> : <Info size={16} />}
          {t.text}
        </button>
      ))}
    </div>
  )
}
