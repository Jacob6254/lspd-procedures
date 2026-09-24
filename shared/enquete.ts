import { borne, type BaseTableau, type PointPlan } from './plan'

/**
 * Le tableau d'enquête : des fiches épinglées qu'on relie par des fils, pour
 * suivre un gang ou une affaire au long cours. Même mécanique que la carte
 * tactique, autre habillage.
 */

export type FicheType = 'suspect' | 'preuve' | 'lieu' | 'vehicule' | 'note'

export interface DefFiche {
  type: FicheType
  label: string
  icone: string
  /** Largeur de la fiche, en fraction de la largeur du tableau. */
  largeur: number
}

/**
 * Les largeurs sont moitié moindres qu'avant : le tableau est deux fois plus
 * vaste, et la vue s'ouvre à l'échelle 2 — on voit donc la même chose au
 * départ, avec deux fois plus de place autour pour écarter les fiches.
 */
export const FICHES: DefFiche[] = [
  { type: 'suspect', label: 'Suspect', icone: 'UserRound', largeur: 0.044 },
  { type: 'preuve', label: 'Preuve', icone: 'Camera', largeur: 0.05 },
  { type: 'lieu', label: 'Lieu', icone: 'MapPin', largeur: 0.041 },
  { type: 'vehicule', label: 'Véhicule', icone: 'Car', largeur: 0.041 },
  { type: 'note', label: 'Note', icone: 'StickyNote', largeur: 0.038 }
]

/** L'échelle à laquelle le tableau s'ouvre : les fiches sont lisibles d'emblée. */
export const ZOOM_TABLEAU = 2

export function defFiche(type: FicheType): DefFiche {
  return FICHES.find((f) => f.type === type) ?? FICHES[0]
}

export const ROLES_GANG = ['Chef', 'Bras droit', 'Lieutenant', 'Soldat', 'Guetteur', 'Dealer', 'Chimiste', 'Indic', 'Proche', 'Inconnu']

export const STATUTS_FICHE = ['Recherché', 'Sous surveillance', 'Interpellé', 'Incarcéré', 'Écarté'] as const
export type StatutFiche = (typeof STATUTS_FICHE)[number]

export interface TypeLien {
  id: string
  label: string
  couleur: string
  /** Suggestions de libellé proposées quand on choisit ce type de fil. */
  exemples: string[]
}

export const TYPES_LIEN: TypeLien[] = [
  { id: 'hierarchie', label: 'Hiérarchie', couleur: 'rouge', exemples: ['chef de', 'bras droit de', 'donne les ordres à', 'protège'] },
  { id: 'trafic', label: 'Trafic', couleur: 'orange', exemples: ['a vendu à', 'fournit', 'transporte pour', 'blanchit pour'] },
  { id: 'frequentation', label: 'Fréquentation', couleur: 'blanc', exemples: ['vu avec', 'famille de', 'colocataire de', 'aperçu sur place'] },
  { id: 'vehicule', label: 'Véhicule', couleur: 'cyan', exemples: ['conduit', 'même véhicule que', 'immatriculé au nom de'] },
  { id: 'lieu', label: 'Lieu', couleur: 'violet', exemples: ['planque à', 'deal à', 'propriétaire de', 'vu à'] }
]

export function typeLien(id: string): TypeLien {
  return TYPES_LIEN.find((t) => t.id === id) ?? TYPES_LIEN[0]
}

export interface Fiche extends PointPlan {
  id: string
  type: FicheType
  titre: string
  /** Rôle dans le gang pour un suspect, catégorie pour le reste. */
  role: string
  statut: string
  texte: string
  date: string
  /** Screen rattaché : photo du suspect, capture de la vente, plaque… */
  image: string | null
  /** Si la fiche vient d'un dossier déjà traité, de quoi y retourner. */
  source: { interventionId: string; suspectId: string | null } | null
  /** Léger travers, pour que le tableau n'ait pas l'air d'un tableur. */
  angle: number
}

export interface Lien {
  id: string
  de: string
  vers: string
  type: string
  libelle: string
}

export interface Enquete extends BaseTableau {
  /** Le gang ou l'affaire : « Ballas », « braquages Fleeca »… */
  cible: string
  resume: string
  statut: 'ouverte' | 'close'
  fiches: Fiche[]
  liens: Lien[]
}

export function ficheDe(e: Enquete, id: string): Fiche | null {
  return e.fiches.find((f) => f.id === id) ?? null
}

/** Les fiches reliées à celle-ci, avec le libellé du fil et son sens. */
export function relationsDe(e: Enquete, id: string): { lien: Lien; autre: Fiche; sortant: boolean }[] {
  const out: { lien: Lien; autre: Fiche; sortant: boolean }[] = []
  for (const l of e.liens) {
    if (l.de === id) {
      const autre = ficheDe(e, l.vers)
      if (autre) out.push({ lien: l, autre, sortant: true })
    } else if (l.vers === id) {
      const autre = ficheDe(e, l.de)
      if (autre) out.push({ lien: l, autre, sortant: false })
    }
  }
  return out
}

/** Le suspect le plus relié du tableau : souvent la tête du réseau. */
export function pivot(e: Enquete): Fiche | null {
  let best: Fiche | null = null
  let max = -1
  for (const f of e.fiches) {
    if (f.type !== 'suspect') continue
    const n = e.liens.filter((l) => l.de === f.id || l.vers === f.id).length
    if (n > max) {
      max = n
      best = f
    }
  }
  return best
}

/**
 * Range le tableau : la tête du réseau au centre, ses relations directes en
 * première couronne, le reste autour. Deux fiches ne peuvent plus se recouvrir.
 */
export function rangerTableau(e: Enquete): Fiche[] {
  if (e.fiches.length === 0) return e.fiches
  const tete = pivot(e) ?? e.fiches[0]
  const voisins = (id: string) => e.liens.filter((l) => l.de === id || l.vers === id).map((l) => (l.de === id ? l.vers : l.de))

  const profondeur = new Map<string, number>([[tete.id, 0]])
  const file = [tete.id]
  while (file.length) {
    const id = file.shift()!
    for (const v of voisins(id)) {
      if (profondeur.has(v)) continue
      profondeur.set(v, (profondeur.get(id) ?? 0) + 1)
      file.push(v)
    }
  }

  const couronnes: string[][] = [[], [], []]
  for (const f of e.fiches) couronnes[Math.min(2, profondeur.get(f.id) ?? 2)].push(f.id)

  const RAYONS: [number, number][] = [
    [0, 0],
    [0.15, 0.17],
    [0.28, 0.29]
  ]
  const place = new Map<string, PointPlan>()
  couronnes.forEach((ids, d) => {
    if (d === 0) {
      for (const id of ids) place.set(id, { x: 0.5, y: 0.5 })
      return
    }
    ids.forEach((id, k) => {
      // Un décalage d'un demi-pas sur la couronne extérieure, pour ne pas
      // aligner les fiches en rayons.
      const angle = -Math.PI / 2 + ((k + (d === 2 ? 0.5 : 0)) / Math.max(1, ids.length)) * Math.PI * 2
      place.set(id, {
        x: borne(0.5 + Math.cos(angle) * RAYONS[d][0], 0.05, 0.95),
        y: borne(0.5 + Math.sin(angle) * RAYONS[d][1], 0.06, 0.94)
      })
    })
  })

  return e.fiches.map((f) => ({ ...f, ...(place.get(f.id) ?? { x: f.x, y: f.y }), angle: 0 }))
}

interface Boite {
  x: number
  y: number
  larg: number
  haut: number
}

function recouvrement(a: Boite, b: Boite): number {
  const dx = (a.larg + b.larg) / 2 - Math.abs(a.x - b.x)
  const dy = (a.haut + b.haut) / 2 - Math.abs(a.y - b.y)
  return dx > 0 && dy > 0 ? dx * dy : 0
}

/**
 * Où poser le nom de chaque fil. On vise le milieu du trait, puis on glisse le
 * long du trait et de part et d'autre tant que l'étiquette recouvre une fiche
 * ou un autre nom. Si rien n'est libre, on garde le moins mauvais.
 */
export function positionsLibelles(
  fils: { x1: number; y1: number; x2: number; y2: number; larg: number; haut: number }[],
  obstacles: Boite[] = []
): PointPlan[] {
  const LONG = [0.5, 0.4, 0.6, 0.32, 0.68, 0.25, 0.75, 0.18, 0.82]
  const COTE = [0, -1, 1, -2, 2]
  const posees: Boite[] = []

  for (const f of fils) {
    const dx = f.x2 - f.x1
    const dy = f.y2 - f.y1
    const d = Math.hypot(dx, dy) || 1
    // Perpendiculaire au fil, pour décaler l'étiquette sur le côté.
    const nx = -dy / d
    const ny = dx / d

    let meilleur: Boite | null = null
    let meilleurScore = Infinity
    sortie: for (const t of LONG) {
      for (const c of COTE) {
        const essai: Boite = {
          x: f.x1 + dx * t + nx * c * (f.haut * 0.9),
          y: f.y1 + dy * t + ny * c * (f.haut * 0.9),
          larg: f.larg,
          haut: f.haut
        }
        let score = 0
        for (const o of obstacles) score += recouvrement(essai, o)
        for (const o of posees) score += recouvrement(essai, o) * 1.5
        if (score === 0) {
          meilleur = essai
          break sortie
        }
        if (score < meilleurScore) {
          meilleurScore = score
          meilleur = essai
        }
      }
    }
    posees.push(meilleur ?? { x: f.x1 + dx * 0.5, y: f.y1 + dy * 0.5, larg: f.larg, haut: f.haut })
  }
  return posees.map((p) => ({ x: p.x, y: p.y }))
}

export function compteParType(e: Enquete): Record<FicheType, number> {
  const out = { suspect: 0, preuve: 0, lieu: 0, vehicule: 0, note: 0 }
  for (const f of e.fiches) out[f.type]++
  return out
}
