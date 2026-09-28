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

]

export const guideParId = (id: string): Guide | undefined => GUIDES.find((g) => g.id === id)
