import express, { type NextFunction, type Request, type Response } from 'express'
import { createHmac, randomBytes, randomUUID, scrypt, timingSafeEqual } from 'node:crypto'
import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs'
import { mkdir, readFile, rename, rm, unlink, writeFile } from 'node:fs/promises'
import { dirname, join, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import type { AccountInfo, Db, ImageRef, Me, WeaponData } from '../shared/types'

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

const toMe = (a: Account): Me => ({ id: a.id, username: a.username, role: a.role })

function validUsername(u: unknown): u is string {
  return typeof u === 'string' && /^[a-zA-Z0-9_.-]{3,32}$/.test(u)
}

function validPassword(p: unknown): p is string {
  return typeof p === 'string' && p.length >= 8 && p.length <= 200
}

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

const failures = new Map<string, { count: number; until: number }>()

function tooManyAttempts(ip: string): boolean {
  const f = failures.get(ip)
  return !!f && f.count >= 5 && f.until > Date.now()
}

function recordFailure(ip: string): void {
  const f = failures.get(ip)
  const now = Date.now()
  if (!f || f.until < now) failures.set(ip, { count: 1, until: now + 10 * 60 * 1000 })
  else f.count++
}

// ---------- Données par utilisateur ----------

const userDir = (acc: Account) => join(DATA_DIR, 'users', acc.id)
const screensDir = (acc: Account) => join(userDir(acc), 'screens')
const dbFile = (acc: Account) => join(userDir(acc), 'db.json')

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
  res.json({ setup: accounts.length === 0, me: req.account ? toMe(req.account) : null })
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
    res.status(429).json({ error: 'Trop d’essais. Réessaie dans 10 minutes.' })
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

api.put('/db', requireAuth, async (req, res) => {
  const db = req.body as Db
  if (!db || db.version !== 1 || !Array.isArray(db.interventions) || !Array.isArray(db.inbox) || typeof db.settings !== 'object') {
    res.status(400).json({ error: 'Données invalides' })
    return
  }
  const acc = req.account!
  await queueWrite(acc, async () => {
    await mkdir(userDir(acc), { recursive: true })
    await writeJsonAtomic(dbFile(acc), db)
  })
  res.json({ ok: true })
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
