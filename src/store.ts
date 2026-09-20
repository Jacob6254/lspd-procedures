import { create } from 'zustand'
import type { Db, ImageRef, Intervention, Settings, Suspect } from '@shared/types'
import { nowHm, todayIso, uid } from './lib/format'
import type { FormationResultat } from '@shared/formation'
import { ApiError, api } from './api'

const deleteImageFile = (file: string) => void api.deleteImage(file).catch(() => undefined)

export type StepKey = 'identite' | 'miranda' | 'fouille' | 'comportement' | 'sanction' | 'rapport' | 'checklist' | 'fiche'
export type SlotKey = 'sceneScreens' | 'photo' | 'identite' | 'fouilleScreens' | 'amendesScreens' | 'casierScreens'
export type SuspectSlot = Exclude<SlotKey, 'sceneScreens'>

export type Route =
  | { page: 'accueil' }
  | { page: 'dossier'; id: string; tab: string; step: StepKey }
  | { page: 'historique' }
  | { page: 'armes' }
  | { page: 'radio' }
  | { page: 'supervision' }
  | { page: 'formation' }
  | { page: 'formation-admin' }
  | { page: 'screens' }
  | { page: 'reglages' }

export interface CaptureTarget {
  interventionId: string
  suspectId: string | null
  slot: SlotKey
}

export interface Toast {
  id: string
  kind: 'ok' | 'error' | 'info'
  text: string
}

export const SLOT_LABELS: Record<SlotKey, string> = {
  sceneScreens: 'Scène',
  photo: 'Photo du suspect',
  identite: "Carte d'identité",
  fouilleScreens: 'Fouille',
  amendesScreens: 'Amendes',
  casierScreens: 'Ajout au casier'
}

export const STEP_DEFAULT_SLOT: Record<StepKey, SuspectSlot> = {
  identite: 'identite',
  miranda: 'fouilleScreens',
  fouille: 'fouilleScreens',
  comportement: 'fouilleScreens',
  sanction: 'amendesScreens',
  rapport: 'amendesScreens',
  checklist: 'amendesScreens',
  fiche: 'amendesScreens'
}

/** Matricule choisi à l'inscription, repris dans les réglages au premier chargement. */
let matriculeInscription = ''
export function setMatriculeInscription(v: string): void {
  matriculeInscription = v
}

export const defaultSettings: Settings = {
  matricule: '',
  nomAgent: '',
  collegues: [],
  rapportCourt: true
}

function emptyDb(): Db {
  return {
    version: 1,
    settings: { ...defaultSettings },
    interventions: [],
    inbox: [],
    learned: { drogues: [], autres: [], accusations: [] }
  }
}

export function newSuspect(): Suspect {
  return {
    id: uid(),
    civilite: 'M',
    prenom: '',
    nom: '',
    naissance: '',
    photo: [],
    identite: [],
    recherche: null,
    bracelet: null,
    ppa: null,
    mirandaLusA: null,
    fouilleScreens: [],
    saisies: [],
    rienSurLui: false,
    cooperation: null,
    comportements: [],
    outrage: false,
    outragePhrase: '',
    menace: false,
    menacePhrase: '',
    accusations: [],
    checklist: [],
    notes: '',
    amendesScreens: [],
    casierScreens: [],
    rapportManuel: null
  }
}

function newIntervention(settings: Settings): Intervention {
  const now = new Date()
  return {
    id: uid(),
    createdAt: now.toISOString(),
    updatedAt: now.toISOString(),
    statut: 'en_cours',
    date: todayIso(now),
    heure: nowHm(now),
    origine: 'appel',
    motif: '',
    lieu: '',
    matricules: settings.matricule ? [settings.matricule] : [],
    constat: '',
    refusObtemperer: false,
    fuitePied: false,
    fuitePiedDuree: '',
    poursuite: false,
    poursuiteDuree: '',
    poursuiteDangereuse: false,
    poursuiteVehicule: '',
    poursuiteVehiculeType: '',
    poursuiteVehiculeCouleur: '',
    poursuiteFin: '',
    tazer: false,
    negociation: '',
    interpellation: '',
    destination: 'poste',
    autres: '',
    sceneScreens: [],
    suspects: [newSuspect()]
  }
}

export function suspectImages(s: Suspect): ImageRef[] {
  return [...s.photo, ...s.identite, ...s.fouilleScreens, ...s.amendesScreens, ...s.casierScreens]
}

export function interventionImages(i: Intervention): ImageRef[] {
  return [...i.sceneScreens, ...i.suspects.flatMap(suspectImages)]
}

export function suspectName(s: Suspect): string {
  const n = `${s.prenom} ${s.nom}`.trim()
  return n || 'Suspect sans nom'
}

export function interventionTitle(i: Intervention): string {
  return i.motif.trim() || 'Intervention sans motif'
}

interface State {
  ready: boolean
  rev: number
  db: Db
  route: Route
  captureTarget: CaptureTarget | null
  toasts: Toast[]
  init(db: Db | null): void
  replaceDb(db: Db | null): void
  go(route: Route): void
  openDossier(id: string, tab?: string, step?: StepKey): void
  createIntervention(): void
  updateIntervention(id: string, fn: (i: Intervention) => Partial<Intervention>): void
  deleteIntervention(id: string): void
  addSuspect(interventionId: string): void
  removeSuspect(interventionId: string, suspectId: string): void
  updateSuspect(interventionId: string, suspectId: string, fn: (s: Suspect) => Partial<Suspect>): void
  addImage(target: CaptureTarget | null, img: ImageRef): string
  removeImage(target: CaptureTarget | 'inbox', imgId: string): void
  moveFromInbox(imgId: string, target: CaptureTarget): void
  updateSettings(patch: Partial<Settings>): void
  ajouterResultatFormation(resultat: FormationResultat): void
  learn(kind: keyof Db['learned'], values: string[]): void
  setCaptureTarget(target: CaptureTarget | null): void
  toast(kind: Toast['kind'], text: string): void
  dismissToast(id: string): void
}

function touch(i: Intervention, patch: Partial<Intervention>): Intervention {
  return { ...i, ...patch, updatedAt: new Date().toISOString() }
}

export function getSlot(i: Intervention, target: CaptureTarget): ImageRef[] | null {
  if (target.slot === 'sceneScreens') return i.sceneScreens
  const s = i.suspects.find((x) => x.id === target.suspectId)
  return s ? s[target.slot] : null
}

export const useStore = create<State>((set, get) => ({
  ready: false,
  rev: 0,
  db: emptyDb(),
  route: { page: 'accueil' },
  captureTarget: null,
  toasts: [],

  init(db) {
    const base = emptyDb()
    const loaded = db
      ? { ...base, ...db, settings: { ...defaultSettings, ...db.settings }, learned: { ...base.learned, ...db.learned } }
      : base
    if (!loaded.settings.matricule && matriculeInscription) loaded.settings = { ...loaded.settings, matricule: matriculeInscription }
    set({ db: loaded, rev: db?.rev ?? 0, ready: true, route: loaded.settings.matricule ? { page: 'accueil' } : { page: 'reglages' } })
  },

  /** Remplace le dossier par celui du serveur (modifié par l'autre personne) sans relancer de sauvegarde. */
  replaceDb(db) {
    const base = emptyDb()
    const loaded = db
      ? { ...base, ...db, settings: { ...defaultSettings, ...db.settings }, learned: { ...base.learned, ...db.learned } }
      : base
    set({ db: loaded, rev: db?.rev ?? 0 })
  },

  go(route) {
    // Hors d'un dossier, les screens vont dans « Screens à trier » et plus dans le dernier dossier ouvert.
    set({ route, ...(route.page === 'dossier' ? {} : { captureTarget: null }) })
    if (route.page === 'dossier') {
      const i = get().db.interventions.find((x) => x.id === route.id)
      if (!i) return
      if (route.tab === 'commun') set({ captureTarget: { interventionId: i.id, suspectId: null, slot: 'sceneScreens' } })
      else set({ captureTarget: { interventionId: i.id, suspectId: route.tab, slot: STEP_DEFAULT_SLOT[route.step] } })
    }
  },

  openDossier(id, tab = 'commun', step = 'identite') {
    get().go({ page: 'dossier', id, tab, step })
  },

  createIntervention() {
    const i = newIntervention(get().db.settings)
    set((st) => ({ db: { ...st.db, interventions: [i, ...st.db.interventions] } }))
    get().openDossier(i.id)
  },

  updateIntervention(id, fn) {
    set((st) => ({
      db: { ...st.db, interventions: st.db.interventions.map((i) => (i.id === id ? touch(i, fn(i)) : i)) }
    }))
  },

  deleteIntervention(id) {
    const i = get().db.interventions.find((x) => x.id === id)
    if (!i) return
    interventionImages(i).forEach((img) => deleteImageFile(img.file))
    set((st) => ({
      db: { ...st.db, interventions: st.db.interventions.filter((x) => x.id !== id) },
      captureTarget: st.captureTarget?.interventionId === id ? null : st.captureTarget,
      route: { page: 'historique' }
    }))
  },

  addSuspect(interventionId) {
    const s = newSuspect()
    get().updateIntervention(interventionId, (i) => ({ suspects: [...i.suspects, s] }))
    get().openDossier(interventionId, s.id, 'identite')
  },

  removeSuspect(interventionId, suspectId) {
    const i = get().db.interventions.find((x) => x.id === interventionId)
    const s = i?.suspects.find((x) => x.id === suspectId)
    if (!i || !s) return
    suspectImages(s).forEach((img) => deleteImageFile(img.file))
    get().updateIntervention(interventionId, (cur) => ({ suspects: cur.suspects.filter((x) => x.id !== suspectId) }))
    get().openDossier(interventionId, 'commun')
  },

  updateSuspect(interventionId, suspectId, fn) {
    get().updateIntervention(interventionId, (i) => ({
      suspects: i.suspects.map((s) => (s.id === suspectId ? { ...s, ...fn(s) } : s))
    }))
  },

  addImage(target, img) {
    const i = target && get().db.interventions.find((x) => x.id === target.interventionId)
    if (!target || !i || !getSlot(i, target)) {
      set((st) => ({ db: { ...st.db, inbox: [img, ...st.db.inbox] } }))
      return 'Screens à trier'
    }
    if (target.slot === 'sceneScreens') {
      get().updateIntervention(i.id, (cur) => ({ sceneScreens: [...cur.sceneScreens, img] }))
    } else {
      const slot = target.slot
      get().updateSuspect(i.id, target.suspectId!, (s) => {
        if (slot === 'photo') {
          s.photo.forEach((old) => deleteImageFile(old.file))
          return { photo: [img] }
        }
        return { [slot]: [...s[slot], img] }
      })
    }
    const s = i.suspects.find((x) => x.id === target.suspectId)
    return s ? `${SLOT_LABELS[target.slot]} · ${suspectName(s)}` : SLOT_LABELS[target.slot]
  },

  removeImage(target, imgId) {
    if (target === 'inbox') {
      const img = get().db.inbox.find((x) => x.id === imgId)
      if (img) deleteImageFile(img.file)
      set((st) => ({ db: { ...st.db, inbox: st.db.inbox.filter((x) => x.id !== imgId) } }))
      return
    }
    const i = get().db.interventions.find((x) => x.id === target.interventionId)
    const img = i && getSlot(i, target)?.find((x) => x.id === imgId)
    if (!i || !img) return
    deleteImageFile(img.file)
    if (target.slot === 'sceneScreens') {
      get().updateIntervention(i.id, (cur) => ({ sceneScreens: cur.sceneScreens.filter((x) => x.id !== imgId) }))
    } else {
      const slot = target.slot
      get().updateSuspect(i.id, target.suspectId!, (s) => ({ [slot]: s[slot].filter((x) => x.id !== imgId) }))
    }
  },

  moveFromInbox(imgId, target) {
    const img = get().db.inbox.find((x) => x.id === imgId)
    if (!img) return
    set((st) => ({ db: { ...st.db, inbox: st.db.inbox.filter((x) => x.id !== imgId) } }))
    get().addImage(target, img)
  },

  updateSettings(patch) {
    set((st) => ({ db: { ...st.db, settings: { ...st.db.settings, ...patch } } }))
  },

  ajouterResultatFormation(resultat) {
    set((st) => ({ db: { ...st.db, formations: [...(st.db.formations ?? []), resultat].slice(-50) } }))
  },

  learn(kind, values) {
    const cleaned = values.map((v) => v.trim()).filter(Boolean)
    if (!cleaned.length) return
    set((st) => {
      const current = st.db.learned[kind]
      const next = [...cleaned, ...current.filter((c) => !cleaned.some((v) => v.toLowerCase() === c.toLowerCase()))]
      return { db: { ...st.db, learned: { ...st.db.learned, [kind]: next.slice(0, 200) } } }
    })
  },

  setCaptureTarget(target) {
    set({ captureTarget: target })
  },

  toast(kind, text) {
    const id = uid()
    set((st) => ({ toasts: [...st.toasts, { id, kind, text }] }))
    setTimeout(() => get().dismissToast(id), 3500)
  },

  dismissToast(id) {
    set((st) => ({ toasts: st.toasts.filter((t) => t.id !== id) }))
  }
}))

// Sauvegarde automatique : chaque changement est envoyé au serveur peu après.
export const useSaveStatus = create<{ state: 'idle' | 'saving' | 'error' }>(() => ({ state: 'idle' }))

let saveTimer: ReturnType<typeof setTimeout> | null = null
let pending: Db | null = null
let chain: Promise<void> = Promise.resolve()

export function hasUnsavedChanges(): boolean {
  return pending !== null || useSaveStatus.getState().state !== 'idle'
}

export function flushNow(): Promise<void> {
  return flush()
}

function flush(): Promise<void> {
  if (saveTimer) clearTimeout(saveTimer)
  saveTimer = null
  chain = chain.then(async () => {
    if (!pending) return
    const db = pending
    pending = null
    useSaveStatus.setState({ state: 'saving' })
    try {
      const { rev } = await api.saveDb(db, useStore.getState().rev)
      useStore.setState({ rev })
      useSaveStatus.setState({ state: pending ? 'saving' : 'idle' })
    } catch (err) {
      if (err instanceof ApiError && err.status === 409) {
        // Quelqu'un d'autre a modifié le dossier : on reprend sa version.
        const fresh = await api.loadDb().catch(() => null)
        useStore.getState().replaceDb(fresh)
        useStore.getState().toast('info', 'Dossier rechargé : il a été modifié de l’autre côté.')
        useSaveStatus.setState({ state: 'idle' })
        return
      }
      // On garde la version la plus récente et on réessaie un peu plus tard.
      pending ??= db
      useSaveStatus.setState({ state: 'error' })
      saveTimer = setTimeout(() => void flush(), 5000)
    }
  })
  return chain
}

useStore.subscribe((state, prev) => {
  // Une modification venue du serveur change aussi la révision : on ne la renvoie pas.
  if (!state.ready || state.db === prev.db || state.rev !== prev.rev) return
  pending = state.db
  if (saveTimer) clearTimeout(saveTimer)
  saveTimer = setTimeout(() => void flush(), 400)
})

window.addEventListener('beforeunload', (e) => {
  if (!hasUnsavedChanges()) return
  void flush()
  e.preventDefault()
})
