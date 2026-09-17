import { useEffect } from 'react'
import { create } from 'zustand'
import type { Suspect, Weapon, WeaponData } from '@shared/types'
import { normalize } from './lib/format'
import { api } from './api'

interface WeaponState {
  data: WeaponData | null
  source: 'live' | 'cache' | 'bundled' | null
  loading: boolean
  byId: Map<string, Weapon>
  load(refresh?: boolean): Promise<void>
}

export const useWeapons = create<WeaponState>((set, get) => ({
  data: null,
  source: null,
  loading: false,
  byId: new Map(),
  async load(refresh = false) {
    if (get().loading) return
    set({ loading: true })
    try {
      const { data, source } = await api.getWeapons(refresh)
      set({ data, source, byId: new Map(data.weapons.map((w) => [w.id, w])) })
    } catch {
      // Réessaie au prochain affichage d'une page qui en a besoin.
    } finally {
      set({ loading: false })
    }
  }
}))

export function useWeaponsLoaded(): WeaponState {
  const state = useWeapons()
  useEffect(() => {
    const st = useWeapons.getState()
    if (!st.data && !st.loading) void st.load()
  }, [])
  return state
}

export function searchWeapons(weapons: Weapon[], query: string, categories?: string[]): Weapon[] {
  const q = normalize(query)
  if (!q) return []
  const words = q.split(/\s+/)
  return weapons
    .filter((w) => (!categories || categories.includes(w.category)) && words.every((word) => normalize(w.name).includes(word)))
    .sort((a, b) => {
      const an = normalize(a.name).startsWith(q) ? 0 : 1
      const bn = normalize(b.name).startsWith(q) ? 0 : 1
      return an - bn || a.name.localeCompare(b.name)
    })
    .slice(0, 12)
}

export type Legality =
  | { kind: 'legal' }
  | { kind: 'illegal' }
  | { kind: 'ppa-unknown'; level: number }
  | { kind: 'ppa-missing'; level: number; has: number }
  | { kind: 'ppa-ok'; level: number; has: number }

/** Statut d'une arme du répertoire pour ce suspect (les PPA s'obtiennent dans l'ordre, niv. 3 couvre donc 1 et 2). */
export function legalityFor(w: Weapon, suspect: Pick<Suspect, 'ppa'>): Legality {
  if (w.status === 'legal') return { kind: 'legal' }
  if (w.status === 'illegal') return { kind: 'illegal' }
  const level = w.ppa ?? 1
  if (suspect.ppa === null) return { kind: 'ppa-unknown', level }
  return suspect.ppa >= level ? { kind: 'ppa-ok', level, has: suspect.ppa } : { kind: 'ppa-missing', level, has: suspect.ppa }
}

export function legalityLabel(l: Legality): string {
  switch (l.kind) {
    case 'legal':
      return 'Légale'
    case 'illegal':
      return 'Illégale'
    case 'ppa-unknown':
      return `PPA niv. ${l.level} requis`
    case 'ppa-missing':
      return l.has === 0 ? `Sans PPA (niv. ${l.level} requis)` : `PPA insuffisant (niv. ${l.level} requis)`
    case 'ppa-ok':
      return `Couverte par son PPA niv. ${l.has}`
  }
}

export function legalityTone(l: Legality): 'green' | 'red' | 'amber' {
  if (l.kind === 'legal' || l.kind === 'ppa-ok') return 'green'
  if (l.kind === 'ppa-unknown') return 'amber'
  return 'red'
}

export function statusLabel(w: Weapon): string {
  if (w.status === 'legal') return 'Légal'
  if (w.status === 'illegal') return 'Illégal'
  return `PPA niv. ${w.ppa ?? '?'}`
}
