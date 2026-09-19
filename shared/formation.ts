import type { Cooperation, ImageRef, SaisieType, YesNo } from './types'

export type NiveauFormation = 1 | 2 | 3

export interface FormationOption {
  id: string
  texte: string
  bon: boolean
}

export interface FormationQuestion {
  id: string
  texte: string
  type: 'unique' | 'multiple'
  options: FormationOption[]
  /** Conseil du formateur, montré seulement au niveau 1. */
  indice?: string
}

export interface SaisieAttendue {
  id: string
  type: SaisieType
  label: string
  quantite: number | null
}

/** Ce que le dossier du rookie doit contenir pour être juste. */
export interface DossierAttendu {
  accusations: string[]
  saisies: SaisieAttendue[]
  rienSurLui: boolean
  recherche: YesNo
  bracelet: YesNo
  ppa: number | null
  cooperation: Cooperation | null
}

export interface FormationScenario {
  id: string
  titre: string
  niveau: NiveauFormation
  resume: string
  contexte: string
  /** Ce que le rookie a sous les yeux : identité, inventaire, casier… */
  surLui: string
  screens: ImageRef[]
  questions: FormationQuestion[]
  attendu: DossierAttendu
  actif: boolean
}

export interface ReponseDossier {
  accusations: string[]
  saisies: SaisieAttendue[]
  rienSurLui: boolean
  recherche: YesNo
  bracelet: YesNo
  ppa: number | null
  cooperation: Cooperation | null
  rapport: string
}

export interface PointCorrige {
  libelle: string
  bon: boolean
  attendu?: string
  donne?: string
}

export interface FormationResultat {
  scenarioId: string
  titre: string
  niveau: NiveauFormation
  date: string
  dureeSecondes: number
  points: number
  total: number
  pourcentage: number
  valide: boolean
  details: PointCorrige[]
  rapport: string
}

export const SEUIL_REUSSITE = 80
