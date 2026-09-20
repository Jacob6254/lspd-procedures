import express, { type NextFunction, type Request, type Response } from 'express'
import { createHmac, randomBytes, randomUUID, scrypt, timingSafeEqual } from 'node:crypto'
import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs'
import { mkdir, readFile, rename, rm, unlink, writeFile } from 'node:fs/promises'
import { dirname, join, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import type { AccountInfo, AgentSummary, ConfigInscription, Db, ImageRef, Me, ModeInscription, SupervisionNote, WeaponData } from '../shared/types'
import type { FormationScenario } from '../shared/formation'
import { GRADES, GRADE_DEFAUT } from '../shared/grades'
import { FORMATIONS_DEFAUT } from './formations-default'

const PORT = Number(process.env.PORT ?? 3000)
const DATA_DIR = resolve(process.env.DATA_DIR ?? 'data')
const STATIC_DIR = resolve(process.env.STATIC_DIR ?? 'dist')
const HERE = dirname(fileURLToPath(import.meta.url))
const FALLBACK_WEAPONS = resolve(HERE, '../server/weapons-fallback.json')
const WEAPONS_API = 'https://xn--rpertoirearmesrp-bqb.fr/api'
const WEAPONS_TTL_MS = 6 * 60 * 60 * 1000
const COOKIE = 'lspd_session'
const SESSION_MS = 30 * 24 * 60 * 60 * 1000
const IMAGE_NAME = /^[0-9a-f-]{36}\.(png|jpg|webp|gif)$/

mkdirSync(join(DATA_DIR, 'users'), { recursive: true })

// ---------- Secret de signature des sessions ----------

const secretFile = join(DATA_DIR, 'secret.key')
if (!existsSync(secretFile)) writeFileSync(secretFile, randomBytes(32).toString('hex'), { mode: 0o600 })
const SECRET = readFileSync(secretFile, 'utf8').trim()

// ---------- Comptes ----------

interface Account {
  id: string
  username: string
  role: 'admin' | 'user'
  grade?: string
  leadNego?: boolean
  salt: string
  hash: string
  tokenVersion: number
  createdAt: string
}

const accountsFile = join(DATA_DIR, 'accounts.json')
let accounts: Account[] = existsSync(accountsFile) ? JSON.parse(readFileSync(accountsFile, 'utf8')) : []

async function writeJsonAtomic(path: string, value: unknown): Promise<void> {
  const tmp = `${path}.${randomUUID()}.tmp`
  await writeFile(tmp, JSON.stringify(value), 'utf8')
  await rename(tmp, path)
}

const saveAccounts = () => writeJsonAtomic(accountsFile, accounts)

function scryptHash(password: string, salt: string): Promise<Buffer> {
  return new Promise((ok, fail) => scrypt(password, salt, 64, (err, key) => (err ? fail(err) : ok(key))))
}

async function hashPassword(password: string): Promise<{ salt: string; hash: string }> {
  const salt = randomBytes(16).toString('hex')
  return { salt, hash: (await scryptHash(password, salt)).toString('hex') }
}

async function checkPassword(password: string, acc: Account): Promise<boolean> {
  const got = await scryptHash(password, acc.salt)
  const want = Buffer.from(acc.hash, 'hex')
  return got.length === want.length && timingSafeEqual(got, want)
}

const toMe = (a: Account): Me => ({
  id: a.id,
  username: a.username,
  role: a.role,
  grade: a.grade ?? GRADE_DEFAUT,
  leadNego: a.leadNego ?? false
})

function validUsername(u: unknown): u is string {
  return typeof u === 'string' && /^[a-zA-Z0-9_.-]{2,32}$/.test(u)
}

// ---------- Inscription des agents ----------

const configFile = join(DATA_DIR, 'config.json')
const config: ConfigInscription = existsSync(configFile)
  ? JSON.parse(readFileSync(configFile, 'utf8'))
  : { inscription: 'ouvert', code: randomBytes(5).toString('hex') }
// Les installations d'avant passaient par un code : on ouvre l'inscription, comme le nouveau réglage par défaut.
if (config.v !== 2) {
  config.inscription = 'ouvert'
  config.v = 2
}
writeFileSync(configFile, JSON.stringify(config), 'utf8')

const saveConfig = () => writeJsonAtomic(configFile, config)

// Pas plus de 5 inscriptions par heure et par adresse.
const inscriptions = new Map<string, { count: number; until: number }>()

function tropDInscriptions(ip: string): boolean {
  const f = inscriptions.get(ip)
  if (!f || f.until <= Date.now()) {
    inscriptions.delete(ip)
    return false
  }
  return f.count >= 5
}

function noteInscription(ip: string): void {
  const now = Date.now()
  const f = inscriptions.get(ip)
  if (!f || f.until <= now) inscriptions.set(ip, { count: 1, until: now + 60 * 60 * 1000 })
  else f.count++
}

function validPassword(p: unknown): p is string {
  return typeof p === 'string' && p.length >= 8 && p.length <= 200
}

// ---------- Formation des rookies ----------

const formationsFile = join(DATA_DIR, 'formations.json')
const formationScreensDir = join(DATA_DIR, 'formation-screens')
mkdirSync(formationScreensDir, { recursive: true })

let formations: FormationScenario[] = existsSync(formationsFile) ? JSON.parse(readFileSync(formationsFile, 'utf8')) : FORMATIONS_DEFAUT
if (!existsSync(formationsFile)) writeFileSync(formationsFile, JSON.stringify(formations), 'utf8')

// ---------- Sessions (cookie signé) ----------

function hmac(data: string): string {
  return createHmac('sha256', SECRET).update(data).digest('base64url')
}

function makeToken(acc: Account): string {
  const payload = Buffer.from(JSON.stringify({ u: acc.id, v: acc.tokenVersion, e: Date.now() + SESSION_MS })).toString('base64url')
  return `${payload}.${hmac(payload)}`
}

function readToken(token: string | undefined): Account | null {
  if (!token) return null
  const [payload, sig] = token.split('.')
  if (!payload || !sig) return null
  const expected = Buffer.from(hmac(payload))
  const given = Buffer.from(sig)
  if (expected.length !== given.length || !timingSafeEqual(expected, given)) return null
  try {
    const { u, v, e } = JSON.parse(Buffer.from(payload, 'base64url').toString('utf8'))
    if (typeof e !== 'number' || e < Date.now()) return null
    const acc = accounts.find((a) => a.id === u)
    return acc && acc.tokenVersion === v ? acc : null
  } catch {
    return null
  }
}

function readCookie(req: Request, name: string): string | undefined {
  const header = req.headers.cookie
  if (!header) return undefined
  for (const part of header.split(';')) {
    const [k, ...rest] = part.trim().split('=')
    if (k === name) return decodeURIComponent(rest.join('='))
  }
  return undefined
}

function setSession(req: Request, res: Response, acc: Account): void {
  res.cookie(COOKIE, makeToken(acc), { httpOnly: true, sameSite: 'lax', secure: req.secure, maxAge: SESSION_MS, path: '/' })
}

declare module 'express-serve-static-core' {
  interface Request {
    account?: Account
  }
}

// ---------- Anti force brute sur la connexion ----------

// 5 essais ratés = 20 secondes d'attente, puis on repart à zéro.
const LOGIN_MAX = 5
const LOGIN_PAUSE_MS = 20_000
const failures = new Map<string, { count: number; until: number }>()

function tooManyAttempts(ip: string): boolean {
  const f = failures.get(ip)
  if (!f) return false
  if (f.until <= Date.now()) {
    failures.delete(ip)
    return false
  }
  return f.count >= LOGIN_MAX
}

function recordFailure(ip: string): void {
  const now = Date.now()
  const f = failures.get(ip)
  if (!f || f.until <= now) failures.set(ip, { count: 1, until: now + LOGIN_PAUSE_MS })
  else {
    f.count++
    f.until = now + LOGIN_PAUSE_MS
  }
}

// ---------- Données par utilisateur ----------

const userDir = (acc: Account) => join(DATA_DIR, 'users', acc.id)
const screensDir = (acc: Account) => join(userDir(acc), 'screens')
const dbFile = (acc: Account) => join(userDir(acc), 'db.json')
const notesFile = (acc: Account) => join(userDir(acc), 'notes.json')

async function readDb(acc: Account): Promise<Db | null> {
  if (!existsSync(dbFile(acc))) return null
  try {
    return JSON.parse(await readFile(dbFile(acc), 'utf8'))
  } catch {
    return null
  }
}

async function readNotes(acc: Account): Promise<SupervisionNote[]> {
  if (!existsSync(notesFile(acc))) return []
  try {
    return JSON.parse(await readFile(notesFile(acc), 'utf8'))
  } catch {
    return []
  }
}

// Révision du dossier de chaque agent, pour détecter les modifications de l'autre côté.
const revs = new Map<string, number>()

async function getRev(acc: Account): Promise<number> {
  const cached = revs.get(acc.id)
  if (cached !== undefined) return cached
  const db = await readDb(acc)
  const rev = typeof db?.rev === 'number' ? db.rev : 0
  revs.set(acc.id, rev)
  return rev
}

async function saveDbFor(acc: Account, db: Db, rev: number): Promise<{ ok: true; rev: number } | { ok: false; rev: number }> {
  const current = await getRev(acc)
  if (rev !== current) return { ok: false, rev: current }
  const next = current + 1
  await queueWrite(acc, async () => {
    await mkdir(userDir(acc), { recursive: true })
    await writeJsonAtomic(dbFile(acc), { ...db, rev: next })
  })
  revs.set(acc.id, next)
  return { ok: true, rev: next }
}

function validDb(db: unknown): db is Db {
  const d = db as Db
  return !!d && d.version === 1 && Array.isArray(d.interventions) && Array.isArray(d.inbox) && typeof d.settings === 'object'
}

// Une file d'écriture par utilisateur pour ne jamais mélanger deux sauvegardes.
const writeQueues = new Map<string, Promise<void>>()
function queueWrite(acc: Account, job: () => Promise<void>): Promise<void> {
  const next = (writeQueues.get(acc.id) ?? Promise.resolve()).then(job, job)
  writeQueues.set(
    acc.id,
    next.catch(() => undefined)
  )
  return next
}

function imageExt(buf: Buffer): string | null {
  if (buf.length < 12) return null
  if (buf[0] === 0x89 && buf.subarray(1, 4).toString('ascii') === 'PNG') return 'png'
  if (buf[0] === 0xff && buf[1] === 0xd8) return 'jpg'
  if (buf.subarray(0, 4).toString('ascii') === 'RIFF' && buf.subarray(8, 12).toString('ascii') === 'WEBP') return 'webp'
  if (buf.subarray(0, 3).toString('ascii') === 'GIF') return 'gif'
  return null
}

// ---------- Liste des armes ----------

let weapons: { data: WeaponData; source: 'live' | 'cache' | 'bundled'; checkedAt: number } | null = null
let weaponsLoading: Promise<void> | null = null
const weaponsCacheFile = join(DATA_DIR, 'weapons-cache.json')

async function fetchJson(url: string): Promise<unknown> {
  const res = await fetch(url, { signal: AbortSignal.timeout(8000) })
  if (!res.ok) throw new Error(`HTTP ${res.status}`)
  return res.json()
}

async function loadWeapons(force: boolean): Promise<void> {
  if (weapons && !force && Date.now() - weapons.checkedAt < WEAPONS_TTL_MS) return
  if (weaponsLoading) return weaponsLoading
  weaponsLoading = (async () => {
    try {
      const [categories, list] = await Promise.all([fetchJson(`${WEAPONS_API}/categories`), fetchJson(`${WEAPONS_API}/weapons`)])
      if (!Array.isArray(categories) || !Array.isArray(list) || list.length === 0) throw new Error('Réponse invalide')
      const data = { fetchedAt: new Date().toISOString(), categories, weapons: list } as WeaponData
      await writeJsonAtomic(weaponsCacheFile, data)
      weapons = { data, source: 'live', checkedAt: Date.now() }
    } catch {
      if (weapons) weapons.checkedAt = Date.now()
      else if (existsSync(weaponsCacheFile)) weapons = { data: JSON.parse(await readFile(weaponsCacheFile, 'utf8')), source: 'cache', checkedAt: Date.now() }
      else weapons = { data: JSON.parse(await readFile(FALLBACK_WEAPONS, 'utf8')), source: 'bundled', checkedAt: Date.now() }
    } finally {
      weaponsLoading = null
    }
  })()
  return weaponsLoading
}

// ---------- Application ----------

const app = express()
app.disable('x-powered-by')
app.set('trust proxy', 'loopback, linklocal, uniquelocal')

app.use((_req, res, next) => {
  res.setHeader('X-Content-Type-Options', 'nosniff')
  res.setHeader('Referrer-Policy', 'same-origin')
  res.setHeader('X-Frame-Options', 'DENY')
  res.setHeader(
    'Content-Security-Policy',
    "default-src 'self'; script-src 'self'; style-src 'self' 'unsafe-inline'; img-src 'self' data: blob:; font-src 'self' data:; connect-src 'self'; frame-ancestors 'none'; base-uri 'self'; form-action 'self'"
  )
  next()
})

const api = express.Router()
api.use(express.json({ limit: '10mb' }))

// Les requêtes qui modifient quelque chose doivent venir du site lui-même.
api.use((req, res, next) => {
  if (req.method !== 'GET' && req.get('x-lspd') !== '1') {
    res.status(403).json({ error: 'Requête refusée' })
    return
  }
  req.account = readToken(readCookie(req, COOKIE)) ?? undefined
  next()
})

function requireAuth(req: Request, res: Response, next: NextFunction): void {
  if (!req.account) {
    res.status(401).json({ error: 'Non connecté' })
    return
  }
  next()
}

function requireAdmin(req: Request, res: Response, next: NextFunction): void {
  if (req.account?.role !== 'admin') {
    res.status(403).json({ error: 'Réservé à l’administrateur' })
    return
  }
  next()
}

api.get('/health', (_req, res) => {
  res.json({ ok: true })
})

api.get('/status', (req, res) => {
  res.setHeader('Cache-Control', 'no-store')
  res.json({ setup: accounts.length === 0, me: req.account ? toMe(req.account) : null, inscription: config.inscription })
})

// Un agent crée lui-même son compte à partir du lien donné par l'admin.
api.post('/register', async (req, res) => {
  if (accounts.length === 0) {
    res.status(409).json({ error: 'Le compte administrateur doit être créé en premier' })
    return
  }
  if (config.inscription === 'ferme') {
    res.status(403).json({ error: 'Les inscriptions sont fermées. Demande à ton admin de te créer un compte.' })
    return
  }
  const ip = req.ip ?? 'inconnu'
  if (tropDInscriptions(ip)) {
    res.status(429).json({ error: 'Trop de comptes créés depuis cette connexion. Réessaie plus tard.' })
    return
  }
  const { username, password, code } = req.body ?? {}
  if (config.inscription === 'code' && code !== config.code) {
    res.status(403).json({ error: 'Lien d’inscription invalide. Redemande le lien à ton admin.' })
    return
  }
  if (!validUsername(username)) {
    res.status(400).json({ error: 'Matricule : 2 à 32 caractères (lettres, chiffres, . _ -)' })
    return
  }
  if (accounts.some((a) => a.username.toLowerCase() === username.toLowerCase())) {
    res.status(409).json({ error: 'Ce matricule a déjà un compte' })
    return
  }
  if (!validPassword(password)) {
    res.status(400).json({ error: 'Mot de passe : 8 caractères minimum' })
    return
  }
  const acc: Account = {
    id: randomUUID(),
    username,
    role: 'user',
    ...(await hashPassword(password)),
    tokenVersion: 1,
    createdAt: new Date().toISOString()
  }
  accounts.push(acc)
  await saveAccounts()
  noteInscription(ip)
  setSession(req, res, acc)
  res.json(toMe(acc))
})

api.get('/config', requireAuth, requireAdmin, (_req, res) => {
  res.setHeader('Cache-Control', 'no-store')
  res.json(config)
})

api.put('/config', requireAuth, requireAdmin, async (req, res) => {
  const mode = req.body?.inscription as ModeInscription
  if (mode && ['ferme', 'code', 'ouvert'].includes(mode)) config.inscription = mode
  if (req.body?.nouveauCode === true) config.code = randomBytes(5).toString('hex')
  await saveConfig()
  res.json(config)
})

api.post('/setup', async (req, res) => {
  if (accounts.length > 0) {
    res.status(409).json({ error: 'Le compte administrateur existe déjà' })
    return
  }
  const { username, password } = req.body ?? {}
  if (!validUsername(username)) {
    res.status(400).json({ error: 'Identifiant : 3 à 32 caractères (lettres, chiffres, . _ -)' })
    return
  }
  if (!validPassword(password)) {
    res.status(400).json({ error: 'Mot de passe : 8 caractères minimum' })
    return
  }
  const acc: Account = { id: randomUUID(), username, role: 'admin', ...(await hashPassword(password)), tokenVersion: 1, createdAt: new Date().toISOString() }
  accounts.push(acc)
  await saveAccounts()
  setSession(req, res, acc)
  res.json(toMe(acc))
})

api.post('/login', async (req, res) => {
  const ip = req.ip ?? 'inconnu'
  if (tooManyAttempts(ip)) {
    res.status(429).json({ error: 'Trop d’essais. Réessaie dans 20 secondes.' })
    return
  }
  const { username, password } = req.body ?? {}
  const acc = typeof username === 'string' ? accounts.find((a) => a.username.toLowerCase() === username.toLowerCase()) : undefined
  if (!acc || typeof password !== 'string' || !(await checkPassword(password, acc))) {
    recordFailure(ip)
    res.status(401).json({ error: 'Identifiant ou mot de passe incorrect' })
    return
  }
  failures.delete(ip)
  setSession(req, res, acc)
  res.json(toMe(acc))
})

api.post('/logout', (_req, res) => {
  res.clearCookie(COOKIE, { path: '/' })
  res.json({ ok: true })
})

api.post('/me/password', requireAuth, async (req, res) => {
  const acc = req.account!
  const { current, password } = req.body ?? {}
  if (typeof current !== 'string' || !(await checkPassword(current, acc))) {
    res.status(400).json({ error: 'Mot de passe actuel incorrect' })
    return
  }
  if (!validPassword(password)) {
    res.status(400).json({ error: 'Nouveau mot de passe : 8 caractères minimum' })
    return
  }
  Object.assign(acc, await hashPassword(password), { tokenVersion: acc.tokenVersion + 1 })
  await saveAccounts()
  setSession(req, res, acc)
  res.json({ ok: true })
})

api.get('/accounts', requireAuth, requireAdmin, (_req, res) => {
  const list: AccountInfo[] = accounts.map((a) => ({ ...toMe(a), createdAt: a.createdAt }))
  res.json(list)
})

api.post('/accounts', requireAuth, requireAdmin, async (req, res) => {
  const { username, password, role } = req.body ?? {}
  if (!validUsername(username)) {
    res.status(400).json({ error: 'Identifiant : 3 à 32 caractères (lettres, chiffres, . _ -)' })
    return
  }
  if (accounts.some((a) => a.username.toLowerCase() === username.toLowerCase())) {
    res.status(409).json({ error: 'Cet identifiant est déjà pris' })
    return
  }
  if (!validPassword(password)) {
    res.status(400).json({ error: 'Mot de passe : 8 caractères minimum' })
    return
  }
  const acc: Account = {
    id: randomUUID(),
    username,
    role: role === 'admin' ? 'admin' : 'user',
    ...(await hashPassword(password)),
    tokenVersion: 1,
    createdAt: new Date().toISOString()
  }
  accounts.push(acc)
  await saveAccounts()
  res.json({ ...toMe(acc), createdAt: acc.createdAt })
})

// L'admin fixe le grade en jeu et le rôle de formateur négociation.
api.put('/accounts/:id/grade', requireAuth, requireAdmin, async (req, res) => {
  const acc = accounts.find((a) => a.id === req.params.id)
  if (!acc) {
    res.status(404).json({ error: 'Compte introuvable' })
    return
  }
  const { grade, leadNego } = req.body ?? {}
  if (typeof grade === 'string') {
    if (!GRADES.includes(grade as (typeof GRADES)[number])) {
      res.status(400).json({ error: 'Grade inconnu' })
      return
    }
    acc.grade = grade
  }
  if (typeof leadNego === 'boolean') acc.leadNego = leadNego
  await saveAccounts()
  res.json(toMe(acc))
})

api.put('/accounts/:id/password', requireAuth, requireAdmin, async (req, res) => {
  const acc = accounts.find((a) => a.id === req.params.id)
  if (!acc) {
    res.status(404).json({ error: 'Compte introuvable' })
    return
  }
  if (!validPassword(req.body?.password)) {
    res.status(400).json({ error: 'Mot de passe : 8 caractères minimum' })
    return
  }
  Object.assign(acc, await hashPassword(req.body.password), { tokenVersion: acc.tokenVersion + 1 })
  await saveAccounts()
  res.json({ ok: true })
})

api.delete('/accounts/:id', requireAuth, requireAdmin, async (req, res) => {
  const acc = accounts.find((a) => a.id === req.params.id)
  if (!acc) {
    res.status(404).json({ error: 'Compte introuvable' })
    return
  }
  if (acc.id === req.account!.id) {
    res.status(400).json({ error: 'Tu ne peux pas supprimer ton propre compte' })
    return
  }
  accounts = accounts.filter((a) => a.id !== acc.id)
  await saveAccounts()
  await rm(userDir(acc), { recursive: true, force: true })
  res.json({ ok: true })
})

api.get('/db', requireAuth, async (req, res) => {
  const file = dbFile(req.account!)
  res.setHeader('Cache-Control', 'no-store')
  if (!existsSync(file)) {
    res.json(null)
    return
  }
  res.type('json').send(await readFile(file, 'utf8'))
})

api.get('/db/etat', requireAuth, async (req, res) => {
  res.setHeader('Cache-Control', 'no-store')
  res.json({ rev: await getRev(req.account!) })
})

api.put('/db', requireAuth, async (req, res) => {
  const { db, rev } = req.body ?? {}
  if (!validDb(db) || typeof rev !== 'number') {
    res.status(400).json({ error: 'Données invalides' })
    return
  }
  const out = await saveDbFor(req.account!, db, rev)
  if (!out.ok) {
    res.status(409).json({ error: 'Le dossier a été modifié ailleurs', rev: out.rev })
    return
  }
  res.json({ rev: out.rev })
})

api.post('/images', requireAuth, express.raw({ type: () => true, limit: '25mb' }), async (req, res) => {
  const buf = req.body as Buffer
  const ext = Buffer.isBuffer(buf) ? imageExt(buf) : null
  if (!ext) {
    res.status(415).json({ error: 'Ce fichier n’est pas une image' })
    return
  }
  const acc = req.account!
  await mkdir(screensDir(acc), { recursive: true })
  const id = randomUUID()
  const img: ImageRef = { id, file: `${id}.${ext}`, createdAt: new Date().toISOString() }
  await writeFile(join(screensDir(acc), img.file), buf)
  res.json(img)
})

api.get('/images/:file', requireAuth, (req, res) => {
  const file = String(req.params.file)
  if (!IMAGE_NAME.test(file)) {
    res.status(400).end()
    return
  }
  res.sendFile(join(screensDir(req.account!), file), { headers: { 'Cache-Control': 'private, max-age=31536000, immutable' } }, (err) => {
    if (err && !res.headersSent) res.status(404).end()
  })
})

api.delete('/images/:file', requireAuth, async (req, res) => {
  const file = String(req.params.file)
  if (!IMAGE_NAME.test(file)) {
    res.status(400).end()
    return
  }
  await unlink(join(screensDir(req.account!), file)).catch(() => undefined)
  res.json({ ok: true })
})

// ---------- Supervision (admin) ----------

api.get('/admin/agents', requireAuth, requireAdmin, async (_req, res) => {
  const list: AgentSummary[] = []
  for (const acc of accounts) {
    const db = await readDb(acc)
    const notes = await readNotes(acc)
    const interventions = db?.interventions ?? []
    list.push({
      ...toMe(acc),
      interventions: interventions.length,
      enCours: interventions.filter((i) => i.statut === 'en_cours').length,
      suspects: interventions.reduce((n, i) => n + i.suspects.length, 0),
      screens: interventions.reduce(
        (n, i) =>
          n +
          i.sceneScreens.length +
          i.suspects.reduce((m, s) => m + s.photo.length + s.identite.length + s.fouilleScreens.length + s.amendesScreens.length + s.casierScreens.length, 0),
        (db?.inbox ?? []).length
      ),
      majA: interventions.reduce<string | null>((last, i) => (!last || i.updatedAt > last ? i.updatedAt : last), null),
      notesNonLues: notes.filter((n) => !n.lu).length,
      formations: (db?.formations ?? []).length,
      formationsValidees: (db?.formations ?? []).filter((f) => f.valide).length
    })
  }
  res.setHeader('Cache-Control', 'no-store')
  res.json(list)
})

api.get('/admin/agents/:id/db', requireAuth, requireAdmin, async (req, res) => {
  const acc = accounts.find((a) => a.id === req.params.id)
  if (!acc) {
    res.status(404).json({ error: 'Compte introuvable' })
    return
  }
  res.setHeader('Cache-Control', 'no-store')
  res.json(await readDb(acc))
})

api.get('/admin/agents/:id/db/etat', requireAuth, requireAdmin, async (req, res) => {
  const acc = accounts.find((a) => a.id === req.params.id)
  if (!acc) {
    res.status(404).json({ error: 'Compte introuvable' })
    return
  }
  res.setHeader('Cache-Control', 'no-store')
  res.json({ rev: await getRev(acc) })
})

// Prise en main : l'admin remplit le dossier à la place de l'agent.
api.put('/admin/agents/:id/db', requireAuth, requireAdmin, async (req, res) => {
  const acc = accounts.find((a) => a.id === req.params.id)
  if (!acc) {
    res.status(404).json({ error: 'Compte introuvable' })
    return
  }
  const { db, rev } = req.body ?? {}
  if (!validDb(db) || typeof rev !== 'number') {
    res.status(400).json({ error: 'Données invalides' })
    return
  }
  const out = await saveDbFor(acc, db, rev)
  if (!out.ok) {
    res.status(409).json({ error: 'Le dossier a été modifié ailleurs', rev: out.rev })
    return
  }
  res.json({ rev: out.rev })
})

api.post('/admin/agents/:id/images', requireAuth, requireAdmin, express.raw({ type: () => true, limit: '25mb' }), async (req, res) => {
  const acc = accounts.find((a) => a.id === req.params.id)
  const buf = req.body as Buffer
  const ext = acc && Buffer.isBuffer(buf) ? imageExt(buf) : null
  if (!acc || !ext) {
    res.status(415).json({ error: 'Ce fichier n’est pas une image' })
    return
  }
  await mkdir(screensDir(acc), { recursive: true })
  const id = randomUUID()
  const img: ImageRef = { id, file: `${id}.${ext}`, createdAt: new Date().toISOString() }
  await writeFile(join(screensDir(acc), img.file), buf)
  res.json(img)
})

api.delete('/admin/agents/:id/images/:file', requireAuth, requireAdmin, async (req, res) => {
  const acc = accounts.find((a) => a.id === req.params.id)
  const file = String(req.params.file)
  if (!acc || !IMAGE_NAME.test(file)) {
    res.status(400).end()
    return
  }
  await unlink(join(screensDir(acc), file)).catch(() => undefined)
  res.json({ ok: true })
})

api.get('/admin/agents/:id/images/:file', requireAuth, requireAdmin, (req, res) => {
  const acc = accounts.find((a) => a.id === req.params.id)
  const file = String(req.params.file)
  if (!acc || !IMAGE_NAME.test(file)) {
    res.status(404).end()
    return
  }
  res.sendFile(join(screensDir(acc), file), { headers: { 'Cache-Control': 'private, max-age=31536000, immutable' } }, (err) => {
    if (err && !res.headersSent) res.status(404).end()
  })
})

api.post('/admin/agents/:id/notes', requireAuth, requireAdmin, async (req, res) => {
  const acc = accounts.find((a) => a.id === req.params.id)
  if (!acc) {
    res.status(404).json({ error: 'Compte introuvable' })
    return
  }
  const text = typeof req.body?.text === 'string' ? req.body.text.trim().slice(0, 1000) : ''
  if (!text) {
    res.status(400).json({ error: 'Message vide' })
    return
  }
  const note: SupervisionNote = {
    id: randomUUID(),
    from: req.account!.username,
    text,
    createdAt: new Date().toISOString(),
    interventionId: typeof req.body?.interventionId === 'string' ? req.body.interventionId : undefined,
    suspectId: typeof req.body?.suspectId === 'string' ? req.body.suspectId : undefined,
    lu: false
  }
  await queueWrite(acc, async () => {
    const notes = await readNotes(acc)
    await mkdir(userDir(acc), { recursive: true })
    await writeJsonAtomic(notesFile(acc), [...notes, note].slice(-200))
  })
  res.json(note)
})

api.get('/notes', requireAuth, async (req, res) => {
  res.setHeader('Cache-Control', 'no-store')
  res.json(await readNotes(req.account!))
})

api.post('/notes/lu', requireAuth, async (req, res) => {
  const ids: string[] = Array.isArray(req.body?.ids) ? req.body.ids : []
  const acc = req.account!
  await queueWrite(acc, async () => {
    const notes = await readNotes(acc)
    await writeJsonAtomic(notesFile(acc), notes.map((n) => (ids.includes(n.id) ? { ...n, lu: true } : n)))
  })
  res.json({ ok: true })
})

api.get('/formations', requireAuth, (_req, res) => {
  res.setHeader('Cache-Control', 'no-store')
  res.json(formations)
})

api.put('/formations', requireAuth, requireAdmin, async (req, res) => {
  const liste = req.body
  if (!Array.isArray(liste) || liste.some((s) => typeof s?.id !== 'string' || typeof s?.titre !== 'string' || !Array.isArray(s?.questions))) {
    res.status(400).json({ error: 'Scénarios invalides' })
    return
  }
  formations = liste as FormationScenario[]
  await writeJsonAtomic(formationsFile, formations)
  res.json(formations)
})

api.post('/formations/images', requireAuth, requireAdmin, express.raw({ type: () => true, limit: '25mb' }), async (req, res) => {
  const buf = req.body as Buffer
  const ext = Buffer.isBuffer(buf) ? imageExt(buf) : null
  if (!ext) {
    res.status(415).json({ error: 'Ce fichier n’est pas une image' })
    return
  }
  const id = randomUUID()
  const img: ImageRef = { id, file: `${id}.${ext}`, createdAt: new Date().toISOString() }
  await writeFile(join(formationScreensDir, img.file), buf)
  res.json(img)
})

api.get('/formations/images/:file', requireAuth, (req, res) => {
  const file = String(req.params.file)
  if (!IMAGE_NAME.test(file)) {
    res.status(400).end()
    return
  }
  res.sendFile(join(formationScreensDir, file), { headers: { 'Cache-Control': 'private, max-age=31536000, immutable' } }, (err) => {
    if (err && !res.headersSent) res.status(404).end()
  })
})

api.get('/weapons', requireAuth, async (req, res) => {
  const force = req.query.refresh === '1' && (!weapons || Date.now() - weapons.checkedAt > 60_000)
  await loadWeapons(force)
  res.json({ data: weapons!.data, source: weapons!.source })
})

api.use((_req, res) => {
  res.status(404).json({ error: 'Introuvable' })
})

api.use((err: Error & { status?: number; type?: string }, _req: Request, res: Response, _next: NextFunction) => {
  if (err.type === 'entity.too.large') {
    res.status(413).json({ error: 'Fichier trop gros' })
    return
  }
  console.error(err)
  res.status(err.status ?? 500).json({ error: 'Erreur du serveur' })
})

app.use('/api', api)

app.use(
  express.static(STATIC_DIR, {
    index: false,
    setHeaders(res, path) {
      res.setHeader('Cache-Control', /[\\/]assets[\\/]/.test(path) ? 'public, max-age=31536000, immutable' : 'no-cache')
    }
  })
)

app.get(/.*/, (_req, res) => {
  res.setHeader('Cache-Control', 'no-cache')
  res.sendFile(join(STATIC_DIR, 'index.html'))
})

app.listen(PORT, () => {
  console.log(`LSPD Procédures en ligne sur le port ${PORT} (données : ${DATA_DIR})`)
  void loadWeapons(false)
})
