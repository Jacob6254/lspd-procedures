import { useState } from 'react'
import { Radio, Search } from 'lucide-react'
import { CODES_RADIO, GROUPES, type CodeGroupe } from '../data/codes-radio'
import { Empty, PageHeader, Segmented } from '../components/ui'
import { normalize } from '../lib/format'
import { api } from '../api'
import { useStore } from '../store'

const TONE: Record<CodeGroupe, string> = {
  'Code 10': 'bleu',
  'Code d’affiliation': 'vert',
  'Code de priorité': 'ambre',
  'Zone géographique': 'violet'
}

export function CodesRadioPage() {
  const toast = useStore((s) => s.toast)
  const [query, setQuery] = useState('')
  const [groupe, setGroupe] = useState<'all' | CodeGroupe>('all')
  const q = normalize(query)

  const list = CODES_RADIO.filter((c) => groupe === 'all' || c.groupe === groupe).filter(
    (c) => !q || q.split(/\s+/).every((mot) => normalize(`${c.code} ${c.sens}`).includes(mot))
  )

  return (
    <div className="page">
      <PageHeader icon={Radio} title="Code Radio" subtitle={`${CODES_RADIO.length} codes · recherche par code ou par mot-clé`} />
      <div className="toolbar">
        <div className="search">
          <Search size={16} />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Rechercher un code ou un mot-clé… (ex. « 10-55 », « braquage », « tango »)"
            autoFocus
          />
        </div>
        <Segmented
          value={groupe}
          onChange={setGroupe}
          options={[{ value: 'all' as const, label: 'Tout' }, ...GROUPES.map((g) => ({ value: g, label: g }))]}
        />
      </div>

      {list.length === 0 ? (
        <Empty icon={Radio} title="Aucun code trouvé" />
      ) : (
        GROUPES.filter((g) => list.some((c) => c.groupe === g)).map((g) => (
          <section key={g}>
            <div className="section-title">
              <Radio size={16} /> {g} <span className="count-pill">{list.filter((c) => c.groupe === g).length}</span>
            </div>
            <div className="code-grid">
              {list
                .filter((c) => c.groupe === g)
                .map((c) => (
                  <button
                    type="button"
                    className="code-card"
                    key={c.code}
                    title="Cliquer pour copier"
                    onClick={async () => {
                      await api.copyText(`${c.code} — ${c.sens}`)
                      toast('ok', `« ${c.code} » copié`)
                    }}
                  >
                    <span className={`code-tag code-${TONE[c.groupe]}`}>{c.code}</span>
                    <span className="code-sens">{c.sens}</span>
                  </button>
                ))}
            </div>
          </section>
        ))
      )}
    </div>
  )
}
