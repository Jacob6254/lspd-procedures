import { useEffect, useMemo, useState } from 'react'
import { AlertTriangle, CheckCircle2, Circle, Clock, Handshake, Lock, PlayCircle, RefreshCw, Send, Timer } from 'lucide-react'
import { CRITERES_PRATIQUE, NOTE_ADMIS, NOTE_MAX_PRATIQUE, verdictNego } from '@shared/nego'
import { useNego } from '../nego'
import { dateTimeFr } from '../lib/format'
import { Badge, Empty, PageHeader, Panel } from '../components/ui'
import { Correction } from '../components/Correction'

export function dureeTexte(secondes: number): string {
  const m = Math.floor(secondes / 60)
  const s = secondes % 60
  return `${m} min ${String(s).padStart(2, '0')}`
}

function Chrono({ depart, limiteMinutes }: { depart: number; limiteMinutes: number }) {
  const [now, setNow] = useState(Date.now())
  useEffect(() => {
    const t = setInterval(() => setNow(Date.now()), 1000)
    return () => clearInterval(t)
  }, [])
  const secondes = Math.max(0, Math.floor((now - depart) / 1000))
  const depasse = secondes > limiteMinutes * 60
  return (
    <span className={`chrono ${depasse ? 'c-red' : ''}`}>
      <Timer size={15} /> {dureeTexte(secondes)}
      {depasse ? ' · temps dépassé' : ` / ${limiteMinutes} min`}
    </span>
  )
}

export function NegoPage() {
  const { examen, session, pret, erreur, charger, demarrer } = useNego()
  const [busy, setBusy] = useState(false)

  useEffect(() => {
    void charger()
  }, [charger])

  if (!pret) return <div className="page">Chargement de la formation négociation…</div>

  if (session && !session.rendu) return <Examen />
  if (session && session.rendu) return <Resultat />

  return (
    <div className="page">
      <PageHeader
        icon={Handshake}
        title="Formation négociation"
        subtitle="Théorie en direct avec ton formateur, puis mise en situation sur le terrain."
      />

      {erreur && <div className="form-error">{erreur}</div>}

      <Panel title="Avant de commencer">
        <ul className="liste-consignes">
          <li>Ton formateur te lit le texte d’introduction et vérifie que ton stream est lancé.</li>
          <li>
            {examen?.questions.length ?? 15} questions, {examen?.fautesMax ?? 5} fautes maximum, {examen?.dureeMinutes ?? 20} minutes
            indicatives. Certaines questions sont éliminatoires.
          </li>
          <li>Pendant l’examen le reste du site est bloqué : tu ne peux plus ouvrir le mémo ni tes dossiers.</li>
          <li>Ton formateur voit tes réponses arriver en direct. Les résultats te seront donnés après la pratique.</li>
        </ul>
        <div className="step-nav">
          <span className="muted small">
            <Lock size={14} /> Une fois commencé, tu ne peux plus revenir en arrière.
          </span>
          <button
            type="button"
            className="btn btn-primary"
            disabled={busy}
            onClick={() => {
              setBusy(true)
              void demarrer().finally(() => setBusy(false))
            }}
          >
            <PlayCircle size={15} /> Commencer l’examen
          </button>
        </div>
      </Panel>
    </div>
  )
}

function Examen() {
  const { examen, session, envoi, erreur, choisir, rendre } = useNego()
  const [confirme, setConfirme] = useState(false)
  const [busy, setBusy] = useState(false)
  const depart = useMemo(() => (session ? Date.parse(session.debut) : Date.now()), [session])

  if (!examen || !session) return null

  const repondues = examen.questions.filter((q) => (session.reponses[q.id] ?? []).length > 0).length
  const total = examen.questions.length

  return (
    <div className="examen">
      <div className="page">
        <PageHeader
          icon={Handshake}
          title="Examen théorique — négociation"
          subtitle={`${repondues} / ${total} questions répondues · ton formateur suit en direct`}
          right={
            <>
              <Chrono depart={depart} limiteMinutes={examen.dureeMinutes} />
              <span className="muted small">{envoi ? 'envoi…' : 'réponses enregistrées'}</span>
            </>
          }
        />

        {erreur && <div className="form-error">{erreur}</div>}

        <div className="stack gap-12">
          {examen.questions.map((q, n) => {
            const choix = session.reponses[q.id] ?? []
            return (
              <Panel key={q.id} className={choix.length ? 'question-panel repondue' : 'question-panel'}>
                <div className="question">
                  <strong>
                    {n + 1}. {q.texte}
                  </strong>
                  {q.type === 'multiple' && <small className="muted">Plusieurs réponses possibles</small>}
                  <div className="stack gap-6">
                    {q.options.map((o) => {
                      const on = choix.includes(o.id)
                      return (
                        <button
                          type="button"
                          key={o.id}
                          className={`reponse ${on ? 'on' : ''}`}
                          onClick={() => choisir(q.id, o.id, q.type === 'unique')}
                        >
                          <span className={`reponse-box ${q.type === 'unique' ? 'rond' : ''}`}>
                            {on && <CheckCircle2 size={13} strokeWidth={3} />}
                          </span>
                          {o.texte}
                        </button>
                      )
                    })}
                  </div>
                </div>
              </Panel>
            )
          })}
        </div>

        <div className="step-nav">
          <span className="muted small">
            {repondues < total ? `Il te reste ${total - repondues} question(s) sans réponse.` : 'Toutes les questions ont une réponse.'}
          </span>
          {confirme ? (
            <button
              type="button"
              className="btn btn-primary"
              disabled={busy}
              onClick={() => {
                setBusy(true)
                void rendre().finally(() => setBusy(false))
              }}
            >
              <Send size={15} /> Confirmer, je rends ma copie
            </button>
          ) : (
            <button type="button" className="btn btn-primary" onClick={() => setConfirme(true)}>
              Rendre ma copie
            </button>
          )}
        </div>
      </div>
    </div>
  )
}

function Resultat() {
  const { session, charger, fermerRecap } = useNego()
  const [busy, setBusy] = useState(false)
  if (!session) return null

  if (!session.publie) {
    return (
      <div className="page">
        <PageHeader icon={Clock} title="Copie rendue" subtitle="Ton formateur reprend la main." />
        <Empty
          icon={Clock}
          title="Résultats en attente"
          text={`Copie rendue le ${dateTimeFr(session.fin ?? session.debut)} en ${dureeTexte(session.dureeSecondes)}. Tes résultats te seront donnés après la partie pratique.`}
        >
          <button
            type="button"
            className="btn"
            disabled={busy}
            onClick={() => {
              setBusy(true)
              void charger().finally(() => setBusy(false))
            }}
          >
            <RefreshCw size={15} /> Vérifier si les résultats sont publiés
          </button>
        </Empty>
      </div>
    )
  }

  const verdict = verdictNego(session)
  const admis = verdict === 'admis'
  const t = session.theorie
  const p = session.pratique

  return (
    <div className="page">
      <PageHeader
        icon={admis ? CheckCircle2 : AlertTriangle}
        title="Résultat de ta formation négociation"
        subtitle={`Session du ${dateTimeFr(session.debut)}${session.formateur ? ` · formateur : ${session.formateur}` : ''}`}
        right={
          <button type="button" className="btn" onClick={fermerRecap}>
            Fermer
          </button>
        }
      />

      <div className={`checklist-head ${admis ? 'fini' : ''}`}>
        {admis ? <CheckCircle2 size={22} /> : <AlertTriangle size={22} />}
        <div>
          <strong>{admis ? 'ADMIS' : 'ÉCHOUÉ'}</strong>
          <span>
            {t ? `Théorie : ${t.justes}/${t.total}, ${t.fautes} faute(s).` : ''}
            {p ? ` Pratique : ${p.total}/${NOTE_MAX_PRATIQUE}.` : ''}
            {t && t.eliminatoiresRatees.length > 0 ? ' Une question éliminatoire a été ratée.' : ''}
            {p?.eliminatoire ? ' Un critère éliminatoire a été raté en pratique.' : ''}
          </span>
        </div>
      </div>

      {p && (
        <Panel title={`Partie pratique — ${p.total}/${NOTE_MAX_PRATIQUE} (admis à partir de ${NOTE_ADMIS})`}>
          <div className="stack gap-6">
            {CRITERES_PRATIQUE.map((c) => {
              const n = p.notes[c.id]
              return (
                <div className="critere-ligne" key={c.id}>
                  <span>{c.titre}</span>
                  <Badge tone={n === 2 ? 'green' : n === 1 ? 'amber' : 'red'}>{typeof n === 'number' ? `${n}/2` : '—'}</Badge>
                </div>
              )
            })}
          </div>
          {p.commentaire && <p className="formation-texte" style={{ marginTop: 12 }}>{p.commentaire}</p>}
        </Panel>
      )}

      {t && (
        <>
          <div className="section-title">
            <Circle size={16} /> Ta copie corrigée
          </div>
          <Correction details={t.details} />
        </>
      )}
    </div>
  )
}
