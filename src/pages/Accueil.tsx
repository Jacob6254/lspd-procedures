import { Clock3, Crosshair, FileText, Handshake, Home, Plus, UserRound } from 'lucide-react'
import { interventionTitle, suspectName, useStore } from '../store'
import { Empty, PageHeader } from '../components/ui'
import { dateFr, heureFr } from '../lib/format'
import type { Intervention } from '@shared/types'

export function InterventionRow({ i }: { i: Intervention }) {
  const openDossier = useStore((s) => s.openDossier)
  const saisies = i.suspects.reduce((n, s) => n + s.saisies.length, 0)
  return (
    <div className="row-card">
      <div className={`row-card-icon ${i.statut === 'en_cours' ? 'amber' : 'green'}`}>
        <FileText size={17} />
      </div>
      <div className="row-card-text">
        <strong>
          {interventionTitle(i)} · <span>{i.suspects.map(suspectName).join(', ')}</span>
        </strong>
        <small>
          {dateFr(i.date)} à {heureFr(i.heure)} · {i.suspects.length} suspect{i.suspects.length > 1 ? 's' : ''} · {saisies} saisie
          {saisies > 1 ? 's' : ''} · 
        </small>
      </div>
      <span className={`status ${i.statut === 'en_cours' ? 'status-amber' : 'status-green'}`}>{i.statut === 'en_cours' ? 'En cours' : 'Terminée'}</span>
      <button type="button" className="btn" onClick={() => openDossier(i.id)}>
        <UserRound size={15} /> Ouvrir
      </button>
    </div>
  )
}

export function AccueilPage() {
  const db = useStore((s) => s.db)
  const createIntervention = useStore((s) => s.createIntervention)
  const go = useStore((s) => s.go)
  const enCours = db.interventions.filter((i) => i.statut === 'en_cours')
  const terminees = db.interventions.filter((i) => i.statut === 'terminee')
  const suspects = db.interventions.reduce((n, i) => n + i.suspects.length, 0)
  const negociations = db.negociations ?? []
  const armes = db.interventions.reduce(
    (n, i) => n + i.suspects.reduce((m, s) => m + s.saisies.filter((x) => x.type === 'arme').reduce((q, x) => q + (x.quantite ?? 0), 0), 0),
    0
  )

  return (
    <div className="page">
      <PageHeader icon={Home} title="Accueil" subtitle="Aperçu de tes procédures" />

      <section className="hero">
        <div>
          <span className="eyebrow blue">Procédures LSPD</span>
          <div className="hero-number">
            {enCours.length} <span>intervention{enCours.length > 1 ? 's' : ''} en cours</span>
          </div>
          <p>
            Commence le dossier pendant le trajet vers le poste : faits, suspects, fouille. L’appli écrit le rapport et vérifie qu’il ne manque
            rien.
          </p>
          <button type="button" className="btn btn-primary btn-lg" onClick={createIntervention}>
            <Plus size={17} /> Nouvelle intervention
          </button>
        </div>
        <div className="hero-badge">
          <img src="/lspdlogo.webp" alt="" width="132" height="132" />
        </div>
      </section>

      <div className="stats">
        <div className="stat">
          <span className="eyebrow">
            <FileText size={14} /> Interventions
          </span>
          <strong>{db.interventions.length}</strong>
          <small>{terminees.length} terminée{terminees.length > 1 ? 's' : ''}</small>
        </div>
        <div className="stat">
          <span className="eyebrow">
            <UserRound size={14} /> Suspects traités
          </span>
          <strong>{suspects}</strong>
          <small>un dossier par suspect</small>
        </div>
        <div className="stat">
          <span className="eyebrow">
            <Handshake size={14} /> Négociations
          </span>
          <strong>{negociations.length}</strong>
          <small>{negociations.filter((n) => n.statut === 'en_cours').length} en cours</small>
        </div>
        <div className="stat">
          <span className="eyebrow">
            <Crosshair size={14} /> Armes saisies
          </span>
          <strong>{armes}</strong>
          <small>toutes interventions</small>
        </div>
      </div>

      <div className="section-title">
        <Clock3 size={16} /> Interventions en cours <span className="count-pill">{enCours.length}</span>
      </div>
      {enCours.length === 0 ? (
        <Empty icon={FileText} title="Aucune intervention en cours" text="Crée une intervention dès que tu interpelles quelqu’un." />
      ) : (
        <div className="stack gap-8">
          {enCours.map((i) => (
            <InterventionRow key={i.id} i={i} />
          ))}
        </div>
      )}

      {terminees.length > 0 && (
        <>
          <div className="section-title">
            <FileText size={16} /> Dernières terminées
            <button type="button" className="link" onClick={() => go({ page: 'historique' })}>
              Tout voir
            </button>
          </div>
          <div className="stack gap-8">
            {terminees.slice(0, 5).map((i) => (
              <InterventionRow key={i.id} i={i} />
            ))}
          </div>
        </>
      )}
    </div>
  )
}
