export function uid(): string {
  if (typeof crypto.randomUUID === 'function') return crypto.randomUUID()
  return `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 10)}`
}

export function pad(n: number): string {
  return String(n).padStart(2, '0')
}

export function todayIso(d = new Date()): string {
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`
}

export function nowHm(d = new Date()): string {
  return `${pad(d.getHours())}:${pad(d.getMinutes())}`
}

/** 2026-09-17 → 17/09/2026 */
export function dateFr(iso: string): string {
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(iso)
  return m ? `${m[3]}/${m[2]}/${m[1]}` : iso
}

/** 15:11 → 15h11 */
export function heureFr(hm: string): string {
  return hm ? hm.replace(':', 'h') : ''
}

export function dateTimeFr(isoDateTime: string): string {
  const d = new Date(isoDateTime)
  return `${pad(d.getDate())}/${pad(d.getMonth() + 1)}/${d.getFullYear()} à ${pad(d.getHours())}h${pad(d.getMinutes())}`
}

export function money(n: number): string {
  return `${n.toLocaleString('fr-FR').replace(/ | /g, ' ')} $`
}

/** ["a","b","c"] → "a, b et c" */
export function joinFr(items: string[]): string {
  const list = items.filter(Boolean)
  if (list.length <= 1) return list[0] ?? ''
  return `${list.slice(0, -1).join(', ')} et ${list[list.length - 1]}`
}

export function capitalize(s: string): string {
  return s ? s.charAt(0).toUpperCase() + s.slice(1) : s
}

/** Met une majuscule et un point final à une phrase tapée à la main. */
export function sentence(s: string): string {
  const t = s.trim()
  if (!t) return ''
  const withCap = capitalize(t)
  return /[.!?…»"]$/.test(withCap) ? withCap : `${withCap}.`
}

export function normalize(s: string): string {
  return s
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    .trim()
}
