import { create } from 'zustand'
import type { Db, ImageRef, Intervention, Settings, Suspect } from '@shared/types'
import type { NegoEchange, NegoOtage, NegoVehicule, Negociation } from '@shared/negociation'
import { nowHm, todayIso, uid } from './lib/format'
import { ApiError, api } from './api'

const deleteImageFile = (file: string) => void api.deleteImage(file).catch(() => undefined)

export type StepKey = 'identite' | 'miranda' | 'fouille' | 'comportement' | 'rapport' | 'fiche'
/** Les seuls screens encore demandés : la carte d'identité et l'inventaire, plus ceux de la négociation. */
export type SlotKey = 'identite' | 'fouilleScreens' | 'negoSuspects' | 'negoVehicule' | 'negoOtage'
export type SuspectSlot = 'identite' | 'fouilleScreens'

export type Route =
  | { page: 'accueil' }
  | { page: 'dossier'; id: string; tab: string; step: StepKey }
  | { page: 'historique' }
  | { page: 'armes' }
  | { page: 'radio' }
  | { page: 'supervision' }
  | { page: 'negociations' }
  | { page: 'negociation'; id: string }
  | { page: 'nego-guide' }
  | { page: 'reglages' }

export interface CaptureTarget {
  /** Dossier d'intervention ou négociation. */
  dossierId: string
  /** Suspect, véhicule ou otage concerné. */
  sousId: string | null
  slot: SlotKey
}

export interface Toast {
  id: string
  kind: 'ok' | 'error' | 'info'
  text: string
}

export const SLOT_LABELS: Record<SlotKey, string> = {
  identite: "Carte d'identité",
  fouilleScreens: 'Inventaire',
  negoSuspects: 'Photos des suspects',
  negoVehicule: 'Plaque du véhicule',
  negoOtage: "Carte d'identité de l'otage"
}

export const STEP_DEFAULT_SLOT: Record<StepKey, SuspectSlot> = {
  identite: 'identite',
  miranda: 'fouilleScreens',
  fouille: 'fouilleScreens',
  comportement: 'fouilleScreens',
  rapport: 'fouilleScreens',
  fiche: 'fouilleScreens'
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
  rapportCourt: true,
  sexe: 'H',
  nom: '',
  prenom: '',
  grade: '',
  specialisation: '',
  unitCode: '20-S',
  nmrJustice: '1293',
  nmrRoom: '0001',
  prochainCase: 1
}

function emptyDb(): Db {
  return {
    version: 1,
    settings: { ...defaultSettings },
    interventions: [],
    negociations: [],
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
    interpellationMoyen: '',
    interpellationLieu: '',
    sommations: false,
    resistance: false,
    armeSortie: false,
    blesse: false,
    fouilleSurPlace: false,
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
  removeImage(target: CaptureTarget, imgId: string): void
  createNegociation(): void
  updateNegociation(id: string, fn: (n: Negociation) => Partial<Negociation>): void
  deleteNegociation(id: string): void
  addVehicule(negoId: string): void
  removeVehicule(negoId: string, vehiculeId: string): void
  addOtage(negoId: string): void
  removeOtage(negoId: string, otageId: string): void
  addEchange(negoId: string): void
  removeEchange(negoId: string, echangeId: string): void
  updateSettings(patch: Partial<Settings>): void
  learn(kind: keyof Db['learned'], values: string[]): void
  setCaptureTarget(target: CaptureTarget | null): void
  toast(kind: Toast['kind'], text: string): void
  dismissToast(id: string): void
}

function touch(i: Intervention, patch: Partial<Intervention>): Intervention {
  return { ...i, ...patch, updatedAt: new Date().toISOString() }
}

export function getSlot(i: Intervention, target: CaptureTarget): ImageRef[] | null {
  if (target.slot !== 'identite' && target.slot !== 'fouilleScreens') return null
  const s = i.suspects.find((x) => x.id === target.sousId)
  return s ? s[target.slot] : null
}

export function negociationImages(n: Negociation): ImageRef[] {
  return [...n.photosSuspects, ...n.vehicules.flatMap((v) => v.photos), ...n.otages.flatMap((o) => o.identite)]
}

export function negociationTitre(n: Negociation): string {
  return n.lieu.trim() || n.typeLieu || 'Négociation sans lieu'
}

export function nouvelleNegociation(settings: Settings): Negociation {
  const now = new Date()
  return {
    id: uid(),
    createdAt: now.toISOString(),
    updatedAt: now.toISOString(),
    statut: 'en_cours',
    date: todayIso(now),
    heure: nowHm(now),
    typeLieu: '',
    lieu: '',
    braqueurs: null,
    otagesAnnonces: null,
    agents: settings.matricule ? [settings.matricule] : [],
    negociateur: settings.matricule ?? '',
    relayeur: '',
    perimetre: false,
    offRadio: false,
    vehicules: [],
    photosSuspects: [],
    otages: [],
    echanges: [],
    demandesAtypiques: '',
    armeUtilisee: false,
    armeMotifs: [],
    armeDetail: '',
    deroulement: '',
    finType: 'enfuis',
    finArretes: null,
    finDetail: '',
    poursuite: true,
    resume: ''
  }
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
    // En quittant un dossier, on oublie la zone visée pour ne pas y envoyer un screen par erreur.
    set({ route, ...(route.page === 'dossier' ? {} : { captureTarget: null }) })
    if (route.page === 'dossier') {
      const i = get().db.interventions.find((x) => x.id === route.id)
      if (!i || route.tab === 'commun') return
      set({ captureTarget: { dossierId: i.id, sousId: route.tab, slot: STEP_DEFAULT_SLOT[route.step] } })
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
      captureTarget: st.captureTarget?.dossierId === id ? null : st.captureTarget,
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
    if (!target) {
      deleteImageFile(img.file)
      get().toast('error', 'Clique d’abord sur la zone où doit aller le screen.')
      return ''
    }
    if (target.slot === 'identite' || target.slot === 'fouilleScreens') {
      const slot = target.slot
      const i = get().db.interventions.find((x) => x.id === target.dossierId)
      if (!i || !getSlot(i, target)) return ''
      get().updateSuspect(i.id, target.sousId!, (s) => ({ [slot]: [...s[slot], img] }))
      const s = i.suspects.find((x) => x.id === target.sousId)
      return s ? `${SLOT_LABELS[slot]} · ${suspectName(s)}` : SLOT_LABELS[slot]
    }
    // Négociation : photos des suspects, plaques et cartes d'identité des otages.
    const n = get().db.negociations?.find((x) => x.id === target.dossierId)
    if (!n) return ''
    if (target.slot === 'negoSuspects') {
      get().updateNegociation(n.id, (cur) => ({ photosSuspects: [...cur.photosSuspects, img] }))
    } else if (target.slot === 'negoVehicule') {
      get().updateNegociation(n.id, (cur) => ({
        vehicules: cur.vehicules.map((v) => (v.id === target.sousId ? { ...v, photos: [...v.photos, img] } : v))
      }))
    } else {
      get().updateNegociation(n.id, (cur) => ({
        otages: cur.otages.map((o) => (o.id === target.sousId ? { ...o, identite: [...o.identite, img] } : o))
      }))
    }
    return SLOT_LABELS[target.slot]
  },

  removeImage(target, imgId) {
    if (target.slot === 'identite' || target.slot === 'fouilleScreens') {
      const slot = target.slot
      const i = get().db.interventions.find((x) => x.id === target.dossierId)
      const s = i?.suspects.find((x) => x.id === target.sousId)
      const img = s?.[slot].find((x) => x.id === imgId)
      if (!img) return
      deleteImageFile(img.file)
      get().updateSuspect(target.dossierId, target.sousId!, (cur) => ({ [slot]: cur[slot].filter((x) => x.id !== imgId) }))
      return
    }
    const n = get().db.negociations?.find((x) => x.id === target.dossierId)
    if (!n) return
    const img = negociationImages(n).find((x) => x.id === imgId)
    if (img) deleteImageFile(img.file)
    if (target.slot === 'negoSuspects') {
      get().updateNegociation(target.dossierId, (cur) => ({ photosSuspects: cur.photosSuspects.filter((x) => x.id !== imgId) }))
    } else if (target.slot === 'negoVehicule') {
      get().updateNegociation(target.dossierId, (cur) => ({
        vehicules: cur.vehicules.map((v) => (v.id === target.sousId ? { ...v, photos: v.photos.filter((x) => x.id !== imgId) } : v))
      }))
    } else {
      get().updateNegociation(target.dossierId, (cur) => ({
        otages: cur.otages.map((o) => (o.id === target.sousId ? { ...o, identite: o.identite.filter((x) => x.id !== imgId) } : o))
      }))
    }
  },

  // ---------- Négociations ----------

  createNegociation() {
    const n = nouvelleNegociation(get().db.settings)
    set((st) => ({ db: { ...st.db, negociations: [n, ...(st.db.negociations ?? [])] } }))
    get().go({ page: 'negociation', id: n.id })
  },

  updateNegociation(id, fn) {
    set((st) => ({
      db: {
        ...st.db,
        negociations: (st.db.negociations ?? []).map((n) => (n.id === id ? { ...n, ...fn(n), updatedAt: new Date().toISOString() } : n))
      }
    }))
  },

  deleteNegociation(id) {
    const n = get().db.negociations?.find((x) => x.id === id)
    if (n) negociationImages(n).forEach((img) => deleteImageFile(img.file))
    set((st) => ({
      db: { ...st.db, negociations: (st.db.negociations ?? []).filter((x) => x.id !== id) },
      captureTarget: st.captureTarget?.dossierId === id ? null : st.captureTarget,
      route: { page: 'negociations' }
    }))
  },

  addVehicule(negoId) {
    const v: NegoVehicule = { id: uid(), plaque: '', description: '', photos: [] }
    get().updateNegociation(negoId, (n) => ({ vehicules: [...n.vehicules, v] }))
  },

  removeVehicule(negoId, vehiculeId) {
    const n = get().db.negociations?.find((x) => x.id === negoId)
    n?.vehicules.find((v) => v.id === vehiculeId)?.photos.forEach((img) => deleteImageFile(img.file))
    get().updateNegociation(negoId, (cur) => ({ vehicules: cur.vehicules.filter((v) => v.id !== vehiculeId) }))
  },

  addOtage(negoId) {
    const o: NegoOtage = { id: uid(), nom: '', recherche: null, arrete: false, identite: [], note: '' }
    get().updateNegociation(negoId, (n) => ({ otages: [...n.otages, o] }))
  },

  removeOtage(negoId, otageId) {
    const n = get().db.negociations?.find((x) => x.id === negoId)
    n?.otages.find((o) => o.id === otageId)?.identite.forEach((img) => deleteImageFile(img.file))
    get().updateNegociation(negoId, (cur) => ({ otages: cur.otages.filter((o) => o.id !== otageId) }))
  },

  addEchange(negoId) {
    const e: NegoEchange = { id: uid(), revendication: '', contrepartie: '1 otage libéré' }
    get().updateNegociation(negoId, (n) => ({ echanges: [...n.echanges, e] }))
  },

  removeEchange(negoId, echangeId) {
    get().updateNegociation(negoId, (cur) => ({ echanges: cur.echanges.filter((e) => e.id !== echangeId) }))
  },

  updateSettings(patch) {
    set((st) => ({ db: { ...st.db, settings: { ...st.db.settings, ...patch } } }))
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
