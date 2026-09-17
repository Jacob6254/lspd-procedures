// Types partagés entre le serveur et l'interface.

export type WeaponStatus = 'legal' | 'ppa' | 'illegal'

export interface Weapon {
  id: string
  name: string
  category: string
  status: WeaponStatus
  ppa?: number | null
}

export interface WeaponCategory {
  key: string
  label: string
  icon: string
}

export interface WeaponData {
  fetchedAt: string
  categories: WeaponCategory[]
  weapons: Weapon[]
}

export interface ImageRef {
  id: string
  file: string // nom du fichier dans le dossier screens
  createdAt: string
}

export type YesNo = 'oui' | 'non' | null
export type Cooperation = 'tres' | 'coop' | 'peu' | 'non'
export type SaisieType = 'arme' | 'munition' | 'drogue' | 'argent' | 'autre'

export interface Saisie {
  id: string
  type: SaisieType
  label: string
  quantite: number | null
  weaponId?: string
}

export interface Suspect {
  id: string
  civilite: 'M' | 'Mme'
  prenom: string
  nom: string
  naissance: string
  photo: ImageRef[]
  identite: ImageRef[]
  recherche: YesNo
  bracelet: YesNo
  ppa: number | null // null = pas vérifié, 0 = aucun
  mirandaLusA: string | null
  fouilleScreens: ImageRef[]
  saisies: Saisie[]
  rienSurLui: boolean
  cooperation: Cooperation | null
  comportements: string[]
  outrage: boolean
  outragePhrase: string
  menace: boolean
  menacePhrase: string
  accusations: string[]
  /** Points cochés dans la checklist de fin de procédure. */
  checklist: string[]
  notes: string
  amendesScreens: ImageRef[]
  casierScreens: ImageRef[]
  rapportManuel: string | null
}

export type Origine = 'appel' | 'patrouille' | 'controle' | 'flagrant'

export interface Intervention {
  id: string
  createdAt: string
  updatedAt: string
  statut: 'en_cours' | 'terminee'
  date: string // AAAA-MM-JJ
  heure: string // HH:MM
  origine: Origine
  motif: string
  lieu: string
  matricules: string[]
  constat: string
  fuitePied: boolean
  fuitePiedDuree: string
  poursuite: boolean
  poursuiteDuree: string
  poursuiteDangereuse: boolean
  poursuiteFin: string
  tazer: boolean
  negociation: string
  interpellation: string
  destination: 'poste' | 'interrogatoire'
  autres: string
  sceneScreens: ImageRef[]
  suspects: Suspect[]
}

export interface Settings {
  matricule: string
  nomAgent: string
  collegues: string[]
}

export interface Db {
  version: 1
  /** Numéro de version géré par le serveur, pour que deux personnes ne s'écrasent pas. */
  rev?: number
  settings: Settings
  interventions: Intervention[]
  inbox: ImageRef[]
  learned: { drogues: string[]; autres: string[]; accusations: string[] }
}

export interface Me {
  id: string
  username: string
  role: 'admin' | 'user'
}

export interface AccountInfo extends Me {
  createdAt: string
}

export interface SupervisionNote {
  id: string
  from: string
  text: string
  createdAt: string
  interventionId?: string
  suspectId?: string
  lu: boolean
}

export interface AgentSummary extends Me {
  interventions: number
  enCours: number
  suspects: number
  screens: number
  majA: string | null
  notesNonLues: number
}
