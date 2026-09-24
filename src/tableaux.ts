import { create } from 'zustand'
import type { BaseTableau } from '@shared/plan'
import { api } from './api'
import { useStore } from './store'

/**
 * Le rangement des deux nouveaux modules. Ils ont leur propre magasin et leurs
 * propres fichiers côté serveur : rien ici ne touche au dossier d'intervention.
 */

export interface MagasinTableaux<T extends BaseTableau> {
  etat: 'vide' | 'chargement' | 'pret' | 'erreur'
  erreur: string
  /** Les miens, modifiables. */
  mes: T[]
  /** Ceux que les autres ont publiés au poste : lecture seule. */
  poste: T[]
  charger(force?: boolean): Promise<void>
  creer(t: T): Promise<T>
  modifier(id: string, patch: (t: T) => T): void
  supprimer(id: string): Promise<void>
  trouver(id: string): T | null
}

/** Une sauvegarde par tableau, regroupée pour ne pas écrire à chaque frappe. */
const minuteries = new Map<string, ReturnType<typeof setTimeout>>()

export function creerMagasin<T extends BaseTableau>(quoi: 'operations' | 'enquetes') {
  return create<MagasinTableaux<T>>((set, get) => {
    const enregistrer = (t: T) => {
      const cle = `${quoi}:${t.id}`
      clearTimeout(minuteries.get(cle))
      minuteries.set(
        cle,
        setTimeout(() => {
          minuteries.delete(cle)
          const frais = get().mes.find((x) => x.id === t.id)
          if (!frais) return
          api.enregistrerTableau(quoi, frais).catch(() => {
            useStore.getState().toast('error', 'Enregistrement impossible, nouvel essai à la prochaine modification.')
          })
        }, 600)
      )
    }

    return {
      etat: 'vide',
      erreur: '',
      mes: [],
      poste: [],

      async charger(force = false) {
        if (!force && (get().etat === 'pret' || get().etat === 'chargement')) return
        set({ etat: 'chargement', erreur: '' })
        try {
          const [mes, poste] = await Promise.all([api.listeTableaux<T>(quoi), api.tableauxPoste<T>(quoi)])
          set({ mes, poste, etat: 'pret' })
        } catch (err) {
          set({ etat: 'erreur', erreur: err instanceof Error ? err.message : 'Chargement impossible' })
        }
      },

      async creer(t: T) {
        set((s) => ({ mes: [t, ...s.mes] }))
        try {
          const enregistre = await api.enregistrerTableau(quoi, t)
          set((s) => ({ mes: s.mes.map((x) => (x.id === t.id ? { ...x, ...enregistre } : x)) }))
          return enregistre
        } catch {
          useStore.getState().toast('error', 'Création impossible, vérifie ta connexion.')
          set((s) => ({ mes: s.mes.filter((x) => x.id !== t.id) }))
          throw new Error('Création impossible')
        }
      },

      modifier(id, patch) {
        let modifie: T | null = null
        set((s) => ({
          mes: s.mes.map((x) => {
            if (x.id !== id) return x
            modifie = { ...patch(x), maj: new Date().toISOString() }
            return modifie
          })
        }))
        if (modifie) enregistrer(modifie)
      },

      async supprimer(id) {
        clearTimeout(minuteries.get(`${quoi}:${id}`))
        const avant = get().mes
        set({ mes: avant.filter((x) => x.id !== id) })
        try {
          await api.supprimerTableau(quoi, id)
        } catch {
          useStore.getState().toast('error', 'Suppression impossible.')
          set({ mes: avant })
        }
      },

      trouver(id) {
        return get().mes.find((x) => x.id === id) ?? get().poste.find((x) => x.id === id) ?? null
      }
    }
  })
}

/** Le nom affiché de l'agent, repris des réglages. */
export function nomAuteur(): string {
  const s = useStore.getState().db.settings
  const nom = `${s.prenom ?? ''} ${s.nom ?? ''}`.trim() || s.nomAgent || ''
  const grade = s.grade?.trim() ?? ''
  return [grade, nom].filter(Boolean).join(' ') || 'Agent'
}
