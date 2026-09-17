import { useState } from 'react'
import { Images, Trash2 } from 'lucide-react'
import { type CaptureTarget, SLOT_LABELS, type SuspectSlot, interventionTitle, suspectName, useStore } from '../store'
import { Empty, PageHeader } from '../components/ui'
import { Lightbox } from '../components/ScreenSlot'
import { dateTimeFr } from '../lib/format'
import { imgUrl } from '../api'

const SUSPECT_SLOTS: SuspectSlot[] = ['photo', 'identite', 'fouilleScreens', 'amendesScreens', 'casierScreens']

export function ScreensPage() {
  const inbox = useStore((s) => s.db.inbox)
  const interventions = useStore((s) => s.db.interventions)
  const moveFromInbox = useStore((s) => s.moveFromInbox)
  const removeImage = useStore((s) => s.removeImage)
  const toast = useStore((s) => s.toast)
  const [viewer, setViewer] = useState<number | null>(null)

  const destinations: { key: string; label: string; target: CaptureTarget }[] = interventions
    .filter((i) => i.statut === 'en_cours')
    .flatMap((i) => [
      { key: `${i.id}|scene`, label: `${interventionTitle(i)} — Scène`, target: { interventionId: i.id, suspectId: null, slot: 'sceneScreens' as const } },
      ...i.suspects.flatMap((s) =>
        SUSPECT_SLOTS.map((slot) => ({
          key: `${i.id}|${s.id}|${slot}`,
          label: `${interventionTitle(i)} — ${suspectName(s)} — ${SLOT_LABELS[slot]}`,
          target: { interventionId: i.id, suspectId: s.id, slot }
        }))
      )
    ])

  return (
    <div className="page">
      <PageHeader
        icon={Images}
        title="Screens à trier"
        subtitle="Les screens pris quand aucun dossier n’est ouvert arrivent ici. Range-les dans une intervention en cours."
      />
      {inbox.length === 0 ? (
        <Empty icon={Images} title="Rien à trier" text="Tous tes screens sont rangés." />
      ) : (
        <div className="inbox-grid">
          {inbox.map((img, idx) => (
            <div className="inbox-card" key={img.id}>
              <button type="button" className="thumb" onClick={() => setViewer(idx)}>
                <img src={imgUrl(img.file)} alt="" loading="lazy" />
              </button>
              <small className="muted">{dateTimeFr(img.createdAt)}</small>
              <div className="row gap-8">
                <select
                  className="input select"
                  value=""
                  disabled={destinations.length === 0}
                  onChange={(e) => {
                    const d = destinations.find((x) => x.key === e.target.value)
                    if (!d) return
                    moveFromInbox(img.id, d.target)
                    toast('ok', `Rangé dans ${d.label}`)
                  }}
                >
                  <option value="">{destinations.length ? 'Ranger dans…' : 'Aucune intervention en cours'}</option>
                  {destinations.map((d) => (
                    <option key={d.key} value={d.key}>
                      {d.label}
                    </option>
                  ))}
                </select>
                <button type="button" className="btn btn-icon btn-danger" aria-label="Supprimer" onClick={() => removeImage('inbox', img.id)}>
                  <Trash2 size={15} />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
      {viewer !== null && inbox[viewer] && (
        <Lightbox
          images={inbox}
          index={viewer}
          onIndex={setViewer}
          onClose={() => setViewer(null)}
          onDelete={(img) => {
            removeImage('inbox', img.id)
            setViewer(inbox.length - 1 <= 0 ? null : Math.min(viewer, inbox.length - 2))
          }}
        />
      )}
    </div>
  )
}
