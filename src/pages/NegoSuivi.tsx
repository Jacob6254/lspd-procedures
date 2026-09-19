import { useCallback, useEffect, useRef, useState } from 'react'
import {
  AlertTriangle,
  BookOpen,
  CheckCircle2,
  ClipboardCopy,
  Eye,
  Handshake,
  Megaphone,
  RefreshCw,
  Send,
  Trash2,
  UserRound
} from 'lucide-react'
import type { NegoConfig, NegoSession } from '@shared/nego'
import { CRITERES_PRATIQUE, NOTE_ADMIS, NOTE_MAX_PRATIQUE, calculerPratique, pratiqueComplete, verdictNego } from '@shared/nego'
import { api } from '../api'
import { useAuth } from '../auth'
import { useStore } from '../store'
import { dateTimeFr } from '../lib/format'
import { Badge, ConfirmButton, Empty, PageHeader, Panel, TextArea } from '../components/ui'
import { dureeTexte } from './Nego'

function etatSession(s: NegoSession, total: number): { texte: string; tone: 'blue' | 'amber' | 'green' | 'red' | 'grey' } {
  if (!s.rendu) {
    const repondues = Object.values(s.reponses).filter((r) => r.length > 0).length
    return { texte: `en cours · ${repondues}/${total}`, tone: 'blue' }
  }
  if (!s.publie) return { texte: pratiqueComplete(s.pratique) ? 'à publier' : 'copie rendue', tone: 'amber' }
  return verdictNego(s) === 'admis' ? { texte: 'ADMIS', tone: 'green' } : { texte: 'ÉCHOUÉ', tone: 'red' }
}

export function NegoSuiviPage() {
  const me = useAuth((s) => s.me)
  const [config, setConfig] = useState<NegoConfig | null>(null)
  const [sessions, setSessions] = useState<NegoSession[]>([])
  const [ouverte, setOuverte] = useState<string | null>(null)
  const [erreur, setErreur] = useState('')

  const recharger = useCallback(async () => {
    try {
      const [c, list] = await Promise.all([api.negoConfig(), api.negoSessions()])
      setConfig(c)
      setSessions(list)
      setErreur('')
    } catch (err) {
      setErreur(err instanceof Error ? err.message : 'Chargement impossible')
    }
  }, [])

  useEffect(() => {
    void recharger()
  }, [recharger])

  // Les sessions en cours bougent tout le temps : on rafraîchit la liste toute seule.
  useEffect(() => {
    if (ouverte) return
    const t = setInterval(() => {
      if (!document.hidden) void recharger()
    }, 5000)
    return () => clearInterval(t)
  }, [ouverte, recharger])

  if (ouverte && config) {
    return (
      <SuiviSession
        id={ouverte}
        config={config}
        onFermer={() => {
          setOuverte(null)
          void recharger()
        }}
      />
    )
  }

  const total = config?.questions.length ?? 0

  return (
    <div className="page">
      <PageHeader
        icon={Handshake}
        title="Suivi négociation"
        subtitle="Les candidats en examen, leurs réponses en direct et la notation de la pratique."
        right={
          <button type="button" className="btn" onClick={() => void recharger()}>
            <RefreshCw size={15} /> Actualiser
          </button>
        }
      />

      {erreur && <div className="form-error">{erreur}</div>}

      {config && (
        <div className="nego-docs">
          <Panel title="Texte à lire aux candidats" icon={Megaphone}>
            <pre className="formation-fiche">{config.texteFormateur}</pre>
            <button type="button" className="btn" onClick={() => void api.copyText(config.texteFormateur)}>
              <ClipboardCopy size={15} /> Copier le texte
            </button>
          </Panel>
          <Panel title="Déroulement de la formation" icon={BookOpen}>
            <pre className="formation-fiche">{config.consignes}</pre>
          </Panel>
        </div>
      )}

      <div className="section-title">
        <Eye size={16} /> Sessions
      </div>

      {sessions.length === 0 ? (
        <Empty icon={UserRound} title="Aucune session" text="Un candidat doit lancer l’examen depuis « Formation négociation »." />
      ) : (
        <div className="stack gap-8">
          {sessions.map((s) => {
            const etat = etatSession(s, total)
            return (
              <div className="row-card" key={s.id}>
                <div className={`row-card-icon ${!s.rendu ? 'blue' : verdictNego(s) === 'admis' ? 'green' : 'amber'}`}>
                  <UserRound size={17} />
                </div>
                <div className="row-card-text">
                  <strong>
                    {s.candidat} <span className="muted small">· {s.grade}</span>
                  </strong>
                  <small>
                    {dateTimeFr(s.debut)}
                    {s.rendu ? ` · rendu en ${dureeTexte(s.dureeSecondes)}` : ''}
                    {s.formateur ? ` · noté par ${s.formateur}` : ''}
                  </small>
                </div>
                <Badge tone={etat.tone}>{etat.texte}</Badge>
                <button type="button" className="btn btn-primary" onClick={() => setOuverte(s.id)}>
                  <Eye size={15} /> {s.rendu ? 'Ouvrir' : 'Suivre en direct'}
                </button>
                {me?.role === 'admin' && (
                  <ConfirmButton
                    icon={Trash2}
                    label="Supprimer"
                    confirmLabel="Confirmer"
                    onConfirm={() => void api.negoSupprimer(s.id).then(recharger)}
                  />
                )}
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}

function SuiviSession({ id, config, onFermer }: { id: string; config: NegoConfig; onFermer: () => void }) {
  const toast = useStore((s) => s.toast)
  const [s, setS] = useState<NegoSession | null>(null)
  const [notes, setNotes] = useState<Record<string, number>>({})
  const [commentaire, setCommentaire] = useState('')
  const [busy, setBusy] = useState(false)
  const [erreur, setErreur] = useState('')
  const grilleChargee = useRef(false)

  const relire = useCallback(async () => {
    try {
      const data = await api.negoSession(id)
      setS(data)
      if (!grilleChargee.current && data.pratique) {
        setNotes(data.pratique.notes)
        setCommentaire(data.pratique.commentaire)
      }
      grilleChargee.current = true
    } catch (err) {
      setErreur(err instanceof Error ? err.message : 'Session introuvable')
    }
  }, [id])

  useEffect(() => {
    void relire()
  }, [relire])

  // Suivi en direct tant que le candidat n'a pas rendu.
  useEffect(() => {
    if (s?.rendu) return
    const t = setInterval(() => {
      if (!document.hidden) void relire()
    }, 2500)
    return () => clearInterval(t)
  }, [s?.rendu, relire])

  if (!s) return <div className="page">{erreur || 'Chargement de la session…'}</div>

  const enDirect = !s.rendu
  const pratique = calculerPratique(notes, commentaire)
  const complet = pratiqueComplete(pratique)
  const verdictProvisoire = verdictNego({ theorie: s.theorie, pratique })

  async function enregistrer() {
    setBusy(true)
    try {
      setS(await api.negoPratique(id, notes, commentaire))
      toast('ok', 'Note de pratique enregistrée.')
    } catch (err) {
      setErreur(err instanceof Error ? err.message : 'Enregistrement impossible')
    } finally {
      setBusy(false)
    }
  }

  async function publier() {
    setBusy(true)
    try {
      await api.negoPratique(id, notes, commentaire)
      setS(await api.negoPublier(id))
      toast('ok', 'Résultats publiés : le candidat peut les voir.')
    } catch (err) {
      setErreur(err instanceof Error ? err.message : 'Publication impossible')
    } finally {
      setBusy(false)
    }
  }

  function compteRendu(): string {
    const v = verdictNego({ theorie: s!.theorie, pratique })
    const lignes = [
      'FORMATION NÉGOCIATION — LSPD',
      `Agent : ${s!.candidat} (${s!.grade})`,
      s!.formateur ? `Formateur : ${s!.formateur}` : '',
      `Date : ${dateTimeFr(s!.debut)}`,
      '',
      s!.theorie
        ? `THÉORIE : ${s!.theorie.justes}/${s!.theorie.total} — ${s!.theorie.fautes} faute(s) sur ${config.fautesMax} autorisées${
            s!.theorie.eliminatoiresRatees.length ? ` — ÉLIMINATOIRE RATÉE : ${s!.theorie.eliminatoiresRatees.join(' / ')}` : ''
          }`
        : 'THÉORIE : copie non rendue',
      `PRATIQUE : ${pratique.total}/${NOTE_MAX_PRATIQUE}${pratique.eliminatoire ? ' — CRITÈRE ÉLIMINATOIRE RATÉ' : ''}`,
      ...CRITERES_PRATIQUE.map((c) => `  - ${c.titre} : ${typeof notes[c.id] === 'number' ? `${notes[c.id]}/2` : 'non noté'}`),
      commentaire ? `Commentaire : ${commentaire}` : '',
      '',
      `RÉSULTAT : ${v === 'admis' ? 'ADMIS' : v === 'echoue' ? 'ÉCHOUÉ' : 'EN ATTENTE'}`
    ]
    return lignes.filter((l) => l !== '').join('\n')
  }

  return (
    <div className="page">
      <PageHeader
        icon={Handshake}
        title={`${s.candidat} · ${s.grade}`}
        subtitle={
          enDirect
            ? 'Examen en cours — les réponses arrivent en direct.'
            : `Copie rendue le ${dateTimeFr(s.fin ?? s.debut)} en ${dureeTexte(s.dureeSecondes)}.`
        }
        right={
          <>
            {enDirect && (
              <span className="chrono">
                <RefreshCw size={15} /> en direct
              </span>
            )}
            <button type="button" className="btn" onClick={onFermer}>
              Retour aux sessions
            </button>
          </>
        }
      />

      {erreur && <div className="form-error">{erreur}</div>}

      {s.theorie && (
        <div className={`checklist-head ${s.theorie.ok ? 'fini' : ''}`}>
          {s.theorie.ok ? <CheckCircle2 size={22} /> : <AlertTriangle size={22} />}
          <div>
            <strong>
              Théorie : {s.theorie.justes}/{s.theorie.total} — {s.theorie.fautes} faute(s) sur {config.fautesMax} autorisées
            </strong>
            <span>
              {s.theorie.eliminatoiresRatees.length
                ? `Éliminatoire ratée : ${s.theorie.eliminatoiresRatees.join(' · ')}`
                : 'Aucune question éliminatoire ratée.'}
            </span>
          </div>
        </div>
      )}

      <div className="nego-suivi">
        <div className="stack gap-12">
          {config.questions.map((q, n) => {
            const choix = s.reponses[q.id] ?? []
            const attendus = q.options.filter((o) => o.bon).map((o) => o.id)
            const juste = attendus.length === choix.length && attendus.every((x) => choix.includes(x))
            const repondu = choix.length > 0
            return (
              <Panel key={q.id} className={`question-panel ${repondu ? (juste ? 'ok' : 'ko') : ''}`}>
                <div className="question">
                  <strong>
                    {n + 1}. {q.texte}
                    {q.eliminatoire && (
                      <span style={{ marginLeft: 8 }}>
                        <Badge tone="red">éliminatoire</Badge>
                      </span>
                    )}
                  </strong>
                  <div className="stack gap-6">
                    {q.options.map((o) => {
                      const pris = choix.includes(o.id)
                      const etat = o.bon ? (pris ? 'juste' : 'manquee') : pris ? 'faux' : 'neutre'
                      return (
                        <div className={`copie-option ${etat}`} key={o.id}>
                          {etat === 'juste' && <CheckCircle2 size={14} />}
                          {etat === 'manquee' && <CheckCircle2 size={14} />}
                          {etat === 'faux' && <AlertTriangle size={14} />}
                          {etat === 'neutre' && <span style={{ width: 14 }} />}
                          <span>{o.texte}</span>
                          {o.bon && <small>bonne réponse</small>}
                          {pris && !o.bon && <small>son choix</small>}
                        </div>
                      )
                    })}
                  </div>
                  <p className="indice">À entendre : {q.aide}</p>
                </div>
              </Panel>
            )
          })}
        </div>

        <aside className="stack">
          <Panel title={`Pratique — ${pratique.total}/${NOTE_MAX_PRATIQUE}`} icon={ClipboardCopy}>
            <div className="stack gap-12">
              {CRITERES_PRATIQUE.map((c) => {
                const choisi = notes[c.id]
                const niveaux: { valeur: number; texte: string }[] = [{ valeur: 2, texte: c.deux }]
                if (c.un) niveaux.push({ valeur: 1, texte: c.un })
                niveaux.push({ valeur: 0, texte: c.zero })
                return (
                  <div className="critere" key={c.id}>
                    <strong>{c.titre}</strong>
                    <div className="stack gap-6">
                      {niveaux.map((niv) => {
                        const elim = niv.valeur === 0 && c.zeroEliminatoire
                        return (
                          <button
                            type="button"
                            key={niv.valeur}
                            className={`reponse ${choisi === niv.valeur ? 'on' : ''} ${elim && choisi === 0 ? 'ko' : ''}`}
                            onClick={() => setNotes({ ...notes, [c.id]: niv.valeur })}
                          >
                            <span className="reponse-box rond">{choisi === niv.valeur && <CheckCircle2 size={13} strokeWidth={3} />}</span>
                            <span>
                              <strong>{elim ? '0 — éliminatoire' : `${niv.valeur} pt${niv.valeur > 1 ? 's' : ''}`}</strong> · {niv.texte}
                            </span>
                          </button>
                        )
                      })}
                    </div>
                  </div>
                )
              })}

              <TextArea value={commentaire} onChange={setCommentaire} rows={4} placeholder="Commentaire pour le candidat (facultatif)" />

              <div className={`checklist-head ${verdictProvisoire === 'admis' ? 'fini' : ''}`}>
                {verdictProvisoire === 'admis' ? <CheckCircle2 size={20} /> : <AlertTriangle size={20} />}
                <div>
                  <strong>
                    {verdictProvisoire === 'admis' ? 'ADMIS' : verdictProvisoire === 'echoue' ? 'ÉCHOUÉ' : 'Grille incomplète'}
                  </strong>
                  <span>
                    {pratique.total}/{NOTE_MAX_PRATIQUE} · admis à partir de {NOTE_ADMIS}
                    {pratique.eliminatoire ? ' · critère éliminatoire raté' : ''}
                  </span>
                </div>
              </div>

              <div className="row gap-8">
                <button type="button" className="btn" disabled={busy || !s.rendu} onClick={() => void enregistrer()}>
                  Enregistrer la note
                </button>
                <button type="button" className="btn" onClick={() => void api.copyText(compteRendu())}>
                  <ClipboardCopy size={15} /> Compte-rendu
                </button>
              </div>
              <button
                type="button"
                className="btn btn-primary"
                disabled={busy || !s.rendu || (s.theorie?.ok === true && !complet) || s.publie}
                onClick={() => void publier()}
              >
                <Send size={15} /> {s.publie ? 'Résultats déjà publiés' : 'Publier les résultats au candidat'}
              </button>
              {!s.rendu && <small className="muted">Le candidat n’a pas encore rendu sa copie.</small>}
            </div>
          </Panel>

          <Panel title="Texte à lire" icon={Megaphone}>
            <pre className="formation-fiche">{config.texteFormateur}</pre>
          </Panel>
          <Panel title="Déroulement" icon={BookOpen}>
            <pre className="formation-fiche">{config.consignes}</pre>
          </Panel>
        </aside>
      </div>
    </div>
  )
}
