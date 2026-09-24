/**
 * Socle commun aux deux tableaux de travail : la carte tactique des opérations
 * et le tableau d'enquête. Les deux se rangent de la même façon, se publient de
 * la même façon, et vivent dans leurs propres fichiers, à l'écart des dossiers.
 */

export interface BaseTableau {
  id: string
  nom: string
  /** Date de l'opération ou d'ouverture de l'enquête (yyyy-mm-dd). */
  date: string
  heure: string
  /** Identifiant du compte, posé par le serveur : on ne fait pas confiance au navigateur. */
  auteur: string
  /** Grade et nom tels qu'affichés, recopiés des réglages au moment de la création. */
  auteurNom: string
  /** Tant que c'est faux, personne d'autre ne le voit. */
  publiee: boolean
  maj: string
}

/** Un point du plan, en fraction de la largeur et de la hauteur (0 à 1). */
export interface PointPlan {
  x: number
  y: number
}

export interface CouleurPlan {
  id: string
  nom: string
  hex: string
}

/** La palette du blueprint : ce sont les teintes déjà présentes sur la carte. */
export const COULEURS_PLAN: CouleurPlan[] = [
  { id: 'cyan', nom: 'Cyan', hex: '#38bdf8' },
  { id: 'orange', nom: 'Orange', hex: '#f59e0b' },
  { id: 'rouge', nom: 'Rouge', hex: '#ef4444' },
  { id: 'vert', nom: 'Vert', hex: '#22c55e' },
  { id: 'violet', nom: 'Violet', hex: '#a78bfa' },
  { id: 'blanc', nom: 'Blanc', hex: '#e2e8f0' }
]

export function couleurPlan(id: string): string {
  return COULEURS_PLAN.find((c) => c.id === id)?.hex ?? COULEURS_PLAN[0].hex
}

/** Couleur suivante dans la palette, pour ne pas donner deux fois la même. */
export function couleurLibre(prises: string[]): string {
  return (COULEURS_PLAN.find((c) => !prises.includes(c.id)) ?? COULEURS_PLAN[prises.length % COULEURS_PLAN.length]).id
}

export function borne(v: number, min = 0, max = 1): number {
  return v < min ? min : v > max ? max : v
}
