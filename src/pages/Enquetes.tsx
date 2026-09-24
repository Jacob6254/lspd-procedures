import { useEffect, useState } from 'react'
import { Camera, Network, Plus, RefreshCw, Share2, Trash, UserRound, Users } from 'lucide-react'
import type { Enquete } from '@shared/enquete'
import { compteParType, pivot } from '@shared/enquete'
import { dateFr } from '../lib/format'
import { nouvelleEnquete, useEnquetes } from '../enquetes'
import { useStore } from '../store'
import { ConfirmButton, Empty, PageHeader, TextInput } from '../components/ui'

export function EnquetesPage() {
  const charger = useEnquetes((s) => s.charger)
  const etat = useEnquetes((s) => s.etat)
  const erreur = useEnquetes((s) => s.erreur)
  const mes = useEnquetes((s) => s.mes)
  const poste = useEnquetes((s) => s.poste)
  const creer = useEnquetes((s) => s.creer)
  const supprimer = useEnquetes((s) => s.supprimer)
  const go = useStore((s) => s.go)
  const [cible, setCible] = useState('')

  useEffect(() => {
    void charger()
  }, [charger])

  async function nouvelle() {
    const e = nouvelleEnquete(cible)
    try {
      await creer(e)
      setCible('')
      go({ page: 'enquete', id: e.id })
    } catch {
      // le magasin a déjà prévenu
    }
  }

  return (
    <div className="page">
      <PageHeader
        icon={Network}
        title="Enquêtes"
        subtitle="Le tableau : on épingle les suspects, les preuves et les lieux, et on tire les fils entre eux."
      />

      <div className="enq-ouverture">
        <div className="enq-ouverture-texte">
          <strong>Ouvrir un tableau</strong>
          <span>Sur un gang, un réseau, une série de faits. Tu pourras tout renommer ensuite.</span>
        </div>
        <TextInput
          value={cible}
          onChange={setCible}
          placeholder="Gang des Ballas"
          className="enq-ouverture-champ"
        />
        <button type="button" className="btn btn-primary" onClick={() => void nouvelle()}>
          <Plus size={15} /> Ouvrir l'enquête
        </button>
      </div>

      {etat === 'erreur' && (
        <div className="alerte-erreur">
          {erreur}
          <button type="button" className="btn btn-ghost" onClick={() => void charger(true)}>
            <RefreshCw size={14} /> Réessayer
          </button>
        </div>
      )}

      <div className="section-title">
        <Network size={15} /> Mes enquêtes
      </div>
      {mes.length === 0 ? (
        <Empty icon={Network} title="Aucune enquête" text="Ouvre un tableau au-dessus, puis épingle ta première fiche." />
      ) : (
        <div className="ops-grille">
          {mes.map((e) => (
            <CarteEnquete key={e.id} enq={e} onOuvrir={() => go({ page: 'enquete', id: e.id })} onSupprimer={() => void supprimer(e.id)} />
          ))}
        </div>
      )}

      {poste.length > 0 && (
        <>
          <div className="section-title">
            <Share2 size={15} /> Publiées au poste
          </div>
          <div className="ops-grille">
            {poste.map((e) => (
              <CarteEnquete key={e.id} enq={e} lecture onOuvrir={() => go({ page: 'enquete', id: e.id })} />
            ))}
          </div>
        </>
      )}
    </div>
  )
}

function CarteEnquete({
  enq,
  lecture,
  onOuvrir,
  onSupprimer
}: {
  enq: Enquete
  lecture?: boolean
  onOuvrir: () => void
  onSupprimer?: () => void
}) {
  const c = compteParType(enq)
  const tete = pivot(enq)

  return (
    <div className={`op-carte ${lecture ? 'lecture' : ''}`}>
      <button type="button" className="op-carte-corps" onClick={onOuvrir}>
        <div className="op-carte-head">
          <strong>{enq.nom}</strong>
          {enq.publiee && !lecture && <span className="op-tag">Publiée</span>}
        </div>
        <small>
          Ouverte le {dateFr(enq.date)}
          {enq.statut === 'close' ? ' · clôturée' : ''}
        </small>
        {lecture && (
          <small className="muted">
            <Users size={12} /> {enq.auteurNom}
          </small>
        )}
        {tete && (
          <small className="muted">
            <UserRound size={12} /> {tete.titre.trim() || 'Suspect non identifié'}
            {tete.role ? ` — ${tete.role}` : ''}
          </small>
        )}
        <div className="op-carte-stats">
          <span>
            <UserRound size={12} /> {c.suspect}
          </span>
          <span>
            <Camera size={12} /> {c.preuve}
          </span>
          <span>{enq.liens.length} lien(s)</span>
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
