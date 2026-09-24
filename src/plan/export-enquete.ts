import type { Enquete, Fiche } from '@shared/enquete'
import { compteParType, defFiche, pivot, relationsDe, typeLien } from '@shared/enquete'
import { couleurPlan } from '@shared/plan'
import { dateFr } from '../lib/format'
import { chargerImage, coinsRonds, couperTexte, sortie, type Sortie } from './dessin'

const L = 2000
const RATIO = 1.55
const BANDEAU = 92

/** Le tableau tel qu'on le voit, en une image à coller dans Discord. */
export async function exporterTableau(enq: Enquete, urlImage: (file: string) => string): Promise<Sortie> {
  const H = Math.round(L / RATIO)
  const canvas = document.createElement('canvas')
  canvas.width = L
  canvas.height = H + BANDEAU
  const ctx = canvas.getContext('2d')!

  // L'ardoise.
  const fondu = ctx.createLinearGradient(0, 0, 0, H)
  fondu.addColorStop(0, '#0f1522')
  fondu.addColorStop(1, '#0a0e18')
  ctx.fillStyle = fondu
  ctx.fillRect(0, 0, L, H)
  ctx.strokeStyle = 'rgba(148, 163, 184, 0.06)'
  ctx.lineWidth = 1
  for (let x = 0; x < L; x += 64) {
    ctx.beginPath()
    ctx.moveTo(x, 0)
    ctx.lineTo(x, H)
    ctx.stroke()
  }
  for (let y = 0; y < H; y += 64) {
    ctx.beginPath()
    ctx.moveTo(0, y)
    ctx.lineTo(L, y)
    ctx.stroke()
  }

  // Les fils passent sous les fiches, mais leurs libellés se posent par-dessus :
  // c'est ce qui rend le tableau lisible six mois plus tard.
  const libelles: (() => void)[] = []
  for (const l of enq.liens) {
    const a = enq.fiches.find((f) => f.id === l.de)
    const b = enq.fiches.find((f) => f.id === l.vers)
    if (!a || !b) continue
    const t = typeLien(l.type)
    const c = couleurPlan(t.couleur)
    const x1 = a.x * L
    const y1 = a.y * H
    const x2 = b.x * L
    const y2 = b.y * H

    ctx.strokeStyle = 'rgba(6, 9, 16, 0.7)'
    ctx.lineWidth = 7
    ctx.beginPath()
    ctx.moveTo(x1, y1)
    ctx.lineTo(x2, y2)
    ctx.stroke()
    ctx.strokeStyle = c
    ctx.lineWidth = 3
    ctx.beginPath()
    ctx.moveTo(x1, y1)
    ctx.lineTo(x2, y2)
    ctx.stroke()

    const libelle = l.libelle.trim() || t.label.toLowerCase()
    const mx = (x1 + x2) / 2
    const my = (y1 + y2) / 2
    libelles.push(() => {
      ctx.font = '600 17px Archivo, sans-serif'
      const w = ctx.measureText(libelle).width + 20
      ctx.fillStyle = 'rgba(8, 11, 20, 0.95)'
      coinsRonds(ctx, mx - w / 2, my - 15, w, 30, 6)
      ctx.fill()
      ctx.strokeStyle = c
      ctx.lineWidth = 1.5
      ctx.stroke()
      ctx.fillStyle = '#e2e8f0'
      ctx.textAlign = 'center'
      ctx.fillText(libelle, mx, my + 6)
      ctx.textAlign = 'left'
    })
  }

  // Les images des fiches, chargées avant la mise en page.
  const photos = new Map<string, HTMLImageElement>()
  await Promise.all(
    enq.fiches
      .filter((f) => f.image)
      .map(async (f) => {
        const img = await chargerImage(urlImage(f.image!))
        if (img) photos.set(f.image!, img)
      })
  )

  for (const f of enq.fiches) dessinerFiche(ctx, f, L, H, photos)
  for (const poser of libelles) poser()

  // Le bandeau.
  ctx.fillStyle = '#0b0e18'
  ctx.fillRect(0, H, L, BANDEAU)
  ctx.fillStyle = 'rgba(56, 189, 248, 0.5)'
  ctx.fillRect(0, H, L, 2)
  ctx.fillStyle = '#f1f5f9'
  ctx.font = '700 28px Archivo, sans-serif'
  ctx.fillText((enq.nom || "Tableau d'enquête").toUpperCase(), 28, H + 40)
  ctx.fillStyle = '#8b93a7'
  ctx.font = '15px Archivo, sans-serif'
  const c = compteParType(enq)
  ctx.fillText(
    `${dateFr(enq.date)} · ${enq.auteurNom} · ${c.suspect} suspect(s), ${c.preuve} preuve(s), ${enq.liens.length} lien(s)`,
    28,
    H + 66
  )
  ctx.textAlign = 'right'
  ctx.fillText('Los Santos Police Department — Mission Row', L - 28, H + 66)
  ctx.textAlign = 'left'

  return sortie(canvas)
}

function dessinerFiche(ctx: CanvasRenderingContext2D, f: Fiche, L: number, H: number, photos: Map<string, HTMLImageElement>): void {
  const def = defFiche(f.type)
  const w = def.largeur * L
  const marge = w * 0.07
  const img = f.image ? photos.get(f.image) : null
  const hPhoto = img ? w * 0.62 : 0

  ctx.font = `700 ${Math.round(w * 0.095)}px Archivo, sans-serif`
  const titre = couperTexte(ctx, f.titre.trim() || def.label, w - marge * 2)
  ctx.font = `${Math.round(w * 0.078)}px Archivo, sans-serif`
  const texte = f.texte.trim() ? couperTexte(ctx, f.texte.trim(), w - marge * 2).slice(0, 6) : []
  const tags = f.role || f.statut ? Math.round(w * 0.12) : 0

  const h = hPhoto + marge * 2 + titre.length * w * 0.115 + tags + texte.length * w * 0.098 + (f.date ? w * 0.1 : 0)
  const x = f.x * L - w / 2
  const y = f.y * H - h / 2

  ctx.save()
  ctx.translate(f.x * L, f.y * H)
  ctx.rotate((f.angle * Math.PI) / 180)
  ctx.translate(-f.x * L, -f.y * H)

  ctx.shadowColor = 'rgba(0, 0, 0, 0.55)'
  ctx.shadowBlur = 16
  ctx.shadowOffsetY = 5
  ctx.fillStyle = f.type === 'note' ? '#2a2415' : '#141a28'
  coinsRonds(ctx, x, y, w, h, 6)
  ctx.fill()
  ctx.shadowColor = 'transparent'
  ctx.shadowBlur = 0
  ctx.shadowOffsetY = 0
  ctx.strokeStyle = f.type === 'note' ? 'rgba(240, 163, 39, 0.5)' : 'rgba(148, 163, 184, 0.28)'
  ctx.lineWidth = 1.5
  ctx.stroke()

  let cy = y + marge
  if (img) {
    const ratio = img.naturalWidth / img.naturalHeight
    const iw = w - marge * 2
    const ih = hPhoto
    const sw = ratio > iw / ih ? img.naturalHeight * (iw / ih) : img.naturalWidth
    const sh = ratio > iw / ih ? img.naturalHeight : img.naturalWidth * (ih / iw)
    ctx.save()
    coinsRonds(ctx, x + marge, cy, iw, ih, 4)
    ctx.clip()
    ctx.drawImage(img, (img.naturalWidth - sw) / 2, (img.naturalHeight - sh) / 2, sw, sh, x + marge, cy, iw, ih)
    ctx.restore()
    cy += ih + marge * 0.8
  }

  ctx.fillStyle = '#f1f5f9'
  ctx.font = `700 ${Math.round(w * 0.095)}px Archivo, sans-serif`
  for (const ligne of titre) {
    ctx.fillText(ligne, x + marge, cy + w * 0.09)
    cy += w * 0.115
  }

  if (tags) {
    let tx = x + marge
    ctx.font = `600 ${Math.round(w * 0.068)}px Archivo, sans-serif`
    for (const [t, couleur] of [
      [f.role, '#93b2ff'],
      [f.statut, '#f0a327']
    ] as [string, string][]) {
      if (!t) continue
      const tw = ctx.measureText(t).width + w * 0.05
      ctx.fillStyle = 'rgba(255, 255, 255, 0.06)'
      coinsRonds(ctx, tx, cy, tw, w * 0.095, 3)
      ctx.fill()
      ctx.fillStyle = couleur
      ctx.fillText(t, tx + w * 0.025, cy + w * 0.072)
      tx += tw + w * 0.03
    }
    cy += tags
  }

  ctx.fillStyle = '#b9bfcc'
  ctx.font = `${Math.round(w * 0.078)}px Archivo, sans-serif`
  for (const ligne of texte) {
    ctx.fillText(ligne, x + marge, cy + w * 0.075)
    cy += w * 0.098
  }

  if (f.date) {
    ctx.fillStyle = '#6b7385'
    ctx.font = `${Math.round(w * 0.068)}px Archivo, sans-serif`
    ctx.fillText(dateFr(f.date), x + marge, cy + w * 0.07)
  }

  // La punaise.
  ctx.beginPath()
  ctx.arc(f.x * L, y + marge * 0.6, w * 0.035, 0, Math.PI * 2)
  ctx.fillStyle = f.type === 'note' ? '#f0a327' : '#e5484d'
  ctx.fill()
  ctx.strokeStyle = 'rgba(0, 0, 0, 0.5)'
  ctx.lineWidth = 1
  ctx.stroke()

  ctx.restore()
}

/** La note d'enquête, composée à partir du tableau. */
export function noteEnquete(enq: Enquete): string {
  const l: string[] = []
  const c = compteParType(enq)

  l.push('**LOS SANTOS POLICE DEPARTMENT — MISSION ROW**')
  l.push(`**NOTE D'ENQUÊTE — ${(enq.cible || enq.nom || 'sans objet').toUpperCase()}**`)
  l.push(`Ouverte le ${dateFr(enq.date)} · ${enq.auteurNom} · ${enq.statut === 'close' ? 'clôturée' : 'en cours'}`)
  l.push('')

  if (enq.resume.trim()) {
    l.push('**OÙ ON EN EST**')
    l.push(enq.resume.trim())
    l.push('')
  }

  const tete = pivot(enq)
  if (tete) {
    const n = enq.liens.filter((x) => x.de === tete.id || x.vers === tete.id).length
    l.push(`**FIGURE CENTRALE** : ${tete.titre.trim() || 'suspect non identifié'}${tete.role ? ` — ${tete.role}` : ''} (${n} lien(s))`)
    l.push('')
  }

  const suspects = enq.fiches.filter((f) => f.type === 'suspect')
  if (suspects.length) {
    l.push(`**SUSPECTS (${suspects.length})**`)
    for (const f of suspects) {
      const bouts = [f.role, f.statut, f.texte.trim()].filter(Boolean)
      l.push(`- ${f.titre.trim() || 'Identité inconnue'}${bouts.length ? ` — ${bouts.join(' · ')}` : ''}`)
      for (const r of relationsDe(enq, f.id)) {
        if (!r.sortant) continue
        l.push(`  ↳ ${r.lien.libelle.trim() || typeLien(r.lien.type).label.toLowerCase()} ${r.autre.titre.trim() || 'fiche'}`)
      }
    }
    l.push('')
  }

  const preuves = enq.fiches.filter((f) => f.type === 'preuve')
  if (preuves.length) {
    l.push(`**PREUVES (${preuves.length})**`)
    for (const f of preuves) {
      l.push(`- ${f.titre.trim() || 'Preuve'}${f.date ? ` (${dateFr(f.date)})` : ''}${f.texte.trim() ? ` — ${f.texte.trim()}` : ''}`)
    }
    l.push('')
  }

  const lieux = enq.fiches.filter((f) => f.type === 'lieu' || f.type === 'vehicule')
  if (lieux.length) {
    l.push('**LIEUX ET VÉHICULES**')
    for (const f of lieux) l.push(`- ${f.titre.trim() || defFiche(f.type).label}${f.texte.trim() ? ` — ${f.texte.trim()}` : ''}`)
    l.push('')
  }

  const notes = enq.fiches.filter((f) => f.type === 'note' && (f.titre.trim() || f.texte.trim()))
  if (notes.length) {
    l.push('**À VÉRIFIER**')
    for (const f of notes) l.push(`- ${[f.titre.trim(), f.texte.trim()].filter(Boolean).join(' — ')}`)
    l.push('')
  }

  l.push(`_${c.suspect} suspect(s), ${c.preuve} preuve(s), ${enq.liens.length} lien(s). Tableau joint._`)
  return l.join('\n').trim()
}
