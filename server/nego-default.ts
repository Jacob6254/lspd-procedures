import type { NegoConfig } from '../shared/nego'

/**
 * Questionnaire livré par défaut, écrit à partir des documents de formation
 * négociation du LSPD. Un admin peut tout réécrire depuis « Questionnaire négo ».
 */
export const NEGO_DEFAUT: NegoConfig = {
  dureeMinutes: 20,
  fautesMax: 5,
  texteFormateur:
    'Dans le cadre de votre formation au LSPD, la négociation exige une posture ferme et professionnelle : notre autorité doit s’imposer face aux suspects tout en rassurant les otages, sans jamais céder à des exigences abusives.\n\n' +
    'Seuls le négociateur principal et son relayeur sont autorisés à communiquer avec les suspects, pendant que les autres agents sécurisent la zone, prennent des photos des suspects et des véhicules et regardent si nos véhicules sont bien réparés pour l’intervention.\n\n' +
    'Gardez en tête la règle d’or : un otage civil correspond à exactement une seule revendication accordée.\n\n' +
    'Vous devez systématiquement évaluer les otages physiquement et verbalement, vérifier s’ils ont reçu à manger et à boire, s’ils ont besoin d’une assistance médicale, et contrôler leur carte d’identité pour vérifier qu’ils ne sont pas recherchés.\n\n' +
    'Ces directives sont strictes et non négociables : tout manquement ou faute de votre part entraînera une sanction disciplinaire immédiate.',
  consignes:
    'THÉORIE (20 minutes maximum par candidat)\n' +
    '1. Lis le texte ci-dessus au candidat avant de commencer.\n' +
    '2. Vérifie qu’il lance bien son stream, puis ouvre son suivi ici pour voir ses réponses arriver en direct.\n' +
    '3. Sois strict : une réponse trop hésitante peut être comptée fausse, c’est à toi de juger.\n' +
    '4. Ne donne aucun résultat avant la fin de la pratique.\n\n' +
    'PRATIQUE\n' +
    '1. Prends un véhicule et va à la Fleeca (si 3 formateurs ou plus) ou à une supérette.\n' +
    '2. Prends plusieurs tenues et masques pour faire tour à tour l’otage et le braqueur.\n' +
    '3. Fais passer 2 agents ensemble : un qui négocie, l’autre qui fait le périmètre.\n' +
    '4. Regarde-les bien et note tout ce qu’ils font, puis remplis la grille.\n\n' +
    'FIN DE SESSION\n' +
    'Une fois les tests terminés, rentrez au poste pour annoncer les résultats, puis publie-les ici.',
  questions: [
    {
      id: 'n1',
      texte: 'Quelle est la toute première information que tu demandes aux braqueurs ?',
      type: 'unique',
      eliminatoire: true,
      aide: 'Combien ils sont et combien d’otages ils ont. Sans ça il ne peut rien cadrer : hésitation = faute.',
      options: [
        { id: 'a', texte: 'Combien ils sont et combien d’otages ils ont', bon: true },
        { id: 'b', texte: 'Le montant de la rançon qu’ils réclament', bon: false },
        { id: 'c', texte: 'Leur identité et leur organisation', bon: false },
        { id: 'd', texte: 'Le temps qu’il leur faut pour sortir', bon: false }
      ]
    },
    {
      id: 'n2',
      texte: 'Qui a le droit de communiquer avec les suspects ?',
      type: 'unique',
      eliminatoire: false,
      aide: 'Le négociateur principal et son relayeur, personne d’autre.',
      options: [
        { id: 'a', texte: 'Le négociateur principal et son relayeur', bon: true },
        { id: 'b', texte: 'N’importe quel agent présent sur scène', bon: false },
        { id: 'c', texte: 'Le plus haut gradé présent', bon: false },
        { id: 'd', texte: 'Le négociateur seul, même sans relayeur', bon: false }
      ]
    },
    {
      id: 'n3',
      texte: 'La règle d’or : combien de revendications accorde-t-on pour un otage civil ?',
      type: 'unique',
      eliminatoire: true,
      aide: 'Exactement une revendication par otage civil. C’est la base du métier.',
      options: [
        { id: 'a', texte: 'Une seule revendication par otage civil', bon: true },
        { id: 'b', texte: 'Deux revendications par otage civil', bon: false },
        { id: 'c', texte: 'Autant que le négociateur juge utile', bon: false },
        { id: 'd', texte: 'Aucune, on ne cède jamais rien', bon: false }
      ]
    },
    {
      id: 'n4',
      texte: 'À chaque contact, que contrôles-tu sur les otages ?',
      type: 'multiple',
      eliminatoire: true,
      aide: 'État physique et verbal, à manger et à boire, assistance médicale, carte d’identité pour voir s’il est recherché.',
      options: [
        { id: 'a', texte: 'Leur état physique et verbal', bon: true },
        { id: 'b', texte: 'S’ils ont eu à manger et à boire', bon: true },
        { id: 'c', texte: 'S’ils ont besoin d’une assistance médicale', bon: true },
        { id: 'd', texte: 'Leur carte d’identité, pour vérifier qu’ils ne sont pas recherchés', bon: true },
        { id: 'e', texte: 'Leur numéro de téléphone pour prévenir leur famille', bon: false },
        { id: 'f', texte: 'Leur profession et leur employeur', bon: false }
      ]
    },
    {
      id: 'n5',
      texte: 'Tu arrives sur scène comme négociateur. Que vérifies-tu en premier ?',
      type: 'unique',
      eliminatoire: false,
      aide: 'Que le périmètre est fait. On ne parle pas tant que la zone n’est pas tenue.',
      options: [
        { id: 'a', texte: 'Que le périmètre est bien fait', bon: true },
        { id: 'b', texte: 'Que la rançon est prête à être versée', bon: false },
        { id: 'c', texte: 'Que les braqueurs ont un véhicule de fuite disponible', bon: false },
        { id: 'd', texte: 'Que les otages sont visibles depuis la rue', bon: false }
      ]
    },
    {
      id: 'n6',
      texte: 'Pendant que tu négocies, que font les agents en appui ?',
      type: 'multiple',
      eliminatoire: false,
      aide: 'Périmètre maintenu, plaques photographiées, photos de la scène, véhicules d’intervention vérifiés.',
      options: [
        { id: 'a', texte: 'Ils maintiennent le périmètre', bon: true },
        { id: 'b', texte: 'Ils photographient les plaques des véhicules suspects', bon: true },
        { id: 'c', texte: 'Ils prennent un maximum de photos de la scène', bon: true },
        { id: 'd', texte: 'Ils vérifient que nos véhicules d’intervention sont bien réparés', bon: true },
        { id: 'e', texte: 'Ils parlent aux braqueurs pour appuyer le négociateur', bon: false },
        { id: 'f', texte: 'Ils entrent discrètement par l’arrière du bâtiment', bon: false }
      ]
    },
    {
      id: 'n7',
      texte: 'Les ondes sont saturées. Peux-tu passer en OFF radio ?',
      type: 'unique',
      eliminatoire: false,
      aide: 'Oui, mais uniquement si un agent relayeur est sur scène pour faire le lien avec l’équipe.',
      options: [
        { id: 'a', texte: 'Oui, à condition qu’un agent relayeur soit présent sur scène', bon: true },
        { id: 'b', texte: 'Oui, dans tous les cas, pour rester concentré', bon: false },
        { id: 'c', texte: 'Non, jamais pendant une négociation', bon: false },
        { id: 'd', texte: 'Oui, si un haut gradé te l’autorise par téléphone', bon: false }
      ]
    },
    {
      id: 'n8',
      texte: 'Un otage libéré se révèle recherché. Que fais-tu ?',
      type: 'unique',
      eliminatoire: false,
      aide: 'Il retourne à l’intérieur sans rien dire, et une unité vient le chercher juste après le braquage.',
      options: [
        {
          id: 'a',
          texte: 'Tu lui dis de retourner à l’intérieur sans rien dire et tu appelles une unité qui le récupère après le braquage',
          bon: true
        },
        { id: 'b', texte: 'Tu l’interpelles immédiatement devant les braqueurs', bon: false },
        { id: 'c', texte: 'Tu le laisses partir, son affaire passera plus tard', bon: false },
        { id: 'd', texte: 'Tu préviens les braqueurs qu’il est recherché', bon: false }
      ]
    },
    {
      id: 'n9',
      texte: 'Les braqueurs blessent ou tuent un otage. Quelle conséquence ?',
      type: 'unique',
      eliminatoire: false,
      aide: 'Chaque otage blessé ou tué leur retire une possibilité de négociation.',
      options: [
        { id: 'a', texte: 'Ça leur retire une possibilité de négociation', bon: true },
        { id: 'b', texte: 'Ça leur ajoute une revendication', bon: false },
        { id: 'c', texte: 'Ça ne change rien au barème', bon: false },
        { id: 'd', texte: 'La négociation s’arrête automatiquement', bon: false }
      ]
    },
    {
      id: 'n10',
      texte: 'Les braqueurs annoncent plus d’otages que le plafond prévu pour ce braquage.',
      type: 'unique',
      eliminatoire: false,
      aide: 'Interdit : on ne négocie jamais au-delà du plafond d’otages du braquage.',
      options: [
        { id: 'a', texte: 'C’est interdit : on ne négocie pas au-delà du plafond du braquage', bon: true },
        { id: 'b', texte: 'On négocie quand même, otage par otage', bon: false },
        { id: 'c', texte: 'On accepte si un haut gradé valide', bon: false },
        { id: 'd', texte: 'On double la rançon et on accepte', bon: false }
      ]
    },
    {
      id: 'n11',
      texte: 'Dans un petit braquage, le marchand compte-t-il comme otage ?',
      type: 'unique',
      eliminatoire: false,
      aide: 'Oui, sauf dans les supérettes.',
      options: [
        { id: 'a', texte: 'Oui, sauf dans les supérettes', bon: true },
        { id: 'b', texte: 'Oui, dans tous les cas', bon: false },
        { id: 'c', texte: 'Non, jamais', bon: false },
        { id: 'd', texte: 'Seulement s’il est blessé', bon: false }
      ]
    },
    {
      id: 'n12',
      texte: 'Le bluff est-il autorisé ?',
      type: 'unique',
      eliminatoire: false,
      aide: 'Oui, notamment pour annuler un véhicule d’intervention qui n’est pas disponible.',
      options: [
        { id: 'a', texte: 'Oui, notamment pour annuler un véhicule d’intervention non disponible', bon: true },
        { id: 'b', texte: 'Non, tout ce qu’on annonce doit être vrai', bon: false },
        { id: 'c', texte: 'Oui, mais uniquement sur le montant de la rançon', bon: false },
        { id: 'd', texte: 'Oui, sans aucune limite', bon: false }
      ]
    },
    {
      id: 'n13',
      texte: 'Les braqueurs font une demande atypique, hors barème. Que fais-tu ?',
      type: 'unique',
      eliminatoire: false,
      aide: 'Transmission immédiate aux hauts gradés. Le négociateur ne tranche pas seul.',
      options: [
        { id: 'a', texte: 'Tu la transmets immédiatement aux hauts gradés', bon: true },
        { id: 'b', texte: 'Tu refuses sèchement et tu passes à autre chose', bon: false },
        { id: 'c', texte: 'Tu acceptes si ça fait sortir un otage', bon: false },
        { id: 'd', texte: 'Tu décides seul, c’est toi le négociateur', bon: false }
      ]
    },
    {
      id: 'n14',
      texte: 'L’assaut est-il envisageable ?',
      type: 'unique',
      eliminatoire: false,
      aide: 'Oui, à tout moment si la situation l’exige.',
      options: [
        { id: 'a', texte: 'Oui, à tout moment si la situation l’exige', bon: true },
        { id: 'b', texte: 'Non, jamais tant qu’il reste un otage', bon: false },
        { id: 'c', texte: 'Seulement si les braqueurs ont déjà tué un otage', bon: false },
        { id: 'd', texte: 'Seulement après l’échec complet de la négociation', bon: false }
      ]
    },
    {
      id: 'n15',
      texte: 'Quelle est la rançon officielle pour un Sergent 1 pris en otage ?',
      type: 'unique',
      eliminatoire: false,
      aide: '99 000 $, soit 132 pochons d’argent sale.',
      options: [
        { id: 'a', texte: '99 000 $ (132 pochons)', bon: true },
        { id: 'b', texte: '82 500 $ (110 pochons)', bon: false },
        { id: 'c', texte: '115 500 $ (154 pochons)', bon: false },
        { id: 'd', texte: '66 000 $ (88 pochons)', bon: false }
      ]
    }
  ]
}
