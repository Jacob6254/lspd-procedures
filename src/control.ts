import { create } from 'zustand'
import type { AgentSummary } from '@shared/types'
import { api, setControl } from './api'
import { flushNow, useStore } from './store'

interface ControlState {
  agent: AgentSummary | null
  busy: boolean
  prendre(agent: AgentSummary): Promise<void>
  rendre(): Promise<void>
}

/** Prise en main : l'admin travaille dans le dossier d'un agent, qui voit tout arriver en direct. */
export const useControl = create<ControlState>((set, get) => ({
  agent: null,
  busy: false,

  async prendre(agent) {
    if (get().busy) return
    set({ busy: true })
    const st = useStore.getState()
    try {
      await flushNow().catch(() => undefined)
      setControl(agent.id)
      st.replaceDb(await api.loadDb())
      st.go({ page: 'accueil' })
      set({ agent })
      st.toast('ok', `Tu remplis maintenant le dossier de ${agent.username}.`)
    } catch (err) {
      setControl(get().agent?.id ?? null)
      st.toast('error', err instanceof Error ? err.message : 'Prise en main impossible')
    } finally {
      set({ busy: false })
    }
  },

  async rendre() {
    if (get().busy) return
    set({ busy: true })
    const st = useStore.getState()
    try {
      await flushNow().catch(() => undefined)
      setControl(null)
      st.replaceDb(await api.loadDb())
      st.go({ page: 'supervision' })
      set({ agent: null })
      st.toast('ok', 'Tu es revenu sur tes propres dossiers.')
    } finally {
      set({ busy: false })
    }
  }
}))
