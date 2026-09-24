import type { BaseTableau, PointPlan } from './plan'

/**
 * La carte tactique : on pose des marqueurs, on trace les itinéraires en
 * flèches, on annote, et chaque unité a son calque qu'on peut éteindre.
 */

export type MarqueurType =
  | 'pc'
  | 'entree'
  | 'unite'
  | 'objectif'
  | 'vehicule'
  | 'blocage'
  | 'air'
  | 'otage'
  | 'cible'
  | 'sniper'
  | 'perimetre'
  | 'evac'
  | 'regroupement'

export interface DefMarqueur {
  type: MarqueurType
  label: string
  /** Le sigle inscrit dans la pastille, sur la carte comme sur l'image exportée. */
  code: string
  /** Nom de l'icône lucide, résolu côté page. */
  icone: string
  famille: 'dispositif' | 'mobilite' | 'personnes' | 'zones'
}

export const MARQUEURS: DefMarqueur[] = [
  { type: 'pc', label: 'PC / QG', code: 'PC', icone: 'Flag', famille: 'dispositif' },
  { type: 'entree', label: "Point d'entrée", code: 'E', icone: 'DoorOpen', famille: 'dispositif' },
  { type: 'unite', label: "Position d'unité", code: 'U', icone: 'Users', famille: 'dispositif' },
  { type: 'objectif', label: 'Objectif', code: 'OBJ', icone: 'Target', famille: 'dispositif' },
  { type: 'vehicule', label: 'Véhicule', code: 'VH', icone: 'Car', famille: 'mobilite' },
  { type: 'blocage', label: 'Blocage routier', code: 'BLC', icone: 'Construction', famille: 'mobilite' },
  { type: 'air', label: 'Air Unit', code: 'AIR', icone: 'Plane', famille: 'mobilite' },
  { type: 'otage', label: 'Otage', code: 'OT', icone: 'UserRound', famille: 'personnes' },
  { type: 'cible', label: 'Cible / suspect', code: 'X', icone: 'Crosshair', famille: 'personnes' },
  { type: 'sniper', label: 'Observateur', code: 'OBS', icone: 'Eye', famille: 'personnes' },
  { type: 'perimetre', label: 'Périmètre', code: 'PER', icone: 'Hexagon', famille: 'zones' },
  { type: 'evac', label: 'Évacuation', code: 'EVA', icone: 'Ambulance', famille: 'zones' },
  { type: 'regroupement', label: 'Regroupement', code: 'RGP', icone: 'MapPin', famille: 'zones' }
]

export const FAMILLES_MARQUEUR: { id: DefMarqueur['famille']; label: string }[] = [
  { id: 'dispositif', label: 'Dispositif' },
  { id: 'mobilite', label: 'Véhicules et air' },
  { id: 'personnes', label: 'Personnes' },
  { id: 'zones', label: 'Zones' }
]

export function defMarqueur(type: MarqueurType): DefMarqueur {
  return MARQUEURS.find((m) => m.type === type) ?? MARQUEURS[0]
}

/**
 * Un fond de carte. Les positions sont enregistrées en coordonnées de l'île,
 * jamais en pixels : `ile` dit où se trouve l'île dans l'image, ce qui permet
 * de changer de fond sans qu'un seul marqueur ne bouge.
 */
export interface FondCarte {
  id: string
  nom: string
  fichier: string
  /** Cadre de l'île dans l'image, en fractions (x, y, largeur, hauteur). */
  ile: { x: number; y: number; w: number; h: number }
  sombre: boolean
}

/**
 * Les fichiers sont dans `public/cartes/`. Le cadre `ile` a été relevé sur
 * chaque image : c'est lui qui fait qu'on passe d'un fond à l'autre sans
 * qu'un seul marqueur ne bouge. Si on remplace une image, il faut le refaire.
 */
export const FONDS: FondCarte[] = [
  { id: 'nuit', nom: 'Nuit', fichier: '/cartes/nuit.webp', ile: { x: 0.117, y: 0.063, w: 0.771, h: 0.901 }, sombre: true },
  { id: 'satellite', nom: 'Satellite', fichier: '/cartes/satellite.webp', ile: { x: 0.019, y: 0.06, w: 0.918, h: 0.902 }, sombre: true },
  { id: 'atlas', nom: 'Atlas', fichier: '/cartes/atlas.webp', ile: { x: 0.071, y: 0.091, w: 0.821, h: 0.857 }, sombre: false }
]

export const FOND_DEFAUT = 'nuit'

export function fondCarte(id: string): FondCarte {
  return FONDS.find((f) => f.id === id) ?? FONDS[0]
}

export interface Unite {
  id: string
  nom: string
  /** Identifiant de couleur dans la palette du plan. */
  couleur: string
  visible: boolean
  effectif: number
}

export interface Marqueur extends PointPlan {
  id: string
  type: MarqueurType
  texte: string
  uniteId: string | null
}

export interface Fleche {
  id: string
  points: PointPlan[]
  uniteId: string | null
}

export interface Etiquette extends PointPlan {
  id: string
  texte: string
  uniteId: string | null
}

export interface Operation extends BaseTableau {
  lieu: string
  objectif: string
  fond: string
  unites: Unite[]
  marqueurs: Marqueur[]
  fleches: Fleche[]
  etiquettes: Etiquette[]
}

export const UNITES_DEPART: { nom: string; couleur: string }[] = [
  { nom: 'Alpha', couleur: 'cyan' },
  { nom: 'Bravo', couleur: 'orange' }
]

/** Tout ce qui est posé sur la carte, mis à plat pour compter ou parcourir. */
export function elementsOperation(op: Operation): number {
  return op.marqueurs.length + op.fleches.length + op.etiquettes.length
}

export function uniteDe(op: Operation, id: string | null): Unite | null {
  return id ? (op.unites.find((u) => u.id === id) ?? null) : null
}

/** Longueur approximative d'un itinéraire, en fraction de la largeur de l'île. */
export function longueurFleche(f: Fleche): number {
  let d = 0
  for (let i = 1; i < f.points.length; i++) {
    d += Math.hypot(f.points[i].x - f.points[i - 1].x, f.points[i].y - f.points[i - 1].y)
  }
  return d
}

/** Point cardinal d'une position, pour décrire un itinéraire en français. */
export function cardinal(p: PointPlan): string {
  const v = p.y < 0.37 ? 'nord' : p.y > 0.63 ? 'sud' : ''
  const h = p.x < 0.37 ? 'ouest' : p.x > 0.63 ? 'est' : ''
  if (v && h) return `${v}-${h}`
  return v || h || 'centre'
}
