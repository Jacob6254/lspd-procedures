import type { Settings } from '@shared/types'
import type { Negociation } from '@shared/negociation'
import { labelFin } from '@shared/negociation'
import { imgUrl } from './api'
import { dateFr, heureFr } from './lib/format'

/** Feuille A4 à 150 points par pouce. */
const L = 1240
const H = 1754
const MARGE = 70

const SERIF = "Georgia, 'Times New Roman', serif"
const MACHINE = "'Courier New', Courier, monospace"

type Bloc =
  | { type: 'titre'; texte: string }
  | { type: 'ligne'; texte: string }
  | { type: 'puce'; texte: string; niveau?: number }
  | { type: 'vide' }
  | { type: 'image'; src: string; legende: string }

export interface PageRapport {
  dataUrl: string
  blob: Blob
}

// ---------- Outils de dessin ----------

function ligneH(ctx: CanvasRenderingContext2D, y: number, x1 = MARGE, x2 = L - MARGE, epaisseur = 1.5): void {
  ctx.fillStyle = '#000'
  ctx.fillRect(x1, y, x2 - x1, epaisseur)
}

function cadre(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, epaisseur = 1.5): void {
  ctx.strokeStyle = '#000'
  ctx.lineWidth = epaisseur
  ctx.strokeRect(x + epaisseur / 2, y + epaisseur / 2, w - epaisseur, h - epaisseur)
}

function texteEspace(ctx: CanvasRenderingContext2D, texte: string, x: number, y: number, espace: number): number {
  let cx = x
  for (const c of texte) {
    ctx.fillText(c, cx, y)
    cx += ctx.measureText(c).width + espace
  }
  return cx - x - espace
}

function largeurEspacee(ctx: CanvasRenderingContext2D, texte: string, espace: number): number {
  let w = 0
  for (const c of texte) w += ctx.measureText(c).width + espace
  return w - espace
}

function couper(ctx: CanvasRenderingContext2D, texte: string, largeur: number): string[] {
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

/** Sceau du LSPD, dessiné à la main pour ne dépendre d'aucun fichier. */
function dessinerSceau(ctx: CanvasRenderingContext2D, cx: number, cy: number, r: number): void {
  ctx.save()
  ctx.beginPath()
  ctx.arc(cx, cy, r, 0, Math.PI * 2)
  ctx.fillStyle = '#0d1b3e'
  ctx.fill()
  ctx.lineWidth = r * 0.09
  ctx.strokeStyle = '#c8a23c'
  ctx.stroke()

  ctx.beginPath()
  ctx.arc(cx, cy, r * 0.72, 0, Math.PI * 2)
  ctx.strokeStyle = '#e8e8ee'
  ctx.lineWidth = r * 0.04
  ctx.stroke()

  // Étoile centrale
  ctx.beginPath()
  const rr = r * 0.46
  for (let k = 0; k < 10; k++) {
    const angle = -Math.PI / 2 + (k * Math.PI) / 5
    const rayon = k % 2 === 0 ? rr : rr * 0.42
    const px = cx + Math.cos(angle) * rayon
    const py = cy + Math.sin(angle) * rayon
    k === 0 ? ctx.moveTo(px, py) : ctx.lineTo(px, py)
  }
  ctx.closePath()
  ctx.fillStyle = '#e9c65a'
  ctx.fill()

  // Texte circulaire
  ctx.fillStyle = '#f0f0f5'
  ctx.font = `bold ${Math.round(r * 0.17)}px ${MACHINE}`
  ctx.textAlign = 'center'
  ctx.textBaseline = 'middle'
  const haut = 'LOS SANTOS'
  const bas = 'POLICE DEPARTMENT'
const poser = (texte: string, centre: number, enBas: boolean) => {
    const pas = 0.135
    const demi = ((texte.length - 1) * pas) / 2
    for (let k = 0; k < texte.length; k++) {
      // En haut on tourne dans le sens des aiguilles, en bas dans l'autre, sinon le texte se lit à l'envers.
      const a = enBas ? centre + demi - k * pas : centre - demi + k * pas
      ctx.save()
      ctx.translate(cx + Math.cos(a) * r * 0.85, cy + Math.sin(a) * r * 0.85)
      ctx.rotate(a + (enBas ? -Math.PI / 2 : Math.PI / 2))
      ctx.fillText(texte[k], 0, 0)
      ctx.restore()
    }
  }
  poser(haut, -Math.PI / 2, false)
  poser(bas, Math.PI / 2, true)
  ctx.restore()
}

// ---------- En-têtes ----------

function enTetePremierePage(
  ctx: CanvasRenderingContext2D,
  settings: Settings,
  n: Negociation,
  numeroCase: string,
  page: number,
  total: number
): number {
  ctx.textAlign = 'left'
  ctx.textBaseline = 'alphabetic'
  ctx.fillStyle = '#000'

  ctx.font = `bold 21px ${SERIF}`
  const w = ctx.measureText('OFFICIAL DOCUMENT').width
  ctx.fillText('OFFICIAL DOCUMENT', L - MARGE - w, MARGE + 10)

  dessinerSceau(ctx, MARGE + 62, MARGE + 60, 60)

  ctx.textAlign = 'left'
  ctx.textBaseline = 'alphabetic'
  ctx.fillStyle = '#000'
  ctx.font = `bold 30px ${MACHINE}`
  const titre = 'LOS SANTOS POLICE DEPARTMENT'
  const lt = largeurEspacee(ctx, titre, 2.5)
  texteEspace(ctx, titre, (L - lt) / 2 + 40, MARGE + 52, 2.5)

  ctx.font = `26px ${MACHINE}`
  const sous = 'Mission Row'
  const ls = largeurEspacee(ctx, sous, 3)
  texteEspace(ctx, sous, (L - ls) / 2 + 40, MARGE + 88, 3)

  ctx.font = `bold italic 20px ${SERIF}`
  const devise = 'To Protect And To Serve'
  const ld = largeurEspacee(ctx, devise, 2)
  const xd = MARGE + 30
  texteEspace(ctx, devise, xd, MARGE + 150, 2)
  ctx.fillRect(xd, MARGE + 157, ld, 1.5)

  // Encadré du poste
  const bx = MARGE
  const by = MARGE + 185
  const bw = 470
  cadre(ctx, bx, by, bw, 56)
  ctx.fillStyle = '#e9e9e9'
  ctx.fillRect(bx + 2, by + 2, bw - 4, 30)
  ctx.fillStyle = '#000'
  ctx.font = `bold 17px ${SERIF}`
  ctx.textAlign = 'center'
  ctx.fillText('POLICE  DEPARTMENT', bx + bw / 2, by + 23)
  ctx.font = `17px ${SERIF}`
  ctx.fillText('Mission Row Station', bx + bw / 2, by + 50)

  // Quatre cases de référence
  const cy2 = by + 56
  const cases = [
    { t: 'Unit code', v: settings.unitCode || '20-S' },
    { t: 'Nmr Case', v: numeroCase },
    { t: 'Year', v: String(new Date(n.date || Date.now()).getFullYear() || new Date().getFullYear()) },
    { t: 'Nmr justice file', v: settings.nmrJustice || '1293' }
  ]
  const cw = bw / 4
  cadre(ctx, bx, cy2, bw, 62)
  cases.forEach((c, k) => {
    const x = bx + k * cw
    if (k > 0) ctx.fillRect(x, cy2, 1.5, 62)
    ctx.font = `italic 13px ${SERIF}`
    ctx.fillText(c.t, x + cw / 2, cy2 + 20)
    ctx.font = `bold 18px ${SERIF}`
    ctx.fillText(c.v, x + cw / 2, cy2 + 48)
  })

  // Titre du document et cases de droite
  ctx.font = `bold italic 22px ${SERIF}`
  ctx.textAlign = 'left'
  const ti = 'INCIDENT REPORT'
  const lti = ctx.measureText(ti).width
  ctx.fillText(ti, bx + bw + 90, by + 30)
  ctx.fillRect(bx + bw + 90, by + 38, lti, 1.5)

  const dx = L - MARGE - 300
  const dy = by + 70
  cadre(ctx, dx, dy, 300, 62)
  ctx.fillRect(dx + 150, dy, 1.5, 62)
  ctx.textAlign = 'center'
  ctx.font = `italic 13px ${SERIF}`
  ctx.fillText('Nmr room', dx + 75, dy + 20)
  ctx.fillText('N° feuillet', dx + 225, dy + 20)
  ctx.font = `bold 18px ${SERIF}`
  ctx.fillText(settings.nmrRoom || '0001', dx + 75, dy + 48)
  ctx.fillText(`${page} / ${total}`, dx + 225, dy + 48)

  // Date et affectation
  ctx.textAlign = 'left'
  let y = cy2 + 105
  ctx.font = `17px ${SERIF}`
  const dateTexte = `(Le ${dateFr(n.date)} à ${heureFr(n.heure)}).`
  ctx.fillText(dateTexte, MARGE, y)
  ctx.fillRect(MARGE, y + 6, ctx.measureText(dateTexte).width, 1.2)

  y += 40
  const grade = settings.grade?.trim() || 'Officer'
  const nom = `${settings.prenom?.trim() ?? ''} ${settings.nom?.trim() ?? ''}`.trim() || settings.nomAgent || '—'
  ctx.font = `17px ${SERIF}`
  ctx.fillText(`${grade} ${nom}, affecté à la Division Metro, Patrol of Area Mission Row.`, MARGE, y)

  y += 26
  ligneH(ctx, y)

  // Identité du rédacteur
  y += 44
  ctx.textAlign = 'center'
  ctx.font = `bold 20px ${SERIF}`
  ctx.fillText('IDENTITÉ DU RÉDACTEUR', L / 2, y)
  y += 20
  ligneH(ctx, y)

  ctx.textAlign = 'left'
  y += 40
  const champs: [string, string][] = [
    ['Sexe', settings.sexe ?? 'H'],
    ['Nom', settings.nom?.trim() || '—'],
    ['Prénom', settings.prenom?.trim() || '—'],
    ['Grade', settings.grade?.trim() || '—'],
    ['Spécialisation', settings.specialisation?.trim() || 'Négociateur']
  ]
  for (const [cle, valeur] of champs) {
    ctx.font = `italic 17px ${SERIF}`
    ctx.fillText(`${cle}`, MARGE, y)
    ctx.font = `bold 18px ${SERIF}`
    ctx.fillText(valeur, MARGE + 150, y)
    y += 30
  }

  y += 10
  ligneH(ctx, y)
  return y + 30
}

function enTeteSuite(ctx: CanvasRenderingContext2D, numeroCase: string, page: number, total: number): number {
  ctx.fillStyle = '#000'
  ctx.textAlign = 'left'
  ctx.textBaseline = 'alphabetic'
  dessinerSceau(ctx, MARGE + 34, MARGE + 30, 32)

  ctx.font = `bold 22px ${MACHINE}`
  const titre = 'LOS SANTOS POLICE DEPARTMENT'
  const lt = largeurEspacee(ctx, titre, 1.5)
  texteEspace(ctx, titre, (L - lt) / 2 + 20, MARGE + 28, 1.5)
  ctx.font = `16px ${MACHINE}`
  const sous = 'Mission Row'
  const ls = largeurEspacee(ctx, sous, 2)
  texteEspace(ctx, sous, (L - ls) / 2 + 20, MARGE + 52, 2)

  ctx.font = `italic 14px ${SERIF}`
  ctx.textAlign = 'right'
  ctx.fillText(`Nmr Case ${numeroCase} · N° feuillet ${page} / ${total}`, L - MARGE, MARGE + 52)
  ctx.textAlign = 'left'

  const y = MARGE + 72
  ligneH(ctx, y)
  return y + 34
}

// ---------- Contenu ----------

function blocsNegociation(n: Negociation): Bloc[] {
  const b: Bloc[] = []
  const lieu = n.lieu.trim() || n.typeLieu || 'un établissement'
  b.push({ type: 'ligne', texte: `Ce jour, nous intervenons sur une prise d’otages à ${lieu}.` })
  b.push({ type: 'vide' })

  b.push({ type: 'titre', texte: '1. SITUATION INITIALE' })
  b.push({ type: 'puce', texte: `Type d’incident : prise d’otages${n.typeLieu ? ` — ${n.typeLieu}` : ''}` })
  b.push({ type: 'puce', texte: `Nombre de braqueurs : ${n.braqueurs ?? '—'}` })
  b.push({ type: 'puce', texte: `Nombre d’otages : ${n.otagesAnnonces ?? n.otages.length}` })
  b.push({ type: 'puce', texte: `Périmètre : ${n.perimetre ? 'mis en place et tenu' : 'non confirmé'}` })
  const equipe = [n.negociateur && `négociateur ${n.negociateur}`, n.relayeur && `relayeur ${n.relayeur}`].filter(Boolean).join(', ')
  if (equipe) b.push({ type: 'puce', texte: `Équipe : ${equipe}` })
  if (n.agents.length) b.push({ type: 'puce', texte: `Agents présents : ${n.agents.join(', ')}` })
  if (n.offRadio) b.push({ type: 'puce', texte: 'Négociateur passé en OFF radio, relayeur présent sur scène.' })

  if (n.vehicules.length) {
    b.push({ type: 'vide' })
    b.push({ type: 'ligne', texte: 'Véhicules identifiés :' })
    for (const v of n.vehicules) {
      b.push({ type: 'puce', texte: `Plaque : ${v.plaque.trim() || '[non relevée]'}${v.description.trim() ? ` — ${v.description.trim()}` : ''}` })
      for (const img of v.photos) b.push({ type: 'image', src: imgUrl(img.file), legende: `Photo de la plaque ${v.plaque.trim()}` })
    }
  }
  if (n.photosSuspects.length) {
    b.push({ type: 'vide' })
    b.push({ type: 'ligne', texte: 'Photos des individus :' })
    for (const img of n.photosSuspects) b.push({ type: 'image', src: imgUrl(img.file), legende: 'Photo des suspects sur place' })
  }

  b.push({ type: 'vide' })
  b.push({ type: 'titre', texte: '2. IDENTIFICATION DES OTAGES' })
  if (n.otages.length === 0) {
    b.push({ type: 'puce', texte: 'Aucun otage identifié.' })
  } else {
    n.otages.forEach((o, k) => {
      const etat = o.recherche === 'oui' ? 'RECHERCHÉ' : o.recherche === 'non' ? 'non recherché' : 'non vérifié'
      const suite = o.arrete ? ' → arrestation après le braquage' : ''
      b.push({ type: 'puce', texte: `Otage ${k + 1} : ${o.nom.trim() || '[identité non relevée]'} — ${etat}${suite}` })
      if (o.note.trim()) b.push({ type: 'puce', texte: o.note.trim(), niveau: 2 })
      for (const img of o.identite) b.push({ type: 'image', src: imgUrl(img.file), legende: `Carte d’identité — otage ${k + 1}` })
    })
  }

  b.push({ type: 'vide' })
  b.push({ type: 'titre', texte: '3. DÉROULEMENT DE LA NÉGOCIATION' })
  if (n.echanges.length === 0) {
    b.push({ type: 'puce', texte: 'Aucune revendication accordée.' })
  } else {
    for (const e of n.echanges) {
      b.push({
        type: 'puce',
        texte: `Revendication : ${e.revendication.trim() || '[non précisée]'} → ${e.contrepartie.trim() || 'contrepartie non précisée'}`
      })
    }
  }
  if (n.demandesAtypiques.trim()) {
    b.push({ type: 'puce', texte: `Demande atypique transmise aux hauts gradés : ${n.demandesAtypiques.trim()}` })
  }
  const arme = n.armeUtilisee
    ? `Oui${n.armeMotifs.length ? ` — ${n.armeMotifs.join(', ')}` : ''}${n.armeDetail.trim() ? `. ${n.armeDetail.trim()}` : ''}`
    : 'Non'
  b.push({ type: 'puce', texte: `Armes utilisées par les forces de l’ordre : ${arme}` })
  if (n.deroulement.trim()) {
    b.push({ type: 'vide' })
    for (const l of n.deroulement.trim().split('\n')) if (l.trim()) b.push({ type: 'ligne', texte: l.trim() })
  }

  b.push({ type: 'vide' })
  b.push({ type: 'titre', texte: '4. FIN DE L’OPÉRATION' })
  b.push({ type: 'puce', texte: `Résultat final : ${labelFin(n.finType, n.finArretes)}` })
  const arretes = n.finType === 'arretes-tous' ? (n.braqueurs ?? 0) : n.finType === 'arretes-partiel' ? (n.finArretes ?? 0) : 0
  const fuite = Math.max(0, (n.braqueurs ?? 0) - arretes)
  b.push({ type: 'puce', texte: `${arretes} individu(s) arrêté(s) sur place` })
  b.push({ type: 'puce', texte: `${fuite} individu(s) en fuite` })
  const otagesArretes = n.otages.filter((o) => o.arrete).length
  if (otagesArretes) b.push({ type: 'puce', texte: `${otagesArretes} otage(s) recherché(s) interpellé(s) après le braquage` })
  b.push({ type: 'puce', texte: n.poursuite ? 'Course-poursuite engagée à la sortie' : 'Aucune course-poursuite' })
  if (n.finDetail.trim()) for (const l of n.finDetail.trim().split('\n')) if (l.trim()) b.push({ type: 'puce', texte: l.trim() })

  b.push({ type: 'vide' })
  b.push({ type: 'titre', texte: '5. RÉSUMÉ RAPIDE' })
  for (const l of (n.resume.trim() || resumeAuto(n)).split('\n')) if (l.trim()) b.push({ type: 'ligne', texte: l.trim() })

  return b
}

export function resumeAuto(n: Negociation): string {
  const lieu = n.lieu.trim() || n.typeLieu || 'établissement'
  const libere = n.echanges.length
  const recherches = n.otages.filter((o) => o.arrete).length
  const morceaux = [
    `Prise d’otages à ${lieu} — ${n.braqueurs ?? '—'} braqueur(s) / ${n.otagesAnnonces ?? n.otages.length} otage(s).`,
    recherches ? `${recherches} otage(s) recherché(s) interpellé(s).` : '',
    libere ? `${libere} otage(s) libéré(s) contre ${libere} revendication(s).` : '',
    `${labelFin(n.finType, n.finArretes)}.`
  ]
  return morceaux.filter(Boolean).join(' ')
}

// ---------- Rendu ----------

function chargerImage(src: string): Promise<HTMLImageElement | null> {
  return new Promise((ok) => {
    const img = new Image()
    img.onload = () => ok(img)
    img.onerror = () => ok(null)
    img.src = src
  })
}

export async function genererRapportNego(n: Negociation, settings: Settings, numeroCase: string): Promise<PageRapport[]> {
  const blocs = blocsNegociation(n)

  // Les images sont chargées une fois pour toutes avant la mise en page.
  const images = new Map<string, HTMLImageElement>()
  for (const b of blocs) {
    if (b.type === 'image' && !images.has(b.src)) {
      const img = await chargerImage(b.src)
      if (img) images.set(b.src, img)
    }
  }

  const rendre = (total: number): PageRapport[] => {
    const pages: PageRapport[] = []
    let index = 0
    let page = 1

    while (index < blocs.length || page === 1) {
      const canvas = document.createElement('canvas')
      canvas.width = L
      canvas.height = H
      const ctx = canvas.getContext('2d')!
      ctx.fillStyle = '#fff'
      ctx.fillRect(0, 0, L, H)

      const haut = page === 1 ? enTetePremierePage(ctx, settings, n, numeroCase, page, total) : enTeteSuite(ctx, numeroCase, page, total)

      // Grande zone « LE RAPPORT »
      const bx = MARGE
      const bw = L - MARGE * 2
      const bh = H - haut - MARGE
      cadre(ctx, bx, haut, bw, bh, 2)

      let y = haut + 46
      const gauche = bx + 34
      const droite = bx + bw - 34
      const largeur = droite - gauche
      const bas = haut + bh - 34

      ctx.fillStyle = '#000'
      ctx.textAlign = 'left'
      ctx.font = `bold 21px ${SERIF}`
      ctx.fillText(`LE RAPPORT - du ${dateFr(n.date)} à ${heureFr(n.heure)}${page > 1 ? ' (suite)' : ''}`, gauche, y)
      y += 40

      while (index < blocs.length) {
        const b = blocs[index]
        let hauteur = 0

        if (b.type === 'vide') hauteur = 16
        else if (b.type === 'image') {
          const img = images.get(b.src)
          hauteur = img ? Math.min(300, (img.height / img.width) * 420) + 34 : 26
        } else {
          ctx.font = b.type === 'titre' ? `bold 19px ${SERIF}` : `17px ${SERIF}`
          const retrait = b.type === 'puce' ? (b.niveau === 2 ? 60 : 30) : 0
          hauteur = couper(ctx, b.texte, largeur - retrait).length * 26 + (b.type === 'titre' ? 12 : 0)
        }

        if (y + hauteur > bas && index > 0) break

        // Une ligne qui annonce une image part avec elle à la page suivante.
        const apres = blocs[index + 1]
        if ((b.type === 'ligne' || b.type === 'puce') && apres?.type === 'image') {
          const suivante = images.get(apres.src)
          const hImage = suivante ? Math.min(300, (suivante.height / suivante.width) * 420) + 34 : 26
          if (y + hauteur + hImage > bas) break
        }

        if (b.type === 'vide') {
          y += 16
        } else if (b.type === 'image') {
          const img = images.get(b.src)
          if (img) {
            const w = Math.min(420, img.width)
            const h = (img.height / img.width) * w
            const hh = Math.min(300, h)
            const ww = (img.width / img.height) * hh
            ctx.drawImage(img, gauche + 30, y, ww, hh)
            ctx.strokeStyle = '#000'
            ctx.lineWidth = 1
            ctx.strokeRect(gauche + 30, y, ww, hh)
            ctx.font = `italic 14px ${SERIF}`
            ctx.fillText(b.legende, gauche + 30, y + hh + 20)
            y += hh + 34
          } else {
            ctx.font = `italic 16px ${SERIF}`
            ctx.fillText(`[ ${b.legende} ]`, gauche + 30, y + 16)
            y += 26
          }
        } else {
          ctx.font = b.type === 'titre' ? `bold 19px ${SERIF}` : `17px ${SERIF}`
          const retrait = b.type === 'puce' ? (b.niveau === 2 ? 60 : 30) : 0
          const lignes = couper(ctx, b.texte, largeur - retrait)
          lignes.forEach((l, k) => {
            const prefixe = b.type === 'puce' && k === 0 ? '• ' : ''
            ctx.fillText(prefixe + l, gauche + retrait + (b.type === 'puce' && k > 0 ? 16 : 0), y + 18)
            y += 26
          })
          if (b.type === 'titre') y += 12
        }
        index++
      }

      pages.push({ dataUrl: canvas.toDataURL('image/png'), blob: dataUrlVersBlob(canvas.toDataURL('image/png')) })
      page++
      if (page > 12) break
    }
    return pages
  }

  // Premier passage pour connaître le nombre de feuillets, second pour l'écrire.
  const essai = rendre(1)
  return rendre(essai.length)
}

function dataUrlVersBlob(dataUrl: string): Blob {
  const [entete, data] = dataUrl.split(',')
  const binaire = atob(data)
  const buffer = new Uint8Array(binaire.length)
  for (let k = 0; k < binaire.length; k++) buffer[k] = binaire.charCodeAt(k)
  return new Blob([buffer], { type: entete.includes('png') ? 'image/png' : 'image/jpeg' })
}
