import { useEffect, useState } from 'react'
import { ArrowDown, ArrowUp, ClipboardList, Plus, Save, Trash2 } from 'lucide-react'
import type { NegoConfig, NegoQuestion } from '@shared/nego'
import { api } from '../api'
import { useStore } from '../store'
import { uid } from '../lib/format'
import { Badge, ConfirmButton, Field, PageHeader, Panel, Segmented, TextArea, TextInput, Toggle } from '../components/ui'

function questionVide(): NegoQuestion {
  return {
    id: uid(),
    texte: 'Nouvelle question',
    type: 'unique',
    eliminatoire: false,
    aide: '',
    options: [
      { id: uid(), texte: 'Bonne réponse', bon: true },
      { id: uid(), texte: 'Mauvaise réponse', bon: false }
    ]
  }
}

export function NegoAdminPage() {
  const toast = useStore((s) => s.toast)
  const [config, setConfig] = useState<NegoConfig | null>(null)
  const [erreur, setErreur] = useState('')
  const [busy, setBusy] = useState(false)

  useEffect(() => {
    api
      .negoConfig()
      .then(setConfig)
      .catch((err) => setErreur(err instanceof Error ? err.message : 'Chargement impossible'))
  }, [])

  if (!config) return <div className="page">{erreur || 'Chargement du questionnaire…'}</div>

  const maj = (patch: Partial<NegoConfig>) => setConfig({ ...config, ...patch })
  const majQuestion = (id: string, patch: Partial<NegoQuestion>) =>
    maj({ questions: config.questions.map((q) => (q.id === id ? { ...q, ...patch } : q)) })

  function deplacer(index: number, sens: -1 | 1) {
    const suite = [...config!.questions]
    const cible = index + sens
    if (cible < 0 || cible >= suite.length) return
    ;[suite[index], suite[cible]] = [suite[cible], suite[index]]
    maj({ questions: suite })
  }

  async function enregistrer() {
    setBusy(true)
    try {
      setConfig(await api.negoSetConfig(config!))
      toast('ok', 'Questionnaire négociation enregistré.')
      setErreur('')
    } catch (err) {
      setErreur(err instanceof Error ? err.message : 'Enregistrement impossible')
    } finally {
      setBusy(false)
    }
  }

  const eliminatoires = config.questions.filter((q) => q.eliminatoire).length

  return (
    <div className="page">
      <PageHeader
        icon={ClipboardList}
        title="Questionnaire négociation"
        subtitle={`${config.questions.length} questions dont ${eliminatoires} éliminatoire(s). Les candidats ne voient jamais les bonnes réponses.`}
        right={
          <button type="button" className="btn btn-primary" disabled={busy} onClick={() => void enregistrer()}>
            <Save size={15} /> Enregistrer
          </button>
        }
      />

      {erreur && <div className="form-error">{erreur}</div>}

      <Panel title="Règles de l’examen">
        <div className="form-grid">
          <Field label="Durée indicative (minutes)">
            <TextInput value={String(config.dureeMinutes)} onChange={(v) => maj({ dureeMinutes: Number(v) || 0 })} type="number" />
          </Field>
          <Field label="Fautes autorisées">
            <TextInput value={String(config.fautesMax)} onChange={(v) => maj({ fautesMax: Number(v) || 0 })} type="number" />
          </Field>
          <Field label="Texte à lire aux candidats" wide>
            <TextArea value={config.texteFormateur} onChange={(v) => maj({ texteFormateur: v })} rows={8} />
          </Field>
          <Field label="Déroulement affiché au formateur" wide>
            <TextArea value={config.consignes} onChange={(v) => maj({ consignes: v })} rows={10} />
          </Field>
        </div>
      </Panel>

      {config.questions.map((q, n) => (
        <Panel
          key={q.id}
          title={`Question ${n + 1}`}
          right={
            <>
              {q.eliminatoire && <Badge tone="red">éliminatoire</Badge>}
              <button type="button" className="btn btn-icon" title="Monter" onClick={() => deplacer(n, -1)}>
                <ArrowUp size={15} />
              </button>
              <button type="button" className="btn btn-icon" title="Descendre" onClick={() => deplacer(n, 1)}>
                <ArrowDown size={15} />
              </button>
              <ConfirmButton
                icon={Trash2}
                label="Supprimer"
                confirmLabel="Confirmer"
                onConfirm={() => maj({ questions: config.questions.filter((x) => x.id !== q.id) })}
              />
            </>
          }
        >
          <div className="stack gap-12">
            <Field label="Question" wide>
              <TextArea value={q.texte} onChange={(v) => majQuestion(q.id, { texte: v })} rows={2} />
            </Field>

            <div className="form-grid">
              <Field label="Type de réponse">
                <Segmented
                  value={q.type}
                  onChange={(v: 'unique' | 'multiple') => majQuestion(q.id, { type: v })}
                  options={[
                    { value: 'unique' as const, label: 'Une seule' },
                    { value: 'multiple' as const, label: 'Plusieurs' }
                  ]}
                />
              </Field>
              <Field label="Poids">
                <Toggle
                  checked={q.eliminatoire}
                  onChange={(v) => majQuestion(q.id, { eliminatoire: v })}
                  label="Éliminatoire"
                  hint="Une faute ici fait échouer le candidat"
                />
              </Field>
            </div>

            <Field label="À entendre (vu par le formateur seulement)" wide>
              <TextInput value={q.aide} onChange={(v) => majQuestion(q.id, { aide: v })} placeholder="Ce que le candidat doit répondre" />
            </Field>

            <Field label="Réponses proposées" wide hint="Coche celles qui sont justes.">
              <div className="stack gap-6">
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
                      label=""
                    />
                    <TextInput
                      value={o.texte}
                      onChange={(v) => majQuestion(q.id, { options: q.options.map((x) => (x.id === o.id ? { ...x, texte: v } : x)) })}
                    />
                    <button
                      type="button"
                      className="btn btn-icon"
                      title="Retirer"
                      disabled={q.options.length <= 2}
                      onClick={() => majQuestion(q.id, { options: q.options.filter((x) => x.id !== o.id) })}
                    >
                      <Trash2 size={15} />
                    </button>
                  </div>
                ))}
                <button
                  type="button"
                  className="btn"
                  onClick={() => majQuestion(q.id, { options: [...q.options, { id: uid(), texte: '', bon: false }] })}
                >
                  <Plus size={15} /> Ajouter une réponse
                </button>
              </div>
            </Field>
          </div>
        </Panel>
      ))}

      <div className="step-nav">
        <button type="button" className="btn" onClick={() => maj({ questions: [...config.questions, questionVide()] })}>
          <Plus size={15} /> Ajouter une question
        </button>
        <button type="button" className="btn btn-primary" disabled={busy} onClick={() => void enregistrer()}>
          <Save size={15} /> Enregistrer le questionnaire
        </button>
      </div>
    </div>
  )
}
