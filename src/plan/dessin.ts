/** Les outils de dessin partagés par l'export de la carte et celui du tableau. */

export interface Sortie {
  dataUrl: string
  blob: Blob
}

export function chargerImage(src: string): Promise<HTMLImageElement | null> {
  return new Promise((ok) => {
    const img = new Image()
    img.crossOrigin = 'anonymous'
    img.onload = () => ok(img)
    img.onerror = () => ok(null)
    img.src = src
  })
}

export function dataUrlVersBlob(dataUrl: string): Blob {
  const [entete, data] = dataUrl.split(',')
  const binaire = atob(data)
  const buffer = new Uint8Array(binaire.length)
  for (let i = 0; i < binaire.length; i++) buffer[i] = binaire.charCodeAt(i)
  return new Blob([buffer], { type: entete.slice(5).split(';')[0] })
}

export function sortie(canvas: HTMLCanvasElement): Sortie {
  const dataUrl = canvas.toDataURL('image/png')
  return { dataUrl, blob: dataUrlVersBlob(dataUrl) }
}

export function couperTexte(ctx: CanvasRenderingContext2D, texte: string, largeur: number): string[] {
  const out: string[] = []
  for (const paragraphe of texte.split('\n')) {
    let ligne = ''
    for (const mot of paragraphe.split(' ')) {
      const essai = ligne ? `${ligne} ${mot}` : mot
      if (ctx.measureText(essai).width > largeur && ligne) {
        out.push(ligne)
        ligne = mot
      } else {
        ligne = essai
      }
    }
    out.push(ligne)
  }
  return out
}

export function coinsRonds(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, r: number): void {
  const rr = Math.min(r, w / 2, h / 2)
  ctx.beginPath()
  ctx.moveTo(x + rr, y)
  ctx.arcTo(x + w, y, x + w, y + h, rr)
  ctx.arcTo(x + w, y + h, x, y + h, rr)
  ctx.arcTo(x, y + h, x, y, rr)
  ctx.arcTo(x, y, x + w, y, rr)
  ctx.closePath()
}

/** Un fond sombre derrière un texte, pour qu'il reste lisible sur n'importe quelle carte. */
export function plaque(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, bord?: string): void {
  ctx.fillStyle = 'rgba(8, 11, 20, 0.82)'
  coinsRonds(ctx, x, y, w, h, 4)
  ctx.fill()
  if (bord) {
    ctx.strokeStyle = bord
    ctx.lineWidth = 1.5
    ctx.stroke()
  }
}

/** Texte posé sur sa plaque, renvoie la largeur occupée. */
export function texteSurPlaque(
  ctx: CanvasRenderingContext2D,
  texte: string,
  x: number,
  y: number,
  police: string,
  couleur: string,
  bord?: string
): number {
  ctx.font = police
  const w = ctx.measureText(texte).width
  const h = Number(police.match(/(\d+(?:\.\d+)?)px/)?.[1] ?? 14)
  plaque(ctx, x - 6, y - h + 1, w + 12, h + 8, bord)
  ctx.fillStyle = couleur
  ctx.textBaseline = 'alphabetic'
  ctx.fillText(texte, x, y + 3)
  return w + 12
}

/** Trait d'itinéraire avec pointe de flèche, doublé d'un liseré sombre. */
export function fleche(ctx: CanvasRenderingContext2D, points: { x: number; y: number }[], couleur: string, epaisseur: number): void {
  if (points.length < 2) return
  const trace = () => {
    ctx.beginPath()
    ctx.moveTo(points[0].x, points[0].y)
    for (let i = 1; i < points.length; i++) ctx.lineTo(points[i].x, points[i].y)
    ctx.stroke()
  }
  ctx.lineJoin = 'round'
  ctx.lineCap = 'round'
  ctx.strokeStyle = 'rgba(6, 9, 16, 0.75)'
  ctx.lineWidth = epaisseur + 4
  trace()
  ctx.strokeStyle = couleur
  ctx.lineWidth = epaisseur
  trace()

  const a = points[points.length - 2]
  const b = points[points.length - 1]
  const angle = Math.atan2(b.y - a.y, b.x - a.x)
  const t = epaisseur * 3.4
  ctx.beginPath()
  ctx.moveTo(b.x, b.y)
  ctx.lineTo(b.x - t * Math.cos(angle - 0.42), b.y - t * Math.sin(angle - 0.42))
  ctx.lineTo(b.x - t * Math.cos(angle + 0.42), b.y - t * Math.sin(angle + 0.42))
  ctx.closePath()
  ctx.fillStyle = couleur
  ctx.strokeStyle = 'rgba(6, 9, 16, 0.75)'
  ctx.lineWidth = 2
  ctx.stroke()
  ctx.fill()
}

/** Pastille d'un marqueur : disque teinté, liseré clair, sigle au centre. */
export function pastille(ctx: CanvasRenderingContext2D, x: number, y: number, r: number, couleur: string, code: string): void {
  ctx.beginPath()
  ctx.arc(x, y, r, 0, Math.PI * 2)
  ctx.fillStyle = 'rgba(8, 11, 20, 0.88)'
  ctx.fill()
  ctx.strokeStyle = couleur
  ctx.lineWidth = Math.max(2, r * 0.16)
  ctx.stroke()

  ctx.fillStyle = couleur
  ctx.textAlign = 'center'
  ctx.textBaseline = 'middle'
  ctx.font = `bold ${Math.round(r * (code.length > 2 ? 0.72 : 0.92))}px Archivo, sans-serif`
  ctx.fillText(code, x, y + 1)
  ctx.textAlign = 'left'
  ctx.textBaseline = 'alphabetic'
}

export async function copierImage(blob: Blob): Promise<void> {
  await navigator.clipboard.write([new ClipboardItem({ 'image/png': blob })])
}

export function telechargerImage(dataUrl: string, nom: string): void {
  const a = document.createElement('a')
  a.href = dataUrl
  a.download = `${nom.replace(/[^\w\-. ]+/g, '_').trim() || 'plan'}.png`
  a.click()
}
