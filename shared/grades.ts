/** Grades LSPD du serveur, du plus bas au plus haut. */
export const GRADES = [
  'Rookie',
  'Officier 1',
  'Officier 2',
  'Officier 3',
  'Senior Lead Officer',
  'Sergent 1',
  'Sergent 2',
  'Lieutenant 1',
  'Lieutenant 2',
  'Capitaine',
  'Commandant',
  'Deputy-Chief',
  'Assistant Chief',
  'Chief Of Police'
] as const

export type Grade = (typeof GRADES)[number]

export const GRADE_DEFAUT: Grade = 'Rookie'

export function niveauGrade(grade: string | undefined): number {
  const i = GRADES.indexOf((grade ?? GRADE_DEFAUT) as Grade)
  return i === -1 ? 0 : i
}

/** Ce que l'agent voit dans un dossier, selon son grade. */
export type Visibilite = 'tout' | 'sans-screens' | 'reduit'

export function visibiliteDossier(grade: string | undefined): Visibilite {
  const n = niveauGrade(grade)
  if (n === 0) return 'tout' // Rookie
  if (n < niveauGrade('Sergent 1')) return 'sans-screens' // Officiers et Senior Lead Officer
  return 'reduit' // Sergent 1 et au-dessus
}

/** Étapes gardées pour les gradés à partir de Sergent 1. */
export const ETAPES_REDUITES = ['fouille', 'rapport', 'miranda', 'fiche'] as const
