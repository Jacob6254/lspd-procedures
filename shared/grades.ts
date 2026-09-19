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

/** Ransons officielles par grade, en argent sale. */
export const RANCONS_GRADES: { grade: string; montant: number; pochons: number }[] = [
  { grade: 'Rookie', montant: 16500, pochons: 22 },
  { grade: 'Officier 1', montant: 33000, pochons: 44 },
  { grade: 'Officier 2', montant: 49500, pochons: 66 },
  { grade: 'Officier 3', montant: 66000, pochons: 88 },
  { grade: 'Senior Lead Officer', montant: 82500, pochons: 110 },
  { grade: 'Sergent 1', montant: 99000, pochons: 132 },
  { grade: 'Sergent 2', montant: 115500, pochons: 154 },
  { grade: 'Lieutenant 1', montant: 132000, pochons: 176 },
  { grade: 'Lieutenant 2', montant: 148500, pochons: 198 },
  { grade: 'Capitaine', montant: 165000, pochons: 220 },
  { grade: 'Commandant', montant: 181500, pochons: 242 },
  { grade: 'Deputy-Chief', montant: 198000, pochons: 264 },
  { grade: 'Assistant Chief', montant: 214500, pochons: 286 },
  { grade: 'Chief Of Police', montant: 231000, pochons: 308 }
]

export const RANCONS_AUTRES = [
  { qui: 'Civil', montant: 10000, pochons: 13 },
  { qui: 'Agent du DOJ', montant: 80000, pochons: 106 }
]

export const PLAFONDS_ILLEGAUX = [
  { rang: 'Soldat', montant: 40000 },
  { rang: 'Élite', montant: 60000 },
  { rang: 'Lieutenant', montant: 70000 },
  { rang: 'Bras droit', montant: 80000 },
  { rang: 'Co-Patron', montant: 90000 },
  { rang: 'Patron', montant: 120000 }
]

export const BRAQUAGES = [
  { lieu: 'Supérette', braqueurs: 2, otages: 1, vehicules: 1 },
  { lieu: 'Fleeca Bank', braqueurs: 6, otages: 2, vehicules: 2 },
  { lieu: 'Paleto Bay', braqueurs: 8, otages: 2, vehicules: 3 },
  { lieu: 'Vangelico', braqueurs: 10, otages: 3, vehicules: 3 },
  { lieu: 'Maze Bank', braqueurs: 12, otages: 3, vehicules: 4 },
  { lieu: 'Pacific Bank', braqueurs: 15, otages: 5, vehicules: 6 }
]
