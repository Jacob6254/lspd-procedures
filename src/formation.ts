import { create } from 'zustand'
import type { FormationResultat, FormationScenario, PointCorrige, ReponseDossier } from '@shared/formation'
import { SEUIL_REUSSITE } from '@shared/formation'
import { COOPERATION } from './report'
import { api } from './api'
import { normalize, uid } from './lib/format'

interface FormationState {
  scenarios: FormationScenario[]
  chargement: boolean
  charger(): Promise<void>
  remplacer(scenarios: FormationScenario[]): void
}

export const useFormations = create<FormationState>((set, get) => ({
  scenarios: [],
  chargement: false,
  async charger() {
    if (get().chargement) return
    set({ chargement: true })
    try {
      set({ scenarios: await api.getFormations() })
    } catch {
      // on réessaiera au prochain affichage
    } finally {
      set({ chargement: false })
    }
  },
  remplacer(scenarios) {
    set({ scenarios })
  }
}))

export function reponseVide(): ReponseDossier {
  return {
    accusations: [],
    saisies: [],
    rienSurLui: false,
    recherche: null,
    bracelet: null,
    ppa: null,
    cooperation: null,
    rapport: ''
  }
}

const meme = (a: string, b: string) => normalize(a) === normalize(b)

/** Corrige les questions et le dossier du rookie. Les bonnes réponses sont celles écrites par l'admin. */
export function corriger(scenario: FormationScenario, choix: Record<string, string[]>, rep: ReponseDossier, dureeSecondes: number): FormationResultat {
  const details: PointCorrige[] = []

  for (const q of scenario.questions) {
    const attendus = q.options.filter((o) => o.bon).map((o) => o.id)
    const donnes = choix[q.id] ?? []
    const bon = attendus.length === donnes.length && attendus.every((id) => donnes.includes(id))
    details.push({
      libelle: q.texte,
      bon,
      attendu: q.options
        .filter((o) => o.bon)
        .map((o) => o.texte)
        .join(', '),
      donne: q.options
        .filter((o) => donnes.includes(o.id))
        .map((o) => o.texte)
        .join(', ')
    })
  }

  const att = scenario.attendu

  const accusationsAttendues = att.accusations.map((a) => a.trim()).filter(Boolean)
  const saisiesAttendues = att.saisies.filter((s) => (s.type === 'argent' ? (s.quantite ?? 0) > 0 : s.label.trim().length > 0))

  for (const a of accusationsAttendues) {
    details.push({ libelle: `Accusation : ${a}`, bon: rep.accusations.some((x) => meme(x, a)), attendu: 'retenue' })
  }
  const enTrop = rep.accusations.filter((x) => !accusationsAttendues.some((a) => meme(a, x)))
  details.push({
    libelle: 'Aucune accusation en trop',
    bon: enTrop.length === 0,
    donne: enTrop.join(', ')
  })

  for (const s of saisiesAttendues) {
    const nom = s.type === 'argent' ? 'argent non déclaré' : s.label
    const trouve = rep.saisies.find((x) => x.type === s.type && (s.type === 'argent' || meme(x.label, s.label)))
    details.push({
      libelle: `Saisie : ${s.quantite ?? '?'} × ${nom}`,
      bon: !!trouve && trouve.quantite === s.quantite,
      attendu: String(s.quantite ?? ''),
      donne: trouve ? String(trouve.quantite ?? '') : 'manquant'
    })
  }
  if (saisiesAttendues.length === 0) {
    // Rien à saisir : on ne vérifie que si l'admin a demandé la case « rien d'illégal sur lui ».
    if (att.rienSurLui) details.push({ libelle: 'Rien d’illégal sur lui', bon: rep.rienSurLui && rep.saisies.length === 0 })
  } else {
    const saisiesEnTrop = rep.saisies.filter((x) => !saisiesAttendues.some((s) => s.type === x.type && (s.type === 'argent' || meme(s.label, x.label))))
    details.push({ libelle: 'Aucune saisie en trop', bon: saisiesEnTrop.length === 0, donne: saisiesEnTrop.map((x) => x.label).join(', ') })
  }

  if (att.recherche) details.push({ libelle: 'Avis de recherche vérifié', bon: rep.recherche === att.recherche, attendu: att.recherche })
  if (att.bracelet) details.push({ libelle: 'Bracelet vérifié', bon: rep.bracelet === att.bracelet, attendu: att.bracelet })
  if (att.ppa !== null) {
    details.push({ libelle: 'PPA du suspect', bon: rep.ppa === att.ppa, attendu: att.ppa === 0 ? 'aucun' : `niveau ${att.ppa}` })
  }
  if (att.cooperation) {
    const label = COOPERATION.find((c) => c.key === att.cooperation)?.label ?? att.cooperation
    details.push({ libelle: 'Coopérativité', bon: rep.cooperation === att.cooperation, attendu: label })
  }

  const points = details.filter((d) => d.bon).length
  const total = details.length
  const pourcentage = total ? Math.round((points / total) * 100) : 0

  return {
    scenarioId: scenario.id,
    titre: scenario.titre,
    niveau: scenario.niveau,
    date: new Date().toISOString(),
    dureeSecondes,
    points,
    total,
    pourcentage,
    valide: pourcentage >= SEUIL_REUSSITE,
    details,
    rapport: rep.rapport.trim()
  }
}

export function nouveauScenario(niveau: 1 | 2 | 3): FormationScenario {
  return {
    id: uid(),
    titre: 'Nouveau scénario',
    niveau,
    resume: '',
    contexte: '',
    surLui: '',
    screens: [],
    questions: [],
    attendu: { accusations: [], saisies: [], rienSurLui: false, recherche: null, bracelet: null, ppa: null, cooperation: null },
    actif: true
  }
}
