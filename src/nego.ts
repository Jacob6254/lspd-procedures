import { create } from 'zustand'
import type { NegoExamen, NegoSession } from '@shared/nego'
import type { Me } from '@shared/types'
import { niveauGrade } from '@shared/grades'
import { api } from './api'
import { useStore } from './store'

interface NegoState {
  examen: NegoExamen | null
  session: NegoSession | null
  pret: boolean
  envoi: boolean
  erreur: string
  charger(): Promise<void>
  demarrer(): Promise<void>
  choisir(questionId: string, optionId: string, unique: boolean): void
  rendre(): Promise<void>
  fermerRecap(): void
}

let envoiEnAttente: ReturnType<typeof setTimeout> | null = null

export const useNego = create<NegoState>((set, get) => ({
  examen: null,
  session: null,
  pret: false,
  envoi: false,
  erreur: '',

  async charger() {
    try {
      const [examen, session] = await Promise.all([api.negoExamen(), api.negoMaSession()])
      set({ examen, session, pret: true, erreur: '' })
    } catch (err) {
      set({ pret: true, erreur: err instanceof Error ? err.message : 'Chargement impossible' })
    }
  },

  async demarrer() {
    const session = await api.negoDemarrer()
    set({ session, erreur: '' })
  },

  choisir(questionId, optionId, unique) {
    const session = get().session
    if (!session || session.rendu) return
    const actuel = session.reponses[questionId] ?? []
    const suite = unique
      ? actuel.includes(optionId)
        ? []
        : [optionId]
      : actuel.includes(optionId)
        ? actuel.filter((x) => x !== optionId)
        : [...actuel, optionId]
    const reponses = { ...session.reponses, [questionId]: suite }
    set({ session: { ...session, reponses } })

    // Le formateur suit en direct : on pousse les réponses sans attendre.
    if (envoiEnAttente) clearTimeout(envoiEnAttente)
    envoiEnAttente = setTimeout(() => {
      const s = get().session
      if (!s || s.rendu) return
      set({ envoi: true })
      api
        .negoReponses(s.id, s.reponses)
        .catch(() => set({ erreur: 'Tes dernières réponses n’ont pas été envoyées. Vérifie ta connexion.' }))
        .finally(() => set({ envoi: false }))
    }, 500)
  },

  async rendre() {
    const s = get().session
    if (!s) return
    if (envoiEnAttente) clearTimeout(envoiEnAttente)
    await api.negoReponses(s.id, s.reponses).catch(() => undefined)
    set({ session: await api.negoRendre(s.id) })
    // On sort de l’examen sur la page de la formation, pas sur la dernière page ouverte.
    useStore.getState().go({ page: 'nego' })
  },

  fermerRecap() {
    set({ session: null })
  }
}))

/** L'examen bloque le reste du site tant que la copie n'est pas rendue. */
export function examenEnCours(session: NegoSession | null): boolean {
  return !!session && !session.rendu
}

/** Formateurs et admins gèrent les sessions. */
export function estFormateurNego(me: Me | null): boolean {
  return !!me && (me.role === 'admin' || me.leadNego)
}

/** Le mémo est réservé aux négociateurs et aux gradés qui les encadrent. */
export function accesMemoNego(me: Me | null): boolean {
  if (!me) return false
  return me.role === 'admin' || me.leadNego || me.negoAdmis || niveauGrade(me.grade) >= niveauGrade('Sergent 1')
}
