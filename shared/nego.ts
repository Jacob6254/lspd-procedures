import type { PointCorrige } from './formation'

// ---------- Questionnaire ----------

export interface NegoOption {
  id: string
  texte: string
  bon: boolean
}

export interface NegoQuestion {
  id: string
  texte: string
  type: 'unique' | 'multiple'
  /** Une faute sur cette question fait échouer le candidat, quel que soit le reste. */
  eliminatoire: boolean
  options: NegoOption[]
  /** Ce que le formateur doit entendre. Jamais envoyé au candidat. */
  aide: string
}

export interface NegoConfig {
  questions: NegoQuestion[]
  /** Texte lu à voix haute aux candidats avant de commencer. */
  texteFormateur: string
  /** Marche à suivre du formateur pendant la session. */
  consignes: string
  dureeMinutes: number
  fautesMax: number
}

/** Ce que reçoit le candidat : les mêmes questions, sans les bonnes réponses. */
export interface NegoQuestionPublique {
  id: string
  texte: string
  type: 'unique' | 'multiple'
  options: { id: string; texte: string }[]
}

export interface NegoExamen {
  questions: NegoQuestionPublique[]
  dureeMinutes: number
  fautesMax: number
  total: number
}

export function versionPublique(config: NegoConfig): NegoExamen {
  return {
    questions: config.questions.map((q) => ({
      id: q.id,
      texte: q.texte,
      type: q.type,
      options: q.options.map((o) => ({ id: o.id, texte: o.texte }))
    })),
    dureeMinutes: config.dureeMinutes,
    fautesMax: config.fautesMax,
    total: config.questions.length
  }
}

// ---------- Partie pratique ----------

export interface CriterePratique {
  id: string
  titre: string
  deux: string
  /** Certains critères n'ont pas de demi-point dans le document. */
  un: string | null
  zero: string
  /** Un zéro sur ce critère est éliminatoire. */
  zeroEliminatoire: boolean
}

export const CRITERES_PRATIQUE: CriterePratique[] = [
  {
    id: 'posture',
    titre: 'Posture & sérieux',
    deux: 'Calme, pro, sérieux et crédible.',
    un: 'S’énerve un peu ou manque d’assurance.',
    zero: 'Irrespectueux, énervé ou trop familier avec les braqueurs.',
    zeroEliminatoire: false
  },
  {
    id: 'tactique',
    titre: 'Mise en place tactique',
    deux: 'Arme sortie, sorties surveillées, périmètre et barrières posées.',
    un: 'Pas d’arme en main, distrait ou manque de vigilance.',
    zero: 'Ne fait rien.',
    zeroEliminatoire: true
  },
  {
    id: 'braqueurs',
    titre: 'Communication avec les braqueurs',
    deux: 'Négociation claire, ferme, ne lâche rien sans contrepartie.',
    un: 'Négociation correcte mais perfectible.',
    zero: 'Négociation bâclée ou donnée trop vite.',
    zeroEliminatoire: false
  },
  {
    id: 'otages',
    titre: 'Gestion des otages',
    deux: 'Rassure, pose les 3 questions santé et vérifie si l’otage est recherché.',
    un: null,
    zero: 'Ignore l’otage (n’appelle pas de patrouille si l’otage est recherché).',
    zeroEliminatoire: true
  },
  {
    id: 'ecoute',
    titre: 'Écoute active & stratégie',
    deux: 'Preuves et photos prises, un maximum d’infos (plaques, tenues, noms).',
    un: 'Photos simples, sans exploiter les détails.',
    zero: 'Aucune prise d’information.',
    zeroEliminatoire: false
  },
  {
    id: 'adaptation',
    titre: 'Créativité & adaptation',
    deux: 'Bonnes initiatives tactiques (VIR, ASD, bluff, matériel).',
    un: 'Adaptation au strict minimum.',
    zero: 'Aucune initiative ou mauvaise réaction.',
    zeroEliminatoire: false
  }
]

export const NOTE_MAX_PRATIQUE = CRITERES_PRATIQUE.length * 2
export const NOTE_ADMIS = 7

export interface NegoPratique {
  /** Note de chaque critère : 0, 1 ou 2. */
  notes: Record<string, number>
  commentaire: string
  /** Rempli par le serveur. */
  total: number
  eliminatoire: boolean
}

export function calculerPratique(notes: Record<string, number>, commentaire: string): NegoPratique {
  let total = 0
  let eliminatoire = false
  for (const c of CRITERES_PRATIQUE) {
    const n = notes[c.id]
    if (typeof n !== 'number') continue
    total += n
    if (n === 0 && c.zeroEliminatoire) eliminatoire = true
  }
  return { notes, commentaire, total, eliminatoire }
}

export function pratiqueComplete(p: NegoPratique | null): boolean {
  return !!p && CRITERES_PRATIQUE.every((c) => typeof p.notes[c.id] === 'number')
}

// ---------- Théorie corrigée ----------

export interface NegoTheorie {
  justes: number
  fautes: number
  total: number
  /** Intitulé des questions éliminatoires ratées. */
  eliminatoiresRatees: string[]
  ok: boolean
  details: PointCorrige[]
}

// ---------- Session d'examen ----------

export interface NegoSession {
  id: string
  candidatId: string
  candidat: string
  grade: string
  debut: string
  /** Dernière activité du candidat, pour le suivi en direct. */
  majA: string
  fin: string | null
  /** Réponses en cours de saisie, envoyées au fur et à mesure. */
  reponses: Record<string, string[]>
  rendu: boolean
  dureeSecondes: number
  theorie: NegoTheorie | null
  pratique: NegoPratique | null
  formateur: string | null
  /** Le candidat ne voit ses résultats qu'une fois publiés par le formateur. */
  publie: boolean
}

export type Verdict = 'admis' | 'echoue' | null

export function verdictNego(s: Pick<NegoSession, 'theorie' | 'pratique'>): Verdict {
  if (!s.theorie) return null
  if (!s.theorie.ok) return 'echoue'
  if (!pratiqueComplete(s.pratique)) return null
  const p = s.pratique!
  if (p.eliminatoire) return 'echoue'
  return p.total >= NOTE_ADMIS ? 'admis' : 'echoue'
}

/** Checklist otages rappelée au négociateur sur le terrain. */
export const CHECKLIST_OTAGES = [
  'Demander combien ils sont et combien d’otages ils ont.',
  'Vérifier que le périmètre est fait avant de parler.',
  'Contrôler l’état physique et verbal de chaque otage.',
  'Demander s’il a eu à manger et à boire.',
  'Demander s’il a besoin d’une assistance médicale.',
  'Contrôler sa carte d’identité pour voir s’il est recherché.',
  'Otage recherché : le renvoyer à l’intérieur sans rien dire, appeler une unité pour l’après-braquage.',
  'Une revendication accordée par otage civil, pas plus.',
  'Ne jamais négocier au-delà du plafond d’otages du braquage.',
  'Transmettre toute demande atypique aux hauts gradés.'
]
