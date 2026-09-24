import { useCallback, useEffect, useLayoutEffect, useRef, useState } from 'react'
import type { PointerEvent as ReactPointerEvent } from 'react'
import type { PointPlan } from '@shared/plan'

/**
 * Le déplacement et le zoom, partagés par la carte tactique et le tableau
 * d'enquête. Tout ce qui est posé sur un plan est rangé en coordonnées 0 à 1 :
 * on peut changer de fond, de taille d'écran ou de zoom sans rien déplacer.
 */

export interface Vue {
  /** Décalage du monde dans le cadre, en pixels. */
  x: number
  y: number
  /** Échelle : 1 = le plan entier tient dans le cadre. */
  k: number
}

const K_MIN = 0.6
const K_MAX = 14

export interface CtrlPlan {
  /**
   * À poser sur le cadre : `ref={ctrl.cadre}`. C'est une fonction et non un
   * objet, pour que la mesure démarre à l'instant où le cadre entre dans la
   * page : l'éditeur affiche d'abord un écran de chargement, et le cadre
   * n'existe pas encore au premier rendu.
   */
  cadre: (el: HTMLDivElement | null) => void
  vue: Vue
  /** Taille du monde à l'écran, en pixels. */
  monde: { w: number; h: number }
  /** Position d'un événement souris dans le plan (0 à 1). */
  versPlan(e: { clientX: number; clientY: number }): PointPlan
  /** Position d'un point du plan dans le cadre, en pixels. */
  versEcran(p: PointPlan): { x: number; y: number }
  zoomer(facteur: number): void
  recadrer(): void
  demarrerPan(e: ReactPointerEvent): void
  /** Vrai pendant un glissement : sert à ne pas déclencher le clic derrière. */
  panEnCours: boolean
  pret: boolean
}

export function usePlan(ratio: number): CtrlPlan {
  const element = useRef<HTMLDivElement | null>(null)
  const [noeud, setNoeud] = useState<HTMLDivElement | null>(null)
  const [boite, setBoite] = useState({ w: 0, h: 0 })
  const [vue, setVue] = useState<Vue>({ x: 0, y: 0, k: 1 })
  const [panEnCours, setPan] = useState(false)
  const vueRef = useRef(vue)
  vueRef.current = vue

  const cadre = useCallback((el: HTMLDivElement | null) => {
    element.current = el
    setNoeud(el)
  }, [])

  // Largeur du monde quand le plan entier tient dans le cadre.
  const base = Math.max(1, Math.min(boite.w, boite.h * ratio))
  const baseRef = useRef(base)
  baseRef.current = base
  const monde = { w: base * vue.k, h: (base / ratio) * vue.k }

  const centrer = useCallback(
    (k = 1) => {
      const el = element.current
      if (!el) return
      const b = baseRef.current
      setVue({ x: (el.clientWidth - b * k) / 2, y: (el.clientHeight - (b / ratio) * k) / 2, k })
    },
    [ratio]
  )

  useLayoutEffect(() => {
    if (!noeud) return
    const mesurer = () => setBoite({ w: noeud.clientWidth, h: noeud.clientHeight })
    mesurer()
    const ro = new ResizeObserver(mesurer)
    ro.observe(noeud)
    // Filet de sécurité : si le cadre naît dans une fenêtre de largeur nulle
    // (onglet en arrière-plan, panneau replié), l'observateur peut ne rien voir.
    window.addEventListener('resize', mesurer)
    return () => {
      ro.disconnect()
      window.removeEventListener('resize', mesurer)
    }
  }, [noeud])

  // Premier affichage : le plan entier, centré. Ensuite, quand la fenêtre
  // change de taille, on garde sous les yeux le point qu'on regardait.
  const cadrage = useRef(false)
  const precedent = useRef({ base: 0, w: 0, h: 0 })
  useLayoutEffect(() => {
    if (boite.w === 0 || boite.h === 0) return
    const avant = precedent.current
    precedent.current = { base, w: boite.w, h: boite.h }

    if (!cadrage.current) {
      cadrage.current = true
      setVue({ x: (boite.w - base) / 2, y: (boite.h - base / ratio) / 2, k: 1 })
      return
    }
    if (avant.base === base && avant.w === boite.w && avant.h === boite.h) return

    setVue((v) => {
      const vise = {
        x: (avant.w / 2 - v.x) / (avant.base * v.k),
        y: (avant.h / 2 - v.y) / ((avant.base / ratio) * v.k)
      }
      return { ...v, x: boite.w / 2 - vise.x * base * v.k, y: boite.h / 2 - vise.y * (base / ratio) * v.k }
    })
  }, [base, boite.w, boite.h, ratio])

  const versPlan = useCallback(
    (e: { clientX: number; clientY: number }): PointPlan => {
      const el = element.current
      const v = vueRef.current
      const b = baseRef.current
      if (!el) return { x: 0.5, y: 0.5 }
      const r = el.getBoundingClientRect()
      return {
        x: (e.clientX - r.left - v.x) / (b * v.k),
        y: (e.clientY - r.top - v.y) / ((b / ratio) * v.k)
      }
    },
    [ratio]
  )

  const versEcran = useCallback(
    (p: PointPlan) => {
      const v = vueRef.current
      const b = baseRef.current
      return { x: v.x + p.x * b * v.k, y: v.y + p.y * (b / ratio) * v.k }
    },
    [ratio]
  )

  // Zoom à la molette, centré sur le curseur.
  useEffect(() => {
    if (!noeud) return
    const onWheel = (e: WheelEvent) => {
      e.preventDefault()
      const r = noeud.getBoundingClientRect()
      const cx = e.clientX - r.left
      const cy = e.clientY - r.top
      setVue((v) => {
        const k = Math.min(K_MAX, Math.max(K_MIN, v.k * (e.deltaY < 0 ? 1.15 : 1 / 1.15)))
        if (k === v.k) return v
        const f = k / v.k
        return { k, x: cx - (cx - v.x) * f, y: cy - (cy - v.y) * f }
      })
    }
    noeud.addEventListener('wheel', onWheel, { passive: false })
    return () => noeud.removeEventListener('wheel', onWheel)
  }, [noeud])

  const zoomer = useCallback((facteur: number) => {
    const el = element.current
    if (!el) return
    const cx = el.clientWidth / 2
    const cy = el.clientHeight / 2
    setVue((v) => {
      const k = Math.min(K_MAX, Math.max(K_MIN, v.k * facteur))
      const f = k / v.k
      return { k, x: cx - (cx - v.x) * f, y: cy - (cy - v.y) * f }
    })
  }, [])

  const demarrerPan = useCallback((e: ReactPointerEvent) => {
    const depart = { x: e.clientX, y: e.clientY }
    const debut = { ...vueRef.current }
    let bouge = false
    const cible = e.currentTarget as HTMLElement
    cible.setPointerCapture?.(e.pointerId)

    const move = (m: PointerEvent) => {
      const dx = m.clientX - depart.x
      const dy = m.clientY - depart.y
      if (!bouge && Math.hypot(dx, dy) < 3) return
      if (!bouge) {
        bouge = true
        setPan(true)
      }
      setVue({ ...debut, x: debut.x + dx, y: debut.y + dy })
    }
    const up = () => {
      window.removeEventListener('pointermove', move)
      window.removeEventListener('pointerup', up)
      cible.releasePointerCapture?.(e.pointerId)
      // On relâche au tour suivant pour que le clic qui suit soit ignoré.
      if (bouge) setTimeout(() => setPan(false), 0)
    }
    window.addEventListener('pointermove', move)
    window.addEventListener('pointerup', up)
  }, [])

  return {
    cadre,
    vue,
    monde,
    versPlan,
    versEcran,
    zoomer,
    recadrer: () => centrer(1),
    demarrerPan,
    panEnCours,
    pret: boite.w > 0
  }
}

/** Glissement d'un élément posé sur le plan, en coordonnées 0 à 1. */
export function glisser(
  e: ReactPointerEvent,
  ctrl: CtrlPlan,
  depart: PointPlan,
  bouger: (p: PointPlan) => void,
  fini?: () => void
): void {
  e.stopPropagation()
  const origine = ctrl.versPlan(e)
  const ecart = { x: depart.x - origine.x, y: depart.y - origine.y }
  const move = (m: PointerEvent) => {
    const p = ctrl.versPlan(m)
    bouger({ x: Math.min(1, Math.max(0, p.x + ecart.x)), y: Math.min(1, Math.max(0, p.y + ecart.y)) })
  }
  const up = () => {
    window.removeEventListener('pointermove', move)
    window.removeEventListener('pointerup', up)
    fini?.()
  }
  window.addEventListener('pointermove', move)
  window.addEventListener('pointerup', up)
}
