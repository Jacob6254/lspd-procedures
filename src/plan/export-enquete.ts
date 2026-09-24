import type { Enquete, Fiche } from '@shared/enquete'
import { compteParType, defFiche, pivot, positionsLibelles, relationsDe, typeLien } from '@shared/enquete'
import { couleurPlan } from '@shared/plan'
import { dateFr } from '../lib/format'
import { chargerImage, coinsRonds, couperTexte, sortie, type Sortie } from './dessin'

const L = 2000
const RATIO = 1.55
const BANDEAU = 92

/**
 * Le tableau tel qu'on le voit, en une image à coller dans Discord. L'image se
 * recadre sur ce qui est réellement posé : le tableau est vaste, inutile
 * d'exporter des hectares de vide.
 */
export async function exporterTableau(enq: Enquete, urlImage: (file: string) => string): Promise<Sortie> {
  const H = Math.round(L / RATIO)
  const canvas = document.createElement('canvas')
  canvas.width = L
  canvas.height = H + BANDEAU
  const ctx = canvas.getContext('2d')!

  // --- Le cadre : ce qui est posé, plus une marge, au format de l'image ---
  let x0 = 1
  let y0 = 1
  let x1 = 0
  let y1 = 0
  for (const f of enq.fiches) {
    const demiL = defFiche(f.type).largeur / 2
    const demiH = hauteurFiche(ctx, f, L) / (2 * H)
    x0 = Math.min(x0, f.x - demiL)
    x1 = Math.max(x1, f.x + demiL)
    y0 = Math.min(y0, f.y - demiH)
    y1 = Math.max(y1, f.y + demiH)
  }
  if (enq.fiches.length === 0) {
    x0 = 0.25
    x1 = 0.75
    y0 = 0.3
    y1 = 0.7
  }
  const marge = 0.04
  x0 -= marge
  x1 += marge
  y0 -= marge
  y1 += marge
  let zw = Math.max(0.12, x1 - x0)
  let zh = Math.max(0.12, y1 - y0)
  // La toile a les proportions du plan : pour la remplir sans étirer, la zone
  // doit être aussi large que haute en fractions du plan.
  if (zw > zh) zh = zw
  else zw = zh
  const cx = (x0 + x1) / 2
  const cy = (y0 + y1) / 2
  const zx = cx - zw / 2
  const zy = cy - zh / 2

  // Pixels par unité de plan, une fois recadré.
  const ech = L / zw
  const echY = H / zh
  const px = (x: number) => (x - zx) * ech
  const py = (y: number) => (y - zy) * echY

  // --- L'ardoise ---
  const fondu = ctx.createLinearGradient(0, 0, 0, H)
  fondu.addColorStop(0, '#0f1522')
  fondu.addColorStop(1, '#0a0e18')
  ctx.fillStyle = fondu
  ctx.fillRect(0, 0, L, H)
  ctx.strokeStyle = 'rgba(148, 163, 184, 0.06)'
  ctx.lineWidth = 1
  const pas = Math.max(48, Math.round(ech * 0.028))
  for (let x = 0; x < L; x += pas) {
    ctx.beginPath()
    ctx.moveTo(x, 0)
    ctx.lineTo(x, H)
    ctx.stroke()
  }
  for (let y = 0; y < H; y += pas) {
    ctx.beginPath()
    ctx.moveTo(0, y)
    ctx.lineTo(L, y)
    ctx.stroke()
  }

  // --- Les ficelles partent des punaises et passent sous les fiches ---
  const punaise = (f: Fiche) => ({
    x: px(f.x),
    y: py(f.y) - hauteurFiche(ctx, f, ech) / 2 + defFiche(f.type).largeur * ech * 0.07
  })
  const visibles = enq.liens
    .map((l) => {
      const a = enq.fiches.find((f) => f.id === l.de)
      const b = enq.fiches.find((f) => f.id === l.vers)
      return a && b ? { l, p1: punaise(a), p2: punaise(b) } : null
    })
    .filter((v): v is { l: (typeof enq.liens)[number]; p1: { x: number; y: number }; p2: { x: number; y: number } } => v !== null)

  ctx.font = '600 17px Archivo, sans-serif'
  const obstacles = enq.fiches.map((f) => ({
    x: px(f.x),
    y: py(f.y),
    larg: defFiche(f.type).largeur * ech,
    haut: hauteurFiche(ctx, f, ech)
  }))
  const places = positionsLibelles(
    visibles.map(({ l, p1, p2 }) => {
      const creux = Math.hypot(p2.x - p1.x, p2.y - p1.y) * 0.055
      return {
        x1: p1.x,
        y1: p1.y + creux,
        x2: p2.x,
        y2: p2.y + creux,
        larg: ctx.measureText(l.libelle.trim()).width + 22,
        haut: 38
      }
    }),
    obstacles
  )

  const libelles: (() => void)[] = []
  visibles.forEach(({ l, p1, p2 }, i) => {
    const c = couleurPlan(typeLien(l.type).couleur)
    const creux = Math.hypot(p2.x - p1.x, p2.y - p1.y) * 0.11
    const trace = () => {
      ctx.beginPath()
      ctx.moveTo(p1.x, p1.y)
      ctx.quadraticCurveTo((p1.x + p2.x) / 2, (p1.y + p2.y) / 2 + creux, p2.x, p2.y)
      ctx.stroke()
    }
    ctx.lineCap = 'round'
    ctx.strokeStyle = 'rgba(6, 9, 16, 0.6)'
    ctx.lineWidth = 6
    trace()
    ctx.strokeStyle = c
    ctx.lineWidth = 2.6
    trace()

    const libelle = l.libelle.trim()
    if (!libelle) return
    const mx = places[i].x
    const my = places[i].y
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
  })

  // --- Les fiches ---
  const photos = new Map<string, HTMLImageElement>()
  await Promise.all(
    enq.fiches
      .filter((f) => f.image)
      .map(async (f) => {
        const img = await chargerImage(urlImage(f.image!))
        if (img) photos.set(f.image!, img)
      })
  )
  for (const f of enq.fiches) dessinerFiche(ctx, f, px(f.x), py(f.y), ech, photos)
  for (const poser of libelles) poser()

  // --- Le bandeau ---
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

/** Ce que mesure une fiche : sert au dessin et à savoir où planter la punaise. */
function mesures(ctx: CanvasRenderingContext2D, f: Fiche, echelle: number, avecPhoto: boolean) {
  const def = defFiche(f.type)
  const w = def.largeur * echelle
  const marge = w * 0.07
  const hPhoto = avecPhoto ? w * 0.62 : 0
  ctx.font = `700 ${Math.round(w * 0.095)}px Archivo, sans-serif`
  const titre = couperTexte(ctx, f.titre.trim() || def.label, w - marge * 2)
  ctx.font = `${Math.round(w * 0.078)}px Archivo, sans-serif`
  const texte = f.texte.trim() ? couperTexte(ctx, f.texte.trim(), w - marge * 2).slice(0, 3) : []
  const tags = f.role || f.statut ? Math.round(w * 0.12) : 0
  const h = hPhoto + marge * 2 + titre.length * w * 0.115 + tags + texte.length * w * 0.098 + (f.date ? w * 0.1 : 0)
  return { def, w, marge, hPhoto, titre, texte, tags, h }
}

function hauteurFiche(ctx: CanvasRenderingContext2D, f: Fiche, echelle: number): number {
  return mesures(ctx, f, echelle, !!f.image).h
}

function dessinerFiche(
  ctx: CanvasRenderingContext2D,
  f: Fiche,
  cx: number,
  cy: number,
  echelle: number,
  photos: Map<string, HTMLImageElement>
): void {
  const img = f.image ? photos.get(f.image) : null
  const { w, marge, hPhoto, titre, texte, tags, h } = mesures(ctx, f, echelle, !!img)
  const x = cx - w / 2
  const y = cy - h / 2

  ctx.save()
  ctx.translate(cx, cy)
  ctx.rotate((f.angle * Math.PI) / 180)
  ctx.translate(-cx, -cy)

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

  let ly = y + marge
  if (img) {
    const ratio = img.naturalWidth / img.naturalHeight
    const iw = w - marge * 2
    const ih = hPhoto
    const sw = ratio > iw / ih ? img.naturalHeight * (iw / ih) : img.naturalWidth
    const sh = ratio > iw / ih ? img.naturalHeight : img.naturalWidth * (ih / iw)
    ctx.save()
    coinsRonds(ctx, x + marge, ly, iw, ih, 4)
    ctx.clip()
    ctx.drawImage(img, (img.naturalWidth - sw) / 2, (img.naturalHeight - sh) / 2, sw, sh, x + marge, ly, iw, ih)
    ctx.restore()
    ly += ih + marge * 0.8
  }

  ctx.fillStyle = '#f1f5f9'
  ctx.font = `700 ${Math.round(w * 0.095)}px Archivo, sans-serif`
  for (const ligne of titre) {
    ctx.fillText(ligne, x + marge, ly + w * 0.09)
    ly += w * 0.115
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
      coinsRonds(ctx, tx, ly, tw, w * 0.095, 3)
      ctx.fill()
      ctx.fillStyle = couleur
      ctx.fillText(t, tx + w * 0.025, ly + w * 0.072)
      tx += tw + w * 0.03
    }
    ly += tags
  }

  ctx.fillStyle = '#b9bfcc'
  ctx.font = `${Math.round(w * 0.078)}px Archivo, sans-serif`
  for (const ligne of texte) {
    ctx.fillText(ligne, x + marge, ly + w * 0.075)
    ly += w * 0.098
  }

  if (f.date) {
    ctx.fillStyle = '#6b7385'
    ctx.font = `${Math.round(w * 0.068)}px Archivo, sans-serif`
    ctx.fillText(dateFr(f.date), x + marge, ly + w * 0.07)
  }

  // La punaise.
  ctx.beginPath()
  ctx.arc(cx, y + marge * 0.6, w * 0.035, 0, Math.PI * 2)
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
