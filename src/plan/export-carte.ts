import type { Operation } from '@shared/operation'
import { cardinal, defMarqueur, fondCarte, uniteDe } from '@shared/operation'
import { couleurPlan } from '@shared/plan'
import { dateFr, heureFr } from '../lib/format'
import { chargerImage, couperTexte, fleche, pastille, plaque, sortie, texteSurPlaque, type Sortie } from './dessin'

const LARGEUR_MAX = 2000
const BANDEAU = 96

/** Ce qui est visible à l'écran : un calque éteint ne part pas dans l'image. */
function visible(op: Operation, uniteId: string | null): boolean {
  if (!uniteId) return true
  return uniteDe(op, uniteId)?.visible !== false
}

function teinte(op: Operation, uniteId: string | null): string {
  const u = uniteDe(op, uniteId)
  return u ? couleurPlan(u.couleur) : '#e2e8f0'
}

export async function exporterCarte(op: Operation): Promise<Sortie> {
  const fond = fondCarte(op.fond)
  const img = await chargerImage(fond.fichier)

  // On ne garde que l'île : les marqueurs sont rangés dans ce repère-là.
  const sx = img ? img.naturalWidth * fond.ile.x : 0
  const sy = img ? img.naturalHeight * fond.ile.y : 0
  const sw = img ? img.naturalWidth * fond.ile.w : 1000
  const sh = img ? img.naturalHeight * fond.ile.h : 1200

  const L = Math.round(Math.min(LARGEUR_MAX, Math.max(1100, sw)))
  const H = Math.round((sh / sw) * L)

  const canvas = document.createElement('canvas')
  canvas.width = L
  canvas.height = H + BANDEAU
  const ctx = canvas.getContext('2d')!

  ctx.fillStyle = '#080b14'
  ctx.fillRect(0, 0, canvas.width, canvas.height)

  if (img) {
    ctx.drawImage(img, sx, sy, sw, sh, 0, 0, L, H)
  } else {
    // Pas de fond installé : un quadrillage, pour que le plan reste lisible.
    ctx.strokeStyle = 'rgba(56, 189, 248, 0.16)'
    ctx.lineWidth = 1
    for (let x = 0; x < L; x += L / 24) {
      ctx.beginPath()
      ctx.moveTo(x, 0)
      ctx.lineTo(x, H)
      ctx.stroke()
    }
    for (let y = 0; y < H; y += L / 24) {
      ctx.beginPath()
      ctx.moveTo(0, y)
      ctx.lineTo(L, y)
      ctx.stroke()
    }
  }

  const px = (x: number) => x * L
  const py = (y: number) => y * H
  const ech = L / 1400

  for (const f of op.fleches) {
    if (!visible(op, f.uniteId) || f.points.length < 2) continue
    fleche(
      ctx,
      f.points.map((p) => ({ x: px(p.x), y: py(p.y) })),
      teinte(op, f.uniteId),
      Math.max(3, 4.5 * ech)
    )
  }

  const r = Math.max(14, 20 * ech)
  for (const m of op.marqueurs) {
    if (!visible(op, m.uniteId)) continue
    const c = teinte(op, m.uniteId)
    pastille(ctx, px(m.x), py(m.y), r, c, defMarqueur(m.type).code)
    const libelle = m.texte.trim() || defMarqueur(m.type).label
    texteSurPlaque(ctx, libelle, px(m.x) + r + 10, py(m.y) + 5, `600 ${Math.round(15 * ech)}px Archivo, sans-serif`, '#f1f5f9', c)
  }

  for (const e of op.etiquettes) {
    if (!visible(op, e.uniteId)) continue
    const c = teinte(op, e.uniteId)
    const police = `600 ${Math.round(16 * ech)}px Archivo, sans-serif`
    ctx.font = police
    const lignes = couperTexte(ctx, e.texte || 'Annotation', 420 * ech)
    const hl = 22 * ech
    const w = Math.max(...lignes.map((l) => ctx.measureText(l).width))
    // Centrée sur son point, comme à l'écran.
    const x0 = px(e.x) - w / 2
    const y0 = py(e.y) - (lignes.length * hl) / 2
    plaque(ctx, x0 - 9, y0 - hl * 0.72, w + 18, lignes.length * hl + 10, c)
    ctx.fillStyle = '#f1f5f9'
    lignes.forEach((l, i) => ctx.fillText(l, x0, y0 + i * hl))
  }

  // Le bandeau du bas : de quelle opération il s'agit, et qui tient quel calque.
  ctx.fillStyle = '#0b0e18'
  ctx.fillRect(0, H, L, BANDEAU)
  ctx.fillStyle = 'rgba(56, 189, 248, 0.5)'
  ctx.fillRect(0, H, L, 2)

  ctx.fillStyle = '#f1f5f9'
  ctx.font = `700 ${Math.round(26 * ech)}px Archivo, sans-serif`
  ctx.fillText(op.nom.toUpperCase() || 'OPÉRATION', 26, H + 38)

  ctx.fillStyle = '#8b93a7'
  ctx.font = `${Math.round(14 * ech)}px Archivo, sans-serif`
  const sous = [dateFr(op.date), heureFr(op.heure), op.lieu.trim(), op.auteurNom].filter(Boolean).join(' · ')
  ctx.fillText(sous, 26, H + 62)
  ctx.fillText('Los Santos Police Department — Mission Row', 26, H + 84)

  let lx = L - 26
  ctx.textAlign = 'right'
  for (const u of [...op.unites].reverse()) {
    if (!u.visible) continue
    ctx.font = `600 ${Math.round(15 * ech)}px Archivo, sans-serif`
    const label = u.effectif > 0 ? `${u.nom} (${u.effectif})` : u.nom
    const w = ctx.measureText(label).width
    ctx.fillStyle = '#e2e8f0'
    ctx.fillText(label, lx, H + 46)
    ctx.fillStyle = couleurPlan(u.couleur)
    ctx.fillRect(lx - w - 20, H + 33, 12, 12)
    lx -= w + 38
  }
  ctx.textAlign = 'left'

  return sortie(canvas)
}

/** Le briefing en texte, composé à partir de ce qui est posé sur la carte. */
export function texteBriefing(op: Operation): string {
  const l: string[] = []
  const vus = (id: string | null) => visible(op, id)

  l.push('**LOS SANTOS POLICE DEPARTMENT — MISSION ROW**')
  l.push(`**BRIEFING OPÉRATION — ${(op.nom || 'sans nom').toUpperCase()}**`)
  l.push(`${dateFr(op.date)} à ${heureFr(op.heure)}${op.lieu.trim() ? ` · ${op.lieu.trim()}` : ''}`)
  l.push(`Rédacteur : ${op.auteurNom}`)
  l.push('')

  if (op.objectif.trim()) {
    l.push('**OBJECTIF**')
    l.push(op.objectif.trim())
    l.push('')
  }

  const unites = op.unites.filter((u) => u.visible)
  if (unites.length) {
    l.push('**UNITÉS ENGAGÉES**')
    for (const u of unites) {
      const m = op.marqueurs.filter((x) => x.uniteId === u.id).length
      const f = op.fleches.filter((x) => x.uniteId === u.id).length
      const detail = [m ? `${m} position(s)` : '', f ? `${f} itinéraire(s)` : ''].filter(Boolean).join(', ')
      l.push(`- ${u.nom}${u.effectif > 0 ? ` — ${u.effectif} agent(s)` : ''}${detail ? ` : ${detail}` : ''}`)
    }
    l.push('')
  }

  const marqueurs = op.marqueurs.filter((m) => vus(m.uniteId))
  if (marqueurs.length) {
    l.push('**DISPOSITIF**')
    for (const m of marqueurs) {
      const d = defMarqueur(m.type)
      const u = uniteDe(op, m.uniteId)
      const bouts = [m.texte.trim(), u ? u.nom : '', `secteur ${cardinal(m)}`].filter(Boolean)
      l.push(`- ${d.label} — ${bouts.join(' · ')}`)
    }
    l.push('')
  }

  const fleches = op.fleches.filter((f) => vus(f.uniteId) && f.points.length > 1)
  if (fleches.length) {
    l.push('**ITINÉRAIRES**')
    for (const f of fleches) {
      const u = uniteDe(op, f.uniteId)
      const a = f.points[0]
      const b = f.points[f.points.length - 1]
      l.push(`- ${u ? u.nom : 'Non affecté'} : du secteur ${cardinal(a)} vers le secteur ${cardinal(b)} (${f.points.length} points)`)
    }
    l.push('')
  }

  const notes = op.etiquettes.filter((e) => vus(e.uniteId) && e.texte.trim())
  if (notes.length) {
    l.push('**ANNOTATIONS**')
    for (const e of notes) l.push(`- ${e.texte.trim()} (secteur ${cardinal(e)})`)
    l.push('')
  }

  l.push('_Carte annotée jointe._')
  return l.join('\n').trim()
}
