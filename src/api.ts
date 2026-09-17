import type { AccountInfo, AgentSummary, Db, ImageRef, Me, SupervisionNote, WeaponData } from '@shared/types'

export class ApiError extends Error {
  constructor(
    message: string,
    readonly status: number
  ) {
    super(message)
  }
}

// Quand l'admin prend la main, toutes les requêtes visent le dossier de cet agent.
let control: string | null = null
export function setControl(agentId: string | null): void {
  control = agentId
}
export function controlId(): string | null {
  return control
}
const base = () => (control ? `/admin/agents/${control}` : '')

// Appelé quand le serveur répond « non connecté » (session expirée…).
let onUnauthorized: () => void = () => undefined
export function setUnauthorizedHandler(fn: () => void): void {
  onUnauthorized = fn
}

async function request<T>(method: string, path: string, body?: unknown, raw?: Blob | ArrayBuffer): Promise<T> {
  const headers: Record<string, string> = { 'x-lspd': '1' }
  let payload: BodyInit | undefined
  if (raw) {
    headers['content-type'] = 'application/octet-stream'
    payload = raw
  } else if (body !== undefined) {
    headers['content-type'] = 'application/json'
    payload = JSON.stringify(body)
  }
  let res: Response
  try {
    res = await fetch(`/api${path}`, { method, headers, body: payload, credentials: 'same-origin' })
  } catch {
    throw new ApiError('Serveur injoignable. Vérifie ta connexion.', 0)
  }
  if (res.status === 401 && path !== '/login' && path !== '/me/password') onUnauthorized()
  const data = res.headers.get('content-type')?.includes('json') ? await res.json() : null
  if (!res.ok) throw new ApiError(data?.error ?? `Erreur ${res.status}`, res.status)
  return data as T
}

export function imgUrl(file: string): string {
  return control ? adminImgUrl(control, file) : `/api/images/${encodeURIComponent(file)}`
}

/** Image d'un autre agent, vue depuis la supervision. */
export function adminImgUrl(agentId: string, file: string): string {
  return `/api/admin/agents/${agentId}/images/${encodeURIComponent(file)}`
}

async function pngBlob(file: string): Promise<Blob> {
  const blob = await (await fetch(imgUrl(file), { credentials: 'same-origin' })).blob()
  if (blob.type === 'image/png') return blob
  const bitmap = await createImageBitmap(blob)
  const canvas = document.createElement('canvas')
  canvas.width = bitmap.width
  canvas.height = bitmap.height
  canvas.getContext('2d')!.drawImage(bitmap, 0, 0)
  return new Promise((ok, fail) => canvas.toBlob((b) => (b ? ok(b) : fail(new Error('Conversion impossible'))), 'image/png'))
}

export const api = {
  status: () => request<{ setup: boolean; me: Me | null }>('GET', '/status'),
  setup: (username: string, password: string) => request<Me>('POST', '/setup', { username, password }),
  login: (username: string, password: string) => request<Me>('POST', '/login', { username, password }),
  logout: () => request<{ ok: true }>('POST', '/logout', {}),
  changePassword: (current: string, password: string) => request<{ ok: true }>('POST', '/me/password', { current, password }),

  listAccounts: () => request<AccountInfo[]>('GET', '/accounts'),
  createAccount: (username: string, password: string, role: 'admin' | 'user') =>
    request<AccountInfo>('POST', '/accounts', { username, password, role }),
  resetPassword: (id: string, password: string) => request<{ ok: true }>('PUT', `/accounts/${id}/password`, { password }),
  deleteAccount: (id: string) => request<{ ok: true }>('DELETE', `/accounts/${id}`),

  loadDb: () => request<Db | null>('GET', `${base()}/db`),
  saveDb: (db: Db, rev: number) => request<{ rev: number }>('PUT', `${base()}/db`, { db, rev }),
  dbState: () => request<{ rev: number }>('GET', `${base()}/db/etat`),

  saveImage: (data: Blob) => request<ImageRef>('POST', `${base()}/images`, undefined, data),
  deleteImage: (file: string) => request<{ ok: true }>('DELETE', `${base()}/images/${encodeURIComponent(file)}`),

  async copyImage(file: string): Promise<void> {
    await navigator.clipboard.write([new ClipboardItem({ 'image/png': pngBlob(file) })])
  },

  downloadImage(file: string): void {
    const a = document.createElement('a')
    a.href = imgUrl(file)
    a.download = file
    a.click()
  },

  copyText: (text: string) => navigator.clipboard.writeText(text),

  adminAgents: () => request<AgentSummary[]>('GET', '/admin/agents'),
  adminDb: (id: string) => request<Db | null>('GET', `/admin/agents/${id}/db`),
  adminSendNote: (id: string, note: { text: string; interventionId?: string; suspectId?: string }) =>
    request<SupervisionNote>('POST', `/admin/agents/${id}/notes`, note),

  notes: () => request<SupervisionNote[]>('GET', '/notes'),
  markNotesRead: (ids: string[]) => request<{ ok: true }>('POST', '/notes/lu', { ids }),

  getWeapons: (refresh: boolean) =>
    request<{ data: WeaponData; source: 'live' | 'cache' | 'bundled' }>('GET', `/weapons${refresh ? '?refresh=1' : ''}`)
}
