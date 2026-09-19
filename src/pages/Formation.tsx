import { useEffect, useMemo, useState } from 'react'
import { AlertTriangle, CheckCircle2, ClipboardCheck, GraduationCap, Lock, PlayCircle, Timer, XCircle } from 'lucide-react'
import type { FormationResultat, FormationScenario, ReponseDossier } from '@shared/formation'
import { SEUIL_REUSSITE } from '@shared/formation'
import type { Cooperation, Suspect, YesNo } from '@shared/types'
import { newSuspect, useStore } from '../store'
import { corriger, reponseVide, useFormations } from '../formation'
import { formationImgUrl } from '../api'
import { COOPERATION } from '../report'
import { accusationSuggestions } from '../data/infractions'
import { dateTimeFr } from '../lib/format'
import { Badge, ChipsInput, Empty, Field, PageHeader, Panel, Segmented, TextArea } from '../components/ui'
import { SaisiesEditor } from '../components/SaisiesEditor'

function duree(secondes: number): string {
  const m = Math.floor(secondes / 60)
  const s = secondes % 60
  return `${m} min ${String(s).padStart(2, '0')}`
}

function Chrono({ depart }: { depart: number }) {
  const [now, setNow] = useState(Date.now())
  useEffect(() => {
    const t = setInterval(() => setNow(Date.now()), 1000)
    return () => clearInterval(t)
  }, [])
  const secondes = Math.floor((now - depart) / 1000)
  return (
    <span className={`chrono ${secondes > 25 * 60 ? 'c-amber' : ''}`}>
      <Timer size={15} /> {duree(secondes)}
    </span>
  )
}

export function FormationPage() {
  const { scenarios, charger } = useFormations()
  const resultats = useStore((s) => s.db.formations) ?? []
  const [enCours, setEnCours] = useState<FormationScenario | null>(null)
  const [recap, setRecap] = useState<FormationResultat | null>(null)

  useEffect(() => {
    void charger()
  }, [charger])

  const actifs = useMemo(() => scenarios.filter((s) => s.actif).sort((a, b) => a.niveau - b.niveau), [scenarios])
  const meilleur = (id: string) => resultats.filter((r) => r.scenarioId === id).sort((a, b) => b.pourcentage - a.pourcentage)[0]
  const niveauValide = (niveau: number) => resultats.some((r) => r.niveau === niveau && r.valide)

  if (recap) return <Recap resultat={recap} onFermer={() => setRecap(null)} />
  if (enCours) return <Exercice scenario={enCours} onFini={(r) => { setEnCours(null); setRecap(r) }} onAbandon={() => setEnCours(null)} />

  return (
    <div className="page">
      <PageHeader
        icon={GraduationCap}
        title="Formation casier rookie"
        subtitle={`Trois exercices pour apprendre à monter un dossier. Validé à partir de ${SEUIL_REUSSITE} %.`}
      />

      {actifs.length === 0 ? (
        <Empty icon={GraduationCap} title="Aucun exercice disponible" text="Un admin doit en créer dans Gestion formation." />
      ) : (
        <div className="stack gap-12">
          {actifs.map((s) => {
            const best = meilleur(s.id)
            const verrouille = s.niveau > 1 && !niveauValide(s.niveau - 1)
            return (
              <Panel key={s.id} className="formation-card">
                <div className="formation-head">
                  <span className={`formation-niveau n${s.niveau}`}>Niveau {s.niveau}</span>
                  <div className="formation-titre">
                    <strong>{s.titre}</strong>
                    <small className="muted">{s.resume}</small>
                  </div>
                  {best && (
                    <Badge tone={best.valide ? 'green' : 'amber'}>
                      Meilleur score : {best.pourcentage} %
                    </Badge>
                  )}
                  {verrouille ? (
                    <span className="muted small">
                      <Lock size={14} /> Réussis le niveau {s.niveau - 1} pour débloquer
                    </span>
                  ) : (
                    <button type="button" className="btn btn-primary" onClick={() => setEnCours(s)}>
                      <PlayCircle size={15} /> {best ? 'Refaire' : 'Commencer'}
                    </button>
                  )}
                </div>
                {best && (
                  <small className="muted">
                    Dernier essai : {dateTimeFr(best.date)} · {duree(best.dureeSecondes)}
                  </small>
                )}
              </Panel>
            )
          })}
        </div>
      )}

      {resultats.length > 0 && (
        <>
          <div className="section-title">
            <ClipboardCheck size={16} /> Mes essais
          </div>
          <div className="stack gap-8">
            {[...resultats]
              .reverse()
              .slice(0, 10)
              .map((r, n) => (
                <div className="row-card" key={n}>
                  <div className={`row-card-icon ${r.valide ? 'green' : 'amber'}`}>
                    {r.valide ? <CheckCircle2 size={17} /> : <AlertTriangle size={17} />}
                  </div>
                  <div className="row-card-text">
                    <strong>{r.titre}</strong>
                    <small>
                      {dateTimeFr(r.date)} · {r.points}/{r.total} · {duree(r.dureeSecondes)}
                    </small>
                  </div>
                  <Badge tone={r.valide ? 'green' : 'red'}>{r.pourcentage} %</Badge>
                  <button type="button" className="btn" onClick={() => setRecap(r)}>
                    Voir la correction
                  </button>
                </div>
              ))}
          </div>
        </>
      )}
    </div>
  )
}

function Exercice({ scenario, onFini, onAbandon }: { scenario: FormationScenario; onFini: (r: FormationResultat) => void; onAbandon: () => void }) {
  const ajouterResultat = useStore((s) => s.ajouterResultatFormation)
  const learned = useStore((s) => s.db.learned.accusations)
  const toast = useStore((s) => s.toast)
  const [depart] = useState(() => Date.now())
  const [choix, setChoix] = useState<Record<string, string[]>>({})
  const [rep, setRep] = useState<ReponseDossier>(reponseVide)
  const [confirme, setConfirme] = useState(false)

  const aide = scenario.niveau === 1

  function basculer(questionId: string, optionId: string, unique: boolean) {
    setChoix((cur) => {
      const actuel = cur[questionId] ?? []
      if (unique) return { ...cur, [questionId]: actuel.includes(optionId) ? [] : [optionId] }
      return { ...cur, [questionId]: actuel.includes(optionId) ? actuel.filter((x) => x !== optionId) : [...actuel, optionId] }
    })
  }

  // Le rookie remplit la fouille avec l'éditeur habituel de l'appli.
  const fauxSuspect: Suspect = { ...newSuspect(), saisies: rep.saisies as Suspect['saisies'], rienSurLui: rep.rienSurLui, ppa: rep.ppa }

  function rendre() {
    const secondes = Math.floor((Date.now() - depart) / 1000)
    const resultat = corriger(scenario, choix, rep, secondes)
    ajouterResultat(resultat)
    toast(resultat.valide ? 'ok' : 'info', resultat.valide ? `Validé avec ${resultat.pourcentage} %` : `${resultat.pourcentage} % : regarde la correction`)
    onFini(resultat)
  }

  return (
    <div className="page">
      <PageHeader
        icon={GraduationCap}
        title={scenario.titre}
        subtitle={`Niveau ${scenario.niveau} · ${aide ? 'ton formateur te guide' : scenario.niveau === 2 ? 'peu d’aide' : 'aucune aide'}`}
        right={
          <>
            <Chrono depart={depart} />
            <button type="button" className="btn" onClick={onAbandon}>
              Abandonner
            </button>
          </>
        }
      />

      <div className="formation-layout">
        <aside className="stack">
          <Panel title="La scène">
            <p className="formation-texte">{scenario.contexte}</p>
          </Panel>
          <Panel title="Ce qu’il a sur lui">
            <pre className="formation-fiche">{scenario.surLui}</pre>
            {scenario.screens.length > 0 && (
              <div className="slot-grid" style={{ marginTop: 12 }}>
                {scenario.screens.map((img) => (
                  <a key={img.id} className="thumb" href={formationImgUrl(img.file)} target="_blank" rel="noreferrer">
                    <img src={formationImgUrl(img.file)} alt="" loading="lazy" />
                  </a>
                ))}
              </div>
            )}
          </Panel>
        </aside>

        <div className="stack">
          <Panel title="Questions" icon={ClipboardCheck}>
            <div className="stack gap-16">
              {scenario.questions.map((q, n) => (
                <div key={q.id} className="question">
                  <strong>
                    {n + 1}. {q.texte}
                  </strong>
                  {q.type === 'multiple' && <small className="muted">Plusieurs réponses possibles</small>}
                  <div className="stack gap-6">
                    {q.options.map((o) => {
                      const on = (choix[q.id] ?? []).includes(o.id)
                      return (
                        <button type="button" key={o.id} className={`reponse ${on ? 'on' : ''}`} onClick={() => basculer(q.id, o.id, q.type === 'unique')}>
                          <span className={`reponse-box ${q.type === 'unique' ? 'rond' : ''}`}>{on && <CheckCircle2 size={13} strokeWidth={3} />}</span>
                          {o.texte}
                        </button>
                      )
                    })}
                  </div>
                  {aide && q.indice && <p className="indice">Formateur : {q.indice}</p>}
                </div>
              ))}
            </div>
          </Panel>

          <Panel title="Le dossier" icon={ClipboardCheck}>
            <div className="stack gap-16">
              <Field label="Accusations retenues" wide>
                <ChipsInput
                  values={rep.accusations}
                  onChange={(v) => setRep({ ...rep, accusations: v })}
                  suggestions={accusationSuggestions(learned)}
                  placeholder="Tape une accusation puis Entrée"
                />
              </Field>

              <Field label="Objets saisis à la fouille" wide>
                <SaisiesEditor
                  suspect={fauxSuspect}
                  onChange={(p) => {
                    const patch = typeof p === 'function' ? p(fauxSuspect) : p
                    setRep((cur) => ({
                      ...cur,
                      saisies: (patch.saisies ?? cur.saisies) as ReponseDossier['saisies'],
                      rienSurLui: patch.rienSurLui ?? cur.rienSurLui
                    }))
                  }}
                />
              </Field>

              <div className="form-grid">
                <Field label="Avis de recherche ?">
                  <Segmented
                    tone="yesno"
                    value={rep.recherche}
                    onChange={(v: YesNo) => setRep({ ...rep, recherche: v })}
                    options={[
                      { value: 'oui' as const, label: 'Oui' },
                      { value: 'non' as const, label: 'Non' }
                    ]}
                  />
                </Field>
                <Field label="Bracelet électronique ?">
                  <Segmented
                    tone="yesno"
                    value={rep.bracelet}
                    onChange={(v: YesNo) => setRep({ ...rep, bracelet: v })}
                    options={[
                      { value: 'oui' as const, label: 'Oui' },
                      { value: 'non' as const, label: 'Non' }
                    ]}
                  />
                </Field>
                <Field label="PPA du suspect" wide>
                  <Segmented
                    value={rep.ppa}
                    onChange={(v: number) => setRep({ ...rep, ppa: v })}
                    options={[
                      { value: 0, label: 'Aucun' },
                      { value: 1, label: 'Niv. 1' },
                      { value: 2, label: 'Niv. 2' },
                      { value: 3, label: 'Niv. 3' },
                      { value: 4, label: 'Niv. 4' }
                    ]}
                  />
                </Field>
                <Field label="Coopérativité" wide>
                  <Segmented
                    value={rep.cooperation}
                    onChange={(v: Cooperation) => setRep({ ...rep, cooperation: v })}
                    options={COOPERATION.map((c) => ({ value: c.key, label: c.label.charAt(0).toUpperCase() + c.label.slice(1) }))}
                  />
                </Field>
              </div>

              <Field label="Ton rapport" wide hint="Il n’est pas noté automatiquement : un formateur le relit.">
                <TextArea value={rep.rapport} onChange={(v) => setRep({ ...rep, rapport: v })} rows={8} placeholder="Rédige ton rapport comme pour une vraie procédure." />
              </Field>
            </div>
          </Panel>

          <div className="step-nav">
            <span className="muted small">Tu ne verras la correction qu’après avoir rendu ta copie.</span>
            {confirme ? (
              <button type="button" className="btn btn-primary" onClick={rendre}>
                <CheckCircle2 size={15} /> Confirmer et voir la correction
              </button>
            ) : (
              <button type="button" className="btn btn-primary" onClick={() => setConfirme(true)}>
                Rendre ma copie
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

function Recap({ resultat, onFermer }: { resultat: FormationResultat; onFermer: () => void }) {
  return (
    <div className="page">
      <PageHeader
        icon={resultat.valide ? CheckCircle2 : AlertTriangle}
        title={`Correction · ${resultat.titre}`}
        subtitle={`${resultat.points} bonnes réponses sur ${resultat.total} · ${duree(resultat.dureeSecondes)}`}
        right={
          <button type="button" className="btn" onClick={onFermer}>
            Retour à la formation
          </button>
        }
      />

      <div className={`checklist-head ${resultat.valide ? 'fini' : ''}`}>
        {resultat.valide ? <CheckCircle2 size={22} /> : <AlertTriangle size={22} />}
        <div>
          <strong>
            {resultat.pourcentage} % — {resultat.valide ? 'exercice validé' : `il faut ${SEUIL_REUSSITE} % pour valider`}
          </strong>
          <span>{resultat.valide ? 'Le niveau suivant est débloqué.' : 'Regarde les lignes en rouge et refais l’exercice.'}</span>
        </div>
      </div>

      <div className="stack gap-6" style={{ marginTop: 16 }}>
        {resultat.details.map((d, n) => (
          <div className={`correction ${d.bon ? 'ok' : 'ko'}`} key={n}>
            {d.bon ? <CheckCircle2 size={16} /> : <XCircle size={16} />}
            <span>{d.libelle}</span>
          </div>
        ))}
      </div>

      {resultat.rapport && (
        <Panel title="Ton rapport (relu par un formateur)" className="panel-wide" >
          <pre className="fiche-rapport">{resultat.rapport}</pre>
        </Panel>
      )}
    </div>
  )
}
