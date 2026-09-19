import type { FormationScenario } from '../shared/formation'

/** Scénarios livrés par défaut. L'admin peut tout modifier depuis « Gestion formation ». */
export const FORMATIONS_DEFAUT: FormationScenario[] = [
  {
    id: 'rookie-1',
    titre: 'Contrôle routier qui tourne mal',
    niveau: 1,
    resume: 'Excès de vitesse, pas de permis et refus d’obtempérer. Tu es guidé par ton formateur.',
    contexte:
      'Tu es en patrouille sur Great Ocean Highway avec le matricule 390 quand un véhicule te dépasse très largement au-dessus de la vitesse autorisée. Tu allumes les gyrophares : le conducteur ne s’arrête pas et continue environ une minute avant de s’immobiliser de lui-même. Il descend, se laisse menotter sans résistance et reconnaît qu’il n’a jamais passé son permis.',
    surLui:
      'CARTE D’IDENTITÉ : Marcus Reed, né le 14/03/1998.\nINVENTAIRE : un téléphone, 340 $ déclarés, un paquet de cigarettes. Aucune arme, aucune drogue.\nCASIER : vierge.\nAVIS DE RECHERCHE : aucun. BRACELET : non. PPA : aucun.',
    screens: [],
    questions: [
      {
        id: 'r1q1',
        texte: 'Le conducteur n’a pas de permis. Que fait-on de son véhicule ?',
        type: 'unique',
        indice: 'Sans permis, il ne peut pas reprendre le volant en repartant du poste.',
        options: [
          { id: 'a', texte: 'Il part à la fourrière', bon: true },
          { id: 'b', texte: 'On le laisse repartir avec', bon: false },
          { id: 'c', texte: 'On le laisse sur place, clés à l’intérieur', bon: false }
        ]
      },
      {
        id: 'r1q2',
        texte: 'Quand lis-tu les droits Miranda ?',
        type: 'unique',
        indice: 'Ils doivent être notifiés dès l’interpellation et avant toute audition.',
        options: [
          { id: 'a', texte: 'Dès l’interpellation, avant la cellule', bon: true },
          { id: 'b', texte: 'Seulement s’il les demande', bon: false },
          { id: 'c', texte: 'Jamais pour un simple contrôle routier', bon: false }
        ]
      },
      {
        id: 'r1q3',
        texte: 'Qu’est-ce qui doit obligatoirement figurer dans ton rapport ?',
        type: 'multiple',
        indice: 'Tout oubli peut créer un vice de procédure.',
        options: [
          { id: 'a', texte: 'Les matricules des agents présents', bon: true },
          { id: 'b', texte: 'Les faits complets', bon: true },
          { id: 'c', texte: 'Les objets illégaux saisis avec les quantités exactes', bon: true },
          { id: 'd', texte: 'Les codes radio utilisés pendant l’intervention', bon: false },
          { id: 'e', texte: 'Ton avis personnel sur le suspect', bon: false }
        ]
      },
      {
        id: 'r1q4',
        texte: 'Il a refusé de s’arrêter une minute, puis s’est laissé menotter sans rien dire. Coopérativité ?',
        type: 'unique',
        indice: 'Il a d’abord refusé d’obtempérer, mais il n’a pas résisté ensuite.',
        options: [
          { id: 'a', texte: 'Coopératif', bon: true },
          { id: 'b', texte: 'Non coopératif', bon: false },
          { id: 'c', texte: 'Très coopératif', bon: false }
        ]
      },
      {
        id: 'r1q5',
        texte: 'Une procédure ne doit pas dépasser :',
        type: 'unique',
        indice: 'C’est écrit dans la checklist de fin de procédure.',
        options: [
          { id: 'a', texte: '25 minutes', bon: true },
          { id: 'b', texte: '45 minutes', bon: false },
          { id: 'c', texte: 'Il n’y a pas de limite', bon: false }
        ]
      },
      {
        id: 'r1q6',
        texte: 'Quels screens mets-tu dans le dossier ?',
        type: 'multiple',
        indice: 'Tout ce qui prouve ce que tu écris dans le rapport.',
        options: [
          { id: 'a', texte: 'La carte d’identité', bon: true },
          { id: 'b', texte: 'La photo du suspect', bon: true },
          { id: 'c', texte: 'L’inventaire de la fouille', bon: true },
          { id: 'd', texte: 'Les amendes', bon: true },
          { id: 'e', texte: 'L’ajout au casier', bon: true },
          { id: 'f', texte: 'Une photo de ton véhicule de patrouille', bon: false }
        ]
      }
    ],
    attendu: {
      accusations: ['Excès de vitesse', 'Défaut de permis de conduire', 'Refus d’obtempérer (hors délits routiers)'],
      saisies: [],
      rienSurLui: true,
      recherche: 'non',
      bracelet: 'non',
      ppa: 0,
      cooperation: 'coop'
    },
    actif: true
  },

  {
    id: 'rookie-2',
    titre: 'Braquage du coiffeur',
    niveau: 2,
    resume: 'Braquage à main armée, fuite en véhicule, outrage et récidive. Plus d’aide, tu gères seul.',
    contexte:
      'Appel signalant un braquage du coiffeur de Vinewood. Sur place, un individu ressort avec une arme de poing et prend la fuite au volant d’une berline grise. Course-poursuite de 4 minutes, conduite dangereuse, le véhicule finit contre un poteau. Tu procèdes à l’interpellation. Dans la voiture de patrouille, il t’insulte : « bande de bouffons, vous servez à rien ».',
    surLui:
      'CARTE D’IDENTITÉ : Dimitri Costa, né le 02/07/1995.\nINVENTAIRE : 1 Beretta M9A3, 24 munitions 9mm Parabellum, 6 500 $ d’argent non déclaré, un téléphone.\nCASIER : 3 sanctions pour braquage.\nAVIS DE RECHERCHE : aucun. BRACELET : non. PPA : aucun.',
    screens: [],
    questions: [
      {
        id: 'r2q1',
        texte: 'Il a une Beretta M9A3 (arme soumise au PPA) et aucun PPA. Quelle infraction retiens-tu pour l’arme ?',
        type: 'unique',
        options: [
          { id: 'a', texte: 'Port d’arme légale sans PPA', bon: true },
          { id: 'b', texte: 'Port d’arme illégal', bon: false },
          { id: 'c', texte: 'Aucune, l’arme est légale', bon: false }
        ]
      },
      {
        id: 'r2q2',
        texte: 'Il t’a insulté dans la voiture. Que doit contenir ton rapport ?',
        type: 'unique',
        options: [
          { id: 'a', texte: 'La phrase exacte qu’il a prononcée', bon: true },
          { id: 'b', texte: 'Un résumé de ce qu’il a dit', bon: false },
          { id: 'c', texte: 'Rien, ça ne se met pas dans un rapport', bon: false }
        ]
      },
      {
        id: 'r2q3',
        texte: 'Il a déjà 3 sanctions similaires à son casier. Tu fais quoi pour la récidive ?',
        type: 'unique',
        options: [
          { id: 'a', texte: 'Rien, le MDT l’applique automatiquement', bon: true },
          { id: 'b', texte: 'Je multiplie l’amende moi-même', bon: false },
          { id: 'c', texte: 'J’ajoute une infraction « récidive »', bon: false }
        ]
      },
      {
        id: 'r2q4',
        texte: 'Les 6 500 $ non déclarés trouvés sur lui :',
        type: 'unique',
        options: [
          { id: 'a', texte: 'Je les saisis et je note le montant exact dans le rapport', bon: true },
          { id: 'b', texte: 'Je les laisse, ce n’est pas illégal', bon: false },
          { id: 'c', texte: 'Je les saisis sans les noter', bon: false }
        ]
      },
      {
        id: 'r2q5',
        texte: 'La fuite en véhicule avec conduite dangereuse, tu la mets où ?',
        type: 'multiple',
        options: [
          { id: 'a', texte: 'Dans le déroulé du rapport', bon: true },
          { id: 'b', texte: 'Dans les accusations retenues', bon: true },
          { id: 'c', texte: 'Nulle part, la poursuite ne compte pas', bon: false }
        ]
      },
      {
        id: 'r2q6',
        texte: 'Coopérativité à cocher dans le MDT ?',
        type: 'unique',
        options: [
          { id: 'a', texte: 'Non coopératif', bon: true },
          { id: 'b', texte: 'Coopératif', bon: false },
          { id: 'c', texte: 'Très coopératif', bon: false }
        ]
      }
    ],
    attendu: {
      accusations: [
        'Braquage de coiffeur',
        'Refus d’obtempérer (hors délits routiers)',
        'Conduite dangereuse',
        'Port d’arme légale sans PPA',
        'Possession ou transport d’argent non déclaré',
        'Outrage à agent'
      ],
      saisies: [
        { id: 's1', type: 'arme', label: 'Beretta M9A3', quantite: 1 },
        { id: 's2', type: 'munition', label: '9mm Parabellum', quantite: 24 },
        { id: 's3', type: 'argent', label: '', quantite: 6500 }
      ],
      rienSurLui: false,
      recherche: 'non',
      bracelet: 'non',
      ppa: 0,
      cooperation: 'non'
    },
    actif: true
  },

  {
    id: 'rookie-3',
    titre: 'Individu recherché et armé',
    niveau: 3,
    resume: 'Avis de recherche maximum, tir sur un agent, armement lourd. Aucune aide.',
    contexte:
      'Un individu recherché depuis plusieurs jours est repéré à Sandy Shores : avis de recherche de niveau maximum, il ne s’est jamais présenté à son jugement. Il refuse de s’arrêter, ouvre le feu sur un agent et le touche, avant d’être neutralisé au tazer par ton binôme. L’agent touché est pris en charge par les EMS.',
    surLui:
      'CARTE D’IDENTITÉ : Kofi Kingston, né le 21/11/1992.\nINVENTAIRE : 1 AK-47, 180 munitions 5.56x45mm Nato, 12 pochons de cocaïne, 24 000 $ non déclarés, 1 gilet pare-balles.\nCASIER : tentative d’homicide sur agent de l’État, prise d’otage.\nAVIS DE RECHERCHE : oui, niveau maximum. BRACELET : non. PPA : aucun.',
    screens: [],
    questions: [
      {
        id: 'r3q1',
        texte: 'Il a tiré sur un agent, qui a survécu. Quelle infraction ?',
        type: 'unique',
        options: [
          { id: 'a', texte: 'Tentative d’homicide sur agent de l’État', bon: true },
          { id: 'b', texte: 'Meurtre sur agent de l’État (mort RP)', bon: false },
          { id: 'c', texte: 'Agression', bon: false }
        ]
      },
      {
        id: 'r3q2',
        texte: 'Il ne s’est jamais présenté à son jugement. Que fais-tu à la fin de la procédure ?',
        type: 'unique',
        options: [
          { id: 'a', texte: 'Je le mets en cellule et je préviens le gouvernement', bon: true },
          { id: 'b', texte: 'Je le relâche une fois l’amende payée', bon: false },
          { id: 'c', texte: 'Je supprime son avis de recherche', bon: false }
        ]
      },
      {
        id: 'r3q3',
        texte: 'L’AK-47 est classée illégale dans le répertoire des armes. Conséquence ?',
        type: 'unique',
        options: [
          { id: 'a', texte: 'Port d’arme illégal, saisie de l’arme et des munitions', bon: true },
          { id: 'b', texte: 'Rien s’il a un PPA de niveau 4', bon: false },
          { id: 'c', texte: 'Un simple avertissement', bon: false }
        ]
      },
      {
        id: 'r3q4',
        texte: 'Le gilet pare-balles trouvé sur lui :',
        type: 'unique',
        options: [
          { id: 'a', texte: 'Port de gilet pare-balles sans autorisation', bon: true },
          { id: 'b', texte: 'Ce n’est pas une infraction', bon: false }
        ]
      },
      {
        id: 'r3q5',
        texte: 'La procédure va dépasser les 25 minutes. Tu fais quoi ?',
        type: 'unique',
        options: [
          { id: 'a', texte: 'Je préviens un supérieur et je finis la procédure proprement', bon: true },
          { id: 'b', texte: 'Je bâcle la fin pour tenir le temps', bon: false },
          { id: 'c', texte: 'J’arrête tout et je le relâche', bon: false }
        ]
      },
      {
        id: 'r3q6',
        texte: 'Sur un dossier aussi lourd, quels screens sont indispensables ?',
        type: 'multiple',
        options: [
          { id: 'a', texte: 'La carte d’identité', bon: true },
          { id: 'b', texte: 'L’inventaire complet de la fouille', bon: true },
          { id: 'c', texte: 'Les amendes', bon: true },
          { id: 'd', texte: 'L’ajout au casier', bon: true },
          { id: 'e', texte: 'L’avis de recherche', bon: true },
          { id: 'f', texte: 'Une capture du chat vocal', bon: false }
        ]
      }
    ],
    attendu: {
      accusations: [
        'Tentative d’homicide sur agent de l’État',
        'Refus d’obtempérer (hors délits routiers)',
        'Port d’arme illégal',
        'Possession de drogue',
        'Possession ou transport d’argent non déclaré',
        'Port de gilet pare-balles sans autorisation'
      ],
      saisies: [
        { id: 's1', type: 'arme', label: 'Ak-47', quantite: 1 },
        { id: 's2', type: 'munition', label: '5.56x45mm Nato', quantite: 180 },
        { id: 's3', type: 'drogue', label: 'pochons de cocaïne', quantite: 12 },
        { id: 's4', type: 'argent', label: '', quantite: 24000 },
        { id: 's5', type: 'autre', label: 'gilet pare-balles', quantite: 1 }
      ],
      rienSurLui: false,
      recherche: 'oui',
      bracelet: 'non',
      ppa: 0,
      cooperation: 'non'
    },
    actif: true
  }
]
