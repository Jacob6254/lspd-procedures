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

/**
 * Le coin le plus dégagé du tableau : une fiche importée ne doit pas tomber
 * sur une autre.
 */
export function placeLibre(fiches: { x: number; y: number }[]): { x: number; y: number } {
  if (fiches.length === 0) return { x: 0.5, y: 0.32 }
  let choisie = { x: 0.5, y: 0.5 }
  let ecart = -1
  for (let i = 1; i <= 8; i++) {
    for (let j = 1; j <= 6; j++) {
      const p = { x: i / 9, y: j / 7 }
      // Les fiches sont plus larges que hautes : on compte la distance en conséquence.
      const d = Math.min(...fiches.map((f) => Math.hypot(f.x - p.x, (f.y - p.y) * 0.6)))
      if (d > ecart) {
        ecart = d
        choisie = p
      }
    }
  }
  return choisie
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
