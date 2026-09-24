import { useCallback, useEffect, useLayoutEffect, useRef, useState } from 'react'
import type { PointerEvent as ReactPointerEvent, RefObject } from 'react'
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
  cadre: RefObject<HTMLDivElement | null>
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
  const cadre = useRef<HTMLDivElement | null>(null)
  const [boite, setBoite] = useState({ w: 0, h: 0 })
  const [vue, setVue] = useState<Vue>({ x: 0, y: 0, k: 1 })
  const [panEnCours, setPan] = useState(false)
  const vueRef = useRef(vue)
  vueRef.current = vue

  // Largeur du monde quand le plan entier tient dans le cadre.
  const base = Math.max(1, Math.min(boite.w, boite.h * ratio))
  const baseRef = useRef(base)
  baseRef.current = base
  const monde = { w: base * vue.k, h: (base / ratio) * vue.k }

  const centrer = useCallback((k = 1) => {
    const el = cadre.current
    if (!el) return
    const b = baseRef.current
    setVue({ x: (el.clientWidth - b * k) / 2, y: (el.clientHeight - (b / ratio) * k) / 2, k })
  }, [ratio])

  useLayoutEffect(() => {
    const el = cadre.current
    if (!el) return
    const mesurer = () => setBoite({ w: el.clientWidth, h: el.clientHeight })
    mesurer()
    const ro = new ResizeObserver(mesurer)
    ro.observe(el)
    return () => ro.disconnect()
  }, [])

  // Premier affichage : le plan entier, centré.
  const cadré = useRef(false)
  useLayoutEffect(() => {
    if (cadré.current || boite.w === 0) return
    cadré.current = true
    centrer(1)
  }, [boite.w, centrer])

  const versPlan = useCallback(
    (e: { clientX: number; clientY: number }): PointPlan => {
      const el = cadre.current
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
    const el = cadre.current
    if (!el) return
    const onWheel = (e: WheelEvent) => {
      e.preventDefault()
      const r = el.getBoundingClientRect()
      const cx = e.clientX - r.left
      const cy = e.clientY - r.top
      setVue((v) => {
        const k = Math.min(K_MAX, Math.max(K_MIN, v.k * (e.deltaY < 0 ? 1.15 : 1 / 1.15)))
        if (k === v.k) return v
        const f = k / v.k
        return { k, x: cx - (cx - v.x) * f, y: cy - (cy - v.y) * f }
      })
    }
    el.addEventListener('wheel', onWheel, { passive: false })
    return () => el.removeEventListener('wheel', onWheel)
  }, [])

  const zoomer = useCallback((facteur: number) => {
    const el = cadre.current
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
