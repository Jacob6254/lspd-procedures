/** Code pénal du serveur, dans l'ordre des catégories du MDT. Mis à jour le 24/09/2026. */
export type Categorie =
  | 'Crimes'
  | 'Autorité de l’État'
  | 'Atteintes aux personnes'
  | 'Braquages'
  | 'Atteintes aux biens'
  | 'Stupéfiants et argent sale'
  | 'Armes'
  | 'Ordre public'
  | 'Circulation routière'

export interface Infraction {
  label: string
  categorie: Categorie
  /** Amende en dollars. null quand il n'y a qu'une saisie. */
  amende: number | null
  /** Garde à vue en minutes. 0 = pas de cellule. */
  gav: number
  detail?: string
}

export const INFRACTIONS: Infraction[] = [
  // --- Crimes ---
  { label: 'Tentative d’homicide', categorie: 'Crimes', amende: 15000, gav: 10, detail: 'Tirs ou coups portés dans l’intention de tuer' },
  { label: 'Tentative d’homicide sur agent de l’État', categorie: 'Crimes', amende: 20000, gav: 12 },
  { label: 'Meurtre (mort RP)', categorie: 'Crimes', amende: 75000, gav: 30 },
  { label: 'Meurtre sur agent de l’État (mort RP)', categorie: 'Crimes', amende: 100000, gav: 30 },
  { label: 'Viol, torture ou actes de barbarie', categorie: 'Crimes', amende: 30000, gav: 20 },
  { label: 'Trafic d’êtres humains ou d’organes', categorie: 'Crimes', amende: 30000, gav: 20 },
  { label: 'Acte terroriste', categorie: 'Crimes', amende: 50000, gav: 30, detail: 'Attentat, explosif, attaque de masse' },

  // --- Autorité de l'État ---
  { label: 'Outrage à agent', categorie: 'Autorité de l’État', amende: 1500, gav: 0, detail: 'Insultes, gestes ou propos méprisants envers un agent' },
  {
    label: 'Refus d’obtempérer ou rébellion',
    categorie: 'Autorité de l’État',
    amende: 5000,
    gav: 5,
    detail: 'Fuite à pied ou en véhicule, résistance à l’interpellation, entrave'
  },
  { label: 'Menaces sur agent ou représentant de l’État', categorie: 'Autorité de l’État', amende: 4000, gav: 0 },
  { label: 'Violences sur agent de l’État', categorie: 'Autorité de l’État', amende: 7500, gav: 7 },
  { label: 'Prise d’otage d’un agent de l’État', categorie: 'Autorité de l’État', amende: 15000, gav: 10 },
  {
    label: 'Corruption ou tentative de corruption',
    categorie: 'Autorité de l’État',
    amende: 10000,
    gav: 5,
    detail: 'Offre, promesse ou remise d’un avantage à un agent'
  },
  {
    label: 'Usurpation d’identité ou de fonction',
    categorie: 'Autorité de l’État',
    amende: 5000,
    gav: 5,
    detail: 'Fausse identité, faux policier, faux médecin, faux documents'
  },
  {
    label: 'Entrave à la justice',
    categorie: 'Autorité de l’État',
    amende: 5000,
    gav: 5,
    detail: 'Faux témoignage, destruction de preuve, dénonciation calomnieuse'
  },
  {
    label: 'Intrusion dans un bâtiment de l’État',
    categorie: 'Autorité de l’État',
    amende: 5000,
    gav: 5,
    detail: 'Commissariat, hôpital, zone militaire, zone à accès restreint'
  },
  {
    label: 'Évasion ou aide à l’évasion',
    categorie: 'Autorité de l’État',
    amende: 20000,
    gav: 15,
    detail: 'Évasion de cellule, attaque d’un convoi pénitentiaire'
  },
  {
    label: 'Haute trahison',
    categorie: 'Autorité de l’État',
    amende: 25000,
    gav: 15,
    detail: 'Divulgation d’informations confidentielles, complicité d’un agent avec le crime organisé'
  },

  // --- Atteintes aux personnes ---
  { label: 'Menaces ou intimidation', categorie: 'Atteintes aux personnes', amende: 2000, gav: 0 },
  { label: 'Agression', categorie: 'Atteintes aux personnes', amende: 3500, gav: 5, detail: 'Violences volontaires sans arme à feu' },
  {
    label: 'Braquage d’un individu',
    categorie: 'Atteintes aux personnes',
    amende: 4000,
    gav: 5,
    detail: 'Racket, vol avec violence ou sous la menace d’une arme'
  },
  {
    label: 'Enlèvement ou séquestration',
    categorie: 'Atteintes aux personnes',
    amende: 10000,
    gav: 10,
    detail: 'Prise d’otage, kidnapping, demande de rançon'
  },

  // --- Braquages ---
  {
    label: 'Braquage d’un commerce',
    categorie: 'Braquages',
    amende: 3500,
    gav: 5,
    detail: 'Supermarché, Ammu-Nation, magasin de vêtements, coiffeur, tatoueur'
  },
  { label: 'Braquage d’un distributeur automatique', categorie: 'Braquages', amende: 5000, gav: 5, detail: 'ATM percé ou forcé' },
  { label: 'Braquage d’une agence Fleeca Bank ou Saving Bank', categorie: 'Braquages', amende: 7500, gav: 10 },
  { label: 'Braquage de la bijouterie Vangelico', categorie: 'Braquages', amende: 65000, gav: 10 },
  { label: 'Braquage d’un fourgon blindé Brinks', categorie: 'Braquages', amende: 20000, gav: 10 },
  { label: 'Braquage de la Sandy Shore Central Bank', categorie: 'Braquages', amende: 35000, gav: 12 },
  { label: 'Braquage de la Maze Bank', categorie: 'Braquages', amende: 40000, gav: 15 },
  { label: 'Braquage de la Grand Senora Central Bank', categorie: 'Braquages', amende: 40000, gav: 15 },
  { label: 'Braquage de la Pacific Standard', categorie: 'Braquages', amende: 100000, gav: 20, detail: 'Pacific Standard public deposit bank' },

  // --- Atteintes aux biens ---
  { label: 'Vol simple', categorie: 'Atteintes aux biens', amende: 1500, gav: 0, detail: 'À l’étalage, à la tire, sur un individu sans violence' },
  { label: 'Vol de véhicule', categorie: 'Atteintes aux biens', amende: 5000, gav: 5 },
  { label: 'Cambriolage', categorie: 'Atteintes aux biens', amende: 5000, gav: 5, detail: 'Vol par effraction dans une habitation' },
  { label: 'Dégradation ou destruction de bien d’autrui', categorie: 'Atteintes aux biens', amende: 2000, gav: 0 },
  { label: 'Violation de propriété privée', categorie: 'Atteintes aux biens', amende: 1500, gav: 0 },
  { label: 'Recel', categorie: 'Atteintes aux biens', amende: 5000, gav: 5, detail: 'Détention ou revente de biens volés' },
  {
    label: 'Tentative de vol ou d’effraction',
    categorie: 'Atteintes aux biens',
    amende: 2000,
    gav: 0,
    detail: 'Crochetage, forçage, tentative interrompue'
  },

  // --- Stupéfiants et argent sale ---
  {
    label: 'Détention de stupéfiants',
    categorie: 'Stupéfiants et argent sale',
    amende: 100,
    gav: 5,
    detail: 'Par unité saisie, la peine ne dépend pas de la quantité'
  },
  { label: 'Vente de stupéfiants', categorie: 'Stupéfiants et argent sale', amende: 7500, gav: 7, detail: 'Deal de rue constaté' },
  {
    label: 'Fabrication de stupéfiants',
    categorie: 'Stupéfiants et argent sale',
    amende: 10000,
    gav: 10,
    detail: 'Laboratoire clandestin, la simple présence se note en complicité'
  },
  {
    label: 'Trafic de stupéfiants',
    categorie: 'Stupéfiants et argent sale',
    amende: 15000,
    gav: 10,
    detail: 'Go-fast, transport ou stockage en grande quantité'
  },
  {
    label: 'Blanchiment d’argent',
    categorie: 'Stupéfiants et argent sale',
    amende: 20000,
    gav: 15,
    detail: 'Recyclage d’argent sale, structure de blanchiment'
  },
  {
    label: 'Détention d’argent non déclaré',
    categorie: 'Stupéfiants et argent sale',
    amende: null,
    gav: 5,
    detail: 'Saisie du montant renseigné, sans amende'
  },

  // --- Armes ---
  { label: 'Port d’arme blanche', categorie: 'Armes', amende: 1500, gav: 0, detail: 'Couteau, batte, machette… portée ou sortie en public' },
  { label: 'Sortie d’arme à feu en public', categorie: 'Armes', amende: 2500, gav: 0, detail: 'Arme exhibée sans tir' },
  { label: 'Port d’arme à feu sans PPA', categorie: 'Armes', amende: 4000, gav: 5, detail: 'Arme légale portée sans permis de port d’arme' },
  {
    label: 'Port ou détention d’arme illégale',
    categorie: 'Armes',
    amende: 5000,
    gav: 7,
    detail: 'Par arme : non enregistrée, lourde ou automatique'
  },
  { label: 'Tir en zone urbaine', categorie: 'Armes', amende: 5000, gav: 5, detail: 'Coups de feu sans cible désignée' },
  { label: 'Port de gilet pare-balles sans autorisation', categorie: 'Armes', amende: 1000, gav: 0 },
  { label: 'Détention de matériel illégal', categorie: 'Armes', amende: 2000, gav: 0, detail: 'Outils d’effraction, brouilleur, faux documents…' },

  // --- Ordre public ---
  {
    label: 'Trouble à l’ordre public',
    categorie: 'Ordre public',
    amende: 1000,
    gav: 0,
    detail: 'Tapage, ivresse publique, exhibition, manifestation illégale, dégradation de la voie publique'
  },
  { label: 'Dissimulation du visage sans motif légitime', categorie: 'Ordre public', amende: 750, gav: 0 },
  { label: 'Appel abusif aux services d’urgence', categorie: 'Ordre public', amende: 1500, gav: 0 },

  // --- Circulation routière ---
  {
    label: 'Infraction au code de la route',
    categorie: 'Circulation routière',
    amende: 500,
    gav: 0,
    detail: 'Vitesse, feu rouge, contresens, ligne continue, klaxon abusif, stationnement gênant'
  },
  {
    label: 'Conduite dangereuse',
    categorie: 'Circulation routière',
    amende: 1500,
    gav: 0,
    detail: 'Grand excès de vitesse, rodéo urbain, course, mise en danger d’autrui'
  },
  { label: 'Conduite sous l’emprise de l’alcool ou de stupéfiants', categorie: 'Circulation routière', amende: 1500, gav: 0 },
  { label: 'Conduite sans permis', categorie: 'Circulation routière', amende: 2500, gav: 0, detail: 'Défaut, suspension ou retrait du permis' },
  { label: 'Véhicule non conforme', categorie: 'Circulation routière', amende: 1000, gav: 0, detail: 'Plaque absente ou falsifiée, véhicule endommagé' }
]

/** Les catégories dans l'ordre du code pénal, avec leur couleur d'affichage. */
export const CATEGORIES: { nom: Categorie; ton: 'red' | 'blue' | 'purple' | 'amber' | 'green' | 'grey' }[] = [
  { nom: 'Crimes', ton: 'red' },
  { nom: 'Autorité de l’État', ton: 'blue' },
  { nom: 'Atteintes aux personnes', ton: 'purple' },
  { nom: 'Braquages', ton: 'purple' },
  { nom: 'Atteintes aux biens', ton: 'blue' },
  { nom: 'Stupéfiants et argent sale', ton: 'green' },
  { nom: 'Armes', ton: 'amber' },
  { nom: 'Ordre public', ton: 'grey' },
  { nom: 'Circulation routière', ton: 'grey' }
]

export const montantFr = (n: number | null): string => (n === null ? 'Saisie' : `${n.toLocaleString('fr-FR')} $`)
export const gavFr = (m: number): string => (m === 0 ? '—' : `${m} min`)

/** Total d'une liste d'accusations : amende cumulée et garde à vue, plafonnée à 25 minutes. */
export function totalPeine(accusations: string[]): { amende: number; gav: number; plafonne: boolean } {
  const connues = accusations
    .map((a) => INFRACTIONS.find((i) => i.label.toLowerCase() === a.trim().toLowerCase()))
    .filter((i): i is Infraction => !!i)
  const amende = connues.reduce((n, i) => n + (i.amende ?? 0), 0)
  const brut = connues.reduce((n, i) => n + i.gav, 0)
  return { amende, gav: Math.min(25, brut), plafonne: brut > 25 }
}

export function accusationSuggestions(learned: string[]): { value: string; hint?: string }[] {
  const known = new Map(INFRACTIONS.map((i) => [i.label.toLowerCase(), i]))
  const etiquette = (i: Infraction) => `${montantFr(i.amende)}${i.gav ? ` · ${i.gav} min` : ''}`
  const dejaUtilisees = learned.map((l) => {
    const i = known.get(l.toLowerCase())
    return { value: l, hint: i ? etiquette(i) : undefined }
  })
  const reste = INFRACTIONS.filter((i) => !learned.some((l) => l.toLowerCase() === i.label.toLowerCase())).map((i) => ({
    value: i.label,
    hint: etiquette(i)
  }))
  return [...dejaUtilisees, ...reste]
}
