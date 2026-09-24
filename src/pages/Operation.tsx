import { useEffect, useMemo, useRef, useState } from 'react'
import type { CSSProperties, MouseEvent as ReactMouseEvent, PointerEvent as ReactPointerEvent } from 'react'
import {
  Ambulance,
  ArrowLeft,
  Car,
  ClipboardCopy,
  Construction,
  Crosshair,
  DoorOpen,
  Download,
  Eye,
  EyeOff,
  Flag,
  Hexagon,
  Layers,
  Map as MapIcon,
  MapPin,
  MousePointer2,
  Plane,
  Plus,
  Share2,
  Camera,
  ImagePlus,
  Target,
  Trash,
  Type,
  UserRound,
  Users,
  Waypoints,
  X,
  ZoomIn,
  ZoomOut
} from 'lucide-react'
import type { LucideIcon } from 'lucide-react'
import type { Fleche, MarqueurType, Operation, Unite } from '@shared/operation'
import { FAMILLES_MARQUEUR, FONDS, MARQUEURS, defMarqueur, fondCarte } from '@shared/operation'
import { COULEURS_PLAN, couleurLibre, couleurPlan, type PointPlan } from '@shared/plan'
import { uid } from '../lib/format'
import { useOperations } from '../operations'
import { useStore } from '../store'
import { glisser, usePlan } from '../plan/viewport'
import { exporterCarte, texteBriefing } from '../plan/export-carte'
import { copierImage, telechargerImage, type Sortie } from '../plan/dessin'
import { api, imgUrl } from '../api'
import { Empty, Field, TextArea, TextInput } from '../components/ui'

const ICONES: Record<string, LucideIcon> = {
  Flag,
  DoorOpen,
  Users,
  Target,
  Car,
  Construction,
  Plane,
  UserRound,
  Crosshair,
  Eye,
  Hexagon,
  Ambulance,
  MapPin
}

type Outil = 'main' | 'marqueur' | 'fleche' | 'etiquette'
type Selection = { k: 'marqueur' | 'fleche' | 'etiquette'; id: string } | null

const RATIO_DEFAUT = 0.82

export function OperationPage({ id }: { id: string }) {
  const charger = useOperations((s) => s.charger)
  const etat = useOperations((s) => s.etat)
  const op = useOperations((s) => s.mes.find((o) => o.id === id) ?? s.poste.find((o) => o.id === id) ?? null)
  const mien = useOperations((s) => s.mes.some((o) => o.id === id))
  const modifier = useOperations((s) => s.modifier)
  const go = useStore((s) => s.go)
  const toast = useStore((s) => s.toast)

  useEffect(() => {
    void charger()
  }, [charger])

  const [outil, setOutil] = useState<Outil>('main')
  const [typeMarqueur, setTypeMarqueur] = useState<MarqueurType>('unite')
  const [uniteActive, setUniteActive] = useState<string | null>(null)
  const [selection, setSelection] = useState<Selection>(null)
  const [brouillon, setBrouillon] = useState<PointPlan[]>([])
  const [curseur, setCurseur] = useState<PointPlan | null>(null)
  const [ratio, setRatio] = useState(RATIO_DEFAUT)
  // Largeur utile du fond, en pixels d'origine : elle borne le zoom.
  const [pixelsFond, setPixelsFond] = useState(0)
  const [fondAbsent, setFondAbsent] = useState(false)
  const [sortieExport, setSortieExport] = useState<{ image: Sortie; texte: string } | null>(null)
  const [occupe, setOccupe] = useState(false)
  /** Noms des marqueurs : effacés quand ils se gênent, tous, ou aucun. */
  const [noms, setNoms] = useState<'auto' | 'tous' | 'aucun'>('auto')

  const ctrl = usePlan(ratio, pixelsFond)
  const zone = ctrl.cadre
  const fond = fondCarte(op?.fond ?? '')
  const lecture = !mien

  // La première unité sert de calque par défaut.
  useEffect(() => {
    if (!op) return
    if (uniteActive && op.unites.some((u) => u.id === uniteActive)) return
    setUniteActive(op.unites[0]?.id ?? null)
  }, [op, uniteActive])

  useEffect(() => {
    setFondAbsent(false)
  }, [fond.fichier])

  // Le cadre suit les proportions de l'image dès qu'elle est connue.
  const premierCadrage = useRef(true)
  useEffect(() => {
    if (premierCadrage.current) {
      premierCadrage.current = false
      return
    }
    ctrl.recadrer()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ratio])

  const maj = (patch: (o: Operation) => Operation) => {
    if (lecture) return
    modifier(id, patch)
  }

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const dans = e.target as HTMLElement
      if (dans && /input|textarea|select/i.test(dans.tagName)) return
      if (e.key === 'Escape') {
        if (brouillon.length) setBrouillon([])
        else if (selection) setSelection(null)
        else setOutil('main')
      }
      if ((e.key === 'Delete' || e.key === 'Backspace') && selection) {
        e.preventDefault()
        supprimerSelection()
      }
      if (e.key === 'Enter' && brouillon.length > 1) validerFleche()
      if (e.key === 'v' || e.key === 'V') setOutil('main')
      if (e.key === 'm' || e.key === 'M') setOutil('marqueur')
      if (e.key === 'f' || e.key === 'F') setOutil('fleche')
      if (e.key === 't' || e.key === 'T') setOutil('etiquette')
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  })

  if (!op) {
    return (
      <div className="page">
        <Empty
          icon={MapIcon}
          title={etat === 'chargement' ? 'Ouverture de la carte…' : 'Opération introuvable'}
          text={etat === 'chargement' ? undefined : "Elle a peut-être été supprimée, ou son auteur l'a retirée du poste."}
        >
          <button type="button" className="btn" onClick={() => go({ page: 'operations' })}>
            <ArrowLeft size={15} /> Revenir aux opérations
          </button>
        </Empty>
      </div>
    )
  }

  function validerFleche() {
    if (brouillon.length < 2) {
      setBrouillon([])
      return
    }
    const f: Fleche = { id: uid(), points: brouillon, uniteId: uniteActive }
    maj((o) => ({ ...o, fleches: [...o.fleches, f] }))
    setBrouillon([])
    setSelection({ k: 'fleche', id: f.id })
  }

  function supprimerSelection() {
    if (!selection) return
    const s = selection
    maj((o) => ({
      ...o,
      marqueurs: s.k === 'marqueur' ? o.marqueurs.filter((x) => x.id !== s.id) : o.marqueurs,
      fleches: s.k === 'fleche' ? o.fleches.filter((x) => x.id !== s.id) : o.fleches,
      etiquettes: s.k === 'etiquette' ? o.etiquettes.filter((x) => x.id !== s.id) : o.etiquettes
    }))
    setSelection(null)
  }

  function clicPlan(e: ReactMouseEvent) {
    if (ctrl.panEnCours || lecture) return
    const p = ctrl.versPlan(e)
    if (p.x < 0 || p.x > 1 || p.y < 0 || p.y > 1) return
    if (outil === 'marqueur') {
      const m = { id: uid(), type: typeMarqueur, x: p.x, y: p.y, texte: '', uniteId: uniteActive }
      maj((o) => ({ ...o, marqueurs: [...o.marqueurs, m] }))
      setSelection({ k: 'marqueur', id: m.id })
    } else if (outil === 'fleche') {
      setBrouillon((b) => [...b, p])
    } else if (outil === 'etiquette') {
      const et = { id: uid(), x: p.x, y: p.y, texte: 'Annotation', uniteId: uniteActive }
      maj((o) => ({ ...o, etiquettes: [...o.etiquettes, et] }))
      setSelection({ k: 'etiquette', id: et.id })
    } else {
      setSelection(null)
    }
  }

  async function exporter() {
    setOccupe(true)
    try {
      const image = await exporterCarte(op!)
      setSortieExport({ image, texte: texteBriefing(op!) })
    } catch {
      toast('error', "L'image n'a pas pu être fabriquée.")
    } finally {
      setOccupe(false)
    }
  }

  const visible = (uniteId: string | null) => !uniteId || op.unites.find((u) => u.id === uniteId)?.visible !== false
  const teinte = (uniteId: string | null) => {
    const u = op.unites.find((x) => x.id === uniteId)
    return u ? couleurPlan(u.couleur) : '#e2e8f0'
  }

  const W = ctrl.monde.w
  const H = ctrl.monde.h

  return (
    <div className="plan-ecran">
      <header className="plan-barre">
        <button type="button" className="btn btn-ghost btn-icon" title="Retour" onClick={() => go({ page: 'operations' })}>
          <ArrowLeft size={17} />
        </button>
        <div className="plan-titre">
          <input
            className="plan-nom"
            value={op.nom}
            readOnly={lecture}
            onChange={(e) => maj((o) => ({ ...o, nom: e.target.value }))}
            placeholder="Nom de l'opération"
          />
          <small>
            {lecture ? `Publiée par ${op.auteurNom}` : op.publiee ? 'Publiée au poste' : 'Brouillon privé'} · {op.marqueurs.length} marqueur(s) ·{' '}
            {op.fleches.length} itinéraire(s)
          </small>
        </div>

        <div className="plan-fonds">
          {FONDS.map((f) => (
            <button
              key={f.id}
              type="button"
              className={`plan-fond ${op.fond === f.id ? 'actif' : ''}`}
              onClick={() => maj((o) => ({ ...o, fond: f.id }))}
              disabled={lecture}
            >
              {f.nom}
            </button>
          ))}
        </div>

        <div className="plan-zoom">
          <button type="button" className="btn btn-ghost btn-icon" title="Dézoomer" onClick={() => ctrl.zoomer(1 / 1.3)}>
            <ZoomOut size={16} />
          </button>
          <button type="button" className="btn btn-ghost btn-icon" title="Voir toute la carte" onClick={ctrl.recadrer}>
            <MapIcon size={16} />
          </button>
          <button
            type="button"
            className="btn btn-ghost btn-icon"
            title={ctrl.auMaximum ? `Zoom maximum : le fond « ${fond.nom} » ne contient pas plus de détail` : 'Zoomer'}
            disabled={ctrl.auMaximum}
            onClick={() => ctrl.zoomer(1.3)}
          >
            <ZoomIn size={16} />
          </button>
          <button
            type="button"
            className={`btn btn-ghost btn-icon ${noms === 'aucun' ? 'eteint' : ''}`}
            title={
              noms === 'auto'
                ? 'Noms des marqueurs : effacés quand ils se gênent'
                : noms === 'tous'
                  ? 'Noms des marqueurs : tous affichés'
                  : 'Noms des marqueurs : masqués'
            }
            onClick={() => setNoms(noms === 'auto' ? 'tous' : noms === 'tous' ? 'aucun' : 'auto')}
          >
            <Type size={16} />
          </button>
        </div>

        {!lecture && (
          <button
            type="button"
            className={`btn ${op.publiee ? 'btn-publiee' : ''}`}
            onClick={() => maj((o) => ({ ...o, publiee: !o.publiee }))}
            title={op.publiee ? 'Retirer du poste' : 'Rendre visible par les autres agents'}
          >
            <Share2 size={15} /> {op.publiee ? 'Publiée' : 'Publier'}
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
              <OutilBouton icon={MousePointer2} label="Main" actif={outil === 'main'} onClick={() => setOutil('main')} raccourci="V" />
              <OutilBouton icon={MapPin} label="Marqueur" actif={outil === 'marqueur'} onClick={() => setOutil('marqueur')} raccourci="M" />
              <OutilBouton icon={Waypoints} label="Itinéraire" actif={outil === 'fleche'} onClick={() => setOutil('fleche')} raccourci="F" />
              <OutilBouton icon={Type} label="Étiquette" actif={outil === 'etiquette'} onClick={() => setOutil('etiquette')} raccourci="T" />
            </div>

            {outil === 'marqueur' && (
              <>
                <div className="rail-titre">Marqueur à poser</div>
                {FAMILLES_MARQUEUR.map((fam) => (
                  <div key={fam.id} className="rail-famille">
                    <span>{fam.label}</span>
                    <div className="rail-grille">
                      {MARQUEURS.filter((m) => m.famille === fam.id).map((m) => {
                        const Icone = ICONES[m.icone] ?? MapPin
                        return (
                          <button
                            key={m.type}
                            type="button"
                            title={m.label}
                            className={`rail-marqueur ${typeMarqueur === m.type ? 'actif' : ''}`}
                            onClick={() => setTypeMarqueur(m.type)}
                          >
                            <Icone size={15} />
                            <small>{m.label}</small>
                          </button>
                        )
                      })}
                    </div>
                  </div>
                ))}
              </>
            )}

            {outil === 'fleche' && (
              <p className="rail-aide">
                Clique de point en point pour tracer l'itinéraire. <strong>Entrée</strong> pour le terminer, <strong>Échap</strong> pour tout
                effacer.
              </p>
            )}

            <div className="rail-titre">
              <Layers size={13} /> Calques
            </div>
            <p className="rail-cible">
              Nouvel élément pour <strong>{op.unites.find((u) => u.id === uniteActive)?.nom ?? 'aucune unité'}</strong>
            </p>
            <div className="rail-unites">
              {op.unites.map((u) => (
                <UniteLigne
                  key={u.id}
                  unite={u}
                  active={uniteActive === u.id}
                  onActiver={() => setUniteActive(u.id)}
                  onChange={(patch) => maj((o) => ({ ...o, unites: o.unites.map((x) => (x.id === u.id ? { ...x, ...patch } : x)) }))}
                  onSupprimer={() =>
                    maj((o) => ({
                      ...o,
                      unites: o.unites.filter((x) => x.id !== u.id),
                      marqueurs: o.marqueurs.map((m) => (m.uniteId === u.id ? { ...m, uniteId: null } : m)),
                      fleches: o.fleches.map((f) => (f.uniteId === u.id ? { ...f, uniteId: null } : f)),
                      etiquettes: o.etiquettes.map((e) => (e.uniteId === u.id ? { ...e, uniteId: null } : e))
                    }))
                  }
                />
              ))}
              <button
                type="button"
                className="rail-ajout"
                onClick={() =>
                  maj((o) => ({
                    ...o,
                    unites: [
                      ...o.unites,
                      {
                        id: uid(),
                        nom: `Unité ${o.unites.length + 1}`,
                        couleur: couleurLibre(o.unites.map((u) => u.couleur)),
                        visible: true,
                        effectif: 0
                      }
                    ]
                  }))
                }
              >
                <Plus size={14} /> Ajouter une unité
              </button>
            </div>
          </aside>
        )}

        <div
          className={`plan-zone ${outil === 'main' ? 'outil-main' : 'outil-pose'} ${ctrl.panEnCours ? 'en-pan' : ''}`}
          ref={zone}
          onPointerDown={(e: ReactPointerEvent) => {
            if (e.button === 0 && outil !== 'main') {
              // On laisse le clic poser l'élément, mais un glissement déplace la carte.
              ctrl.demarrerPan(e)
            } else if (e.button === 0 || e.button === 1) {
              ctrl.demarrerPan(e)
            }
          }}
          onMouseMove={(e) => outil === 'fleche' && brouillon.length > 0 && setCurseur(ctrl.versPlan(e))}
          onClick={clicPlan}
          onDoubleClick={() => brouillon.length > 1 && validerFleche()}
        >
          <div
            className={`plan-monde ${outil === 'fleche' ? 'trace' : ''}`}
            style={{ width: W, height: H, transform: `translate(${ctrl.vue.x}px, ${ctrl.vue.y}px)` }}
          >
            {!fondAbsent ? (
              <img
                className="carte-fond"
                src={fond.fichier}
                alt=""
                draggable={false}
                style={{
                  width: `${100 / fond.ile.w}%`,
                  height: `${100 / fond.ile.h}%`,
                  left: `${(-fond.ile.x / fond.ile.w) * 100}%`,
                  top: `${(-fond.ile.y / fond.ile.h) * 100}%`
                }}
                onLoad={(e) => {
                  const img = e.currentTarget
                  const r = (img.naturalWidth * fond.ile.w) / (img.naturalHeight * fond.ile.h)
                  if (Number.isFinite(r) && r > 0.2 && r < 5) setRatio(r)
                  setPixelsFond(Math.round(img.naturalWidth * fond.ile.w))
                }}
                onError={() => setFondAbsent(true)}
              />
            ) : (
              <div className="carte-absente">
                <MapIcon size={26} />
                <strong>Fond « {fond.nom} » pas encore installé</strong>
                <small>Dépose l'image dans public{fond.fichier} et elle s'affichera ici.</small>
              </div>
            )}

            <svg className="plan-svg" width={Math.max(1, W)} height={Math.max(1, H)}>
              {op.fleches
                .filter((f) => visible(f.uniteId))
                .map((f) => (
                  <TraceFleche
                    key={f.id}
                    fleche={f}
                    couleur={teinte(f.uniteId)}
                    W={W}
                    H={H}
                    choisi={selection?.k === 'fleche' && selection.id === f.id}
                    onChoisir={() => setSelection({ k: 'fleche', id: f.id })}
                  />
                ))}
              {brouillon.length > 0 && (
                <TraceFleche
                  fleche={{ id: 'brouillon', points: curseur ? [...brouillon, curseur] : brouillon, uniteId: uniteActive }}
                  couleur={teinte(uniteActive)}
                  W={W}
                  H={H}
                  choisi
                  brouillon
                />
              )}
            </svg>

            {(() => {
              // Les noms s'effacent quand ils se marcheraient dessus : la carte
              // reste lisible même avec vingt marqueurs au même endroit.
              const vus = op.marqueurs.filter((m) => visible(m.uniteId))
              const montres = new Set<string>()
              if (noms !== 'aucun') {
                const boites: { x: number; y: number; larg: number; haut: number }[] = []
                const prioritaire = (m: { id: string }) => (selection?.k === 'marqueur' && selection.id === m.id ? 0 : 1)
                for (const m of [...vus].sort((a, b) => prioritaire(a) - prioritaire(b))) {
                  const texte = m.texte.trim() || defMarqueur(m.type).label
                  const b = { x: m.x * W, y: m.y * H + 28, larg: texte.length * 6.2 + 18, haut: 21 }
                  const gene = boites.some(
                    (o) => Math.abs(o.x - b.x) < (o.larg + b.larg) / 2 && Math.abs(o.y - b.y) < (o.haut + b.haut) / 2
                  )
                  if (noms === 'tous' || !gene) {
                    boites.push(b)
                    montres.add(m.id)
                  }
                }
              }

              return vus.map((m) => {
                const d = defMarqueur(m.type)
                const choisi = selection?.k === 'marqueur' && selection.id === m.id
                const classes = ['mk', choisi ? 'choisi' : '', montres.has(m.id) ? '' : 'sans-nom'].join(' ')
                return (
                  <div
                    key={m.id}
                    className={classes}
                    style={{ left: `${m.x * 100}%`, top: `${m.y * 100}%`, '--c': teinte(m.uniteId) } as CSSProperties}
                    onPointerDown={(e) =>
                      !lecture &&
                      glisser(e, ctrl, m, (p) =>
                        maj((o) => ({ ...o, marqueurs: o.marqueurs.map((x) => (x.id === m.id ? { ...x, ...p } : x)) }))
                      )
                    }
                    onClick={(e) => {
                      e.stopPropagation()
                      setSelection({ k: 'marqueur', id: m.id })
                    }}
                  >
                    <span className="mk-pastille">
                      {d.code}
                      {m.image ? <i className="mk-photo" /> : null}
                    </span>
                    <span className="mk-label">{m.texte.trim() || d.label}</span>
                  </div>
                )
              })
            })()}

            {op.etiquettes
              .filter((e) => visible(e.uniteId))
              .map((et) => {
                const choisi = selection?.k === 'etiquette' && selection.id === et.id
                return (
                  <div
                    key={et.id}
                    className={`etq ${choisi ? 'choisi' : ''}`}
                    style={{ left: `${et.x * 100}%`, top: `${et.y * 100}%`, '--c': teinte(et.uniteId) } as CSSProperties}
                    onPointerDown={(e) =>
                      !lecture &&
                      glisser(e, ctrl, et, (p) =>
                        maj((o) => ({ ...o, etiquettes: o.etiquettes.map((x) => (x.id === et.id ? { ...x, ...p } : x)) }))
                      )
                    }
                    onClick={(e) => {
                      e.stopPropagation()
                      setSelection({ k: 'etiquette', id: et.id })
                    }}
                  >
                    {et.texte || 'Annotation'}
                  </div>
                )
              })}
          </div>

          {outil !== 'main' && !lecture && (
            <div className="plan-astuce">
              {outil === 'marqueur' && `Clique pour poser : ${defMarqueur(typeMarqueur).label}`}
              {outil === 'fleche' && (brouillon.length ? 'Entrée pour terminer l’itinéraire' : 'Clique le premier point de l’itinéraire')}
              {outil === 'etiquette' && 'Clique où écrire'}
            </div>
          )}

          {ctrl.auMaximum && (
            <div className="plan-note">Zoom maximum pour la définition du fond « {fond.nom} »</div>
          )}
        </div>

        <aside className="plan-inspecteur">
          <Inspecteur
            op={op}
            selection={selection}
            lecture={lecture}
            onChange={maj}
            onSupprimer={supprimerSelection}
            onFermer={() => setSelection(null)}
          />
        </aside>
      </div>

      {sortieExport && (
        <PanneauExport
          nom={op.nom}
          sortie={sortieExport}
          onFermer={() => setSortieExport(null)}
          onTexte={(t) => setSortieExport((s) => (s ? { ...s, texte: t } : s))}
        />
      )}
    </div>
  )
}

function OutilBouton({
  icon: Icon,
  label,
  actif,
  onClick,
  raccourci
}: {
  icon: LucideIcon
  label: string
  actif: boolean
  onClick: () => void
  raccourci: string
}) {
  return (
    <button type="button" className={`rail-outil ${actif ? 'actif' : ''}`} onClick={onClick} title={`${label} (${raccourci})`}>
      <Icon size={16} />
      <span>{label}</span>
      <kbd>{raccourci}</kbd>
    </button>
  )
}

function UniteLigne({
  unite,
  active,
  onActiver,
  onChange,
  onSupprimer
}: {
  unite: Unite
  active: boolean
  onActiver: () => void
  onChange: (patch: Partial<Unite>) => void
  onSupprimer: () => void
}) {
  const [ouvert, setOuvert] = useState(false)
  return (
    <div
      className={`unite ${active ? 'active' : ''} ${unite.visible ? '' : 'eteinte'}`}
      onPointerDown={onActiver}
      title="Les prochains éléments iront sur ce calque"
    >
      <button type="button" className="unite-puce" style={{ background: couleurPlan(unite.couleur) }} onClick={() => setOuvert((v) => !v)} />
      <input className="unite-nom" value={unite.nom} onChange={(e) => onChange({ nom: e.target.value })} onFocus={onActiver} />
      <input
        className="unite-effectif"
        type="number"
        min={0}
        max={99}
        value={unite.effectif || ''}
        placeholder="0"
        title="Effectif"
        onChange={(e) => onChange({ effectif: Number(e.target.value) || 0 })}
      />
      <button
        type="button"
        className="btn btn-ghost btn-icon"
        title={unite.visible ? 'Masquer ce calque' : 'Afficher ce calque'}
        onClick={() => onChange({ visible: !unite.visible })}
      >
        {unite.visible ? <Eye size={14} /> : <EyeOff size={14} />}
      </button>
      {ouvert && (
        <div className="unite-palette">
          {COULEURS_PLAN.map((c) => (
            <button
              key={c.id}
              type="button"
              title={c.nom}
              style={{ background: c.hex }}
              className={unite.couleur === c.id ? 'actif' : ''}
              onClick={() => {
                onChange({ couleur: c.id })
                setOuvert(false)
              }}
            />
          ))}
          <button type="button" className="unite-suppr" onClick={onSupprimer} title="Supprimer l'unité">
            <Trash size={13} />
          </button>
        </div>
      )}
    </div>
  )
}

function TraceFleche({
  fleche,
  couleur,
  W,
  H,
  choisi,
  brouillon,
  onChoisir
}: {
  fleche: Fleche
  couleur: string
  W: number
  H: number
  choisi: boolean
  brouillon?: boolean
  onChoisir?: () => void
}) {
  const pts = fleche.points.map((p) => ({ x: p.x * W, y: p.y * H }))
  if (pts.length < 2) {
    return pts.length === 1 ? <circle cx={pts[0].x} cy={pts[0].y} r={4} fill={couleur} /> : null
  }
  const d = pts.map((p, i) => `${i === 0 ? 'M' : 'L'} ${p.x} ${p.y}`).join(' ')
  const a = pts[pts.length - 2]
  const b = pts[pts.length - 1]
  const angle = Math.atan2(b.y - a.y, b.x - a.x)
  const t = 13
  const pointe = [
    `${b.x},${b.y}`,
    `${b.x - t * Math.cos(angle - 0.42)},${b.y - t * Math.sin(angle - 0.42)}`,
    `${b.x - t * Math.cos(angle + 0.42)},${b.y - t * Math.sin(angle + 0.42)}`
  ].join(' ')

  return (
    <g className={`trace ${choisi ? 'choisi' : ''}`} onClick={onChoisir ? (e) => (e.stopPropagation(), onChoisir()) : undefined}>
      <path d={d} stroke="rgba(6,9,16,0.7)" strokeWidth={7} fill="none" strokeLinejoin="round" strokeLinecap="round" />
      <path
        d={d}
        stroke={couleur}
        strokeWidth={choisi ? 4 : 3}
        strokeDasharray={brouillon ? '8 6' : undefined}
        fill="none"
        strokeLinejoin="round"
        strokeLinecap="round"
      />
      <polygon points={pointe} fill={couleur} stroke="rgba(6,9,16,0.7)" strokeWidth={1.5} />
      {choisi &&
        pts.map((p, i) => <circle key={i} cx={p.x} cy={p.y} r={4.5} fill="#0b0e18" stroke={couleur} strokeWidth={2} />)}
    </g>
  )
}

function Inspecteur({
  op,
  selection,
  lecture,
  onChange,
  onSupprimer,
  onFermer
}: {
  op: Operation
  selection: Selection
  lecture: boolean
  onChange: (patch: (o: Operation) => Operation) => void
  onSupprimer: () => void
  onFermer: () => void
}) {
  const unites = useMemo(() => [{ id: '', nom: 'Aucune unité' }, ...op.unites], [op.unites])
  const toast = useStore((s) => s.toast)
  const fichier = useRef<HTMLInputElement | null>(null)

  async function envoyerImage(blob: Blob, marqueurId: string) {
    try {
      const ref = await api.saveImage(blob)
      onChange((o) => ({ ...o, marqueurs: o.marqueurs.map((x) => (x.id === marqueurId ? { ...x, image: ref.file } : x)) }))
    } catch {
      toast('error', "L'image n'a pas pu être envoyée.")
    }
  }

  if (!selection) {
    return (
      <div className="insp">
        <div className="insp-titre">L'opération</div>
        <Field label="Lieu">
          <TextInput value={op.lieu} onChange={(v) => onChange((o) => ({ ...o, lieu: v }))} placeholder="Banque Fleeca de Mirror Park" />
        </Field>
        <Field label="Objectif">
          <TextArea
            value={op.objectif}
            onChange={(v) => onChange((o) => ({ ...o, objectif: v }))}
            rows={4}
            placeholder="Interpeller les trois suspects sans mettre les otages en danger."
          />
        </Field>
        <p className="insp-aide">
          Sélectionne un élément de la carte pour le modifier. <strong>Suppr</strong> l'efface, la molette zoome, le glisser déplace la carte.
        </p>
      </div>
    )
  }

  const marqueur = selection.k === 'marqueur' ? op.marqueurs.find((m) => m.id === selection.id) : null
  const etiquette = selection.k === 'etiquette' ? op.etiquettes.find((e) => e.id === selection.id) : null
  const fleche = selection.k === 'fleche' ? op.fleches.find((f) => f.id === selection.id) : null
  const courant = marqueur ?? etiquette ?? fleche
  if (!courant) return <div className="insp" />

  const setUnite = (v: string) => {
    const uniteId = v || null
    onChange((o) => ({
      ...o,
      marqueurs: o.marqueurs.map((x) => (x.id === selection.id ? { ...x, uniteId } : x)),
      fleches: o.fleches.map((x) => (x.id === selection.id ? { ...x, uniteId } : x)),
      etiquettes: o.etiquettes.map((x) => (x.id === selection.id ? { ...x, uniteId } : x))
    }))
  }

  return (
    <div className="insp">
      <div className="insp-titre">
        {marqueur ? defMarqueur(marqueur.type).label : etiquette ? 'Étiquette' : 'Itinéraire'}
        <button type="button" className="btn btn-ghost btn-icon" onClick={onFermer} title="Fermer">
          <X size={15} />
        </button>
      </div>

      {marqueur && (
        <>
          <div className="insp-photo">
            {marqueur.image ? (
              <img src={imgUrl(marqueur.image)} alt="" />
            ) : (
              <div className="insp-photo-vide">
                <Camera size={22} />
                <span>Pas de screen</span>
              </div>
            )}
            {!lecture && (
              <div className="insp-photo-actions">
                <button type="button" className="btn btn-petit" onClick={() => fichier.current?.click()}>
                  <ImagePlus size={14} /> {marqueur.image ? 'Changer' : 'Ajouter un screen'}
                </button>
                {marqueur.image && (
                  <button
                    type="button"
                    className="btn btn-petit btn-ghost"
                    onClick={() => onChange((o) => ({ ...o, marqueurs: o.marqueurs.map((x) => (x.id === marqueur.id ? { ...x, image: null } : x)) }))}
                  >
                    <X size={14} /> Retirer
                  </button>
                )}
              </div>
            )}
            <input
              ref={fichier}
              type="file"
              accept="image/*"
              hidden
              onChange={(e) => {
                const f = e.target.files?.[0]
                if (f) void envoyerImage(f, marqueur.id)
                e.target.value = ''
              }}
            />
          </div>

          <Field label="Ce qu'on écrit à côté">
            <TextInput
              value={marqueur.texte}
              onChange={(v) => onChange((o) => ({ ...o, marqueurs: o.marqueurs.map((x) => (x.id === marqueur.id ? { ...x, texte: v } : x)) }))}
              placeholder={defMarqueur(marqueur.type).label}
            />
          </Field>
          <Field label="Type">
            <select
              className="input"
              value={marqueur.type}
              onChange={(e) =>
                onChange((o) => ({
                  ...o,
                  marqueurs: o.marqueurs.map((x) => (x.id === marqueur.id ? { ...x, type: e.target.value as MarqueurType } : x))
                }))
              }
            >
              {MARQUEURS.map((m) => (
                <option key={m.type} value={m.type}>
                  {m.label}
                </option>
              ))}
            </select>
          </Field>
          <Field label="Détail" hint="Ce qu'on veut savoir en cliquant dessus pendant le briefing.">
            <TextArea
              value={marqueur.note ?? ''}
              onChange={(v) => onChange((o) => ({ ...o, marqueurs: o.marqueurs.map((x) => (x.id === marqueur.id ? { ...x, note: v } : x)) }))}
              rows={5}
              placeholder="Deux agents en poste, porte blindée côté ruelle, caméra à l'angle."
            />
          </Field>
        </>
      )}

      {etiquette && (
        <Field label="Texte">
          <TextArea
            value={etiquette.texte}
            onChange={(v) => onChange((o) => ({ ...o, etiquettes: o.etiquettes.map((x) => (x.id === etiquette.id ? { ...x, texte: v } : x)) }))}
            rows={4}
          />
        </Field>
      )}

      {fleche && <p className="insp-aide">{fleche.points.length} points. Fais glisser un point de la carte pour le déplacer.</p>}

      <Field label="Calque">
        <select className="input" value={courant.uniteId ?? ''} onChange={(e) => setUnite(e.target.value)}>
          {unites.map((u) => (
            <option key={u.id} value={u.id}>
              {u.nom}
            </option>
          ))}
        </select>
      </Field>

      {!lecture && (
        <button type="button" className="btn btn-danger" onClick={onSupprimer}>
          <Trash size={15} /> Supprimer
        </button>
      )}
    </div>
  )
}

function PanneauExport({
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
          <strong>Le plan prêt à partager</strong>
          <button type="button" className="btn btn-ghost btn-icon" onClick={onFermer}>
            <X size={16} />
          </button>
        </div>

        <div className="plan-modale-grille">
          <div className="plan-apercu">
            <img src={sortie.image.dataUrl} alt="Carte annotée" />
            <div className="row gap-8">
              <button
                type="button"
                className="btn btn-primary"
                onClick={async () => {
                  try {
                    await copierImage(sortie.image.blob)
                    toast('ok', 'Image copiée, colle-la dans Discord.')
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
                Le briefing écrit
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
                    toast('ok', 'Briefing copié.')
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
