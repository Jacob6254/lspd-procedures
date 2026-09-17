import { useState } from 'react'
import { Crosshair, ExternalLink, RefreshCw, Search } from 'lucide-react'
import type { Weapon } from '@shared/types'
import { Badge, Empty, PageHeader, Segmented } from '../components/ui'
import { dateTimeFr, normalize } from '../lib/format'
import { statusLabel, useWeaponsLoaded } from '../weapons'

function tone(w: Weapon) {
  return w.status === 'legal' ? 'green' : w.status === 'illegal' ? 'red' : 'blue'
}

export function ArmesPage() {
  const { data, source, loading, load } = useWeaponsLoaded()
  const [query, setQuery] = useState('')
  const [status, setStatus] = useState<'all' | Weapon['status']>('all')
  const [category, setCategory] = useState('all')
  const q = normalize(query)

  const list = (data?.weapons ?? [])
    .filter((w) => status === 'all' || w.status === status)
    .filter((w) => category === 'all' || w.category === category)
    .filter((w) => !q || q.split(/\s+/).every((word) => normalize(w.name).includes(word)))
    .sort((a, b) => a.name.localeCompare(b.name))

  const sourceText =
    source === 'live' ? 'à jour depuis le site' : source === 'cache' ? 'site injoignable, dernière copie enregistrée' : 'site injoignable, liste intégrée à l’appli'

  return (
    <div className="page">
      <PageHeader
        icon={Crosshair}
        title="Répertoire armes"
        subtitle={data ? `${data.weapons.length} objets · ${sourceText} · ${dateTimeFr(data.fetchedAt)}` : 'Chargement…'}
        right={
          <>
            <a className="btn" href="https://xn--rpertoirearmesrp-bqb.fr/index.html" target="_blank" rel="noreferrer">
              <ExternalLink size={15} /> Ouvrir le site
            </a>
            <button type="button" className="btn" disabled={loading} onClick={() => void load(true)}>
              <RefreshCw size={15} className={loading ? 'spin' : ''} /> Actualiser
            </button>
          </>
        }
      />
      <div className="toolbar">
        <div className="search">
          <Search size={16} />
          <input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Rechercher une arme ou une munition…" autoFocus />
        </div>
        <Segmented
          value={status}
          onChange={setStatus}
          options={[
            { value: 'all', label: 'Tous' },
            { value: 'legal', label: 'Légal' },
            { value: 'ppa', label: 'PPA requis' },
            { value: 'illegal', label: 'Illégal' }
          ]}
        />
        <select className="input select" value={category} onChange={(e) => setCategory(e.target.value)}>
          <option value="all">Toutes les catégories</option>
          {data?.categories.map((c) => (
            <option key={c.key} value={c.key}>
              {c.label}
            </option>
          ))}
        </select>
      </div>
      {list.length === 0 ? (
        <Empty icon={Crosshair} title="Aucun résultat" />
      ) : (
        <div className="weapon-grid">
          {list.map((w) => (
            <div className="weapon" key={w.id}>
              <div>
                <strong>{w.name}</strong>
                <small>{data?.categories.find((c) => c.key === w.category)?.label ?? w.category}</small>
              </div>
              <Badge tone={tone(w)}>{statusLabel(w)}</Badge>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
