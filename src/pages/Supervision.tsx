import { useEffect, useState } from 'react'
import { CheckCircle2, Eye, GraduationCap, Hand, MessageSquareWarning, RefreshCw, Send, UserRound, XCircle } from 'lucide-react'
import type { AgentSummary } from '@shared/types'
import type { FormationResultat } from '@shared/formation'
import { api } from '../api'
import { useAuth } from '../auth'
import { useControl } from '../control'
import { useStore } from '../store'
import { dateTimeFr } from '../lib/format'
import { Badge, Empty, PageHeader, Panel, TextArea } from '../components/ui'

export function SupervisionPage() {
  const me = useAuth((s) => s.me)
  const toast = useStore((s) => s.toast)
  const prendre = useControl((s) => s.prendre)
  const busy = useControl((s) => s.busy)
  const [agents, setAgents] = useState<AgentSummary[]>([])
  const [erreur, setErreur] = useState('')
  const [messagePour, setMessagePour] = useState<string | null>(null)
  const [message, setMessage] = useState('')
  const [formationsPour, setFormationsPour] = useState<string | null>(null)
  const [formations, setFormations] = useState<FormationResultat[]>([])

  async function voirFormations(agent: AgentSummary) {
    if (formationsPour === agent.id) {
      setFormationsPour(null)
      return
    }
    setFormationsPour(agent.id)
    setFormations([])
    try {
      const db = await api.adminDb(agent.id)
      setFormations([...(db?.formations ?? [])].reverse())
    } catch (err) {
      toast('error', err instanceof Error ? err.message : 'Lecture impossible')
    }
  }

  useEffect(() => {
    let vivant = true
    const charger = () =>
      api
        .adminAgents()
        .then((list) => vivant && setAgents(list))
        .catch((err) => vivant && setErreur(err instanceof Error ? err.message : 'Chargement impossible'))
    void charger()
    const t = setInterval(charger, 10000)
    return () => {
      vivant = false
      clearInterval(t)
    }
  }, [])

  async function envoyer(agent: AgentSummary) {
    try {
      await api.adminSendNote(agent.id, { text: message })
      toast('ok', `Message envoyé à ${agent.username}.`)
      setMessage('')
      setMessagePour(null)
    } catch (err) {
      toast('error', err instanceof Error ? err.message : 'Envoi impossible')
    }
  }

  const autres = agents.filter((a) => a.id !== me?.id)

  return (
    <div className="page">
      <PageHeader
        icon={Eye}
        title="Procédures des agents"
        subtitle="Suivi en direct · prends la main pour remplir un dossier à leur place"
        right={
          <span className="muted small">
            <RefreshCw size={13} /> actualisé toutes les 10 s
          </span>
        }
      />

      {erreur && <div className="form-error">{erreur}</div>}

      {autres.length === 0 ? (
        <Empty icon={UserRound} title="Aucun autre agent" text="Crée leurs comptes dans Réglages → Comptes des collègues." />
      ) : (
        <div className="stack gap-12">
          {autres.map((a) => (
            <Panel key={a.id} className="agent-panel">
              <div className="agent-head">
                <div className="agent-ident">
                  <span className="agent-avatar">
                    <UserRound size={20} />
                  </span>
                  <div>
                    <strong>{a.username}</strong>
                    <small className="muted">
                      {a.majA ? `Dernière activité : ${dateTimeFr(a.majA)}` : 'Aucune intervention pour le moment'}
                    </small>
                  </div>
                </div>
                <div className="row gap-8">
                  {a.enCours > 0 && <Badge tone="amber">{a.enCours} en cours</Badge>}
                  {a.notesNonLues > 0 && <Badge tone="blue">{a.notesNonLues} message(s) non lu(s)</Badge>}
                  <button type="button" className="btn" onClick={() => void voirFormations(a)}>
                    <GraduationCap size={15} /> Formations{a.formations ? ` (${a.formationsValidees}/${a.formations})` : ''}
                  </button>
                  <button type="button" className="btn" onClick={() => setMessagePour(messagePour === a.id ? null : a.id)}>
                    <MessageSquareWarning size={15} /> Message
                  </button>
                  <button type="button" className="btn btn-primary" disabled={busy} onClick={() => void prendre(a)}>
                    <Hand size={15} /> Prendre la main
                  </button>
                </div>
              </div>

              <div className="agent-stats">
                <div>
                  <strong>{a.interventions}</strong>
                  <small>interventions</small>
                </div>
                <div>
                  <strong>{a.suspects}</strong>
                  <small>suspects</small>
                </div>
                <div>
                  <strong>{a.screens}</strong>
                  <small>screens</small>
                </div>
              </div>

              {formationsPour === a.id && (
                <div className="stack gap-8" style={{ marginTop: 14 }}>
                  {formations.length === 0 ? (
                    <p className="muted small">Aucun exercice passé pour le moment.</p>
                  ) : (
                    formations.map((f, n) => (
                      <div className="formation-resultat" key={n}>
                        <div className="row gap-8">
                          {f.valide ? <CheckCircle2 size={16} className="c-green" /> : <XCircle size={16} className="c-red" />}
                          <strong>{f.titre}</strong>
                          <Badge tone={f.valide ? 'green' : 'red'}>{f.pourcentage} %</Badge>
                          <small className="muted">
                            {dateTimeFr(f.date)} · {f.points}/{f.total}
                          </small>
                        </div>
                        {f.rapport && <pre className="fiche-rapport">{f.rapport}</pre>}
                        <details>
                          <summary className="muted small">Voir le détail de la correction</summary>
                          <div className="stack gap-6" style={{ marginTop: 8 }}>
                            {f.details.map((d, k) => (
                              <div className={`correction ${d.bon ? 'ok' : 'ko'}`} key={k}>
                                {d.bon ? <CheckCircle2 size={15} /> : <XCircle size={15} />}
                                <span>{d.libelle}</span>
                              </div>
                            ))}
                          </div>
                        </details>
                      </div>
                    ))
                  )}
                </div>
              )}

              {messagePour === a.id && (
                <div className="agent-message">
                  <TextArea
                    value={message}
                    onChange={setMessage}
                    rows={2}
                    placeholder={`Ex : « Je prends la main sur ta fouille, regarde ce que je remplis. »`}
                  />
                  <button type="button" className="btn btn-primary" disabled={!message.trim()} onClick={() => void envoyer(a)}>
                    <Send size={15} /> Envoyer
                  </button>
                </div>
              )}
            </Panel>
          ))}
        </div>
      )}

      <p className="muted small" style={{ marginTop: 16 }}>
        Pendant la prise en main, tout ce que tu écris est enregistré dans le dossier de l’agent et apparaît chez lui en quelques secondes. Ses propres
        modifications arrivent aussi chez toi : si vous écrivez au même endroit en même temps, la dernière version enregistrée gagne.
      </p>
    </div>
  )
}
