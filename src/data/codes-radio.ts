/** Codes radio du L.S.P.D Mission Row. */
export type CodeGroupe = 'Code 10' | 'Code d’affiliation' | 'Code de priorité' | 'Zone géographique'

export interface CodeRadio {
  code: string
  sens: string
  groupe: CodeGroupe
}

export const CODES_RADIO: CodeRadio[] = [
  { code: '10-1', sens: 'Je vous reçois mal', groupe: 'Code 10' },
  { code: '10-2', sens: 'Je vous reçois très bien', groupe: 'Code 10' },
  { code: '10-3', sens: 'Arrêtez la transmission', groupe: 'Code 10' },
  { code: '10-4', sens: 'Affirmatif', groupe: 'Code 10' },
  { code: '10-5', sens: 'Négatif', groupe: 'Code 10' },
  { code: '10-6', sens: 'Occupé / Pause service', groupe: 'Code 10' },
  { code: '10-7', sens: 'Service terminé', groupe: 'Code 10' },
  { code: '10-8', sens: 'Début de service', groupe: 'Code 10' },
  { code: '10-9', sens: 'Répétez le dernier message', groupe: 'Code 10' },
  { code: '10-10', sens: 'BDA', groupe: 'Code 10' },
  { code: '10-12', sens: 'Attente de Dispatch', groupe: 'Code 10' },
  { code: '10-14', sens: 'Escorte du suspect', groupe: 'Code 10' },
  { code: '10-18', sens: 'Urgence / Finir la mission rapidement', groupe: 'Code 10' },
  { code: '10-19', sens: 'Revenir au QG / Poste de police', groupe: 'Code 10' },
  { code: '10-20', sens: 'Votre localisation', groupe: 'Code 10' },
  { code: '10-23', sens: 'Arrivé sur les lieux', groupe: 'Code 10' },
  { code: '10-24', sens: 'Renfort demandé', groupe: 'Code 10' },
  { code: '10-25', sens: 'Suspect perdu', groupe: 'Code 10' },
  { code: '10-26', sens: 'Suspect arrêté', groupe: 'Code 10' },
  { code: '10-28', sens: 'Suspect abattu / neutralisé', groupe: 'Code 10' },
  { code: '10-31', sens: 'Course poursuite en cours', groupe: 'Code 10' },
  { code: '10-33', sens: 'Renfort mis en stand-by', groupe: 'Code 10' },
  { code: '10-36', sens: 'Tir de sommation', groupe: 'Code 10' },
  { code: '10-37', sens: 'Voiture suspecte', groupe: 'Code 10' },
  { code: '10-39', sens: 'Intervention avec gyrophare et sirène en cours (Code 3)', groupe: 'Code 10' },
  { code: '10-40', sens: 'Intervention silencieuse en cours (Code 2)', groupe: 'Code 10' },
  { code: '10-41', sens: 'Début de patrouille', groupe: 'Code 10' },
  { code: '10-42', sens: 'Fin de patrouille', groupe: 'Code 10' },
  { code: '10-44', sens: 'Prise de négociation', groupe: 'Code 10' },
  { code: '10-46', sens: 'Contrôle d’un véhicule', groupe: 'Code 10' },
  { code: '10-47', sens: 'Coup de feu', groupe: 'Code 10' },
  { code: '10-50', sens: 'Changement de juridiction', groupe: 'Code 10' },
  { code: '10-52', sens: 'Accident de la route', groupe: 'Code 10' },
  { code: '10-53', sens: 'Assistance médicale nécessaire', groupe: 'Code 10' },
  { code: '10-54', sens: 'Assistance mécanique nécessaire', groupe: 'Code 10' },
  { code: '10-55', sens: 'Braquage de : supérette, Ammu-Nation, coiffeur, tatoueur, magasin de vêtement, cambriolage et ATM', groupe: 'Code 10' },
  { code: '10-56', sens: 'Fleeca, Bijouterie, Banks du nord', groupe: 'Code 10' },
  { code: '10-57', sens: 'Go Fast', groupe: 'Code 10' },
  { code: '10-58', sens: 'Vente de drogue', groupe: 'Code 10' },
  { code: '10-59', sens: 'Se rend sur un appel central ou message civil', groupe: 'Code 10' },
  { code: '10-63', sens: 'Vol de véhicules', groupe: 'Code 10' },
  { code: '10-64', sens: 'Braquage d’individu', groupe: 'Code 10' },
  { code: '10-86', sens: 'Braquage de Maze Bank', groupe: 'Code 10' },
  { code: '10-87', sens: 'Braquage de Pacifique', groupe: 'Code 10' },
  { code: '10-97', sens: 'Agent à terre sur le lieu indiqué', groupe: 'Code 10' },
  { code: '10-98', sens: 'Officier en danger ou pris en otage', groupe: 'Code 10' },
  { code: '10-99', sens: 'Toutes les patrouilles sont demandées sur ce code', groupe: 'Code 10' },
  { code: '10-100', sens: 'Tirs à vue sur toutes personnes menaçantes ou armées se trouvant dans le périmètre', groupe: 'Code 10' },

  { code: 'Lincoln', sens: 'Patrouille seul (autorisé à partir de Lieutenant)', groupe: 'Code d’affiliation' },
  { code: 'Adam', sens: 'Patrouille à deux', groupe: 'Code d’affiliation' },
  { code: 'Tango', sens: 'Patrouille à trois', groupe: 'Code d’affiliation' },
  { code: 'Tango Max', sens: 'Patrouille à quatre (ou plus)', groupe: 'Code d’affiliation' },
  { code: 'Mary', sens: 'Patrouille à moto (MSG)', groupe: 'Code d’affiliation' },
  { code: 'Victor', sens: 'Patrouille à vélo', groupe: 'Code d’affiliation' },
  { code: 'Henry', sens: 'Patrouille en hélicoptère (ASD)', groupe: 'Code d’affiliation' },
  { code: 'Hubert', sens: 'Patrouille en bateau', groupe: 'Code d’affiliation' },
  { code: 'David', sens: 'Patrouille de S.W.A.T', groupe: 'Code d’affiliation' },
  { code: 'VIR', sens: 'Véhicule d’Intervention Rapide', groupe: 'Code d’affiliation' },

  { code: 'Code 1', sens: 'Intervention sans gyrophare et sans sirène', groupe: 'Code de priorité' },
  { code: 'Code 2', sens: 'Intervention silencieuse', groupe: 'Code de priorité' },
  { code: 'Code 3', sens: 'Intervention avec sirène et gyrophare', groupe: 'Code de priorité' },
  { code: 'Code 4', sens: 'Unités X en surveillance, autres unités doivent éviter le lieu', groupe: 'Code de priorité' },

  { code: 'Zone 1', sens: 'Sud (Del Perro, Vinewood, Rockford Hills, Downtown, La Puerta)', groupe: 'Zone géographique' },
  { code: 'Zone 2', sens: 'Milieu (Sandy Shores & Grapeseed)', groupe: 'Zone géographique' },
  { code: 'Zone 3', sens: 'Nord (Paleto Bay)', groupe: 'Zone géographique' },
  { code: 'Zone 4', sens: 'Cayo Perico', groupe: 'Zone géographique' }
]

export const GROUPES: CodeGroupe[] = ['Code 10', 'Code d’affiliation', 'Code de priorité', 'Zone géographique']
