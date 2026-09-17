import { useEffect, useState } from 'react'
import { Check, MessageSquareWarning } from 'lucide-react'
import type { SupervisionNote } from '@shared/types'
import { api } from '../api'
import { dateTimeFr } from '../lib/format'

/** Conseils envoyés par un superviseur, vérifiés régulièrement. */
export function NotesBanner() {
  const [notes, setNotes] = useState<SupervisionNote[]>([])

  useEffect(() => {
    let vivant = true
    const charger = () =>
      api
        .notes()
        .then((n) => vivant && setNotes(n.filter((x) => !x.lu)))
        .catch(() => undefined)
    void charger()
    const t = setInterval(charger, 30000)
    return () => {
      vivant = false
      clearInterval(t)
    }
  }, [])

  if (notes.length === 0) return null

  return (
    <div className="notes-banner">
      {notes.map((n) => (
        <div className="note" key={n.id}>
          <MessageSquareWarning size={18} />
          <div className="note-text">
            <strong>Message de {n.from}</strong>
            <p>{n.text}</p>
            <small>{dateTimeFr(n.createdAt)}</small>
          </div>
          <button
            type="button"
            className="btn"
            onClick={() => {
              setNotes((cur) => cur.filter((x) => x.id !== n.id))
              void api.markNotesRead([n.id]).catch(() => undefined)
            }}
          >
            <Check size={15} /> Vu
          </button>
        </div>
      ))}
    </div>
  )
}
