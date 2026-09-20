import { capitalize } from '../lib/format'

/**
 * Comment le suspect a été intercepté. C'est le passage le plus important du
 * rapport, alors chaque moyen porte de quoi écrire la phrase correctement,
 * au masculin, au féminin et au pluriel.
 */
export type ModeleInterpellation = 'passif' | 'reflexif' | 'etre'

export interface MoyenInterpellation {
  key: string
  /** Ce qui s'affiche sur la pastille du formulaire. */
  label: string
  modele: ModeleInterpellation
  /** Participe passé au masculin singulier. */
  participe: string
  complement: string
  complementFeminin?: string
  complementPluriel?: string
}

export const MOYENS_INTERPELLATION: MoyenInterpellation[] = [
  {
    key: 'rendu',
    label: 'S’est rendu de lui-même',
    modele: 'reflexif',
    participe: 'rendu',
    complement: 'de lui-même, les mains en l’air',
    complementFeminin: 'd’elle-même, les mains en l’air',
    complementPluriel: 'd’eux-mêmes, les mains en l’air'
  },
  {
    key: 'sommations',
    label: 'S’est arrêté à nos sommations',
    modele: 'reflexif',
    participe: 'arrêté',
    complement: 'à nos sommations'
  },
  {
    key: 'sorti-vehicule',
    label: 'Sorti du véhicule à notre demande',
    modele: 'etre',
    participe: 'sorti',
    complement: 'de son véhicule à notre demande',
    complementPluriel: 'de leur véhicule à notre demande'
  },
  {
    key: 'extrait-vehicule',
    label: 'Extrait de force du véhicule',
    modele: 'passif',
    participe: 'extrait',
    complement: 'de force de son véhicule',
    complementPluriel: 'de force de leur véhicule'
  },
  {
    key: 'maitrise',
    label: 'Maîtrisé au sol',
    modele: 'passif',
    participe: 'maîtrisé',
    complement: 'au sol'
  },
  {
    key: 'tazer',
    label: 'Neutralisé au tazer',
    modele: 'passif',
    participe: 'neutralisé',
    complement: 'au tazer'
  },
  {
    key: 'rattrape',
    label: 'Rattrapé à pied',
    modele: 'passif',
    participe: 'rattrapé',
    complement: 'à pied après une course'
  },
  {
    key: 'bloque',
    label: 'Bloqué par nos véhicules',
    modele: 'passif',
    participe: 'bloqué',
    complement: 'par nos véhicules de service'
  },
  {
    key: 'accident',
    label: 'Interpellé après l’accident',
    modele: 'passif',
    participe: 'interpellé',
    complement: 'après l’accident de son véhicule',
    complementPluriel: 'après l’accident de leur véhicule'
  },
  {
    key: 'sorti-batiment',
    label: 'Sorti du bâtiment à notre demande',
    modele: 'etre',
    participe: 'sorti',
    complement: 'du bâtiment à notre demande'
  },
  {
    key: 'riposte',
    label: 'Neutralisé par un tir de riposte',
    modele: 'passif',
    participe: 'neutralisé',
    complement: 'par un tir de riposte'
  },
  {
    key: 'cache',
    label: 'Découvert caché sur les lieux',
    modele: 'passif',
    participe: 'découvert',
    complement: 'caché sur les lieux',
    complementFeminin: 'cachée sur les lieux',
    complementPluriel: 'cachés sur les lieux'
  },
  {
    key: 'domicile',
    label: 'Interpellé à son domicile',
    modele: 'passif',
    participe: 'interpellé',
    complement: 'à son domicile',
    complementPluriel: 'à leur domicile'
  },
  {
    key: 'controle',
    label: 'Interpellé pendant le contrôle',
    modele: 'passif',
    participe: 'interpellé',
    complement: 'pendant le contrôle'
  },
  {
    key: 'renfort',
    label: 'Interpellé par une autre unité',
    modele: 'passif',
    participe: 'interpellé',
    complement: 'par une unité en renfort'
  }
]

export const moyenInterpellation = (key: string | undefined): MoyenInterpellation | undefined =>
  key ? MOYENS_INTERPELLATION.find((m) => m.key === key) : undefined

/** « maîtrisé » → « maîtrisée », « maîtrisés », « maîtrisées ». */
export function accorder(participe: string, fem: boolean, pluriel: boolean): string {
  return `${participe}${fem ? 'e' : ''}${pluriel ? 's' : ''}`
}

interface Accord {
  /** Sujet déjà écrit : « Le prévenu », « Ils »… Inutile en version courte. */
  sujet?: string
  fem: boolean
  pluriel: boolean
  court: boolean
}

/** La phrase du rapport pour le moyen choisi, accordée. */
export function phraseInterpellation(key: string | undefined, a: Accord): string {
  const m = moyenInterpellation(key)
  if (!m) return ''
  const part = accorder(m.participe, a.fem, a.pluriel)
  const comp = (a.pluriel && m.complementPluriel) || (a.fem && m.complementFeminin) || m.complement

  if (a.court) {
    if (m.modele === 'reflexif') return `${a.pluriel ? 'Se sont' : 'S’est'} ${part} ${comp}.`
    return `${capitalize(part)} ${comp}.`
  }

  const sujet = a.sujet ?? 'Le prévenu'
  if (m.modele === 'reflexif') return `${sujet} ${a.pluriel ? 'se sont' : 's’est'} ${part} ${comp}.`
  if (m.modele === 'etre') return `${sujet} ${a.pluriel ? 'sont' : 'est'} ${part} ${comp}.`
  return `${sujet} ${a.pluriel ? 'ont' : 'a'} été ${part} ${comp}.`
}
