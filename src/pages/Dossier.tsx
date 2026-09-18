import { useEffect, useMemo, useState } from 'react'
import {
  AlertTriangle,
  CheckCircle2,
  CircleAlert,
  ClipboardCopy,
  ClipboardList,
  FileText,
  ListChecks,
  Fingerprint,
  Gavel,
  IdCard,
  MessageSquareWarning,
  PackageSearch,
  Plus,
  RotateCcw,
  Scale,
  Siren,
  Trash2,
  UserRound
} from 'lucide-react'
import type { Intervention, Settings, Suspect } from '@shared/types'
import { type StepKey, interventionImages, interventionTitle, suspectName, useStore } from '../store'
import { COMPORTEMENTS, COOPERATION, REPORT_LIMIT, SAISIE_GROUPS, type Check, checkSuspect, generateReport, lowerFirst, stepState } from '../report'
import { INFRACTIONS, accusationSuggestions } from '../data/infractions'
import { CHECKLIST, CHECKLIST_TOTAL } from '../data/checklist'
import {
  PHRASES_AUTRES,
  PHRASES_CONSTAT,
  PHRASES_INTERPELLATION,
  PHRASES_LIEU,
  PHRASES_MOTIF,
  PHRASES_NEGOCIATION,
  PHRASES_NOTES,
  PHRASES_POURSUITE_FIN,
  PHRASES_VEHICULE
} from '../data/phrases'
import { legalityFor, legalityLabel, legalityTone, useWeaponsLoaded } from '../weapons'
import { dateFr, heureFr, joinFr, money, nowHm, todayIso } from '../lib/format'
import { Badge, ChipsInput, ConfirmButton, Empty, Field, PageHeader, Panel, PhrasesRapides, Segmented, TextArea, TextInput, Toggle } from '../components/ui'
import { Lightbox, ScreenSlot } from '../components/ScreenSlot'
import { api, imgUrl } from '../api'
import { SaisiesEditor } from '../components/SaisiesEditor'

const STEPS: { key: StepKey; label: string; icon: typeof IdCard }[] = [
  { key: 'identite', label: 'Identité', icon: IdCard },
  { key: 'fouille', label: 'Fouille', icon: PackageSearch },
  { key: 'comportement', label: 'Comportement & accusations', icon: Scale },
  { key: 'sanction', label: 'Amendes & casier', icon: Gavel },
  { key: 'rapport', label: 'Rapport', icon: FileText },
  { key: 'miranda', label: 'Droits Miranda', icon: MessageSquareWarning },
  { key: 'checklist', label: 'Checklist fin de procédure', icon: ListChecks },
  { key: 'fiche', label: 'Fiche résumé', icon: ClipboardList }
]


export function DossierPage(props: { id: string; tab: string; step: StepKey }) {
  const intervention = useStore((s) => s.db.interventions.find((i) => i.id === props.id))
  const settings = useStore((s) => s.db.settings)
  const openDossier = useStore((s) => s.openDossier)
  const addSuspect = useStore((s) => s.addSuspect)
  const updateIntervention = useStore((s) => s.updateIntervention)
  const deleteIntervention = useStore((s) => s.deleteIntervention)
  const { byId } = useWeaponsLoaded()

  if (!intervention) return null
  const i = intervention
  const suspect = i.suspects.find((s) => s.id === props.tab)
  const screens = interventionImages(i).length

  return (
    <div className="page">
      <PageHeader
        icon={Siren}
        title={interventionTitle(i)}
        subtitle={`Intervention du ${dateFr(i.date)} à ${heureFr(i.heure)} · ${i.suspects.length} suspect${i.suspects.length > 1 ? 's' : ''} · ${screens} screen${screens > 1 ? 's' : ''}`}
        right={
          <>
            {i.statut === 'en_cours' ? (
              <button type="button" className="btn btn-success" onClick={() => updateIntervention(i.id, () => ({ statut: 'terminee' }))}>
                <CheckCircle2 size={15} /> Marquer terminée
              </button>
            ) : (
              <button type="button" className="btn" onClick={() => updateIntervention(i.id, () => ({ statut: 'en_cours' }))}>
                <RotateCcw size={15} /> Rouvrir
              </button>
            )}
            <ConfirmButton icon={Trash2} label="Supprimer" confirmLabel="Supprimer tout le dossier ?" onConfirm={() => deleteIntervention(i.id)} />
          </>
        }
      />

      <div className="tabs">
        <button type="button" className={`tab ${props.tab === 'commun' ? 'active' : ''}`} onClick={() => openDossier(i.id, 'commun')}>
          <Siren size={15} /> Faits communs
        </button>
        {i.suspects.map((s) => {
          const checks = checkSuspect(i, s, settings, byId)
          const errors = checks.filter((c) => c.level === 'error').length
          return (
            <button
              type="button"
              key={s.id}
              className={`tab ${props.tab === s.id ? 'active' : ''}`}
              onClick={() => openDossier(i.id, s.id, props.tab === 'commun' ? 'identite' : props.step)}
            >
              <UserRound size={15} /> {suspectName(s)}
              {errors > 0 && <span className="tab-count">{errors}</span>}
            </button>
          )
        })}
        <button type="button" className="tab tab-add" onClick={() => addSuspect(i.id)}>
          <Plus size={15} /> Suspect
        </button>
      </div>

      {suspect ? (
        <SuspectView intervention={i} suspect={suspect} step={props.step} settings={settings} />
      ) : (
        <CommunForm intervention={i} settings={settings} />
      )}
    </div>
  )
}

function CommunForm({ intervention: i, settings }: { intervention: Intervention; settings: Settings }) {
  const update = useStore((s) => s.updateIntervention)
  const openDossier = useStore((s) => s.openDossier)
  const set = (p: Partial<Intervention>) => update(i.id, () => p)
  const nous = i.matricules.filter((m) => m.trim() && m !== settings.matricule).length > 0

  return (
    <div className="dossier-grid">
      <div className="stack">
        <Panel title="Intervention" icon={Siren}>
          <div className="form-grid">
            <Field label="Date">
              <TextInput type="date" value={i.date} onChange={(v) => set({ date: v || todayIso() })} />
            </Field>
            <Field label="Heure">
              <TextInput type="time" value={i.heure} onChange={(v) => set({ heure: v || nowHm() })} />
            </Field>
            <Field label="Comment ça a commencé" wide>
              <Segmented
                value={i.origine}
                onChange={(v) => set({ origine: v })}
                options={[
                  { value: 'appel', label: 'Appel' },
                  { value: 'appel_citoyen', label: 'Appel citoyen' },
                  { value: 'patrouille', label: 'En patrouille' },
                  { value: 'controle', label: 'Contrôle routier' },
                  { value: 'flagrant', label: 'Flagrant délit' }
                ]}
              />
            </Field>
            <Field
              label={i.origine === 'appel' || i.origine === 'appel_citoyen' ? 'L’appel signalait…' : 'Ce qui a été constaté'}
              hint="Écris-le comme dans une phrase : « un braquage », « une vente de drogue »…"
            >
              <TextInput value={i.motif} onChange={(v) => set({ motif: v })} placeholder="un braquage de l’Ammu-Nation" />
              <PhrasesRapides phrases={PHRASES_MOTIF} valeur={i.motif} mode="remplacer" onChoisir={(v) => set({ motif: v })} />
            </Field>
            <Field label="Lieu" hint="Avec « à », « au niveau de »…">
              <TextInput value={i.lieu} onChange={(v) => set({ lieu: v })} placeholder="au niveau du cimetière" />
              <PhrasesRapides phrases={PHRASES_LIEU} valeur={i.lieu} mode="remplacer" onChoisir={(v) => set({ lieu: v })} />
            </Field>
            <Field label="Matricules des agents présents" wide hint="Le tien est ajouté tout seul. Entrée pour valider.">
              <ChipsInput
                values={i.matricules}
                onChange={(v) => set({ matricules: v })}
                suggestions={settings.collegues}
                prefix="#"
                placeholder="Ex : 388"
              />
            </Field>
            <Field label="Sur place" wide>
              <TextArea
                value={i.constat}
                onChange={(v) => set({ constat: v })}
                rows={2}
                placeholder={`Sur les lieux, ${nous ? 'nous avons' : 'j’ai'} constaté la présence de deux braqueurs, d’un otage et d’un véhicule de fuite.`}
              />
              <PhrasesRapides phrases={PHRASES_CONSTAT} valeur={i.constat} onChoisir={(v) => set({ constat: v })} />
            </Field>
            <Field label="Négociation (si besoin)" wide>
              <TextArea
                value={i.negociation}
                onChange={(v) => set({ negociation: v })}
                rows={2}
                placeholder="Après négociation, les voies ont été libérées en échange de l’otage."
              />
              <PhrasesRapides phrases={PHRASES_NEGOCIATION} valeur={i.negociation} onChoisir={(v) => set({ negociation: v })} />
            </Field>
          </div>
        </Panel>

        <Panel title="Déroulé" icon={Fingerprint}>
          <div className="stack gap-12">
            <Toggle
              checked={i.refusObtemperer ?? false}
              onChange={(v) => set({ refusObtemperer: v })}
              label="Refus d’obtempérer"
              hint="Il n’a pas obéi à nos sommations"
            />

            <Toggle
              checked={i.fuitePied || i.poursuite}
              onChange={(v) => set(v ? { poursuite: true } : { fuitePied: false, poursuite: false })}
              label="Délit de fuite"
              hint="À pied, en véhicule, ou les deux"
            />
            {(i.fuitePied || i.poursuite) && (
              <div className="sub-options-col">
                <div className="toggle-row">
                  <Toggle checked={i.fuitePied} onChange={(v) => set({ fuitePied: v })} label="À pied" />
                  {i.fuitePied && (
                    <TextInput value={i.fuitePiedDuree} onChange={(v) => set({ fuitePiedDuree: v })} placeholder="Durée : environ une minute" />
                  )}
                </div>
                <div className="toggle-row">
                  <Toggle checked={i.poursuite} onChange={(v) => set({ poursuite: v })} label="En véhicule" />
                  {i.poursuite && (
                    <TextInput value={i.poursuiteDuree} onChange={(v) => set({ poursuiteDuree: v })} placeholder="Durée : plusieurs minutes" />
                  )}
                </div>
                {i.poursuite && (
                  <>
                    <Field label="Véhicule du suspect" wide>
                      <TextInput
                        value={i.poursuiteVehicule ?? ''}
                        onChange={(v) => set({ poursuiteVehicule: v })}
                        placeholder="une Sultan RS, un SUV noir…"
                      />
                      <PhrasesRapides
                        phrases={PHRASES_VEHICULE}
                        valeur={i.poursuiteVehicule ?? ''}
                        mode="remplacer"
                        onChoisir={(v) => set({ poursuiteVehicule: v })}
                      />
                    </Field>
                    <Toggle
                      checked={i.poursuiteDangereuse}
                      onChange={(v) => set({ poursuiteDangereuse: v })}
                      label="Conduite dangereuse"
                      hint="Met en danger les usagers de la route"
                    />
                    <Field label="Fin de la poursuite" wide>
                      <TextInput
                        value={i.poursuiteFin}
                        onChange={(v) => set({ poursuiteFin: v })}
                        placeholder="Le véhicule a fini sa course dans un arbre."
                      />
                      <PhrasesRapides phrases={PHRASES_POURSUITE_FIN} valeur={i.poursuiteFin} onChoisir={(v) => set({ poursuiteFin: v })} />
                    </Field>
                  </>
                )}
              </div>
            )}

            <Toggle checked={i.tazer} onChange={(v) => set({ tazer: v })} label="Usage du tazer" />

            <Field label="Interpellation (facultatif)" wide>
              <TextArea
                value={i.interpellation}
                onChange={(v) => set({ interpellation: v })}
                rows={2}
                placeholder="Après nous être assurés que le conducteur n’était pas blessé, nous avons procédé à son interpellation."
              />
              <PhrasesRapides phrases={PHRASES_INTERPELLATION} valeur={i.interpellation} onChoisir={(v) => set({ interpellation: v })} />
            </Field>
            <Field label="Conduit ensuite" wide>
              <Segmented
                value={i.destination}
                onChange={(v) => set({ destination: v })}
                options={[
                  { value: 'poste', label: 'Au poste' },
                  { value: 'interrogatoire', label: 'En salle d’interrogatoire' }
                ]}
              />
            </Field>
            <Field label="Autres éléments importants" wide>
              <TextArea value={i.autres} onChange={(v) => set({ autres: v })} rows={2} placeholder="Tout ce qui ne rentre pas au-dessus." />
              <PhrasesRapides phrases={PHRASES_AUTRES} valeur={i.autres} onChoisir={(v) => set({ autres: v })} />
            </Field>
          </div>
        </Panel>
      </div>

      <div className="stack">
        <Panel title="Screens de la scène">
          <ScreenSlot target={{ interventionId: i.id, suspectId: null, slot: 'sceneScreens' }} images={i.sceneScreens} title="Scène / trajet" />
        </Panel>
        <Panel title="Suspects">
          <div className="stack gap-8">
            {i.suspects.map((s) => (
              <button type="button" key={s.id} className="list-row" onClick={() => openDossier(i.id, s.id, 'identite')}>
                <UserRound size={16} />
                <span>{suspectName(s)}</span>
                <small>{s.saisies.length} saisie{s.saisies.length > 1 ? 's' : ''}</small>
              </button>
            ))}
          </div>
        </Panel>
      </div>
    </div>
  )
}

function StepIcon({ state }: { state: 'done' | 'warn' | 'error' }) {
  if (state === 'done') return <CheckCircle2 size={16} className="c-green" />
  if (state === 'warn') return <CircleAlert size={16} className="c-amber" />
  return <AlertTriangle size={16} className="c-red" />
}

function SuspectView(props: { intervention: Intervention; suspect: Suspect; step: StepKey; settings: Settings }) {
  const { intervention: i, suspect: s, step, settings } = props
  const openDossier = useStore((st) => st.openDossier)
  const updateSuspect = useStore((st) => st.updateSuspect)
  const removeSuspect = useStore((st) => st.removeSuspect)
  const { byId } = useWeaponsLoaded()
  const set: SetSuspect = (p) => updateSuspect(i.id, s.id, typeof p === 'function' ? p : () => p)
  const checks = useMemo(() => checkSuspect(i, s, settings, byId), [i, s, settings, byId])
  const idx = STEPS.findIndex((x) => x.key === step)

  return (
    <div className="suspect-layout">
      <aside className="steps">
        {STEPS.map((st, n) => (
          <button type="button" key={st.key} className={`step ${st.key === step ? 'active' : ''}`} onClick={() => openDossier(i.id, s.id, st.key)}>
            <span className="step-num">{n + 1}</span>
            <span className="step-label">{st.label}</span>
            {st.key !== 'rapport' && st.key !== 'fiche' && <StepIcon state={stepState(checks, st.key)} />}
          </button>
        ))}
        {i.suspects.length > 1 && (
          <ConfirmButton
            icon={Trash2}
            className="steps-remove"
            label="Retirer ce suspect"
            confirmLabel="Retirer + ses screens ?"
            onConfirm={() => removeSuspect(i.id, s.id)}
          />
        )}
      </aside>

      <div className="step-body">
        {step === 'identite' && <IdentiteStep i={i} s={s} set={set} />}
        {step === 'miranda' && <MirandaStep i={i} s={s} set={set} />}
        {step === 'fouille' && <FouilleStep i={i} s={s} set={set} />}
        {step === 'comportement' && <ComportementStep s={s} set={set} />}
        {step === 'sanction' && <SanctionStep i={i} s={s} />}
        {step === 'rapport' && <RapportStep i={i} s={s} set={set} checks={checks} />}
        {step === 'checklist' && <ChecklistStep s={s} set={set} />}
        {step === 'fiche' && <FicheStep i={i} s={s} />}

        <div className="step-nav">
          {idx > 0 ? (
            <button type="button" className="btn" onClick={() => openDossier(i.id, s.id, STEPS[idx - 1].key)}>
              ← {STEPS[idx - 1].label}
            </button>
          ) : (
            <span />
          )}
          {idx < STEPS.length - 1 && (
            <button type="button" className="btn btn-primary" onClick={() => openDossier(i.id, s.id, STEPS[idx + 1].key)}>
              {STEPS[idx + 1].label} →
            </button>
          )}
        </div>
      </div>
    </div>
  )
}

export type SetSuspect = (p: Partial<Suspect> | ((cur: Suspect) => Partial<Suspect>)) => void
type StepProps = { i: Intervention; s: Suspect; set: SetSuspect }

function IdentiteStep({ i, s, set }: StepProps) {
  return (
    <div className="dossier-grid">
      <Panel title="Fiche suspect" icon={IdCard}>
        <div className="form-grid">
          <Field label="Civilité" wide>
            <Segmented
              value={s.civilite}
              onChange={(v) => set({ civilite: v })}
              options={[
                { value: 'M', label: 'Monsieur' },
                { value: 'Mme', label: 'Madame' }
              ]}
            />
          </Field>
          <Field label="Prénom">
            <TextInput value={s.prenom} onChange={(v) => set({ prenom: v })} placeholder="zepekenio" />
          </Field>
          <Field label="Nom">
            <TextInput value={s.nom} onChange={(v) => set({ nom: v })} placeholder="lazit" />
          </Field>
          <Field label="Date de naissance">
            <TextInput type="date" value={s.naissance} onChange={(v) => set({ naissance: v })} />
          </Field>
          <span />
          <Field label="Avis de recherche en cours ?">
            <Segmented
              tone="yesno"
              value={s.recherche}
              onChange={(v) => set({ recherche: v })}
              options={[
                { value: 'oui', label: 'Oui' },
                { value: 'non', label: 'Non' }
              ]}
            />
          </Field>
          <Field label="Bracelet électronique ?">
            <Segmented
              tone="yesno"
              value={s.bracelet}
              onChange={(v) => set({ bracelet: v })}
              options={[
                { value: 'oui', label: 'Oui' },
                { value: 'non', label: 'Non' }
              ]}
            />
          </Field>
          <Field label="Permis de port d’armes (PPA)" wide hint="Sert à savoir si une arme « PPA requis » est légale pour lui.">
            <Segmented
              value={s.ppa}
              onChange={(v) => set({ ppa: v })}
              options={[
                { value: 0, label: 'Aucun' },
                { value: 1, label: 'Niv. 1' },
                { value: 2, label: 'Niv. 2' },
                { value: 3, label: 'Niv. 3' },
                { value: 4, label: 'Niv. 4' }
              ]}
            />
          </Field>
        </div>
      </Panel>
      <div className="stack">
        <Panel>
          <ScreenSlot
            target={{ interventionId: i.id, suspectId: s.id, slot: 'photo' }}
            images={s.photo}
            title="Photo du suspect"
            single
            portrait
            hint="La photo que tu mets sur sa fiche MDT"
          />
        </Panel>
        <Panel>
          <ScreenSlot target={{ interventionId: i.id, suspectId: s.id, slot: 'identite' }} images={s.identite} title="Carte d’identité" />
        </Panel>
      </div>
    </div>
  )
}

function useClock(): Date {
  const [now, setNow] = useState(() => new Date())
  useEffect(() => {
    const t = setInterval(() => setNow(new Date()), 15000)
    return () => clearInterval(t)
  }, [])
  return now
}

function MirandaStep({ i, s, set }: StepProps) {
  const learned = useStore((st) => st.db.learned.accusations)
  const learn = useStore((st) => st.learn)
  const now = useClock()
  const faits = s.accusations.length ? joinFr(s.accusations.map(lowerFirst)) : '[énoncer les faits]'
  const suggestions = accusationSuggestions(learned)

  return (
    <div className="stack">
      <Panel title="Faits reprochés" icon={Scale}>
        <ChipsInput
          values={s.accusations}
          onChange={(v) => {
            set({ accusations: v })
            learn('accusations', v)
          }}
          suggestions={suggestions}
          placeholder="Refus d’obtempérer, port d’arme illégal… (Entrée pour ajouter)"
        />
      </Panel>
      <div className="miranda">
        <p className="miranda-lead">
          « {s.civilite === 'Mme' ? 'Madame' : 'Monsieur'}, nous sommes le {dateFr(todayIso(now))}. Il est {heureFr(nowHm(now))}. Vous êtes
          placé{s.civilite === 'Mme' ? 'e' : ''} en état d’arrestation pour les faits suivants : <mark>{faits}</mark>. »
        </p>
        <ol className="miranda-list">
          <li>« Je vous informe que vous avez le droit de garder le silence. »</li>
          <li>« Tout ce que vous direz pourra être retenu et utilisé contre vous devant un tribunal. »</li>
          <li>« Vous avez le droit de consulter un avocat et de bénéficier de sa présence lors de votre interrogatoire. »</li>
          <li>« Si vous n’avez pas les moyens d’en payer un, un avocat vous sera commis d’office. »</li>
          <li>« Vous avez également le droit de demander à boire et à manger pendant votre garde à vue, ainsi que le droit de passer un appel. »</li>
        </ol>
        <div className="miranda-ask">
          <span className="eyebrow">À demander au mis en cause</span>
          <p>« Avez-vous compris vos droits ? »</p>
          <p>« Souhaitez-vous faire usage de vos droits ? »</p>
        </div>
        <div className="miranda-foot">
          <span>Les droits doivent être notifiés dès l’interpellation et avant toute audition.</span>
          {s.mirandaLusA ? (
            <button type="button" className="btn btn-success" onClick={() => set({ mirandaLusA: null })}>
              <CheckCircle2 size={15} /> Droits lus à {s.mirandaLusA}
            </button>
          ) : (
            <button type="button" className="btn btn-primary" onClick={() => set({ mirandaLusA: heureFr(nowHm()) })}>
              <CheckCircle2 size={15} /> J’ai lu ses droits
            </button>
          )}
        </div>
      </div>
      <p className="muted small">Intervention : {interventionTitle(i)}</p>
    </div>
  )
}

function FouilleStep({ i, s, set }: StepProps) {
  return (
    <div className="stack">
      <Panel title="Screens de la fouille" icon={PackageSearch}>
        <ScreenSlot
          target={{ interventionId: i.id, suspectId: s.id, slot: 'fouilleScreens' }}
          images={s.fouilleScreens}
          title="Inventaire (individu + sac)"
        />
      </Panel>
      <Panel title="Objets saisis" icon={Gavel} right={<span className="muted small">Tout ce qui est illégal, avec la quantité exacte</span>}>
        <SaisiesEditor suspect={s} onChange={set} />
      </Panel>
    </div>
  )
}

function ComportementStep({ s, set }: { s: Suspect; set: SetSuspect }) {
  const learned = useStore((st) => st.db.learned.accusations)
  const learn = useStore((st) => st.learn)
  const suggestions = accusationSuggestions(learned)

  return (
    <div className="stack">
      <Panel title="Comportement" icon={UserRound}>
        <div className="stack gap-16">
          <Field label="Coopérativité (comme dans le MDT)" wide>
            <Segmented
              value={s.cooperation}
              onChange={(v) => set({ cooperation: v })}
              options={COOPERATION.map((c) => ({ value: c.key, label: c.label.charAt(0).toUpperCase() + c.label.slice(1) }))}
            />
          </Field>
          <Field label="Il s’est montré…" wide>
            <div className="pill-group">
              {COMPORTEMENTS.map((c) => {
                const on = s.comportements.includes(c.label)
                return (
                  <button
                    type="button"
                    key={c.label}
                    className={`pill ${on ? 'on' : ''}`}
                    onClick={() =>
                      set((cur) => ({
                        comportements: cur.comportements.includes(c.label)
                          ? cur.comportements.filter((x) => x !== c.label)
                          : [...cur.comportements, c.label]
                      }))
                    }
                  >
                    {c.label}
                  </button>
                )
              })}
            </div>
          </Field>
        </div>
      </Panel>

      <Panel title="Outrage & menaces" icon={MessageSquareWarning}>
        <div className="stack gap-12">
          <Toggle checked={s.outrage} onChange={(v) => set({ outrage: v })} label="Outrage à agent retenu" />
          {s.outrage && (
            <Field label="Phrase exacte prononcée" wide>
              <TextArea value={s.outragePhrase} onChange={(v) => set({ outragePhrase: v })} rows={2} placeholder="Recopie mot pour mot" />
            </Field>
          )}
          <Toggle checked={s.menace} onChange={(v) => set({ menace: v })} label="Menace sur agent de l’État retenue" />
          {s.menace && (
            <Field label="Phrase exacte prononcée" wide>
              <TextArea value={s.menacePhrase} onChange={(v) => set({ menacePhrase: v })} rows={2} placeholder="Recopie mot pour mot" />
            </Field>
          )}
        </div>
      </Panel>

      <Panel title="Accusations retenues" icon={Scale} right={<span className="muted small">Doivent correspondre aux délits constatés + objets saisis</span>}>
        <ChipsInput
          values={s.accusations}
          onChange={(v) => {
            set({ accusations: v })
            learn('accusations', v)
          }}
          suggestions={suggestions}
          placeholder="Tape une accusation puis Entrée"
        />
      </Panel>

      <Panel title="Notes pour le rapport">
        <TextArea value={s.notes} onChange={(v) => set({ notes: v })} rows={3} placeholder="Ce qui concerne uniquement ce suspect (s’ajoute à la fin du rapport)." />
        <PhrasesRapides phrases={PHRASES_NOTES} valeur={s.notes} onChoisir={(v) => set({ notes: v })} />
      </Panel>
    </div>
  )
}

function SanctionStep({ i, s }: { i: Intervention; s: Suspect }) {
  return (
    <div className="dossier-grid even">
      <Panel title="Amendes" icon={Gavel}>
        <ScreenSlot
          target={{ interventionId: i.id, suspectId: s.id, slot: 'amendesScreens' }}
          images={s.amendesScreens}
          title="Screen des amendes"
          hint="La fenêtre « Nouvelle sanction » avec les infractions cochées"
        />
      </Panel>
      <Panel title="Ajout au casier" icon={FileText}>
        <ScreenSlot
          target={{ interventionId: i.id, suspectId: s.id, slot: 'casierScreens' }}
          images={s.casierScreens}
          title="Screen du casier"
          hint="La sanction enregistrée dans le casier judiciaire"
        />
      </Panel>
    </div>
  )
}

function RapportStep({ i, s, set, checks }: StepProps & { checks: Check[] }) {
  const settings = useStore((st) => st.db.settings)
  const openDossier = useStore((st) => st.openDossier)
  const toast = useStore((st) => st.toast)
  const { byId } = useWeaponsLoaded()
  const generated = generateReport(i, s, settings, byId)
  const text = s.rapportManuel ?? generated
  const over = text.length > REPORT_LIMIT
  const errors = checks.filter((c) => c.level === 'error')
  const warns = checks.filter((c) => c.level === 'warn')

  return (
    <div className="rapport-layout">
      <Panel
        title="Rapport"
        icon={FileText}
        right={
          <div className="row gap-8">
            {s.rapportManuel !== null && (
              <button type="button" className="btn" onClick={() => set({ rapportManuel: null })} title="Remplace tes modifications par le texte généré">
                <RotateCcw size={15} /> Régénérer
              </button>
            )}
            <button
              type="button"
              className="btn btn-primary"
              onClick={async () => {
                await api.copyText(text)
                toast(errors.length ? 'info' : 'ok', errors.length ? `Rapport copié, mais il manque ${errors.length} élément(s).` : 'Rapport copié.')
              }}
            >
              <ClipboardCopy size={15} /> Copier le rapport
            </button>
          </div>
        }
      >
        <textarea className="input textarea report" value={text} onChange={(e) => set({ rapportManuel: e.target.value })} spellCheck />
        <div className="report-foot">
          <span className={over ? 'c-red' : 'muted'}>
            {text.length} / {REPORT_LIMIT} caractères{over ? ' : trop long pour le champ « Circonstances » du MDT' : ''}
          </span>
          <span className="muted">{s.rapportManuel !== null ? 'Modifié à la main' : 'Généré automatiquement, tu peux le modifier'}</span>
        </div>
      </Panel>

      <Panel title="Vérification" icon={CircleAlert}>
        {checks.length === 0 ? (
          <div className="check-ok">
            <CheckCircle2 size={18} /> Tout est complet.
          </div>
        ) : (
          <ul className="checks">
            {[...errors, ...warns].map((c, n) => (
              <li key={n}>
                <button type="button" className={`check check-${c.level}`} onClick={() => openDossier(i.id, c.step === 'commun' ? 'commun' : s.id, c.step === 'commun' ? 'identite' : c.step)}>
                  {c.level === 'error' ? <AlertTriangle size={15} /> : <CircleAlert size={15} />}
                  {c.text}
                </button>
              </li>
            ))}
          </ul>
        )}
        <p className="muted small">Rouge = risque de vice de procédure. Orange = conseillé. Clique pour aller à l’étape.</p>
      </Panel>
    </div>
  )
}

const TON_CATEGORIE: Record<string, 'grey' | 'amber' | 'red' | 'purple'> = {
  'Délit mineur': 'grey',
  'Délit moyen': 'amber',
  'Délit majeur': 'red',
  'Délit aggravé': 'red',
  Crime: 'purple'
}

/** Fiche de fin de procédure, dans le style de la fiche citoyen du MDT. */
function FicheStep({ i, s }: { i: Intervention; s: Suspect }) {
  const settings = useStore((st) => st.db.settings)
  const toast = useStore((st) => st.toast)
  const { byId } = useWeaponsLoaded()
  const [viewer, setViewer] = useState<number | null>(null)
  const texte = s.rapportManuel ?? generateReport(i, s, settings, byId)
  const screens = [...s.identite, ...s.fouilleScreens, ...s.amendesScreens, ...s.casierScreens]
  const photo = s.photo[0]
  const age = s.naissance ? Math.floor((Date.now() - new Date(s.naissance).getTime()) / 31_557_600_000) : null
  const groupes = SAISIE_GROUPS.map((g) => ({ ...g, items: s.saisies.filter((x) => x.type === g.type) })).filter((g) => g.items.length)
  const coop = COOPERATION.find((c) => c.key === s.cooperation)

  return (
    <div className="fiche-layout">
      <aside className="fiche-card">
        <span className="eyebrow blue">Fiche suspect</span>
        {photo ? (
          <img className="fiche-photo" src={imgUrl(photo.file)} alt="" onClick={() => setViewer(screens.findIndex((x) => x.id === photo.id))} />
        ) : (
          <div className="fiche-photo fiche-photo-vide">
            <UserRound size={44} />
          </div>
        )}
        <div className="fiche-nom">
          <span>{s.prenom || '—'}</span>
          <strong>{s.nom || 'Sans nom'}</strong>
        </div>
        <dl className="fiche-rows">
          <div>
            <dt>Naissance</dt>
            <dd>{s.naissance ? `${dateFr(s.naissance)}${age !== null ? ` (${age} ans)` : ''}` : '—'}</dd>
          </div>
          <div>
            <dt>Recherché</dt>
            <dd className={s.recherche === 'oui' ? 'c-red' : ''}>{s.recherche === null ? 'Non vérifié' : s.recherche === 'oui' ? 'Oui' : 'Non'}</dd>
          </div>
          <div>
            <dt>Bracelet</dt>
            <dd className={s.bracelet === 'oui' ? 'c-red' : ''}>{s.bracelet === null ? 'Non vérifié' : s.bracelet === 'oui' ? 'Oui' : 'Non'}</dd>
          </div>
          <div>
            <dt>PPA</dt>
            <dd>{s.ppa === null ? 'Non vérifié' : s.ppa === 0 ? 'Aucun' : `Niveau ${s.ppa}`}</dd>
          </div>
          <div>
            <dt>Coopérativité</dt>
            <dd>{coop ? coop.label.charAt(0).toUpperCase() + coop.label.slice(1) : '—'}</dd>
          </div>
          <div>
            <dt>Droits lus</dt>
            <dd className={s.mirandaLusA ? 'c-green' : 'c-amber'}>{s.mirandaLusA ?? 'Non'}</dd>
          </div>
        </dl>
        <div className="fiche-total">
          <span>{s.accusations.length} inculpation{s.accusations.length > 1 ? 's' : ''}</span>
          <span>
            {s.saisies.length} saisie{s.saisies.length > 1 ? 's' : ''}
          </span>
        </div>
      </aside>

      <div className="stack">
        <Panel title="Inculpations" icon={Scale}>
          {s.accusations.length === 0 ? (
            <p className="muted">Aucune accusation retenue.</p>
          ) : (
            <div className="fiche-list">
              {s.accusations.map((a) => {
                const cat = INFRACTIONS.find((x) => x.label.toLowerCase() === a.toLowerCase())?.categorie
                return (
                  <div className="fiche-item" key={a}>
                    <span>{a}</span>
                    {cat && <Badge tone={TON_CATEGORIE[cat]}>{cat}</Badge>}
                  </div>
                )
              })}
              {s.outrage && (
                <div className="fiche-phrase">
                  Outrage : « {s.outragePhrase.trim() || '[phrase exacte manquante]'} »
                </div>
              )}
              {s.menace && (
                <div className="fiche-phrase">
                  Menace sur agent : « {s.menacePhrase.trim() || '[phrase exacte manquante]'} »
                </div>
              )}
            </div>
          )}
        </Panel>

        <Panel title="Objets confisqués" icon={PackageSearch}>
          {groupes.length === 0 ? (
            <p className="muted">{s.rienSurLui ? 'Rien d’illégal sur lui.' : 'Fouille non renseignée.'}</p>
          ) : (
            <div className="stack gap-12">
              {groupes.map((g) => (
                <div key={g.type}>
                  <span className="eyebrow">{g.title}</span>
                  <div className="fiche-list">
                    {g.items.map((x) => {
                      const w = x.weaponId ? byId.get(x.weaponId) : undefined
                      const l = w ? legalityFor(w, s) : null
                      return (
                        <div className="fiche-item" key={x.id}>
                          <span>
                            <strong className="fiche-qty">{x.type === 'argent' ? money(x.quantite ?? 0) : `${x.quantite ?? '?'} ×`}</strong>
                            {x.type === 'argent' ? ' non déclarés' : ` ${x.label}`}
                          </span>
                          {l && <Badge tone={legalityTone(l)}>{legalityLabel(l)}</Badge>}
                        </div>
                      )
                    })}
                  </div>
                </div>
              ))}
            </div>
          )}
        </Panel>

        <Panel
          title="Texte à copier"
          icon={FileText}
          right={
            <button
              type="button"
              className="btn btn-primary"
              onClick={async () => {
                await api.copyText(texte)
                toast('ok', 'Rapport copié.')
              }}
            >
              <ClipboardCopy size={15} /> Copier le rapport
            </button>
          }
        >
          <pre className="fiche-rapport">{texte}</pre>
          <div className="report-foot">
            <span className={texte.length > REPORT_LIMIT ? 'c-red' : 'muted'}>
              {texte.length} / {REPORT_LIMIT} caractères
            </span>
          </div>
        </Panel>

        <Panel title={`Screens de la procédure (${screens.length})`}>
          {screens.length === 0 ? (
            <Empty icon={ClipboardList} title="Aucun screen" />
          ) : (
            <div className="slot-grid">
              {screens.map((img, idx) => (
                <button type="button" key={img.id} className="thumb" onClick={() => setViewer(idx)}>
                  <img src={imgUrl(img.file)} alt="" loading="lazy" />
                </button>
              ))}
            </div>
          )}
        </Panel>
      </div>

      {viewer !== null && screens[viewer] && (
        <Lightbox images={screens} index={viewer} onIndex={setViewer} onClose={() => setViewer(null)} />
      )}
    </div>
  )
}

/** Checklist officielle à passer avant de fermer la procédure. */
function ChecklistStep({ s, set }: { s: Suspect; set: SetSuspect }) {
  const coches = s.checklist ?? []
  const fait = (id: string) => coches.includes(id)
  const total = coches.length
  const fini = total >= CHECKLIST_TOTAL

  function basculer(id: string) {
    set((cur) => {
      const liste = cur.checklist ?? []
      return { checklist: liste.includes(id) ? liste.filter((x) => x !== id) : [...liste, id] }
    })
  }

  return (
    <div className="stack">
      <div className={`checklist-head ${fini ? 'fini' : ''}`}>
        <ListChecks size={22} />
        <div>
          <strong>Avant de fermer la procédure, pose-toi ces questions</strong>
          <span>
            {total} / {CHECKLIST_TOTAL} vérifié{total > 1 ? 's' : ''}
          </span>
        </div>
        <div className="checklist-actions">
          {fini ? (
            <button type="button" className="btn" onClick={() => set({ checklist: [] })}>
              <RotateCcw size={15} /> Tout décocher
            </button>
          ) : (
            <button
              type="button"
              className="btn btn-primary"
              onClick={() => set({ checklist: CHECKLIST.flatMap((g) => g.points.map((p) => p.id)) })}
            >
              <CheckCircle2 size={15} /> Tout cocher
            </button>
          )}
        </div>
      </div>

      <div className="checklist-grid">
        {CHECKLIST.map((g, n) => {
          const faits = g.points.filter((p) => fait(p.id)).length
          return (
            <section className={`checklist-card ${faits === g.points.length ? 'complet' : ''}`} key={g.id}>
              <header>
                <span className="checklist-num">{n + 1}</span>
                <h3>{g.titre}</h3>
                <span className="checklist-compte">
                  {faits}/{g.points.length}
                </span>
              </header>
              <div className="checklist-points">
                {g.points.map((p) => (
                  <button type="button" key={p.id} className={`checklist-point ${fait(p.id) ? 'on' : ''}`} onClick={() => basculer(p.id)}>
                    <span className="checklist-box">{fait(p.id) && <CheckCircle2 size={14} strokeWidth={3} />}</span>
                    {p.texte}
                  </button>
                ))}
              </div>
            </section>
          )
        })}
      </div>

      <div className={`checklist-foot ${fini ? 'fini' : ''}`}>
        {fini ? <CheckCircle2 size={20} /> : <AlertTriangle size={20} />}
        <span>{fini ? 'Tout est vérifié, tu peux fermer la procédure.' : 'Un doute ? Vérifie avant de fermer la procédure.'}</span>
      </div>
    </div>
  )
}
