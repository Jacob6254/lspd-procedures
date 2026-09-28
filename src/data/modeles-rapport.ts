/**
 * Les modèles de rapport, repris de la formation : la trame officielle et
 * quelques cas courants déjà rédigés, à copier et à compléter.
 * Les passages entre crochets sont les seuls à remplacer.
 */

export interface ModeleRapport {
  id: string
  titre: string
  /** Quand on s'en sert. */
  quand: string
  texte: string
}

export const MODELES: ModeleRapport[] = [
  {
    id: 'vierge',
    titre: 'Trame officielle',
    quand: 'La structure à respecter dans tous les cas. On part de là et on adapte.',
    texte: `Matricules : [matricules des agents présents]
Type d'intervention : [ce qui a été constaté]

Nous avons été appelés concernant [le motif de l'appel]. Une fois arrivés sur les
lieux, nous avons constaté [ce qu'on a vu, sans interprétation]. L'individu a été
interpellé puis ramené au poste afin d'effectuer sa procédure.

Lors de la fouille, nous avons saisi [quantité exacte + objet], ainsi que
[quantité exacte + objet].

[Monsieur / Madame] [Prénom NOM] s'est montré[e] [coopératif / peu coopératif /
non coopératif] durant l'intégralité de son arrestation et de sa procédure.

Permis / PPA : [aucun permis pertinent pour cette procédure / PPA niveau X].
Les droits Miranda ont été lus à l'individu avant sa mise en cellule.`
  },
  {
    id: 'stupefiants',
    titre: 'Vente de stupéfiants',
    quand: 'Le modèle donné en formation. À copier tel quel en changeant les noms et les quantités.',
    texte: `Matricules : 301 et 302
Type d'intervention : vente de stupéfiants

Nous avons été appelés concernant une suspicion de vente de stupéfiants. Une fois
arrivés sur les lieux, nous avons constaté Monsieur John DOE en train de procéder à
une vente de stupéfiants. L'individu a été interpellé puis ramené au poste afin
d'effectuer sa procédure.

Lors de la fouille, nous avons saisi 21 pochons de morphine pure ainsi que 2 020 $
d'argent sale.

Monsieur John DOE s'est montré coopératif durant l'intégralité de son arrestation et
de sa procédure.

Permis / PPA : aucun permis pertinent pour cette procédure.
Les droits Miranda ont été lus à l'individu avant sa mise en cellule.`
  },
  {
    id: 'braquage',
    titre: 'Braquage',
    quand: 'Commerce, station-service, banque. On décrit ce qu\'on a vu à l\'arrivée, pas ce qu\'on suppose.',
    texte: `Matricules : [matricules des agents présents]
Type d'intervention : braquage de [l'établissement]

Nous avons été appelés concernant un braquage en cours à [l'établissement]. À notre
arrivée, nous avons constaté [nombre] individus armés à l'intérieur, ainsi que
[nombre] otages. Un périmètre a été mis en place et la négociation a été engagée.
[Résumé de la sortie : reddition, interpellation, fuite.]

Lors de la fouille, nous avons saisi [quantité exacte + objet], ainsi que
[quantité exacte + objet].

[Monsieur / Madame] [Prénom NOM] s'est montré[e] [comportement] durant l'intégralité
de son arrestation et de sa procédure.

Permis / PPA : [aucun permis pertinent pour cette procédure / PPA niveau X].
Les droits Miranda ont été lus à l'individu avant sa mise en cellule.`
  },
  {
    id: 'routier',
    titre: 'Contrôle routier',
    quand: 'Excès de vitesse, conduite dangereuse, défaut de permis.',
    texte: `Matricules : [matricules des agents présents]
Type d'intervention : contrôle routier

En patrouille sur [la route ou le quartier], nous avons constaté [l'infraction
relevée : excès de vitesse, feu grillé, conduite dangereuse]. Le véhicule
[modèle, plaque] a été intercepté et son conducteur contrôlé.

[Suite : simple amende, ou interpellation et raison de l'interpellation.]

Lors de la fouille, nous avons saisi [quantité exacte + objet]. [À retirer s'il n'y
a eu aucune saisie.]

[Monsieur / Madame] [Prénom NOM] s'est montré[e] [comportement] durant l'intégralité
du contrôle.

Permis / PPA : [aucun permis pertinent pour cette procédure / PPA niveau X].
Les droits Miranda ont été lus à l'individu avant sa mise en cellule.`
  },
  {
    id: 'refus',
    titre: 'Refus d’obtempérer',
    quand: 'Course-poursuite, fuite à pied. Le déroulé doit être clair et chronologique.',
    texte: `Matricules : [matricules des agents présents]
Type d'intervention : refus d'obtempérer

En patrouille sur [la route ou le quartier], nous avons fait signe au véhicule
[modèle, plaque] de s'arrêter. Le conducteur a refusé d'obtempérer et a pris la
fuite en direction de [la direction]. La poursuite a duré [durée approximative] et
s'est terminée [comment : immobilisation, abandon du véhicule, fuite à pied].
L'individu a été interpellé puis ramené au poste afin d'effectuer sa procédure.

Lors de la fouille, nous avons saisi [quantité exacte + objet].

[Monsieur / Madame] [Prénom NOM] s'est montré[e] [comportement] durant l'intégralité
de son arrestation et de sa procédure.

Permis / PPA : [aucun permis pertinent pour cette procédure / PPA niveau X].
Les droits Miranda ont été lus à l'individu avant sa mise en cellule.`
  }
]

/** Ce qu'un rapport doit contenir pour être recevable. */
export const A_VERIFIER = [
  'Les matricules de tous les agents présents.',
  'Le type d’intervention, en une ligne.',
  'Les faits dans l’ordre : l’appel, ce qu’on a constaté, l’interpellation.',
  'Les saisies avec les quantités exactes, une par une.',
  'Le comportement du mis en cause.',
  'Les permis et le PPA, même quand il n’y en a pas.',
  'La mention des droits lus avant la mise en cellule.'
]

/** Ce qui fait retoquer un rapport. */
export const A_EVITER = [
  'Les codes radio : on écrit en clair.',
  'Les approximations sur les quantités : « quelques pochons » ne vaut rien.',
  'Les suppositions : on écrit ce qu’on a vu, pas ce qu’on pense.',
  'Les doublons d’infractions.',
  'Les abréviations et le langage parlé.'
]
