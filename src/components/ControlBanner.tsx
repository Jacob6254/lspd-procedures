import { Hand, LogOut } from 'lucide-react'
import { useControl } from '../control'

/** Bandeau affiché tant que l'admin remplit le dossier d'un agent. */
export function ControlBanner() {
  const agent = useControl((s) => s.agent)
  const rendre = useControl((s) => s.rendre)
  const busy = useControl((s) => s.busy)
  if (!agent) return null

  return (
    <div className="control-banner">
      <Hand size={18} />
      <span>
        Prise en main : tu remplis le dossier de <strong>{agent.username}</strong>. Il voit tes modifications en direct.
      </span>
      <button type="button" className="btn" disabled={busy} onClick={() => void rendre()}>
        <LogOut size={15} /> Rendre la main
      </button>
    </div>
  )
}
