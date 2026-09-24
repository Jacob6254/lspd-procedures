import { useEffect, useRef, useState } from 'react'
import type { CSSProperties, MouseEvent as ReactMouseEvent, PointerEvent as ReactPointerEvent } from 'react'
import {
  ArrowLeft,
  Camera,
  Car,
  ClipboardCopy,
  Download,
  FolderOpen,
  ImagePlus,
  Link2,
  MapPin,
  MousePointer2,
  Network,
  Plus,
  Share2,
  StickyNote,
  Trash,
  UserRound,
  X,
  ZoomIn,
  ZoomOut
} from 'lucide-react'
import type { LucideIcon } from 'lucide-react'
import type { Enquete, Fiche, FicheType, Lien } from '@shared/enquete'
import { FICHES, ROLES_GANG, STATUTS_FICHE, TYPES_LIEN, defFiche, typeLien } from '@shared/enquete'
import { couleurPlan } from '@shared/plan'
import type { Suspect } from '@shared/types'
import { dateFr, uid } from '../lib/format'
import { nouvelleFiche, useEnquetes } from '../enquetes'
import { useStore } from '../store'
import { api, imgUrl, posteImgUrl } from '../api'
import { glisser, usePlan } from '../plan/viewport'
import { exporterTableau, noteEnquete } from '../plan/export-enquete'
import { copierImage, telechargerImage, type Sortie } from '../plan/dessin'
import { Empty, Field, TextArea, TextInput } from '../components/ui'

const ICONES: Record<string, LucideIcon> = { UserRound, Camera, MapPin, Car, StickyNote }
const RATIO = 1.55

type Outil = 'main' | 'fiche' | 'lien'

export function EnquetePage({ id }: { id: string }) {
  const charger = useEnquetes((s) => s.charger)
  const etat = useEnquetes((s) => s.etat)
  const enq = useEnquetes((s) => s.mes.find((e) => e.id === id) ?? s.poste.find((e) => e.id === id) ?? null)
  const mien = useEnquetes((s) => s.mes.some((e) => e.id === id))
  const modifier = useEnquetes((s) => s.modifier)
  const go = useStore((s) => s.go)
  const toast = useStore((s) => s.toast)

  useEffect(() => {
    void charger()
  }, [charger])

  const [outil, setOutil] = useState<Outil>('main')
  const [typeFiche, setTypeFiche] = useState<FicheType>('suspect')
  const [choisie, setChoisie] = useState<string | null>(null)
  const [lienChoisi, setLienChoisi] = useState<string | null>(null)
  const [depart, setDepart] = useState<string | null>(null)
  const [importOuvert, setImport] = useState(false)
  const [sortieExport, setSortieExport] = useState<{ image: Sortie; texte: string } | null>(null)
  const [occupe, setOccupe] = useState(false)

  const ctrl = usePlan(RATIO)
  const lecture = !mien
  const maj = (patch: (e: Enquete) => Enquete) => {
    if (lecture) return
    modifier(id, patch)
  }

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const dans = e.target as HTMLElement
      if (dans && /input|textarea|select/i.test(dans.tagName)) return
      if (e.key === 'Escape') {
        setDepart(null)
        setChoisie(null)
        setLienChoisi(null)
        setOutil('main')
      }
      if (e.key === 'Delete' || e.key === 'Backspace') {
        if (choisie) {
          e.preventDefault()
          supprimerFiche(choisie)
        } else if (lienChoisi) {
          e.preventDefault()
          maj((x) => ({ ...x, liens: x.liens.filter((l) => l.id !== lienChoisi) }))
          setLienChoisi(null)
        }
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  })

  if (!enq) {
    return (
      <div className="page">
        <Empty
          icon={Network}
          title={etat === 'chargement' ? 'Ouverture du tableau…' : 'Enquête introuvable'}
          text={etat === 'chargement' ? undefined : "Elle a peut-être été supprimée, ou retirée du poste."}
        >
          <button type="button" className="btn" onClick={() => go({ page: 'enquetes' })}>
            <ArrowLeft size={15} /> Revenir aux enquêtes
          </button>
        </Empty>
      </div>
    )
  }

  function supprimerFiche(ficheId: string) {
    maj((x) => ({
      ...x,
      fiches: x.fiches.filter((f) => f.id !== ficheId),
      liens: x.liens.filter((l) => l.de !== ficheId && l.vers !== ficheId)
    }))
    setChoisie(null)
  }

  function clicTableau(e: ReactMouseEvent) {
    if (ctrl.panEnCours || lecture) return
    const p = ctrl.versPlan(e)
    if (p.x < 0 || p.x > 1 || p.y < 0 || p.y > 1) return
    if (outil === 'fiche') {
      const f = nouvelleFiche(typeFiche, p.x, p.y)
      maj((x) => ({ ...x, fiches: [...x.fiches, f] }))
      setChoisie(f.id)
      setOutil('main')
    } else {
      setChoisie(null)
      setLienChoisi(null)
      setDepart(null)
    }
  }

  function clicFiche(f: Fiche) {
    if (outil === 'lien' && !lecture) {
      if (!depart) {
        setDepart(f.id)
        return
      }
      if (depart === f.id) {
        setDepart(null)
        return
      }
      const l: Lien = { id: uid(), de: depart, vers: f.id, type: 'frequentation', libelle: '' }
      maj((x) => ({ ...x, liens: [...x.liens, l] }))
      setDepart(null)
      setLienChoisi(l.id)
      setChoisie(null)
      setOutil('main')
      return
    }
    setChoisie(f.id)
    setLienChoisi(null)
  }

  async function exporter() {
    setOccupe(true)
    try {
      const image = await exporterTableau(enq!, (file) => (lecture ? posteImgUrl(enq!.auteur, file) : imgUrl(file)))
      setSortieExport({ image, texte: noteEnquete(enq!) })
    } catch {
      toast('error', "L'image n'a pas pu être fabriquée.")
    } finally {
      setOccupe(false)
    }
  }

  const W = ctrl.monde.w
  const H = ctrl.monde.h
  const fiche = choisie ? (enq.fiches.find((f) => f.id === choisie) ?? null) : null
  const lien = lienChoisi ? (enq.liens.find((l) => l.id === lienChoisi) ?? null) : null

  return (
    <div className="plan-ecran">
      <header className="plan-barre">
        <button type="button" className="btn btn-ghost btn-icon" title="Retour" onClick={() => go({ page: 'enquetes' })}>
          <ArrowLeft size={17} />
        </button>
        <div className="plan-titre">
          <input
            className="plan-nom"
            value={enq.nom}
            readOnly={lecture}
            onChange={(e) => maj((x) => ({ ...x, nom: e.target.value }))}
            placeholder="Nom de l'enquête"
          />
          <small>
            {lecture ? `Publiée par ${enq.auteurNom}` : enq.publiee ? 'Publiée au poste' : 'Brouillon privé'} · {enq.fiches.length} fiche(s) ·{' '}
            {enq.liens.length} lien(s)
          </small>
        </div>

        <div className="plan-zoom">
          <button type="button" className="btn btn-ghost btn-icon" title="Dézoomer" onClick={() => ctrl.zoomer(1 / 1.3)}>
            <ZoomOut size={16} />
          </button>
          <button type="button" className="btn btn-ghost btn-icon" title="Voir tout le tableau" onClick={ctrl.recadrer}>
            <Network size={16} />
          </button>
          <button type="button" className="btn btn-ghost btn-icon" title="Zoomer" onClick={() => ctrl.zoomer(1.3)}>
            <ZoomIn size={16} />
          </button>
        </div>

        {!lecture && (
          <button type="button" className={`btn ${enq.publiee ? 'btn-publiee' : ''}`} onClick={() => maj((x) => ({ ...x, publiee: !x.publiee }))}>
            <Share2 size={15} /> {enq.publiee ? 'Publiée' : 'Publier'}
          </button>
        )}
        <button type="button" className="btn btn-primary" onClick={() => void exporter()} disabled={occupe}>
          <Download size={15} /> {occupe ? 'Un instant…' : 'Exporter'}
        </button>
      </header>

      <div className="plan-corps">
        {!lecture && (
          <aside className="plan-rail">
            <div className="rail-titre">Outils</div>
            <div className="rail-outils">
              <button type="button" className={`rail-outil ${outil === 'main' ? 'actif' : ''}`} onClick={() => setOutil('main')}>
                <MousePointer2 size={16} />
                <span>Main</span>
              </button>
              <button
                type="button"
                className={`rail-outil ${outil === 'lien' ? 'actif' : ''}`}
                onClick={() => {
                  setOutil(outil === 'lien' ? 'main' : 'lien')
                  setDepart(null)
                }}
              >
                <Link2 size={16} />
                <span>Tirer un fil</span>
              </button>
            </div>

            <div className="rail-titre">Épingler</div>
            <div className="rail-grille">
              {FICHES.map((f) => {
                const Icone = ICONES[f.icone] ?? StickyNote
                return (
                  <button
                    key={f.type}
                    type="button"
                    className={`rail-marqueur ${outil === 'fiche' && typeFiche === f.type ? 'actif' : ''}`}
                    onClick={() => {
                      setTypeFiche(f.type)
                      setOutil('fiche')
                    }}
                  >
                    <Icone size={15} />
                    <small>{f.label}</small>
                  </button>
                )
              })}
            </div>
            <button type="button" className="rail-ajout" onClick={() => setImport(true)}>
              <FolderOpen size={14} /> Importer un suspect
            </button>

            {outil === 'lien' && (
              <p className="rail-aide">
                {depart ? 'Clique la deuxième fiche pour relier les deux.' : 'Clique la première fiche du fil.'}
              </p>
            )}
            {outil === 'fiche' && <p className="rail-aide">Clique sur le tableau pour épingler la fiche.</p>}

            <div className="rail-titre">Types de fil</div>
            <div className="rail-liens">
              {TYPES_LIEN.map((t) => (
                <span key={t.id}>
                  <i style={{ background: couleurPlan(t.couleur) }} /> {t.label}
                </span>
              ))}
            </div>
          </aside>
        )}

        <div
          className={`plan-zone tableau ${outil === 'main' ? 'outil-main' : 'outil-pose'}`}
          ref={ctrl.cadre}
          onPointerDown={(e: ReactPointerEvent) => (e.button === 0 || e.button === 1) && ctrl.demarrerPan(e)}
          onClick={clicTableau}
        >
          <div className="plan-monde ardoise" style={{ width: W, height: H, transform: `translate(${ctrl.vue.x}px, ${ctrl.vue.y}px)` }}>
            <svg className="plan-svg" width={Math.max(1, W)} height={Math.max(1, H)}>
              {enq.liens.map((l) => {
                const a = enq.fiches.find((f) => f.id === l.de)
                const b = enq.fiches.find((f) => f.id === l.vers)
                if (!a || !b) return null
                const t = typeLien(l.type)
                const c = couleurPlan(t.couleur)
                const x1 = a.x * W
                const y1 = a.y * H
                const x2 = b.x * W
                const y2 = b.y * H
                const mx = (x1 + x2) / 2
                const my = (y1 + y2) / 2
                const libelle = l.libelle.trim() || t.label.toLowerCase()
                const larg = libelle.length * 6.4 + 14
                const actif = lienChoisi === l.id
                return (
                  <g
                    key={l.id}
                    className="fil"
                    onClick={(e) => {
                      e.stopPropagation()
                      setLienChoisi(l.id)
                      setChoisie(null)
                    }}
                  >
                    <line x1={x1} y1={y1} x2={x2} y2={y2} stroke="rgba(6,9,16,0.6)" strokeWidth={actif ? 7 : 5} />
                    <line x1={x1} y1={y1} x2={x2} y2={y2} stroke={c} strokeWidth={actif ? 3 : 2} />
                    <circle cx={x2} cy={y2} r={4} fill={c} />
                    <rect x={mx - larg / 2} y={my - 11} width={larg} height={20} rx={4} fill="rgba(8,11,20,0.9)" stroke={c} strokeWidth={1} />
                    <text x={mx} y={my + 3} textAnchor="middle" fontSize={11} fill="#e2e8f0" fontFamily="Archivo, sans-serif">
                      {libelle}
                    </text>
                  </g>
                )
              })}
            </svg>

            {enq.fiches.map((f) => (
              <CarteFiche
                key={f.id}
                fiche={f}
                W={W}
                H={H}
                choisie={choisie === f.id}
                depart={depart === f.id}
                lecture={lecture}
                srcImage={(file) => (lecture ? posteImgUrl(enq.auteur, file) : imgUrl(file))}
                onClick={() => clicFiche(f)}
                onDeplacer={(e) =>
                  !lecture && glisser(e, ctrl, f, (p) => maj((x) => ({ ...x, fiches: x.fiches.map((y) => (y.id === f.id ? { ...y, ...p } : y)) })))
                }
              />
            ))}
          </div>

          {enq.fiches.length === 0 && (
            <div className="tableau-vide">
              <Network size={28} />
              <strong>Le tableau est vierge</strong>
              <span>Épingle une première fiche à gauche, ou importe un suspect déjà traité dans tes procédures.</span>
            </div>
          )}
        </div>

        <aside className="plan-inspecteur">
          {fiche ? (
            <InspecteurFiche
              fiche={fiche}
              enq={enq}
              lecture={lecture}
              onChange={(patch) => maj((x) => ({ ...x, fiches: x.fiches.map((y) => (y.id === fiche.id ? { ...y, ...patch } : y)) }))}
              onSupprimer={() => supprimerFiche(fiche.id)}
              onFermer={() => setChoisie(null)}
              onOuvrirDossier={(interventionId) => go({ page: 'dossier', id: interventionId, tab: 'commun', step: 'identite' })}
            />
          ) : lien ? (
            <InspecteurLien
              lien={lien}
              enq={enq}
              lecture={lecture}
              onChange={(patch) => maj((x) => ({ ...x, liens: x.liens.map((y) => (y.id === lien.id ? { ...y, ...patch } : y)) }))}
              onSupprimer={() => {
                maj((x) => ({ ...x, liens: x.liens.filter((y) => y.id !== lien.id) }))
                setLienChoisi(null)
              }}
              onFermer={() => setLienChoisi(null)}
            />
          ) : (
            <div className="insp">
              <div className="insp-titre">L'enquête</div>
              <Field label="Sur qui / sur quoi">
                <TextInput value={enq.cible} onChange={(v) => maj((x) => ({ ...x, cible: v }))} placeholder="Gang des Ballas" />
              </Field>
              <Field label="Où on en est">
                <TextArea
                  value={enq.resume}
                  onChange={(v) => maj((x) => ({ ...x, resume: v }))}
                  rows={6}
                  placeholder="Trafic de drogue sur Grove Street. Chef non identifié pour le moment."
                />
              </Field>
              <p className="insp-aide">
                Clique une fiche pour la remplir, un fil pour écrire la relation. <strong>Suppr</strong> efface l'élément sélectionné.
              </p>
            </div>
          )}
        </aside>
      </div>

      {importOuvert && (
        <ImportSuspect
          onFermer={() => setImport(false)}
          onChoisir={(f) => {
            maj((x) => ({ ...x, fiches: [...x.fiches, f] }))
            setChoisie(f.id)
            setImport(false)
          }}
        />
      )}

      {sortieExport && (
        <ExportTableau
          nom={enq.nom}
          sortie={sortieExport}
          onFermer={() => setSortieExport(null)}
          onTexte={(t) => setSortieExport((s) => (s ? { ...s, texte: t } : s))}
        />
      )}
    </div>
  )
}

function CarteFiche({
  fiche,
  W,
  H,
  choisie,
  depart,
  lecture,
  srcImage,
  onClick,
  onDeplacer
}: {
  fiche: Fiche
  W: number
  H: number
  choisie: boolean
  depart: boolean
  lecture: boolean
  srcImage: (file: string) => string
  onClick: () => void
  onDeplacer: (e: ReactPointerEvent) => void
}) {
  const def = defFiche(fiche.type)
  const largeur = def.largeur * W
  const Icone = ICONES[def.icone] ?? StickyNote
  const style: CSSProperties = {
    left: fiche.x * W,
    top: fiche.y * H,
    width: largeur,
    fontSize: Math.max(7, largeur * 0.088),
    transform: `translate(-50%, -50%) rotate(${fiche.angle}deg)`
  }

  return (
    <div
      className={`fiche fiche-${fiche.type} ${choisie ? 'choisie' : ''} ${depart ? 'depart' : ''} ${lecture ? 'lecture' : ''}`}
      style={style}
      onPointerDown={onDeplacer}
      onClick={(e) => {
        e.stopPropagation()
        onClick()
      }}
    >
      <span className="fiche-punaise" />
      {fiche.image && (
        <div className="fiche-photo">
          <img src={srcImage(fiche.image)} alt="" draggable={false} />
        </div>
      )}
      <div className="fiche-corps">
        <div className="fiche-head">
          <Icone size={11} />
          <strong>{fiche.titre.trim() || def.label}</strong>
        </div>
        {(fiche.role || fiche.statut) && (
          <div className="fiche-tags">
            {fiche.role && <span className="fiche-role">{fiche.role}</span>}
            {fiche.statut && <span className="fiche-statut">{fiche.statut}</span>}
          </div>
        )}
        {fiche.texte.trim() && <p>{fiche.texte}</p>}
        {fiche.date && <small>{dateFr(fiche.date)}</small>}
      </div>
    </div>
  )
}

function InspecteurFiche({
  fiche,
  enq,
  lecture,
  onChange,
  onSupprimer,
  onFermer,
  onOuvrirDossier
}: {
  fiche: Fiche
  enq: Enquete
  lecture: boolean
  onChange: (patch: Partial<Fiche>) => void
  onSupprimer: () => void
  onFermer: () => void
  onOuvrirDossier: (interventionId: string) => void
}) {
  const toast = useStore((s) => s.toast)
  const fichier = useRef<HTMLInputElement | null>(null)
  const def = defFiche(fiche.type)
  const relations = enq.liens.filter((l) => l.de === fiche.id || l.vers === fiche.id)

  async function envoyer(blob: Blob) {
    try {
      const ref = await api.saveImage(blob)
      onChange({ image: ref.file })
    } catch {
      toast('error', "L'image n'a pas pu être envoyée.")
    }
  }

  return (
    <div className="insp">
      <div className="insp-titre">
        {def.label}
        <button type="button" className="btn btn-ghost btn-icon" onClick={onFermer} title="Fermer">
          <X size={15} />
        </button>
      </div>

      <Field label={fiche.type === 'suspect' ? 'Identité' : fiche.type === 'note' ? 'Titre de la note' : 'Intitulé'}>
        <TextInput
          value={fiche.titre}
          onChange={(v) => onChange({ titre: v })}
          placeholder={fiche.type === 'suspect' ? 'Marcus JOHNSON' : fiche.type === 'vehicule' ? 'Baller noir — 47LSD821' : def.label}
        />
      </Field>

      {fiche.type === 'suspect' && (
        <>
          <Field label="Rôle dans le réseau">
            <select className="input" value={fiche.role} onChange={(e) => onChange({ role: e.target.value })}>
              {ROLES_GANG.map((r) => (
                <option key={r} value={r}>
                  {r}
                </option>
              ))}
            </select>
          </Field>
          <Field label="Statut">
            <select className="input" value={fiche.statut} onChange={(e) => onChange({ statut: e.target.value })}>
              <option value="">Non précisé</option>
              {STATUTS_FICHE.map((s) => (
                <option key={s} value={s}>
                  {s}
                </option>
              ))}
            </select>
          </Field>
        </>
      )}

      <Field label={fiche.type === 'preuve' ? 'Ce que montre la preuve' : 'Détail'}>
        <TextArea value={fiche.texte} onChange={(v) => onChange({ texte: v })} rows={5} />
      </Field>

      {fiche.type !== 'note' && (
        <Field label="Date">
          <TextInput value={fiche.date} onChange={(v) => onChange({ date: v })} type="date" />
        </Field>
      )}

      {!lecture && fiche.type !== 'note' && (
        <div className="insp-image">
          <input
            ref={fichier}
            type="file"
            accept="image/*"
            hidden
            onChange={(e) => {
              const f = e.target.files?.[0]
              if (f) void envoyer(f)
              e.target.value = ''
            }}
          />
          <button type="button" className="btn" onClick={() => fichier.current?.click()}>
            <ImagePlus size={15} /> {fiche.image ? 'Changer le screen' : 'Ajouter un screen'}
          </button>
          {fiche.image && (
            <button type="button" className="btn btn-ghost btn-icon" title="Retirer le screen" onClick={() => onChange({ image: null })}>
              <X size={15} />
            </button>
          )}
        </div>
      )}

      {fiche.source && (
        <button type="button" className="btn btn-ghost insp-dossier" onClick={() => onOuvrirDossier(fiche.source!.interventionId)}>
          <FolderOpen size={15} /> Ouvrir le dossier d'origine
        </button>
      )}

      {relations.length > 0 && (
        <div className="insp-relations">
          <span className="eyebrow">Relié à</span>
          {relations.map((l) => {
            const autre = enq.fiches.find((f) => f.id === (l.de === fiche.id ? l.vers : l.de))
            return (
              <span key={l.id}>
                <i style={{ background: couleurPlan(typeLien(l.type).couleur) }} />
                {l.libelle.trim() || typeLien(l.type).label.toLowerCase()} · {autre?.titre.trim() || 'fiche'}
              </span>
            )
          })}
        </div>
      )}

      {!lecture && (
        <button type="button" className="btn btn-danger" onClick={onSupprimer}>
          <Trash size={15} /> Supprimer la fiche
        </button>
      )}
    </div>
  )
}

function InspecteurLien({
  lien,
  enq,
  lecture,
  onChange,
  onSupprimer,
  onFermer
}: {
  lien: Lien
  enq: Enquete
  lecture: boolean
  onChange: (patch: Partial<Lien>) => void
  onSupprimer: () => void
  onFermer: () => void
}) {
  const t = typeLien(lien.type)
  const a = enq.fiches.find((f) => f.id === lien.de)
  const b = enq.fiches.find((f) => f.id === lien.vers)

  return (
    <div className="insp">
      <div className="insp-titre">
        Le fil
        <button type="button" className="btn btn-ghost btn-icon" onClick={onFermer} title="Fermer">
          <X size={15} />
        </button>
      </div>

      <p className="insp-aide">
        <strong>{a?.titre.trim() || 'fiche'}</strong> → <strong>{b?.titre.trim() || 'fiche'}</strong>
      </p>

      <Field label="Type de relation">
        <select className="input" value={lien.type} onChange={(e) => onChange({ type: e.target.value })}>
          {TYPES_LIEN.map((x) => (
            <option key={x.id} value={x.id}>
              {x.label}
            </option>
          ))}
        </select>
      </Field>

      <Field label="Ce qu'on écrit sur le fil">
        <TextInput value={lien.libelle} onChange={(v) => onChange({ libelle: v })} placeholder={t.exemples[0]} />
      </Field>

      <div className="insp-exemples">
        {t.exemples.map((x) => (
          <button key={x} type="button" onClick={() => onChange({ libelle: x })}>
            {x}
          </button>
        ))}
      </div>

      {!lecture && (
        <button type="button" className="btn btn-danger" onClick={onSupprimer}>
          <Trash size={15} /> Couper le fil
        </button>
      )}
    </div>
  )
}

/** On récupère un suspect déjà traité plutôt que de le retaper. */
function ImportSuspect({ onFermer, onChoisir }: { onFermer: () => void; onChoisir: (f: Fiche) => void }) {
  const interventions = useStore((s) => s.db.interventions)
  const [recherche, setRecherche] = useState('')

  const lignes: { interventionId: string; suspect: Suspect; quand: string }[] = []
  for (const i of interventions) for (const s of i.suspects) lignes.push({ interventionId: i.id, suspect: s, quand: i.date })

  const q = recherche.trim().toLowerCase()
  const vus = lignes.filter((l) => !q || `${l.suspect.prenom} ${l.suspect.nom}`.toLowerCase().includes(q))

  return (
    <div className="plan-modale" onClick={onFermer}>
      <div className="plan-modale-corps etroite" onClick={(e) => e.stopPropagation()}>
        <div className="plan-modale-head">
          <strong>Importer un suspect de tes procédures</strong>
          <button type="button" className="btn btn-ghost btn-icon" onClick={onFermer}>
            <X size={16} />
          </button>
        </div>
        <div className="import-recherche">
          <TextInput value={recherche} onChange={setRecherche} placeholder="Chercher un nom…" autoFocus />
        </div>
        <div className="import-liste">
          {vus.length === 0 && <p className="muted">Aucun suspect dans tes dossiers pour le moment.</p>}
          {vus.map(({ interventionId, suspect, quand }) => {
            const nom = `${suspect.prenom} ${suspect.nom}`.trim() || 'Suspect sans identité'
            return (
              <button
                key={suspect.id}
                type="button"
                className="import-ligne"
                onClick={() => {
                  const f = nouvelleFiche('suspect', 0.3 + Math.random() * 0.4, 0.3 + Math.random() * 0.4)
                  onChoisir({
                    ...f,
                    titre: nom,
                    texte: suspect.accusations.join(', '),
                    statut: suspect.recherche === 'oui' ? 'Recherché' : 'Interpellé',
                    image: suspect.photo[0]?.file ?? suspect.identite[0]?.file ?? null,
                    date: quand,
                    source: { interventionId, suspectId: suspect.id }
                  })
                }}
              >
                <strong>{nom}</strong>
                <small>
                  {dateFr(quand)}
                  {suspect.accusations.length ? ` · ${suspect.accusations.slice(0, 3).join(', ')}` : ''}
                </small>
                <Plus size={15} />
              </button>
            )
          })}
        </div>
      </div>
    </div>
  )
}

function ExportTableau({
  nom,
  sortie,
  onFermer,
  onTexte
}: {
  nom: string
  sortie: { image: Sortie; texte: string }
  onFermer: () => void
  onTexte: (t: string) => void
}) {
  const toast = useStore((s) => s.toast)
  const trop = sortie.texte.length > 2000

  return (
    <div className="plan-modale" onClick={onFermer}>
      <div className="plan-modale-corps" onClick={(e) => e.stopPropagation()}>
        <div className="plan-modale-head">
          <strong>Le tableau prêt à partager</strong>
          <button type="button" className="btn btn-ghost btn-icon" onClick={onFermer}>
            <X size={16} />
          </button>
        </div>
        <div className="plan-modale-grille">
          <div className="plan-apercu">
            <img src={sortie.image.dataUrl} alt="Tableau d'enquête" />
            <div className="row gap-8">
              <button
                type="button"
                className="btn btn-primary"
                onClick={async () => {
                  try {
                    await copierImage(sortie.image.blob)
                    toast('ok', 'Image copiée.')
                  } catch {
                    toast('error', 'Copie refusée par le navigateur.')
                  }
                }}
              >
                <ClipboardCopy size={15} /> Copier l'image
              </button>
              <button type="button" className="btn" onClick={() => telechargerImage(sortie.image.dataUrl, nom)}>
                <Download size={15} /> Télécharger
              </button>
            </div>
          </div>
          <div className="plan-texte">
            <div className="row gap-8">
              <span className="eyebrow" style={{ flexGrow: 1 }}>
                La note d'enquête
              </span>
              <span className={`muted small ${trop ? 'c-amber' : ''}`}>
                {sortie.texte.length} caractères{trop ? ' · coupe en deux messages' : ''}
              </span>
              <button
                type="button"
                className="btn"
                onClick={async () => {
                  try {
                    await navigator.clipboard.writeText(sortie.texte)
                    toast('ok', 'Note copiée.')
                  } catch {
                    toast('error', 'Copie refusée par le navigateur.')
                  }
                }}
              >
                <ClipboardCopy size={15} /> Copier le texte
              </button>
            </div>
            <TextArea value={sortie.texte} onChange={onTexte} rows={18} />
          </div>
        </div>
      </div>
    </div>
  )
}
