import { useState } from 'react'
import { FileText, Search } from 'lucide-react'
import { useStore } from '../store'
import { Empty, PageHeader, Segmented } from '../components/ui'
import { dateFr, normalize } from '../lib/format'
import { InterventionRow } from './Accueil'

export function HistoriquePage() {
  const interventions = useStore((s) => s.db.interventions)
  const [query, setQuery] = useState('')
  const [statut, setStatut] = useState<'all' | 'en_cours' | 'terminee'>('all')
  const q = normalize(query)

  const list = interventions
    .filter((i) => statut === 'all' || i.statut === statut)
    .filter((i) => {
      if (!q) return true
      const hay = normalize(
        [
          i.motif,
          i.lieu,
          dateFr(i.date),
          ...i.matricules,
          ...i.suspects.flatMap((s) => [s.prenom, s.nom, ...s.accusations, ...s.saisies.map((x) => x.label)])
        ].join(' ')
      )
      return q.split(/\s+/).every((w) => hay.includes(w))
    })
    .sort((a, b) => `${b.date}${b.heure}`.localeCompare(`${a.date}${a.heure}`))

  return (
    <div className="page">
      <PageHeader icon={FileText} title="Historique" subtitle="Toutes tes interventions enregistrées" />
      <div className="toolbar">
        <div className="search">
          <Search size={16} />
          <input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Rechercher un suspect, un motif, une arme, une date…" />
        </div>
        <Segmented
          value={statut}
          onChange={setStatut}
          options={[
            { value: 'all', label: 'Toutes' },
            { value: 'en_cours', label: 'En cours' },
            { value: 'terminee', label: 'Terminées' }
          ]}
        />
      </div>
      {list.length === 0 ? (
        <Empty icon={FileText} title={interventions.length ? 'Aucun résultat' : 'Aucune intervention'} />
      ) : (
        <div className="stack gap-8">
          {list.map((i) => (
            <InterventionRow key={i.id} i={i} />
          ))}
          <p className="muted small">
            {list.length} intervention{list.length > 1 ? 's' : ''}
          </p>
        </div>
      )}
    </div>
  )
}
