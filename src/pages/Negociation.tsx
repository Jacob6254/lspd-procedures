import { useState } from 'react'
import {
  AlertTriangle,
  Car,
  CheckCircle2,
  ClipboardCopy,
  Crosshair,
  Download,
  FileImage,
  Handshake,
  Plus,
  Trash2,
  UserRound,
  Users
} from 'lucide-react'
import type { FinNego, Negociation } from '@shared/negociation'
import { BRAQUAGES, MOTIFS_ARME, REVENDICATIONS } from '@shared/negociation'
import type { YesNo } from '@shared/types'
import { negociationTitre, useStore } from '../store'
import { genererRapportNego, resumeAuto, type PageRapport } from '../rapport-officiel'
import { PHRASES_LIEU } from '../data/phrases'
import { dateFr, heureFr } from '../lib/format'
import { Badge, ChipsInput, ConfirmButton, Empty, Field, PageHeader, Panel, PhrasesRapides, Segmented, TextArea, TextInput, Toggle } from '../components/ui'
import { ScreenSlot } from '../components/ScreenSlot'

const nombre = (v: string): number | null => {
  const n = Number(v.replace(/\D/g, ''))
  return v.trim() === '' ? null : Number.isFinite(n) ? n : null
}

export function NegociationPage({ id }: { id: string }) {
  const n = useStore((s) => s.db.negociations?.find((x) => x.id === id))
  const settings = useStore((s) => s.db.settings)
  const update = useStore((s) => s.updateNegociation)
  const supprimer = useStore((s) => s.deleteNegociation)
  const addVehicule = useStore((s) => s.addVehicule)
  const removeVehicule = useStore((s) => s.removeVehicule)
  const addOtage = useStore((s) => s.addOtage)
  const removeOtage = useStore((s) => s.removeOtage)
  const addEchange = useStore((s) => s.addEchange)
  const removeEchange = useStore((s) => s.removeEchange)
  const updateSettings = useStore((s) => s.updateSettings)
  const toast = useStore((s) => s.toast)
  const [pages, setPages] = useState<PageRapport[] | null>(null)
  const [busy, setBusy] = useState(false)

  if (!n) return <Empty icon={Handshake} title="Négociation introuvable" />
  const set = (patch: Partial<Negociation>) => update(n.id, () => patch)
  const plafond = BRAQUAGES.find((b) => b.lieu === n.typeLieu)

  async function generer() {
    if (!n) return
    setBusy(true)
    try {
      const numero = n.numeroCase || String(settings.prochainCase ?? 1).padStart(4, '0')
      if (!n.numeroCase) {
        set({ numeroCase: numero })
        updateSettings({ prochainCase: (settings.prochainCase ?? 1) + 1 })
      }
      const out = await genererRapportNego(n, settings, numero)
      setPages(out)
      toast('ok', out.length > 1 ? `${out.length} pages générées` : 'Rapport généré')
    } catch (err) {
      toast('error', err instanceof Error ? err.message : 'Génération impossible')
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="page">
      <PageHeader
        icon={Handshake}
        title={negociationTitre(n)}
        subtitle={`Négociation du ${dateFr(n.date)} à ${heureFr(n.heure)} · ${n.otages.length} otage(s) · ${n.echanges.length} revendication(s)`}
        right={
          <>
            <Badge tone={n.statut === 'terminee' ? 'green' : 'amber'}>{n.statut === 'terminee' ? 'Terminée' : 'En cours'}</Badge>
            <button
              type="button"
              className="btn"
              onClick={() => set({ statut: n.statut === 'terminee' ? 'en_cours' : 'terminee' })}
            >
              <CheckCircle2 size={15} /> {n.statut === 'terminee' ? 'Rouvrir' : 'Marquer terminée'}
            </button>
            <ConfirmButton
              icon={Trash2}
              label="Supprimer"
              confirmLabel="Supprimer + ses screens ?"
              onConfirm={() => supprimer(n.id)}
            />
          </>
        }
      />

      <div className="dossier-grid">
        <div className="stack">
          <Panel title="Situation initiale" icon={Handshake}>
            <div className="form-grid">
              <Field label="Date">
                <TextInput value={n.date} onChange={(v) => set({ date: v })} type="date" />
              </Field>
              <Field label="Heure">
                <TextInput value={n.heure} onChange={(v) => set({ heure: v })} type="time" />
              </Field>
              <Field label="Type de braquage" wide hint="Sert à connaître les plafonds à ne pas dépasser.">
                <div className="pill-group">
                  {[...BRAQUAGES.map((b) => b.lieu), 'Autre'].map((t) => (
                    <button
                      type="button"
                      key={t}
                      className={`pill ${n.typeLieu === t ? 'on' : ''}`}
                      onClick={() => set({ typeLieu: n.typeLieu === t ? '' : t })}
                    >
                      {t}
                    </button>
                  ))}
                </div>
              </Field>
              <Field label="Lieu exact" wide>
                <TextInput value={n.lieu} onChange={(v) => set({ lieu: v })} placeholder="la Banque Fleeca de Mirror Park" />
                <PhrasesRapides phrases={PHRASES_LIEU} valeur={n.lieu} mode="remplacer" onChoisir={(v) => set({ lieu: v })} />
              </Field>
              <Field label="Nombre de braqueurs" hint="La toute première question posée.">
                <TextInput value={n.braqueurs === null ? '' : String(n.braqueurs)} onChange={(v) => set({ braqueurs: nombre(v) })} type="number" />
              </Field>
              <Field label="Nombre d’otages annoncés">
                <TextInput
                  value={n.otagesAnnonces === null ? '' : String(n.otagesAnnonces)}
                  onChange={(v) => set({ otagesAnnonces: nombre(v) })}
                  type="number"
                />
              </Field>
            </div>

            {plafond && ((n.braqueurs ?? 0) > plafond.braqueurs || (n.otagesAnnonces ?? 0) > plafond.otages) && (
              <div className="form-error">
                <AlertTriangle size={15} /> Plafond dépassé pour {plafond.lieu} : {plafond.braqueurs} braqueurs et {plafond.otages} otages maximum.
                On ne négocie pas au-delà.
              </div>
            )}

            <div className="sub-options-col" style={{ marginTop: 12 }}>
              <Toggle checked={n.perimetre} onChange={(v) => set({ perimetre: v })} label="Périmètre fait et tenu" />
              <Toggle
                checked={n.offRadio}
                onChange={(v) => set({ offRadio: v })}
                label="Négociateur en OFF radio"
                hint="Autorisé seulement si un relayeur est sur scène"
              />
            </div>

            <div className="form-grid" style={{ marginTop: 12 }}>
              <Field label="Négociateur">
                <TextInput value={n.negociateur} onChange={(v) => set({ negociateur: v })} placeholder="400" />
              </Field>
              <Field label="Relayeur">
                <TextInput value={n.relayeur} onChange={(v) => set({ relayeur: v })} placeholder="410" />
              </Field>
              <Field label="Agents présents" wide>
                <ChipsInput
                  values={n.agents}
                  onChange={(v) => set({ agents: v })}
                  suggestions={settings.collegues}
                  prefix="#"
                  placeholder="Matricule puis Entrée"
                />
              </Field>
            </div>
          </Panel>

          <Panel
            title="Véhicules et individus"
            icon={Car}
            right={
              <button type="button" className="btn" onClick={() => addVehicule(n.id)}>
                <Plus size={15} /> Véhicule
              </button>
            }
          >
            <div className="stack gap-12">
              {n.vehicules.length === 0 && <p className="muted small">Ajoute chaque véhicule suspect avec sa plaque en photo.</p>}
              {n.vehicules.map((v, k) => (
                <div className="bloc-liste" key={v.id}>
                  <div className="bloc-liste-head">
                    <strong>Véhicule {k + 1}</strong>
                    <ConfirmButton icon={Trash2} label="Retirer" confirmLabel="Confirmer" onConfirm={() => removeVehicule(n.id, v.id)} />
                  </div>
                  <div className="form-grid">
                    <Field label="Plaque">
                      <TextInput
                        value={v.plaque}
                        onChange={(x) => set({ vehicules: n.vehicules.map((y) => (y.id === v.id ? { ...y, plaque: x.toUpperCase() } : y)) })}
                        placeholder="48FJD291"
                      />
                    </Field>
                    <Field label="Description">
                      <TextInput
                        value={v.description}
                        onChange={(x) => set({ vehicules: n.vehicules.map((y) => (y.id === v.id ? { ...y, description: x } : y)) })}
                        placeholder="SUV noir"
                      />
                    </Field>
                  </div>
                  <ScreenSlot
                    target={{ dossierId: n.id, sousId: v.id, slot: 'negoVehicule' }}
                    images={v.photos}
                    title="Photo de la plaque"
                    hint="Colle le screen de la plaque avec Ctrl+V"
                  />
                </div>
              ))}

              <ScreenSlot
                target={{ dossierId: n.id, sousId: null, slot: 'negoSuspects' }}
                images={n.photosSuspects}
                title="Photos des individus"
                hint="Tenues, masques, armes visibles"
              />
            </div>
          </Panel>

          <Panel
            title="Otages"
            icon={Users}
            right={
              <button type="button" className="btn" onClick={() => addOtage(n.id)}>
                <Plus size={15} /> Otage
              </button>
            }
          >
            <div className="stack gap-12">
              {n.otages.length === 0 && (
                <p className="muted small">Un otage à la fois : carte d’identité, vérification du fichier des recherchés, état de santé.</p>
              )}
              {n.otages.map((o, k) => (
                <div className="bloc-liste" key={o.id}>
                  <div className="bloc-liste-head">
                    <strong>
                      <UserRound size={15} /> Otage {k + 1}
                    </strong>
                    {o.recherche === 'oui' && <Badge tone="red">recherché</Badge>}
                    <ConfirmButton icon={Trash2} label="Retirer" confirmLabel="Confirmer" onConfirm={() => removeOtage(n.id, o.id)} />
                  </div>
                  <div className="form-grid">
                    <Field label="Nom sur la carte d’identité" wide>
                      <TextInput
                        value={o.nom}
                        onChange={(x) => set({ otages: n.otages.map((y) => (y.id === o.id ? { ...y, nom: x } : y)) })}
                        placeholder="Marcus REED"
                      />
                    </Field>
                    <Field label="Recherché ?">
                      <Segmented
                        tone="yesno"
                        value={o.recherche}
                        onChange={(x: YesNo) =>
                          set({ otages: n.otages.map((y) => (y.id === o.id ? { ...y, recherche: x, arrete: x === 'oui' ? true : y.arrete } : y)) })
                        }
                        options={[
                          { value: 'oui' as const, label: 'Oui' },
                          { value: 'non' as const, label: 'Non' }
                        ]}
                      />
                    </Field>
                    <Field label="Suite donnée">
                      <Toggle
                        checked={o.arrete}
                        onChange={(x) => set({ otages: n.otages.map((y) => (y.id === o.id ? { ...y, arrete: x } : y)) })}
                        label="Interpellé après le braquage"
                      />
                    </Field>
                    <Field label="État de l’otage" wide hint="À manger, à boire, besoin des EMS…">
                      <TextInput
                        value={o.note}
                        onChange={(x) => set({ otages: n.otages.map((y) => (y.id === o.id ? { ...y, note: x } : y)) })}
                        placeholder="A mangé et bu, pas de blessure."
                      />
                    </Field>
                  </div>
                  <ScreenSlot
                    target={{ dossierId: n.id, sousId: o.id, slot: 'negoOtage' }}
                    images={o.identite}
                    title="Carte d’identité"
                    hint="Le screen de sa carte d’identité"
                  />
                </div>
              ))}
            </div>
          </Panel>
        </div>

        <div className="stack">
          <Panel
            title="Déroulement de la négociation"
            icon={Handshake}
            right={
              <button type="button" className="btn" onClick={() => addEchange(n.id)}>
                <Plus size={15} /> Revendication
              </button>
            }
          >
            <div className="stack gap-12">
              <p className="muted small" style={{ margin: 0 }}>
                Un otage civil libéré = une revendication accordée, jamais plus.
              </p>
              {n.echanges.map((e, k) => (
                <div className="bloc-liste" key={e.id}>
                  <div className="bloc-liste-head">
                    <strong>Échange {k + 1}</strong>
                    <ConfirmButton icon={Trash2} label="Retirer" confirmLabel="Confirmer" onConfirm={() => removeEchange(n.id, e.id)} />
                  </div>
                  <Field label="Revendication accordée" wide>
                    <TextInput
                      value={e.revendication}
                      onChange={(x) => set({ echanges: n.echanges.map((y) => (y.id === e.id ? { ...y, revendication: x } : y)) })}
                      placeholder="Véhicule de fuite"
                    />
                    <div className="pill-group" style={{ marginTop: 8 }}>
                      {REVENDICATIONS.map((r) => (
                        <button
                          type="button"
                          key={r}
                          className={`pill ${e.revendication === r ? 'on' : ''}`}
                          onClick={() => set({ echanges: n.echanges.map((y) => (y.id === e.id ? { ...y, revendication: r } : y)) })}
                        >
                          {r}
                        </button>
                      ))}
                    </div>
                  </Field>
                  <Field label="Contrepartie obtenue" wide>
                    <TextInput
                      value={e.contrepartie}
                      onChange={(x) => set({ echanges: n.echanges.map((y) => (y.id === e.id ? { ...y, contrepartie: x } : y)) })}
                      placeholder="1 otage libéré"
                    />
                  </Field>
                </div>
              ))}

              <Field label="Demande atypique transmise aux hauts gradés" wide>
                <TextInput
                  value={n.demandesAtypiques}
                  onChange={(v) => set({ demandesAtypiques: v })}
                  placeholder="Hélicoptère réclamé, refusé par le commandement."
                />
              </Field>

              <Field label="Comment ça s’est passé" wide hint="Ton d’échange, menaces, bluff, temps morts.">
                <TextArea
                  value={n.deroulement}
                  onChange={(v) => set({ deroulement: v })}
                  rows={4}
                  placeholder="La négociation s’est déroulée de manière calme, les braqueurs ont accepté de libérer un otage contre le retrait des barrages."
                />
              </Field>
            </div>
          </Panel>

          <Panel title="Usage de l’arme par les forces de l’ordre" icon={Crosshair}>
            <div className="stack gap-12">
              <Toggle
                checked={n.armeUtilisee}
                onChange={(v) => set({ armeUtilisee: v, armeMotifs: v ? n.armeMotifs : [], armeDetail: v ? n.armeDetail : '' })}
                label="Un agent a fait usage de son arme"
                hint="Tazer compris"
              />
              {n.armeUtilisee && (
                <div className="sub-options-col">
                  <Field label="Pourquoi" wide>
                    <div className="pill-group">
                      {MOTIFS_ARME.map((m) => {
                        const actif = n.armeMotifs.includes(m)
                        return (
                          <button
                            type="button"
                            key={m}
                            className={`pill ${actif ? 'on' : ''}`}
                            onClick={() => set({ armeMotifs: actif ? n.armeMotifs.filter((x) => x !== m) : [...n.armeMotifs, m] })}
                          >
                            {m}
                          </button>
                        )
                      })}
                    </div>
                  </Field>
                  <Field label="Précisions" wide>
                    <TextArea
                      value={n.armeDetail}
                      onChange={(v) => set({ armeDetail: v })}
                      rows={2}
                      placeholder="Deux tirs dans les pneus du véhicule de fuite."
                    />
                  </Field>
                </div>
              )}
            </div>
          </Panel>

          <Panel title="Fin de l’opération" icon={CheckCircle2}>
            <div className="stack gap-12">
              <Field label="Comment ça s’est terminé" wide>
                <Segmented
                  value={n.finType}
                  onChange={(v: FinNego) => set({ finType: v })}
                  options={[
                    { value: 'enfuis' as const, label: 'Les individus se sont enfuis' },
                    { value: 'arretes-partiel' as const, label: 'X individus arrêtés' },
                    { value: 'arretes-tous' as const, label: 'Tous arrêtés' },
                    { value: 'autre' as const, label: 'Autre' }
                  ]}
                />
              </Field>
              {n.finType === 'arretes-partiel' && (
                <Field label="Combien d’individus arrêtés">
                  <TextInput
                    value={n.finArretes === null ? '' : String(n.finArretes)}
                    onChange={(v) => set({ finArretes: nombre(v) })}
                    type="number"
                  />
                </Field>
              )}
              <Toggle checked={n.poursuite} onChange={(v) => set({ poursuite: v })} label="Course-poursuite engagée à la sortie" />
              <Field label="Détails de la fin" wide hint="Obligatoire si tu as choisi « Autre ».">
                <TextArea
                  value={n.finDetail}
                  onChange={(v) => set({ finDetail: v })}
                  rows={3}
                  placeholder="Intervention arrêtée sur ordre du commandement."
                />
              </Field>
            </div>
          </Panel>

          <Panel
            title="Résumé rapide"
            icon={FileImage}
            right={
              <button type="button" className="btn" onClick={() => set({ resume: resumeAuto(n) })}>
                Remplir tout seul
              </button>
            }
          >
            <TextArea
              value={n.resume}
              onChange={(v) => set({ resume: v })}
              rows={3}
              placeholder="Laisse vide : l’appli écrira le résumé toute seule dans le rapport."
            />
          </Panel>
        </div>
      </div>

      <div className="nego-generer">
        <div>
          <strong>Rapport officiel de négociation</strong>
          <span>
            Document LSPD — Mission Row, prêt à envoyer dans le salon de négociation. Les screens que tu as collés sont dessinés dedans.
          </span>
        </div>
        <button type="button" className="btn btn-primary btn-lg" disabled={busy} onClick={() => void generer()}>
          <FileImage size={17} /> {busy ? 'Génération…' : 'Générer votre rapport de négociation'}
        </button>
      </div>

      {pages && <RapportGenere pages={pages} nom={negociationTitre(n)} />}
    </div>
  )
}

function RapportGenere({ pages, nom }: { pages: PageRapport[]; nom: string }) {
  const toast = useStore((s) => s.toast)
  const base = nom.replace(/[^\w\s-]/g, '').trim().replace(/\s+/g, '-').toLowerCase() || 'negociation'

  function telecharger(p: PageRapport, k: number) {
    const a = document.createElement('a')
    a.href = p.dataUrl
    a.download = `rapport-${base}-page-${k + 1}.png`
    a.click()
  }

  async function copier(p: PageRapport) {
    try {
      await navigator.clipboard.write([new ClipboardItem({ 'image/png': p.blob })])
      toast('ok', 'Page copiée, colle-la dans Discord.')
    } catch {
      toast('error', 'Copie refusée par le navigateur, utilise « Télécharger ».')
    }
  }

  return (
    <Panel
      title={`Rapport généré — ${pages.length} page${pages.length > 1 ? 's' : ''}`}
      icon={FileImage}
      className="panel-wide"
      right={
        <button type="button" className="btn" onClick={() => pages.forEach((p, k) => telecharger(p, k))}>
          <Download size={15} /> Tout télécharger
        </button>
      }
    >
      <div className="rapport-pages">
        {pages.map((p, k) => (
          <figure key={k}>
            <img src={p.dataUrl} alt={`Page ${k + 1}`} />
            <figcaption>
              <span>Page {k + 1}</span>
              <button type="button" className="btn" onClick={() => void copier(p)}>
                <ClipboardCopy size={15} /> Copier
              </button>
              <button type="button" className="btn" onClick={() => telecharger(p, k)}>
                <Download size={15} /> Télécharger
              </button>
            </figcaption>
          </figure>
        ))}
      </div>
    </Panel>
  )
}
