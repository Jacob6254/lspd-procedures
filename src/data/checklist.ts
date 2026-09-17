/** Checklist officielle de fin de procédure du LSPD. */
export interface ChecklistGroupe {
  id: string
  titre: string
  points: { id: string; texte: string }[]
}

export const CHECKLIST: ChecklistGroupe[] = [
  {
    id: 'identification',
    titre: 'Identification',
    points: [
      { id: 'id-identite', texte: 'Ai-je vérifié son identité ?' },
      { id: 'id-recherche', texte: 'Ai-je vérifié s’il était recherché ?' }
    ]
  },
  {
    id: 'fouille',
    titre: 'Fouille',
    points: [
      { id: 'fo-correct', texte: 'Ai-je effectué la fouille correctement ?' },
      { id: 'fo-accord', texte: 'Ai-je demandé l’accord si nécessaire ?' },
      { id: 'fo-objets', texte: 'Ai-je récupéré les objets concernés ?' }
    ]
  },
  {
    id: 'casier',
    titre: 'Casier',
    points: [
      { id: 'ca-infractions', texte: 'Ai-je pris les bonnes infractions ?' },
      { id: 'ca-quantites', texte: 'Ai-je vérifié les quantités ?' },
      { id: 'ca-doublons', texte: 'Ai-je évité les doublons ?' }
    ]
  },
  {
    id: 'fin',
    titre: 'Fin de procédure',
    points: [
      { id: 'fi-miranda', texte: 'Ai-je lu Miranda avant la cellule ?' },
      { id: 'fi-facture', texte: 'Ai-je fait la facture ?' },
      { id: 'fi-effets', texte: 'Ai-je déposé les effets personnels ?' },
      { id: 'fi-temps', texte: 'Ai-je respecté les 25 minutes maximum ?' }
    ]
  },
  {
    id: 'rapport',
    titre: 'Rapport',
    points: [
      { id: 'ra-matricules', texte: 'Ai-je mis les matricules ?' },
      { id: 'ra-faits', texte: 'Ai-je expliqué les faits ?' },
      { id: 'ra-saisies', texte: 'Ai-je détaillé les saisies ?' },
      { id: 'ra-quantites', texte: 'Ai-je mis les quantités exactes ?' },
      { id: 'ra-codes', texte: 'Ai-je évité les codes radio ?' }
    ]
  }
]

export const CHECKLIST_TOTAL = CHECKLIST.reduce((n, g) => n + g.points.length, 0)
