/** Liste des infractions du MDT L.S.P.D Mission Row, dans l'ordre des catégories du panel. */
export type Categorie = 'Délit mineur' | 'Délit moyen' | 'Délit majeur' | 'Délit aggravé' | 'Crime'

export interface Infraction {
  label: string
  categorie: Categorie
}

export const INFRACTIONS: Infraction[] = [
  // --- Délit mineur ---
  { label: 'Appel abusif', categorie: 'Délit mineur' },
  { label: 'Conduite d’un véhicule endommagé', categorie: 'Délit mineur' },
  { label: 'Conduite dangereuse', categorie: 'Délit mineur' },
  { label: 'Conduite en état d’ivresse', categorie: 'Délit mineur' },
  { label: 'Contresens', categorie: 'Délit mineur' },
  { label: 'Dégradation de la voie publique', categorie: 'Délit mineur' },
  { label: 'Dépassement dangereux', categorie: 'Délit mineur' },
  { label: 'Dépassement de ligne continue', categorie: 'Délit mineur' },
  { label: 'Entrave à une opération de police', categorie: 'Délit mineur' },
  { label: 'Excès de vitesse', categorie: 'Délit mineur' },
  { label: 'Exhibition sexuelle', categorie: 'Délit mineur' },
  { label: 'Menace verbale ou intimidation', categorie: 'Délit mineur' },
  { label: 'Outrage à agent', categorie: 'Délit mineur' },
  { label: 'Port de gilet pare-balles sans autorisation', categorie: 'Délit mineur' },
  { label: 'Dissimulation du visage sans motif légitime', categorie: 'Délit mineur' },
  { label: 'Tapage nocturne', categorie: 'Délit mineur' },
  { label: 'Rodéo urbain', categorie: 'Délit mineur' },
  { label: 'Trouble à l’ordre public', categorie: 'Délit mineur' },

  // --- Délit moyen ---
  { label: 'Agression', categorie: 'Délit moyen' },
  { label: 'Possession d’objet illégal', categorie: 'Délit moyen' },
  { label: 'Braquage de supérette', categorie: 'Délit moyen' },
  { label: 'Course illégale', categorie: 'Délit moyen' },
  { label: 'Défaut de permis de conduire', categorie: 'Délit moyen' },
  { label: 'Défaut ou invalidité de plaque d’immatriculation', categorie: 'Délit moyen' },
  { label: 'Destruction ou dissimulation de preuve', categorie: 'Délit moyen' },
  { label: 'Fabrication de drogue', categorie: 'Délit moyen' },
  { label: 'Manifestation illégale', categorie: 'Délit moyen' },
  { label: 'Port d’arme illégal', categorie: 'Délit moyen' },
  { label: 'Port d’arme légale sans PPA', categorie: 'Délit moyen' },
  { label: 'Possession ou transport d’argent non déclaré', categorie: 'Délit moyen' },
  { label: 'Possession de drogue', categorie: 'Délit moyen' },
  { label: 'Présence dans un laboratoire clandestin', categorie: 'Délit moyen' },
  { label: 'Prise en flagrant délit de crochetage', categorie: 'Délit moyen' },
  { label: 'Refus d’obtempérer (hors délits routiers)', categorie: 'Délit moyen' },
  { label: 'Tentative de corruption', categorie: 'Délit moyen' },
  { label: 'Tir en ville', categorie: 'Délit moyen' },
  { label: 'Tir sur civil', categorie: 'Délit moyen' },
  { label: 'Usurpation d’identité', categorie: 'Délit moyen' },
  { label: 'Vente de drogue à des civils', categorie: 'Délit moyen' },
  { label: 'Violation de propriété gouvernementale', categorie: 'Délit moyen' },
  { label: 'Violation de propriété privée', categorie: 'Délit moyen' },
  { label: 'Vol de voiture', categorie: 'Délit moyen' },
  { label: 'Go-Fast', categorie: 'Délit moyen' },
  { label: 'Braquage d’ATM (distributeur)', categorie: 'Délit moyen' },
  { label: 'Braquage sur civil', categorie: 'Délit moyen' },
  { label: 'Sortie d’arme blanche en ville', categorie: 'Délit moyen' },
  { label: 'Sortie d’arme létale en ville', categorie: 'Délit moyen' },
  { label: 'Diffamation', categorie: 'Délit moyen' },
  { label: 'Braquage d’Ammu-Nation', categorie: 'Délit moyen' },
  { label: 'Braquage de magasin de vêtements', categorie: 'Délit moyen' },
  { label: 'Braquage de tatoueur', categorie: 'Délit moyen' },
  { label: 'Braquage de coiffeur', categorie: 'Délit moyen' },

  // --- Délit majeur ---
  { label: 'Appartenance à un gang', categorie: 'Délit majeur' },
  { label: 'Kidnapping (en vue d’une rançon)', categorie: 'Délit majeur' },
  { label: 'Blanchiment d’argent', categorie: 'Délit majeur' },
  { label: 'Corruption', categorie: 'Délit majeur' },
  { label: 'Menace aggravée sur représentant de l’État', categorie: 'Délit majeur' },
  { label: 'Braquage de convoi', categorie: 'Délit majeur' },
  { label: 'Braquage de banque (Fleeca)', categorie: 'Délit majeur' },
  { label: 'Braquage de fourgon blindé', categorie: 'Délit majeur' },
  { label: 'Tentative d’homicide', categorie: 'Délit majeur' },
  { label: 'Tentative d’homicide sur agent de l’État', categorie: 'Délit majeur' },
  { label: 'Tentative de prise d’otage', categorie: 'Délit majeur' },
  { label: 'Prise d’otage', categorie: 'Délit majeur' },
  { label: 'Usurpation d’identité gouvernementale', categorie: 'Délit majeur' },
  { label: 'Faux témoignage', categorie: 'Délit majeur' },

  // --- Délit aggravé ---
  { label: 'Braquage de bijouterie', categorie: 'Délit aggravé' },
  { label: 'Braquage du Pacific Standard', categorie: 'Délit aggravé' },
  { label: 'Évasion de convoi fédéral', categorie: 'Délit aggravé' },
  { label: 'Appartenance à une organisation criminelle', categorie: 'Délit aggravé' },
  { label: 'Attaque de convoi fédéral', categorie: 'Délit aggravé' },
  { label: 'Prise d’otage sur agent de l’État', categorie: 'Délit aggravé' },
  { label: 'Divulgation d’information confidentielle', categorie: 'Délit aggravé' },
  { label: 'Braquage de la Maze Bank', categorie: 'Délit aggravé' },
  { label: 'Braquage du casino', categorie: 'Délit aggravé' },
  { label: 'Braquage du Human Labs', categorie: 'Délit aggravé' },
  { label: 'Acte terroriste', categorie: 'Délit aggravé' },

  // --- Crime ---
  { label: 'Haute trahison', categorie: 'Crime' },
  { label: 'Séquestration sur agent de l’État', categorie: 'Crime' },
  { label: 'Meurtre (mort RP)', categorie: 'Crime' },
  { label: 'Meurtre sur agent de l’État (mort RP)', categorie: 'Crime' },
  { label: 'Viol / Torture', categorie: 'Crime' },
  { label: 'Trafic d’organes', categorie: 'Crime' },
  { label: 'Torture sur représentant de l’État', categorie: 'Crime' }
]

/** Suggestions prêtes pour le champ des accusations : celles déjà utilisées d'abord. */
export function accusationSuggestions(learned: string[]): { value: string; hint?: string }[] {
  const known = new Map(INFRACTIONS.map((i) => [i.label.toLowerCase(), i]))
  const dejaUtilisees = learned.map((l) => ({ value: l, hint: known.get(l.toLowerCase())?.categorie }))
  const reste = INFRACTIONS.filter((i) => !learned.some((l) => l.toLowerCase() === i.label.toLowerCase())).map((i) => ({
    value: i.label,
    hint: i.categorie
  }))
  return [...dejaUtilisees, ...reste]
}
