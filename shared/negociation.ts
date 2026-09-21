import type { ImageRef, YesNo } from './types'

/** Véhicule repéré sur place : plaque, description et photo. */
export interface NegoVehicule {
  id: string
  plaque: string
  description: string
  photos: ImageRef[]
}

/** Un otage : on relève son identité et on vérifie s'il est recherché. */
export interface NegoOtage {
  id: string
  nom: string
  recherche: YesNo
  /** Otage recherché : on l'interpelle après le braquage. */
  arrete: boolean
  identite: ImageRef[]
  note: string
}

/** Un otage libéré contre une revendication accordée. */
export interface NegoEchange {
  id: string
  revendication: string
  contrepartie: string
}

export type FinNego = 'enfuis' | 'arretes-partiel' | 'arretes-tous' | 'autre'

export interface Negociation {
  id: string
  createdAt: string
  updatedAt: string
  statut: 'en_cours' | 'terminee'
  date: string
  heure: string
  /** Type de braquage, repris du tableau officiel. */
  typeLieu: string
  lieu: string
  braqueurs: number | null
  otagesAnnonces: number | null
  agents: string[]
  negociateur: string
  relayeur: string
  perimetre: boolean
  offRadio: boolean
  vehicules: NegoVehicule[]
  photosSuspects: ImageRef[]
  otages: NegoOtage[]
  echanges: NegoEchange[]
  demandesAtypiques: string
  armeUtilisee: boolean
  armeMotifs: string[]
  armeDetail: string
  deroulement: string
  finType: FinNego
  finArretes: number | null
  finDetail: string
  poursuite: boolean
  resume: string
  /** Numéro de dossier du document officiel, figé à la première génération. */
  numeroCase?: string
}

/** Lieux du tableau officiel des braquages, avec les plafonds à ne pas dépasser. */
export const BRAQUAGES = [
  { lieu: 'Supérette', braqueurs: 2, otages: 1, vehicules: 1 },
  { lieu: 'Fleeca Bank', braqueurs: 6, otages: 2, vehicules: 2 },
  { lieu: 'Paleto Bay', braqueurs: 8, otages: 2, vehicules: 3 },
  { lieu: 'Vangelico', braqueurs: 10, otages: 3, vehicules: 3 },
  { lieu: 'Maze Bank', braqueurs: 12, otages: 3, vehicules: 4 },
  { lieu: 'Pacific Bank', braqueurs: 15, otages: 5, vehicules: 6 }
]

/** Rançons officielles en argent sale. */
export const RANCONS_GRADES = [
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

/** Les six étapes d'une négociation, telles qu'on les suit sur le terrain. */
export const ETAPES_NEGOCIATION = [
  {
    titre: 'Arrivée sur la prise d’otages',
    points: [
      'Banque, supérette, bijouterie : on sécurise avant de parler.',
      'Vérifier que le périmètre est fait et les sorties surveillées.',
      'Seuls le négociateur principal et son relayeur parlent aux suspects.',
      'Les autres agents tiennent la zone et prennent les photos.'
    ]
  },
  {
    titre: 'Demander le nombre de braqueurs et d’otages',
    points: [
      'C’est la toute première question posée aux braqueurs.',
      'Sans ce chiffre, impossible de savoir combien de revendications sont possibles.',
      'Comparer avec le tableau des braquages : on ne négocie jamais au-delà du plafond.'
    ]
  },
  {
    titre: 'Photographier les plaques et les personnes',
    points: [
      'Plaque de chaque véhicule suspect, en gros plan.',
      'Photo des braqueurs visibles : tenue, masque, arme.',
      'Photo des otages quand c’est possible, sans mettre personne en danger.'
    ]
  },
  {
    titre: 'Voir les otages un par un',
    points: [
      'Contrôler l’état physique et verbal de chacun.',
      'Demander s’il a eu à manger et à boire, et s’il a besoin des EMS.',
      'Relever la carte d’identité et vérifier s’il est recherché.',
      'Otage recherché : le renvoyer à l’intérieur sans rien dire, une unité le récupère après le braquage.'
    ]
  },
  {
    titre: 'Négocier : un otage contre une revendication',
    points: [
      'Un otage civil libéré = exactement une revendication accordée.',
      'Rien ne se donne sans contrepartie.',
      'Tout otage blessé ou tué retire une possibilité de négociation aux braqueurs.',
      'Le bluff est autorisé, par exemple pour annuler un véhicule indisponible.',
      'Toute demande atypique remonte immédiatement aux hauts gradés.'
    ]
  },
  {
    titre: 'Fin : course-poursuite et clôture',
    points: [
      'La sortie des braqueurs débouche en général sur une course-poursuite.',
      'Le travail du négociateur s’arrête là.',
      'Remplir la fin de l’opération : enfuis, arrêtés en partie, tous arrêtés, ou autre.',
      'Générer le rapport et l’envoyer dans le salon de négociation.'
    ]
  }
]

/** Checklist otages rappelée sur le terrain. */
export const CHECKLIST_OTAGES = [
  'Demander combien ils sont et combien d’otages ils ont.',
  'Vérifier que le périmètre est fait avant de parler.',
  'Contrôler l’état physique et verbal de chaque otage.',
  'Demander s’il a eu à manger et à boire.',
  'Demander s’il a besoin d’une assistance médicale.',
  'Contrôler sa carte d’identité pour voir s’il est recherché.',
  'Une revendication accordée par otage civil, pas plus.',
  'Ne jamais négocier au-delà du plafond d’otages du braquage.',
  'Transmettre toute demande atypique aux hauts gradés.'
]

export const MOTIFS_ARME = [
  'Sommation avant tir',
  'Tir de riposte',
  'Tir sur les pneus du véhicule',
  'Tir sur le véhicule en fuite',
  'Légitime défense',
  'Défense d’un otage',
  'Défense d’un collègue',
  'Usage du tazer',
  'Arme sortie sans tir'
]

export const REVENDICATIONS = [
  'Véhicule de fuite',
  'Libération des voies',
  'Retrait du périmètre',
  'Délai supplémentaire',
  'Rançon en argent sale',
  'Libération d’un détenu',
  'Retrait de l’hélicoptère',
  'Passage libre jusqu’à la sortie'
]

export function labelFin(f: FinNego, arretes: number | null): string {
  switch (f) {
    case 'enfuis':
      return 'Les individus se sont enfuis'
    case 'arretes-partiel':
      return `${arretes ?? 0} individu${(arretes ?? 0) > 1 ? 's' : ''} arrêté${(arretes ?? 0) > 1 ? 's' : ''}`
    case 'arretes-tous':
      return 'Tous les individus ont été arrêtés'
    default:
      return 'Autre'
  }
}
