import { CheckCircle2, Clock3, Handshake, Plus } from 'lucide-react'
import { negociationTitre, useStore } from '../store'
import { dateFr, heureFr } from '../lib/format'
import { Badge, Empty, PageHeader } from '../components/ui'

export function NegociationsPage() {
  const negociations = useStore((s) => s.db.negociations)
  const createNegociation = useStore((s) => s.createNegociation)
  const go = useStore((s) => s.go)
  const liste = negociations ?? []

  return (
    <div className="page">
      <PageHeader
        icon={Handshake}
        title="Mes négociations"
        subtitle="Une fiche par prise d’otages, avec le rapport officiel à envoyer dans le salon."
        right={
          <button type="button" className="btn btn-primary" onClick={createNegociation}>
            <Plus size={15} /> Nouvelle négociation
          </button>
        }
      />

      {liste.length === 0 ? (
        <Empty
          icon={Handshake}
          title="Aucune négociation"
          text="Ouvre une fiche dès l’arrivée sur la scène : tu la remplis pendant que ça se joue."
        >
          <button type="button" className="btn btn-primary" onClick={createNegociation}>
            <Plus size={15} /> Nouvelle négociation
          </button>
        </Empty>
      ) : (
        <div className="stack gap-8">
          {liste.map((n) => (
            <div className="row-card" key={n.id}>
              <div className={`row-card-icon ${n.statut === 'terminee' ? 'green' : 'amber'}`}>
                {n.statut === 'terminee' ? <CheckCircle2 size={17} /> : <Clock3 size={17} />}
              </div>
              <div className="row-card-text">
                <strong>{negociationTitre(n)}</strong>
                <small>
                  {dateFr(n.date)} à {heureFr(n.heure)} · {n.braqueurs ?? '—'} braqueur(s) · {n.otages.length} otage(s) ·{' '}
                  {n.echanges.length} revendication(s)
                </small>
              </div>
              <Badge tone={n.statut === 'terminee' ? 'green' : 'amber'}>{n.statut === 'terminee' ? 'Terminée' : 'En cours'}</Badge>
              <button type="button" className="btn" onClick={() => go({ page: 'negociation', id: n.id })}>
                Ouvrir
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
