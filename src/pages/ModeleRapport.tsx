import { useState } from 'react'
import { AlertTriangle, Check, ClipboardCopy, ClipboardList } from 'lucide-react'
import { A_EVITER, A_VERIFIER, MODELES } from '../data/modeles-rapport'
import { useStore } from '../store'
import { api } from '../api'
import { PageHeader, Panel } from '../components/ui'

export function ModeleRapportPage() {
  const toast = useStore((s) => s.toast)
  const settings = useStore((s) => s.db.settings)
  const [choisi, setChoisi] = useState(MODELES[0].id)
  const modele = MODELES.find((m) => m.id === choisi) ?? MODELES[0]

  // Le matricule connu est déjà mis, c'est toujours ça de moins à taper.
  const texte = settings.matricule ? modele.texte.replace('[matricules des agents présents]', settings.matricule) : modele.texte

  async function copier() {
    try {
      await api.copyText(texte)
      toast('ok', 'Modèle copié, il ne reste qu’à compléter les crochets.')
    } catch {
      toast('error', 'Copie refusée par le navigateur.')
    }
  }

  return (
    <div className="page page-etroite">
      <PageHeader
        icon={ClipboardList}
        title="Modèle de rapport"
        subtitle="La trame officielle et quelques cas déjà rédigés. On copie, on remplace ce qui est entre crochets."
      />

      <div className="modele-onglets">
        {MODELES.map((m) => (
          <button key={m.id} type="button" className={`modele-onglet ${m.id === choisi ? 'actif' : ''}`} onClick={() => setChoisi(m.id)}>
            {m.titre}
          </button>
        ))}
      </div>

      <Panel
        title={modele.titre}
        icon={ClipboardList}
        right={
          <button type="button" className="btn btn-primary" onClick={() => void copier()}>
            <ClipboardCopy size={15} /> Copier le modèle
          </button>
        }
      >
        <p className="muted small modele-quand">{modele.quand}</p>
        <pre className="modele-texte">{texte}</pre>
      </Panel>

      <div className="modele-deux">
        <Panel title="Ce qui doit y être" icon={Check}>
          <ul className="modele-liste">
            {A_VERIFIER.map((p) => (
              <li key={p}>
                <Check size={14} className="c-green" /> {p}
              </li>
            ))}
          </ul>
        </Panel>
        <Panel title="Ce qui fait retoquer" icon={AlertTriangle}>
          <ul className="modele-liste">
            {A_EVITER.map((p) => (
              <li key={p}>
                <AlertTriangle size={14} className="c-amber" /> {p}
              </li>
            ))}
          </ul>
        </Panel>
      </div>
    </div>
  )
}
