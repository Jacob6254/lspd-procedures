import type { Enquete, Fiche, FicheType } from '@shared/enquete'
import { nowHm, todayIso, uid } from './lib/format'
import { creerMagasin, nomAuteur } from './tableaux'

export const useEnquetes = creerMagasin<Enquete>('enquetes')

export function nouvelleEnquete(cible: string): Enquete {
  const c = cible.trim()
  return {
    id: uid(),
    nom: c ? `Enquête — ${c}` : 'Nouvelle enquête',
    cible: c,
    resume: '',
    statut: 'ouverte',
    date: todayIso(),
    heure: nowHm(),
    auteur: '',
    auteurNom: nomAuteur(),
    publiee: false,
    maj: new Date().toISOString(),
    fiches: [],
    liens: []
  }
}

export function nouvelleFiche(type: FicheType, x: number, y: number): Fiche {
  return {
    id: uid(),
    type,
    x,
    y,
    titre: '',
    role: type === 'suspect' ? 'Inconnu' : '',
    statut: '',
    texte: '',
    date: type === 'preuve' ? todayIso() : '',
    image: null,
    source: null,
    // Un léger travers, pour que le tableau garde l'air d'un vrai tableau.
    angle: Math.round((Math.random() * 3.4 - 1.7) * 10) / 10,
  }
}
