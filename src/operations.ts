import type { Operation } from '@shared/operation'
import { FOND_DEFAUT, UNITES_DEPART } from '@shared/operation'
import { nowHm, todayIso, uid } from './lib/format'
import { creerMagasin, nomAuteur } from './tableaux'

export const useOperations = creerMagasin<Operation>('operations')

export function nouvelleOperation(nom: string): Operation {
  return {
    id: uid(),
    nom: nom.trim() || 'Opération sans nom',
    date: todayIso(),
    heure: nowHm(),
    auteur: '',
    auteurNom: nomAuteur(),
    publiee: false,
    maj: new Date().toISOString(),
    lieu: '',
    objectif: '',
    fond: FOND_DEFAUT,
    unites: UNITES_DEPART.map((u) => ({ id: uid(), nom: u.nom, couleur: u.couleur, visible: true, effectif: 0 })),
    marqueurs: [],
    fleches: [],
    etiquettes: []
  }
}
