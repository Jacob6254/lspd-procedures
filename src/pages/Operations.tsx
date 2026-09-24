import { useEffect, useState } from 'react'
import { ArrowRight, Map as MapIcon, Plus, RefreshCw, Share2, Trash, Users } from 'lucide-react'
import type { Operation } from '@shared/operation'
import { FOND_DEFAUT, fondCarte } from '@shared/operation'
import { couleurPlan } from '@shared/plan'
import { dateFr, heureFr } from '../lib/format'
import { nouvelleOperation, useOperations } from '../operations'
import { useStore } from '../store'
import { ConfirmButton, Empty, PageHeader } from '../components/ui'

export function OperationsPage() {
  const charger = useOperations((s) => s.charger)
  const etat = useOperations((s) => s.etat)
  const erreur = useOperations((s) => s.erreur)
  const mes = useOperations((s) => s.mes)
  const poste = useOperations((s) => s.poste)
  const creer = useOperations((s) => s.creer)
  const supprimer = useOperations((s) => s.supprimer)
  const go = useStore((s) => s.go)
  const [fondAbsent, setFondAbsent] = useState(false)

  useEffect(() => {
    void charger()
  }, [charger])

  const derniere = mes[0] ?? null
  const fond = fondCarte(derniere?.fond ?? FOND_DEFAUT)

  async function nouvelle() {
    const op = nouvelleOperation('Opération sans nom')
    try {
      await creer(op)
      go({ page: 'operation', id: op.id })
    } catch {
      // le magasin a déjà prévenu
    }
  }

  return (
    <div className="page">
      <PageHeader
        icon={MapIcon}
        title="Opérations"
        subtitle="La table de briefing : on pose le dispositif sur la carte, on trace les itinéraires, on partage le plan."
        right={
          <button type="button" className="btn btn-primary" onClick={() => void nouvelle()}>
            <Plus size={15} /> Nouvelle opération
          </button>
        }
      />

      <button type="button" className="table-briefing" onClick={() => (derniere ? go({ page: 'operation', id: derniere.id }) : void nouvelle())}>
        <div className="table-plateau">
          <div className="table-carte">
            {!fondAbsent ? (
              <img src={fond.fichier} alt="" draggable={false} onError={() => setFondAbsent(true)} />
            ) : (
              <div className="table-carte-vide">
                <MapIcon size={30} />
                <span>Fond de carte à installer</span>
              </div>
            )}
            <span className="table-reflet" />
          </div>
        </div>
        <div className="table-legende">
          <strong>{derniere ? derniere.nom : 'Ouvrir la table'}</strong>
          <span>
            {derniere
              ? `${dateFr(derniere.date)} · ${derniere.marqueurs.length} marqueur(s), ${derniere.fleches.length} itinéraire(s)`
              : 'Aucune opération pour le moment — clique pour en monter une.'}
          </span>
          <em>
            Entrer <ArrowRight size={14} />
          </em>
        </div>
      </button>

      {etat === 'erreur' && (
        <div className="alerte-erreur">
          {erreur}
          <button type="button" className="btn btn-ghost" onClick={() => void charger(true)}>
            <RefreshCw size={14} /> Réessayer
          </button>
        </div>
      )}

      <div className="section-title">
        <MapIcon size={15} /> Mes opérations
      </div>
      {mes.length === 0 ? (
        <Empty icon={MapIcon} title="Aucune opération" text="Monte ton premier plan : la carte, les unités, les points d'entrée." />
      ) : (
        <div className="ops-grille">
          {mes.map((op) => (
            <CarteOperation key={op.id} op={op} onOuvrir={() => go({ page: 'operation', id: op.id })} onSupprimer={() => void supprimer(op.id)} />
          ))}
        </div>
      )}

      {poste.length > 0 && (
        <>
          <div className="section-title">
            <Share2 size={15} /> Publiées au poste
          </div>
          <div className="ops-grille">
            {poste.map((op) => (
              <CarteOperation key={op.id} op={op} lecture onOuvrir={() => go({ page: 'operation', id: op.id })} />
            ))}
          </div>
        </>
      )}
    </div>
  )
}

function CarteOperation({
  op,
  lecture,
  onOuvrir,
  onSupprimer
}: {
  op: Operation
  lecture?: boolean
  onOuvrir: () => void
  onSupprimer?: () => void
}) {
  return (
    <div className={`op-carte ${lecture ? 'lecture' : ''}`}>
      <button type="button" className="op-carte-corps" onClick={onOuvrir}>
        <div className="op-carte-head">
          <strong>{op.nom}</strong>
          {op.publiee && !lecture && <span className="op-tag">Publiée</span>}
        </div>
        <small>
          {dateFr(op.date)} à {heureFr(op.heure)}
          {op.lieu.trim() ? ` · ${op.lieu.trim()}` : ''}
        </small>
        {lecture && (
          <small className="muted">
            <Users size={12} /> {op.auteurNom}
          </small>
        )}
        <div className="op-carte-stats">
          <span>{op.marqueurs.length} marqueur(s)</span>
          <span>{op.fleches.length} itinéraire(s)</span>
          <span>{op.etiquettes.length} note(s)</span>
        </div>
        <div className="op-carte-unites">
          {op.unites.map((u) => (
            <span key={u.id} title={u.nom} style={{ background: couleurPlan(u.couleur) }} />
          ))}
        </div>
      </button>
      {onSupprimer && (
        <ConfirmButton
          onConfirm={onSupprimer}
          label="Supprimer"
          confirmLabel="Confirmer la suppression"
          icon={Trash}
          className="btn btn-ghost btn-icon op-carte-suppr"
        />
      )}
    </div>
  )
}
