/**
 * Les formations écrites du LSPD, reprises telles quelles des documents du
 * serveur. On les lit ici plutôt que d'ouvrir six Google Docs en pleine partie.
 */

export interface BlocGuide {
  titre: string
  /** Paragraphe d'introduction du bloc. */
  texte?: string
  points?: string[]
  /** Ce qu'il ne faut surtout pas faire. */
  alerte?: string
  /** Points à cocher mentalement. */
  check?: string[]
  /** Exemple montré tel quel, en chasse fixe. */
  exemple?: string
  table?: { entetes: string[]; lignes: string[][] }
}

export interface Guide {
  id: string
  titre: string
  sousTitre: string
  /** Phrase à garder en tête, affichée en bandeau. */
  rappel?: string
  etapes: BlocGuide[]
  sections?: BlocGuide[]
}

export const GUIDES: Guide[] = [
  {
    id: 'procedure',
    titre: 'Comment faire une procédure',
    sousTitre: 'De l’interpellation à la cellule, dans l’ordre. Une procédure mal faite, c’est un vice de procédure.',
    rappel:
      'Arrestation → Identification → Avis de recherche → Fouille → Saisies → Infractions → Casier → Miranda → Facture → Effets personnels → Cellule → Rapport',
    etapes: [
      {
        titre: 'Arrestation',
        texte: 'Une arrestation doit toujours avoir un fondement RP valable : flagrant délit ou avis de recherche. Sans fondement, c’est un Free-Arrest.',
        points: [
          'Menotter l’individu.',
          'Vérifier son état.',
          'L’escorter jusqu’au véhicule.',
          'Le ramener au poste.',
          'L’amener en salle de procédure.'
        ],
        alerte: 'Ne jamais arrêter quelqu’un simplement parce qu’il paraît suspect.'
      },
      {
        titre: 'Identification',
        texte: 'Une fois au poste, commence par identifier correctement l’individu.',
        check: ['Identité', 'Carte d’identité', 'Retirer son masque', 'Avis de recherche']
      },
      {
        titre: 'Avis de recherche',
        texte:
          'C’est l’erreur la plus fréquente. Le bon ordre : identité → vérification de l’avis de recherche → vérification du motif → prise en compte des éléments concernés.',
        alerte: 'Avant de commencer le casier, toujours regarder si la personne est recherchée.',
        exemple:
          'Erreur classique\nTu arrêtes un individu pour possession de drogue, tu arrives au poste,\ntu fais directement son casier sans vérifier son avis de recherche.'
      },
      {
        titre: 'Permis et PPA',
        texte:
          'Les permis se vérifient quand ils sont pertinents : le permis de conduire pour une infraction liée à la conduite, le PPA dès qu’une arme est concernée.',
        points: [
          'Si le PPA doit être supprimé à cause des infractions retenues : récupérer l’arme et les munitions.',
          'Faire décharger l’arme quand c’est nécessaire.',
          'Placer l’arme et les munitions dans les saisies.',
          'Indiquer les quantités précises dans le rapport.'
        ],
        alerte: 'Ne jamais laisser repartir l’arme et les munitions quand le PPA doit être supprimé.'
      },
      {
        titre: 'Fouille',
        points: [
          'Même sexe : la fouille se fait normalement.',
          'Sexe opposé : demander l’accord de l’individu avant de fouiller.'
        ],
        alerte: 'Fouiller une personne du sexe opposé sans son accord : vice de procédure.'
      },
      {
        titre: 'Saisies',
        texte: 'Tous les objets illégaux doivent être saisis, avec les quantités exactes. Jamais d’à-peu-près.',
        table: {
          entetes: ['Mauvais', 'Correct'],
          lignes: [
            ['Drogue : plusieurs pochons', '21 pochons de morphine pure'],
            ['Munitions : plusieurs balles', '18 munitions de 5.56'],
            ['Argent sale : beaucoup', '2 020 $ d’argent sale']
          ]
        },
        check: [
          'Vérifier le PPA si nécessaire',
          'Vérifier que le PPA est toujours valable',
          'Faire décharger l’arme',
          'Récupérer les munitions',
          'Indiquer les quantités exactes dans le rapport'
        ],
        alerte: 'Oublier un objet illégal dans les poches est un vice de procédure.'
      },
      {
        titre: 'Déterminer les infractions',
        texte: 'Le Code pénal est la référence pour l’intitulé, l’amende, la garde à vue et le casier. Deux faits distincts se cumulent, un même fait ne se compte qu’une fois.',
        exemple:
          'Un individu possède 20 pochons de drogue.\nFAUX     : 20 × possession de drogue\nCORRECT  : 1 × possession de drogue, amende calculée sur les 20 unités'
      },
      {
        titre: 'Le casier',
        check: ['Nom exact de l’infraction', 'Amende', 'Durée de garde à vue', 'Type de casier', 'Règles de cumul'],
        alerte: 'Ne jamais ajouter une infraction qui ne correspond pas aux faits.'
      },
      {
        titre: 'Droits Miranda',
        texte: 'Les droits se lisent AVANT la mise en cellule. Ils peuvent être relus autant que nécessaire ; après trois lectures ils sont considérés comme acquis.',
        points: [
          'Droit de garder le silence.',
          'Ses déclarations peuvent être utilisées contre lui.',
          'Droit à un avocat.',
          'Droit à un médecin.',
          'Droit à boire et à manger.',
          'Droit à un appel téléphonique.'
        ],
        alerte: 'Mettre l’individu en cellule puis lire Miranda : vice de procédure.'
      },
      {
        titre: 'Facture',
        texte: 'Une fois le casier fait, établis la facture correspondant aux infractions retenues.',
        check: ['Les bonnes infractions', 'Les bons montants', 'Aucun doublon', 'Quantités correctement prises en compte']
      },
      {
        titre: 'Effets personnels',
        texte: 'Avant la cellule, les effets se déposent avec /e box.',
        points: ['Vêtements', 'Bijoux et perruques', 'Objets personnels', 'Moyens de communication', 'Autres effets concernés'],
        alerte: 'Exception : pour une femme, laisser les vêtements. Erreur fréquente : retirer les effets mais oublier le téléphone.'
      },
      {
        titre: 'Mise en cellule',
        texte: 'La tablette indique la durée de garde à vue : en dessous de 25 minutes on applique la durée indiquée, au-delà on plafonne à 25 minutes.',
        table: {
          entetes: ['Tablette', 'Cellule'],
          lignes: [
            ['5 min', '5 minutes'],
            ['15 min', '15 minutes'],
            ['25 min', '25 minutes'],
            ['30 min', '25 minutes maximum']
          ]
        },
        alerte: 'Ne jamais dépasser 25 minutes de cellule, sauf contre-ordre d’un superviseur ou demande du DOJ.'
      },
      {
        titre: 'Le rapport',
        texte: 'Le rapport doit permettre à n’importe quel agent de comprendre exactement ce qui s’est passé.',
        points: [
          'Les matricules des agents ayant participé.',
          'Le type d’intervention : braquage, course-poursuite, vente de stupéfiants, prise d’otage…',
          'Le nombre d’individus et leur rôle : 2 braqueurs, 1 conducteur, 1 otage.',
          'La négociation s’il y en a eu une : ce qui a été négocié et son issue.',
          'La raison claire de l’arrestation.',
          'Le comportement de l’individu.',
          'Les permis et le PPA quand c’est pertinent.',
          'Les objets saisis avec les quantités exactes.',
          'La phrase exacte en cas d’outrage ou de menace sur agent.'
        ],
        alerte:
          'Un outrage pendant le trajet reste un outrage : si l’individu insulte un agent, vérifie s’il faut l’ajouter au casier.'
      }
    ],
    sections: [
      {
        titre: 'Pas de codes radio dans les rapports',
        texte:
          'Le rapport doit être compréhensible par tous, même par quelqu’un qui ne connaît pas les codes. Les codes servent à la radio, les rapports se rédigent en toutes lettres.'
      },
      {
        titre: 'Les erreurs les plus fréquentes',
        points: [
          'Oublier de vérifier l’avis de recherche.',
          'Oublier de le prendre en compte.',
          'Fouiller le sexe opposé sans accord.',
          'Oublier une saisie.',
          'Ne pas mettre les quantités.',
          'Faire plusieurs chefs pour une même quantité.',
          'Mettre l’individu en cellule avant Miranda.',
          'Oublier les moyens de communication.',
          'Utiliser les codes radio dans le rapport.',
          'Dépasser 25 minutes de cellule.',
          'Mettre une infraction qui ne correspond pas aux faits.'
        ]
      },
      {
        titre: 'Vices de procédure',
        texte: 'Un vice de procédure, c’est le non-respect d’une forme substantielle.',
        points: [
          'Absence de lecture de Miranda avant la cellule.',
          'Non-respect des règles sur les effets et les objets.',
          'Non-respect des délais.',
          'Perquisition sans les validations nécessaires.'
        ],
        alerte:
          'N’en sont pas : mal prononcer le nom, se tromper de date pendant Miranda. Les petites erreurs de formulation ne sont pas automatiquement des vices.'
      },
      {
        titre: 'Exemple de bon rapport',
        exemple:
          'Matricules : 301 et 302\nType d’intervention : vente de stupéfiants\n\nNous avons été appelés concernant une suspicion de vente de stupéfiants. Une fois\narrivés sur les lieux, nous avons constaté Monsieur John Doe en train de procéder à\nune vente de stupéfiants. L’individu a été interpellé puis ramené au poste afin\nd’effectuer sa procédure.\n\nLors de la fouille, nous avons saisi 21 pochons de morphine pure ainsi que 2 020 $\nd’argent sale.\n\nMonsieur John Doe s’est montré coopératif durant l’intégralité de son arrestation et\nde sa procédure.\n\nPermis / PPA : aucun permis pertinent pour cette procédure.\nLes droits Miranda ont été lus à l’individu avant sa mise en cellule.'
      },
      {
        titre: 'La checklist à apprendre par cœur',
        check: [
          'Ai-je vérifié son identité ?',
          'Ai-je vérifié s’il était recherché ?',
          'Ai-je effectué la fouille correctement ?',
          'Ai-je demandé l’accord si nécessaire ?',
          'Ai-je récupéré les objets concernés ?',
          'Ai-je pris les bonnes infractions ?',
          'Ai-je vérifié les quantités ?',
          'Ai-je évité les doublons ?',
          'Ai-je lu Miranda avant la cellule ?',
          'Ai-je fait la facture ?',
          'Ai-je déposé les effets personnels ?',
          'Ai-je respecté les 25 minutes maximum ?',
          'Ai-je mis les matricules ?',
          'Ai-je expliqué les faits ?',
          'Ai-je détaillé les saisies avec les quantités exactes ?',
          'Ai-je évité les codes radio ?'
        ]
      }
    ]
  },

  {
    id: 'rookie',
    titre: 'Les bases du rookie',
    sousTitre: 'Ce qu’il faut savoir et savoir faire pour être validé en formation rookie.',
    rappel: 'Une arme peut tuer mais ne doit pas tuer : elle ne s’utilise qu’en légitime défense.',
    etapes: [
      {
        titre: 'La théorie à réviser',
        points: [
          'Légitime défense : une réaction immédiate et proportionnée à une menace injustifiée envers soi, autrui ou un bien.',
          'Délit de fuite : un conducteur cause un accident et décide de ne pas s’arrêter.',
          'Refus d’obtempérer : un conducteur refuse de s’arrêter après l’ordre d’un agent.',
          'Les codes radio, à développer à partir d’un exemple donné par le formateur.'
        ],
        exemple:
          'Call donné      : [Adam-388] [10-31] [descriptif du véhicule] [Occupé 2 fois] [suite au dernier 10-56]\nDéveloppement   : patrouille à deux, matricule du plus haut gradé, départ sur une\n                  course-poursuite, descriptif du véhicule, raison'
      },
      {
        titre: 'Les étapes d’une arrestation',
        points: [
          'Demander à la personne de sortir calmement de son véhicule, en la visant au tazer.',
          'S’approcher doucement et la menotter.',
          'L’installer dans le véhicule et la conduire au poste.',
          'Annoncer à la radio : « Adam (matricule), 10-19 pour 10-14 ».'
        ]
      },
      {
        titre: 'Les étapes du casier',
        points: [
          'Demander la carte d’identité pour vérifier nom et prénom.',
          'Faire lever les mains et fouiller — accord obligatoire pour le sexe opposé. Toute arme, drogue ou objet illégal est saisi.',
          'Armes boutique : faire ranger dans les poches après en avoir pris une photo, pour ne pas se tromper de nom.',
          'Faire déposer les affaires dans une boîte avec /e box, perruques comprises.',
          'F6 → MDT → Citoyens → nom et prénom. Créer la fiche si elle n’existe pas, sinon Casier judiciaire → Nouvelle sanction.',
          'Choisir le niveau de coopérativité : il change fortement le montant de l’amende, tout abus est sanctionné.',
          'Rédiger le rapport avec les matricules, les faits complets, les objets saisis et leurs quantités.',
          'Lire les droits Miranda avant la cellule.',
          'Amender au montant indiqué sur le MDT, puis conduire en cellule.'
        ],
        alerte: 'Tout manquement de précision — objet illégal, arme, drogue oubliés — engendre un vice de procédure.'
      },
      {
        titre: 'Ce qui t’attend en pratique',
        texte:
          'Un test de conduite en course-poursuite suivi d’une procédure d’arrestation complète. Le formateur joue le suspect en véhicule civil et tente de t’échapper.',
        points: [
          'Immobiliser proprement le véhicule en communiquant à la radio.',
          'Appliquer les techniques d’interpellation : sommation puis menottage.',
          'Faire toute la procédure comme en situation réelle, casier compris, sans le finaliser.',
          'Stream Discord ou capture d’écran pour que le formateur vérifie et corrige.'
        ],
        alerte: 'Un seul vice de procédure mineur est toléré. Inapte au bout de 3 essais : la formation est un échec.'
      },
      {
        titre: 'Conditions pour passer la formation',
        points: [
          'Être au LSPD Mission Row depuis au moins 2 jours.',
          'En cas de refus, attendre 1 jour de plus avant de repasser.'
        ]
      }
    ],
    sections: [
      {
        titre: 'Sur quoi tu es noté',
        points: [
          'La maîtrise de la conduite en poursuite.',
          'La coordination et la communication radio.',
          'La capacité à immobiliser et sécuriser le suspect.',
          'La gestion de l’arrestation et de la procédure complète.'
        ]
      }
    ]
  },

  {
    id: 'convoi',
    titre: 'Convoi',
    sousTitre: 'Organiser, encadrer et sécuriser un convoi LSPD sans le casser en route.',
    rappel: 'Un convoi fonctionne grâce à la discipline et à la communication. On ne quitte jamais sa position sans consigne.',
    etapes: [
      {
        titre: 'Communication',
        texte: 'Le responsable de convoi annonce le départ, la formation, les changements, les arrêts, les changements d’itinéraire, l’arrivée et les menaces.',
        points: ['Communications courtes.', 'Claires.', 'Précises.', 'Utiles au convoi.'],
        exemple: 'Chef de convoi : « Formation diamant, départ dans 10 secondes. »'
      },
      {
        titre: 'Formation diamant',
        texte: 'Protection autour d’un véhicule ou d’une personne transportée.',
        exemple: '            AVANT\n             🚓\n\n   🚓                 🚓\n GAUCHE             DROITE\n\n             🚓\n           ARRIÈRE',
        points: [
          'Avant : ouvre la route, anticipe les dangers, signale les ralentissements, ne prend pas trop d’avance.',
          'Latéraux : protègent les côtés, tiennent leur position, surveillent les intersections.',
          'Arrière : ferme le convoi, vérifie que personne n’est lâché, signale une séparation.'
        ],
        alerte: 'À éviter : prendre trop d’avance, coller le véhicule protégé, doubler un véhicule du convoi, quitter sa position.'
      },
      {
        titre: 'Formation linéaire',
        texte: 'La plus simple : tous les véhicules en file, adaptée aux routes étroites.',
        exemple: '🚓  ← chef de convoi\n ↓  distance de sécurité\n🚓\n ↓  distance de sécurité\n🚓\n ↓  distance de sécurité\n🚓  ← fermeture',
        points: ['Suivre le véhicule devant.', 'Garder la distance de sécurité.', 'Adapter sa vitesse.', 'Garder le contact visuel.'],
        alerte: 'À éviter : coller, laisser un énorme espace, doubler, rouler trop vite et créer une séparation, s’arrêter sans prévenir.'
      },
      {
        titre: 'Formation rideau',
        texte: 'Une barrière mobile pour contrôler les côtés, quand la largeur de la route le permet.',
        exemple: '🚓      🚓      🚓\n      CONVOI\n🚓      🚓      🚓',
        points: ['Maintenir sa ligne.', 'Garder une vitesse identique.', 'Surveiller son côté.', 'Garder assez d’espace pour éviter les collisions.'],
        alerte: 'Le rideau ne doit pas bloquer inutilement la circulation.'
      },
      {
        titre: 'Formation quinconce',
        texte: 'Les véhicules alternent gauche et droite : bonne visibilité, bonne protection.',
        exemple: '🚓\n      🚓\n🚓\n      🚓\n🚓\n      🚓',
        points: ['Conserver son côté.', 'Suivre le véhicule précédent.', 'Ne jamais le dépasser.', 'Ne pas se rabattre brutalement.'],
        alerte: 'À éviter : se retrouver côte à côte avec le mauvais véhicule, changer de côté sans consigne, perdre la formation dans les virages.'
      },
      {
        titre: 'Changer de formation',
        texte: 'Le responsable annonce la nouvelle formation, le moment du changement si besoin, et le déplacement à effectuer. Chacun rejoint sa position progressivement.',
        alerte: 'On ne change jamais de formation de manière anarchique.'
      },
      {
        titre: 'Vitesse, distances et intersections',
        points: [
          'La vitesse s’adapte à la circulation, à la route et au véhicule le plus lent.',
          'Trop proche : risque de collision. Trop loin : risque de séparation.',
          'Aux intersections : ralentir, vérifier, ne pas couper la trajectoire d’un autre véhicule du convoi.'
        ],
        alerte: 'La sécurité passe avant le maintien parfait de la formation. Le but n’est pas d’aller vite, c’est de rester uni.'
      },
      {
        titre: 'En cas d’incident',
        texte: 'Accident, blocage, panne, perte du convoi, véhicule pris pour cible : on communique immédiatement.',
        exemple: '« Central, véhicule arrière accidenté, demande assistance. »\n« Chef de convoi, j’ai perdu le convoi, je suis en dernière position connue. »',
        alerte: 'Ne pas essayer de rattraper le convoi à toute vitesse.'
      },
      {
        titre: 'Rôle du chef de convoi',
        points: [
          'Choisir la formation et l’itinéraire.',
          'Donner les consignes et informer des changements.',
          'Adapter la vitesse.',
          'Veiller au maintien du convoi.',
          'Gérer les imprévus.'
        ],
        alerte: 'Les autres agents suivent ses instructions, sauf danger immédiat.'
      }
    ],
    sections: [
      {
        titre: 'Motifs d’échec',
        points: [
          'Ne pas connaître les formations.',
          'Ne pas savoir se positionner.',
          'Mettre volontairement le convoi en danger.',
          'Conduire dangereusement.',
          'Ne pas respecter les consignes.',
          'Quitter régulièrement sa position.',
          'Créer plusieurs collisions.',
          'Ne pas communiquer lors d’un incident.',
          'Ne pas savoir changer de formation.'
        ],
        alerte: 'Une erreur dangereuse peut entraîner l’arrêt immédiat de la formation.'
      },
      {
        titre: 'Checklist du candidat',
        check: [
          'Diamant : je connais la position des véhicules et le rôle de l’avant, des côtés et de l’arrière.',
          'Linéaire : je sais me positionner, tenir la distance et suivre le convoi.',
          'Rideau : je comprends le placement et je sais tenir ma ligne et surveiller mon côté.',
          'Quinconce : je connais le placement gauche/droite et je tiens ma position dans les virages.',
          'Je sais communiquer.',
          'Je sais réagir à un incident.',
          'Je sais changer de formation.',
          'Je connais les règles de sécurité.'
        ]
      }
    ]
  },

  {
    id: 'msg',
    titre: 'Unité Mary (MSG)',
    sousTitre: 'La moto : rapide, mobile, sans protection. Un des parcours les plus sélectifs du département.',
    rappel: 'Les Mary sont toujours en première position, suivies des VIR puis des patrouilles.',
    etapes: [
      {
        titre: 'Règles fondamentales',
        points: [
          'La Mary reste collée au convoi et focalisée sur la protection.',
          'Jamais d’écart pour intercepter seule.',
          'Pour sortir une Mary, il faut au minimum 3 patrouilles terrestres actives.'
        ]
      },
      {
        titre: 'Rôles et missions',
        points: [
          'Agir plus vite et plus facilement que les véhicules classiques.',
          'Se déplacer rapidement pour couvrir une zone.',
          'Servir de renfort mobile en cas d’urgence.',
          'Ouvrir la route pour un convoi prioritaire.',
          'Participer à une mission spéciale avec l’accord d’un supérieur.'
        ],
        texte: 'L’unité intervient là où les véhicules classiques ne passent pas : ruelles étroites, poursuites à haute intensité, reconnaissance rapide, escortes sensibles, soutien immédiat au sol.'
      },
      {
        titre: 'Armement et équipement',
        points: ['Armes autorisées : Glock 17 et tazer, rien d’autre.'],
        check: ['Tenue MSG complète', 'Radio', 'Arme de poing (Glock ou tazer)', 'Gilet de protection']
      },
      {
        titre: 'Conduite en course-poursuite',
        points: ['Suivre le véhicule à distance raisonnable et sécurisée.', 'Attendre l’ordre du lead avant toute manœuvre.'],
        alerte: 'La moto ne protège de rien : discipline, anticipation et sang-froid en permanence.'
      }
    ]
  },

  {
    id: 'asd',
    titre: 'Air Support (ASD)',
    sousTitre: 'L’unité Henry : soutien aérien, surveillance, recherche et coordination des unités au sol.',
    rappel: 'Depuis les airs, l’équipage voit toute la scène : plaques, modèles, déplacements des suspects, positions pour les tireurs d’élite.',
    etapes: [
      {
        titre: 'Ce que fait la division',
        points: [
          'Soutien aérien aux unités au sol et vision d’ensemble de la situation.',
          'Surveillance, recherche d’individus, repérage des plantations de drogue.',
          'Poursuites : anticiper les déplacements, transmettre plaques et modèles en direct.',
          'Braquages : informations pour les équipes au sol, dépose de tireurs d’élite sur les toits, appui à la négociation.'
        ]
      },
      {
        titre: 'Prérequis pour candidater',
        points: [
          'Être Officier 2 au minimum.',
          'Formation codes radio validée et codes parfaitement maîtrisés.',
          'Sang-froid, gestion du stress, réactivité, travail en équipe, communication concise.',
          'Aucune sanction récente (une semaine, hors avertissement mineur).',
          'Tenue ASD obligatoire pour le pilote et le co-pilote, disponible au magasin bleu.'
        ]
      },
      {
        titre: 'Zones interdites de survol',
        points: [
          'Centre pénitencier de Bolingbroke.',
          'Base militaire aérienne de Fort Zancudo.',
          'Entrepôt de Merryweather, au port.',
          'Tout QG d’organisation illégale, sauf descente organisée par les forces de l’ordre.'
        ],
        alerte:
          'Interdit aussi : voler à basse altitude en centre-ville, passer entre les bâtiments, se poser en centre-ville. Sauf demande expresse d’un haut gradé ou urgence.'
      },
      {
        titre: 'Conditions de sortie d’une unité',
        texte: 'Une unité ASD ne sort que si toutes ces conditions sont réunies.',
        check: [
          'Au moins deux patrouilles terrestres en service et sur le terrain',
          'Au moins deux membres de la division disponibles : pilote et co-pilote',
          'Une situation qui le justifie'
        ],
        points: [
          'Braquages majeurs (10-86, 10-87…).',
          'Recherche d’individu.',
          'Mission de surveillance.',
          'Demande de renfort en course-poursuite.',
          'Information de la DOA sur des plantations ou points de vente.',
          'Demande expresse d’un haut gradé.'
        ]
      },
      {
        titre: 'Entretien des appareils',
        table: {
          entetes: ['Avant de sortir', 'Avant de ranger'],
          lignes: [
            ['Au moins 100 litres de carburant', 'Au moins 100 litres de carburant'],
            ['Moteur à 80 % minimum', 'Moteur à 80 % minimum'],
            ['Jamais de décollage avec un appareil endommagé', 'Chaque appareil rangé en état de repartir en urgence']
          ]
        },
        alerte: 'Un appareil stationné hors d’état doit être signalé à la hiérarchie. Tout manquement peut entraîner un avertissement ou une sanction.'
      }
    ]
  },

  {
    id: 'ppa',
    titre: 'PPA — usage de l’arme',
    sousTitre: 'Règles d’engagement, chronologie du tir et règles de sécurité.',
    rappel: 'Le tireur est responsable de chaque tir qu’il effectue. Tout usage de l’arme doit pouvoir être justifié.',
    etapes: [
      {
        titre: 'Règles d’engagement',
        texte: 'Quand la situation le permet, privilégier les zones non vitales.',
        table: {
          entetes: ['À privilégier', 'Zones vitales'],
          lignes: [
            ['Bras, mains', 'Tête'],
            ['Jambes, genoux, pieds', 'Torse']
          ]
        },
        alerte: 'L’usage de l’arme doit toujours être adapté à la situation et rester justifiable.'
      },
      {
        titre: 'Après avoir tiré',
        points: [
          'Contacter immédiatement les LSMC.',
          'Prévenir les services du LSPD.',
          'Être en mesure de justifier l’usage de l’arme lors d’un contrôle ou d’un interrogatoire.'
        ]
      },
      {
        titre: 'C.E.V.I.T.A.L — la chronologie du tir',
        texte: 'Sept étapes, toujours dans cet ordre.',
        points: [
          'C — Certitude : identifier formellement la cible.',
          'E — Élévation : monter l’arme au niveau des yeux.',
          'V — Visée : aligner les organes de visée sur l’objectif.',
          'I — Index : index sur la détente seulement une fois la visée alignée.',
          'T — Tir : pression continue sur la détente jusqu’au départ du coup.',
          'A — Analyse : index hors détente, arme à 45°, vérifier la neutralisation et l’état de l’arme.',
          'L — Liaison : communiquer les résultats du tir aux collègues.'
        ]
      },
      {
        titre: 'I.S.T.C — les 4 règles de sécurité',
        points: [
          'Une arme est toujours considérée comme chargée, la tienne comme celle d’en face. Aucune exception.',
          'Ne jamais pointer une arme vers ce que l’on ne souhaite pas détruire, même pour plaisanter.',
          'Index hors de la détente tant que la visée n’est pas alignée : le stress provoque des tirs involontaires.',
          'Être certain de son objectif et de son environnement : ricochets, tirs manqués, perforations, personnes autour.'
        ]
      },
      {
        titre: 'Le test pratique',
        table: {
          entetes: ['Niveau', 'Arme', 'Lieu', 'Épreuve'],
          lignes: [
            ['PPA Rookie', 'Glock', 'Stand de tir', '7 tirs sur 7 cibles dont 1 otage'],
            ['PPA Moyen', 'MCX Spear', 'Stand de tir', '14 tirs sur 14 cibles dont 2 otages'],
            ['PPA Lourd', 'Pompe MK2', 'Boucherie', 'Incursion, sécurisation des zones puis engagement']
          ]
        },
        points: [
          'Crier « OTAGE ! » dès qu’un otage est identifié, avant de poursuivre.',
          'PPA Lourd : entrer, vérifier chaque angle, annoncer « CLEAR » zone par zone, progresser puis neutraliser l’adversaire.',
          'Aucun temps imposé, mais un candidat excessivement lent peut être éliminé.'
        ],
        alerte: 'Abattre un otage : élimination immédiate.'
      }
    ],
    sections: [
      {
        titre: 'Ce que tu dois maîtriser pour valider',
        check: [
          'Les règles d’engagement',
          'La procédure après usage de l’arme',
          'Le C.E.V.I.T.A.L',
          'Les 4 règles de l’I.S.T.C',
          'Le test pratique'
        ]
      }
    ]
  }
]

export const guideParId = (id: string): Guide | undefined => GUIDES.find((g) => g.id === id)
