import { create } from 'zustand'
import type { Me, ModeInscription } from '@shared/types'
import { api, setUnauthorizedHandler } from './api'
import { flushNow } from './store'

interface AuthState {
  status: 'loading' | 'setup' | 'login' | 'ready' | 'offline'
  me: Me | null
  inscription: ModeInscription
  expired: boolean
  check(): Promise<void>
  loggedIn(me: Me): boolean
  logout(): Promise<void>
}

export const useAuth = create<AuthState>((set, get) => ({
  status: 'loading',
  me: null,
  inscription: 'ferme',
  expired: false,

  async check() {
    try {
      const s = await api.status()
      set({ inscription: s.inscription })
      if (s.setup) set({ status: 'setup', me: null })
      else if (!s.me) set({ status: 'login', me: null })
      else set({ status: 'ready', me: s.me })
    } catch {
      set({ status: 'offline' })
    }
  },

  /** Retourne false si un autre compte se connecte : il faut alors recharger la page. */
  loggedIn(me) {
    const previous = get().me
    if (previous && previous.id !== me.id) {
      location.reload()
      return false
    }
    set({ status: 'ready', me, expired: false })
    return true
  },

  async logout() {
    await flushNow().catch(() => undefined)
    await api.logout().catch(() => undefined)
    location.reload()
  }
}))

setUnauthorizedHandler(() => {
  const { status } = useAuth.getState()
  if (status === 'ready') useAuth.setState({ status: 'login', expired: true })
})
