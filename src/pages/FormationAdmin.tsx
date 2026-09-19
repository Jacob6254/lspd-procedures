import { useEffect, useState } from 'react'
import { GraduationCap, ImagePlus, Plus, Save, Trash2 } from 'lucide-react'
import type { FormationQuestion, FormationScenario, NiveauFormation, SaisieAttendue } from '@shared/formation'
import type { Cooperation, SaisieType, YesNo } from '@shared/types'
import { api, formationImgUrl } from '../api'
import { nouveauScenario, useFormations } from '../formation'
import { useStore } from '../store'
import { COOPERATION } from '../report'
import { accusationSuggestions } from '../data/infractions'
import { uid } from '../lib/format'
import { Badge, ChipsInput, ConfirmButton, Empty, Field, PageHeader, Panel, Segmented, TextArea, TextInput, Toggle } from '../components/ui'

const TYPES: { value: SaisieType; label: string }[] = [
  { value: 'arme', label: 'Arme' },
  { value: 'munition', label: 'Munitions' },
  { value: 'drogue', label: 'Drogue' },
  { value: 'argent', label: 'Argent' },
  { value: 'autre', label: 'Autre' }
]

export function FormationAdminPage() {
  const { scenarios, charger, remplacer } = useFormations()
  const toast = useStore((s) => s.toast)
  const learned = useStore((s) => s.db.learned.accusations)
  const [liste, setListe] = useState<FormationScenario[]>([])
  const [selection, setSelection] = useState<string | null>(null)
  const [modifie, setModifie] = useState(false)

  useEffect(() => {
    void charger()
  }, [charger])

  useEffect(() => {
    if (!modifie) setListe(scenarios)
  }, [scenarios, modifie])

  const scenario = liste.find((s) => s.id === selection) ?? null

  function majScenario(patch: Partial<FormationScenario>) {
    if (!scenario) return
    setListe((cur) => cur.map((s) => (s.id === scenario.id ? { ...s, ...patch } : s)))
    setModifie(true)
  }

  function majQuestion(qid: string, patch: Partial<FormationQuestion>) {
    if (!scenario) return
    majScenario({ questions: scenario.questions.map((q) => (q.id === qid ? { ...q, ...patch } : q)) })
  }

  async function enregistrer() {
    try {
      const sauve = await api.saveFormations(liste)
      remplacer(sauve)
      setModifie(false)
      toast('ok', 'Scénarios enregistrés : tous les agents les voient maintenant.')
    } catch (err) {
      toast('error', err instanceof Error ? err.message : 'Enregistrement impossible')
    }
  }

  async function ajouterScreen(fichier: File) {
    if (!scenario) return
    try {
      const img = await api.uploadFormationImage(fichier)
      majScenario({ screens: [...scenario.screens, img] })
    } catch (err) {
      toast('error', err instanceof Error ? err.message : 'Envoi impossible')
    }
  }

  return (
    <div className="page">
      <PageHeader
        icon={GraduationCap}
        title="Gestion formation"
        subtitle="Les scénarios, les questions et les bonnes réponses vus par les rookies"
        right={
          <>
            <button
              type="button"
              className="btn"
              onClick={() => {
                const s = nouveauScenario(1)
                setListe((cur) => [...cur, s])
                setSelection(s.id)
                setModifie(true)
              }}
            >
              <Plus size={15} /> Nouveau scénario
            </button>
            <button type="button" className="btn btn-primary" disabled={!modifie} onClick={() => void enregistrer()}>
              <Save size={15} /> Enregistrer
            </button>
          </>
        }
      />

      {modifie && <div className="tip">Modifications non enregistrées : clique sur « Enregistrer » pour que les rookies les voient.</div>}

      <div className="formation-admin">
        <aside className="stack gap-8">
          {liste.length === 0 && <Empty icon={GraduationCap} title="Aucun scénario" />}
          {[...liste]
            .sort((a, b) => a.niveau - b.niveau)
            .map((s) => (
              <button type="button" key={s.id} className={`list-row ${selection === s.id ? 'actif' : ''}`} onClick={() => setSelection(s.id)}>
                <span className={`formation-niveau n${s.niveau}`}>N{s.niveau}</span>
                <span>{s.titre}</span>
                {!s.actif && <Badge tone="grey">Masqué</Badge>}
              </button>
            ))}
        </aside>

        {!scenario ? (
          <Empty icon={GraduationCap} title="Choisis un scénario" text="Ou crée-en un nouveau." />
        ) : (
          <div className="stack">
            <Panel title="Le scénario">
              <div className="form-grid">
                <Field label="Titre" wide>
                  <TextInput value={scenario.titre} onChange={(v) => majScenario({ titre: v })} />
                </Field>
                <Field label="Niveau">
                  <Segmented
                    value={scenario.niveau}
                    onChange={(v: NiveauFormation) => majScenario({ niveau: v })}
                    options={[
                      { value: 1 as const, label: 'Débutant' },
                      { value: 2 as const, label: 'Intermédiaire' },
                      { value: 3 as const, label: 'Confirmé' }
                    ]}
                  />
                </Field>
                <Field label="Visible par les rookies">
                  <Toggle checked={scenario.actif} onChange={(v) => majScenario({ actif: v })} label={scenario.actif ? 'Oui' : 'Non'} />
                </Field>
                <Field label="Résumé (une ligne)" wide>
                  <TextInput value={scenario.resume} onChange={(v) => majScenario({ resume: v })} />
                </Field>
                <Field label="La scène" wide hint="Ce qui s’est passé, comme si tu racontais l’intervention.">
                  <TextArea value={scenario.contexte} onChange={(v) => majScenario({ contexte: v })} rows={5} />
                </Field>
                <Field label="Ce qu’il a sur lui" wide hint="Identité, inventaire, casier, avis de recherche…">
                  <TextArea value={scenario.surLui} onChange={(v) => majScenario({ surLui: v })} rows={6} />
                </Field>
              </div>
            </Panel>

            <Panel
              title="Screens du scénario"
              right={
                <label className="btn">
                  <ImagePlus size={15} /> Ajouter une image
                  <input
                    type="file"
                    accept="image/*"
                    style={{ display: 'none' }}
                    onChange={(e) => {
                      const f = e.target.files?.[0]
                      if (f) void ajouterScreen(f)
                      e.target.value = ''
                    }}
                  />
                </label>
              }
            >
              {scenario.screens.length === 0 ? (
                <p className="muted">Ajoute la carte d’identité, l’inventaire, le casier… C’est ce que le rookie aura sous les yeux.</p>
              ) : (
                <div className="slot-grid">
                  {scenario.screens.map((img) => (
                    <div key={img.id} className="stack gap-6">
                      <a className="thumb" href={formationImgUrl(img.file)} target="_blank" rel="noreferrer">
                        <img src={formationImgUrl(img.file)} alt="" loading="lazy" />
                      </a>
                      <button
                        type="button"
                        className="btn btn-danger"
                        onClick={() => majScenario({ screens: scenario.screens.filter((x) => x.id !== img.id) })}
                      >
                        <Trash2 size={14} /> Retirer
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </Panel>

            <Panel
              title="Questions et bonnes réponses"
              right={
                <button
                  type="button"
                  className="btn"
                  onClick={() =>
                    majScenario({
                      questions: [
                        ...scenario.questions,
                        { id: uid(), texte: '', type: 'unique', options: [{ id: uid(), texte: '', bon: true }] }
                      ]
                    })
                  }
                >
                  <Plus size={15} /> Ajouter une question
                </button>
              }
            >
              <div className="stack gap-16">
                {scenario.questions.map((q, n) => (
                  <div className="question-edit" key={q.id}>
                    <div className="row gap-8">
                      <span className="step-num">{n + 1}</span>
                      <TextInput value={q.texte} onChange={(v) => majQuestion(q.id, { texte: v })} placeholder="La question posée au rookie" />
                      <Segmented
                        value={q.type}
                        onChange={(v: 'unique' | 'multiple') => majQuestion(q.id, { type: v })}
                        options={[
                          { value: 'unique' as const, label: 'Une réponse' },
                          { value: 'multiple' as const, label: 'Plusieurs' }
                        ]}
                      />
                      <button
                        type="button"
                        className="btn btn-icon btn-ghost"
                        aria-label="Supprimer la question"
                        onClick={() => majScenario({ questions: scenario.questions.filter((x) => x.id !== q.id) })}
                      >
                        <Trash2 size={15} />
                      </button>
                    </div>

                    <div className="stack gap-6" style={{ paddingLeft: 36 }}>
                      {q.options.map((o) => (
                        <div className="row gap-8" key={o.id}>
                          <Toggle
                            checked={o.bon}
                            onChange={(v) =>
                              majQuestion(q.id, {
                                options: q.options.map((x) =>
                                  x.id === o.id ? { ...x, bon: v } : q.type === 'unique' && v ? { ...x, bon: false } : x
                                )
                              })
                            }
                            label="Bonne"
                          />
                          <TextInput
                            value={o.texte}
                            onChange={(v) => majQuestion(q.id, { options: q.options.map((x) => (x.id === o.id ? { ...x, texte: v } : x)) })}
                            placeholder="Réponse proposée"
                          />
                          <button
                            type="button"
                            className="btn btn-icon btn-ghost"
                            aria-label="Supprimer la réponse"
                            onClick={() => majQuestion(q.id, { options: q.options.filter((x) => x.id !== o.id) })}
                          >
                            <Trash2 size={14} />
                          </button>
                        </div>
                      ))}
                      <button
                        type="button"
                        className="btn"
                        onClick={() => majQuestion(q.id, { options: [...q.options, { id: uid(), texte: '', bon: false }] })}
                      >
                        <Plus size={14} /> Réponse
                      </button>
                      <Field label="Indice du formateur (niveau 1 seulement)" wide>
                        <TextInput value={q.indice ?? ''} onChange={(v) => majQuestion(q.id, { indice: v })} />
                      </Field>
                    </div>
                  </div>
                ))}
              </div>
            </Panel>

            <Panel title="Le dossier attendu" icon={GraduationCap}>
              <div className="stack gap-16">
                <Field label="Accusations à retenir" wide>
                  <ChipsInput
                    values={scenario.attendu.accusations}
                    onChange={(v) => majScenario({ attendu: { ...scenario.attendu, accusations: v } })}
                    suggestions={accusationSuggestions(learned)}
                    placeholder="Tape une accusation puis Entrée"
                  />
                </Field>

                <Field label="Objets à saisir" wide>
                  <div className="stack gap-8">
                    {scenario.attendu.saisies.map((s: SaisieAttendue) => (
                      <div className="row gap-8" key={s.id}>
                        <select
                          className="input select"
                          style={{ width: 140 }}
                          value={s.type}
                          onChange={(e) =>
                            majScenario({
                              attendu: {
                                ...scenario.attendu,
                                saisies: scenario.attendu.saisies.map((x) => (x.id === s.id ? { ...x, type: e.target.value as SaisieType } : x))
                              }
                            })
                          }
                        >
                          {TYPES.map((t) => (
                            <option key={t.value} value={t.value}>
                              {t.label}
                            </option>
                          ))}
                        </select>
                        <TextInput
                          value={s.label}
                          onChange={(v) =>
                            majScenario({
                              attendu: { ...scenario.attendu, saisies: scenario.attendu.saisies.map((x) => (x.id === s.id ? { ...x, label: v } : x)) }
                            })
                          }
                          placeholder={s.type === 'argent' ? 'laisser vide' : 'nom exact de l’objet'}
                        />
                        <input
                          className="input"
                          style={{ width: 120 }}
                          type="number"
                          value={s.quantite ?? ''}
                          placeholder="Qté"
                          onChange={(e) =>
                            majScenario({
                              attendu: {
                                ...scenario.attendu,
                                saisies: scenario.attendu.saisies.map((x) =>
                                  x.id === s.id ? { ...x, quantite: e.target.value === '' ? null : Number(e.target.value) } : x
                                )
                              }
                            })
                          }
                        />
                        <button
                          type="button"
                          className="btn btn-icon btn-ghost"
                          aria-label="Retirer"
                          onClick={() =>
                            majScenario({ attendu: { ...scenario.attendu, saisies: scenario.attendu.saisies.filter((x) => x.id !== s.id) } })
                          }
                        >
                          <Trash2 size={15} />
                        </button>
                      </div>
                    ))}
                    <button
                      type="button"
                      className="btn"
                      onClick={() =>
                        majScenario({
                          attendu: {
                            ...scenario.attendu,
                            saisies: [...scenario.attendu.saisies, { id: uid(), type: 'arme', label: '', quantite: 1 }]
                          }
                        })
                      }
                    >
                      <Plus size={14} /> Objet
                    </button>
                    {scenario.attendu.saisies.length === 0 && (
                      <Toggle
                        checked={scenario.attendu.rienSurLui}
                        onChange={(v) => majScenario({ attendu: { ...scenario.attendu, rienSurLui: v } })}
                        label="Le rookie doit cocher « rien d’illégal sur lui »"
                      />
                    )}
                  </div>
                </Field>

                <div className="form-grid">
                  <Field label="Avis de recherche">
                    <Segmented
                      tone="yesno"
                      value={scenario.attendu.recherche}
                      onChange={(v: YesNo) => majScenario({ attendu: { ...scenario.attendu, recherche: v } })}
                      options={[
                        { value: 'oui' as const, label: 'Oui' },
                        { value: 'non' as const, label: 'Non' }
                      ]}
                    />
                  </Field>
                  <Field label="Bracelet">
                    <Segmented
                      tone="yesno"
                      value={scenario.attendu.bracelet}
                      onChange={(v: YesNo) => majScenario({ attendu: { ...scenario.attendu, bracelet: v } })}
                      options={[
                        { value: 'oui' as const, label: 'Oui' },
                        { value: 'non' as const, label: 'Non' }
                      ]}
                    />
                  </Field>
                  <Field label="PPA attendu" wide>
                    <Segmented
                      value={scenario.attendu.ppa}
                      onChange={(v: number) => majScenario({ attendu: { ...scenario.attendu, ppa: v } })}
                      options={[
                        { value: 0, label: 'Aucun' },
                        { value: 1, label: 'Niv. 1' },
                        { value: 2, label: 'Niv. 2' },
                        { value: 3, label: 'Niv. 3' },
                        { value: 4, label: 'Niv. 4' }
                      ]}
                    />
                  </Field>
                  <Field label="Coopérativité attendue" wide>
                    <Segmented
                      value={scenario.attendu.cooperation}
                      onChange={(v: Cooperation) => majScenario({ attendu: { ...scenario.attendu, cooperation: v } })}
                      options={COOPERATION.map((c) => ({ value: c.key, label: c.label.charAt(0).toUpperCase() + c.label.slice(1) }))}
                    />
                  </Field>
                </div>
              </div>
            </Panel>

            <div className="step-nav">
              <ConfirmButton
                icon={Trash2}
                label="Supprimer ce scénario"
                confirmLabel="Confirmer la suppression"
                onConfirm={() => {
                  setListe((cur) => cur.filter((s) => s.id !== scenario.id))
                  setSelection(null)
                  setModifie(true)
                }}
              />
              <button type="button" className="btn btn-primary" disabled={!modifie} onClick={() => void enregistrer()}>
                <Save size={15} /> Enregistrer
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
