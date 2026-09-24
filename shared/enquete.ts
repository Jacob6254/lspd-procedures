import type { BaseTableau, PointPlan } from './plan'

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

export const FICHES: DefFiche[] = [
  { type: 'suspect', label: 'Suspect', icone: 'UserRound', largeur: 0.11 },
  { type: 'preuve', label: 'Preuve', icone: 'Camera', largeur: 0.13 },
  { type: 'lieu', label: 'Lieu', icone: 'MapPin', largeur: 0.11 },
  { type: 'vehicule', label: 'Véhicule', icone: 'Car', largeur: 0.11 },
  { type: 'note', label: 'Note', icone: 'StickyNote', largeur: 0.1 }
]

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

export function compteParType(e: Enquete): Record<FicheType, number> {
  const out = { suspect: 0, preuve: 0, lieu: 0, vehicule: 0, note: 0 }
  for (const f of e.fiches) out[f.type]++
  return out
}
