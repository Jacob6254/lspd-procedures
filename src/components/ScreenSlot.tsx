import { useEffect, useState, type DragEvent } from 'react'
import { Camera, ChevronLeft, ChevronRight, Copy, Crosshair, Download, ImagePlus, Trash2, X } from 'lucide-react'
import type { ImageRef } from '@shared/types'
import { type CaptureTarget, useStore } from '../store'
import { dateTimeFr } from '../lib/format'
import { api, imgUrl } from '../api'
import { saveFiles, useScreenShare } from '../capture'
import { ConfirmButton } from './ui'

export function sameTarget(a: CaptureTarget | null, b: CaptureTarget | null): boolean {
  return !!a && !!b && a.interventionId === b.interventionId && a.suspectId === b.suspectId && a.slot === b.slot
}

export function ScreenSlot(props: {
  target: CaptureTarget
  images: ImageRef[]
  title: string
  hint?: string
  single?: boolean
  portrait?: boolean
}) {
  const captureTarget = useStore((s) => s.captureTarget)
  const setCaptureTarget = useStore((s) => s.setCaptureTarget)
  const removeImage = useStore((s) => s.removeImage)
  const sharing = useScreenShare((s) => !!s.stream)
  const grab = useScreenShare((s) => s.grab)
  const [over, setOver] = useState(false)
  const [viewer, setViewer] = useState<number | null>(null)
  const active = sameTarget(captureTarget, props.target)

  async function onDrop(e: DragEvent) {
    e.preventDefault()
    setOver(false)
    setCaptureTarget(props.target)
    await saveFiles(Array.from(e.dataTransfer.files))
  }

  return (
    <div
      className={`slot ${active ? 'slot-active' : ''} ${over ? 'slot-over' : ''}`}
      onDragOver={(e) => {
        e.preventDefault()
        setOver(true)
      }}
      onDragLeave={() => setOver(false)}
      onDrop={onDrop}
      onMouseDown={() => setCaptureTarget(props.target)}
    >
      <div className="slot-head">
        <div>
          <strong>{props.title}</strong>
          <span className="slot-count">{props.images.length}</span>
        </div>
        <div className="row gap-8">
          {sharing && (
            <button
              type="button"
              className="slot-target on"
              title="Prend un screen de l’écran partagé et le range ici"
              onClick={() => {
                setCaptureTarget(props.target)
                void grab()
              }}
            >
              <Camera size={13} /> Capturer
            </button>
          )}
          <button
            type="button"
            className={`slot-target ${active ? 'on' : ''}`}
            title="Les screens collés avec Ctrl+V ou capturés arrivent ici"
            onClick={() => setCaptureTarget(props.target)}
          >
            <Crosshair size={13} />
            {active ? 'Ctrl+V → ici' : 'Viser ici'}
          </button>
        </div>
      </div>

      {props.images.length === 0 ? (
        <div className={`slot-empty ${props.portrait ? 'portrait' : ''}`}>
          <ImagePlus size={22} />
          <span>{props.hint ?? 'Colle ton screen avec Ctrl+V, glisse une image ici, ou utilise « Capturer »'}</span>
        </div>
      ) : (
        <div className={`slot-grid ${props.single ? 'single' : ''} ${props.portrait ? 'portrait' : ''}`}>
          {props.images.map((img, idx) => (
            <button type="button" key={img.id} className="thumb" onClick={() => setViewer(idx)}>
              <img src={imgUrl(img.file)} alt="" loading="lazy" draggable={false} />
            </button>
          ))}
        </div>
      )}

      {viewer !== null && props.images[viewer] && (
        <Lightbox
          images={props.images}
          index={viewer}
          onIndex={setViewer}
          onClose={() => setViewer(null)}
          onDelete={(img) => {
            removeImage(props.target, img.id)
            const left = props.images.length - 1
            setViewer(left <= 0 ? null : Math.min(viewer, left - 1))
          }}
        />
      )}
    </div>
  )
}

export function Lightbox(props: {
  images: ImageRef[]
  index: number
  onIndex: (i: number) => void
  onClose: () => void
  onDelete: (img: ImageRef) => void
}) {
  const toast = useStore((s) => s.toast)
  const img = props.images[props.index]
  const count = props.images.length

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === 'Escape') props.onClose()
      if (e.key === 'ArrowRight') props.onIndex((props.index + 1) % count)
      if (e.key === 'ArrowLeft') props.onIndex((props.index - 1 + count) % count)
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [props, count])

  if (!img) return null
  return (
    <div className="lightbox" onMouseDown={(e) => e.stopPropagation()} onClick={props.onClose}>
      <div className="lightbox-bar" onClick={(e) => e.stopPropagation()}>
        <span>
          {props.index + 1} / {count} · {dateTimeFr(img.createdAt)}
        </span>
        <div className="row gap-8">
          <button
            type="button"
            className="btn"
            onClick={async () => {
              try {
                await api.copyImage(img.file)
                toast('ok', 'Image copiée : colle-la avec Ctrl+V dans le MDT ou sur Discord.')
              } catch {
                toast('error', 'Copie impossible : utilise « Télécharger » (la copie d’image demande un site en https).')
              }
            }}
          >
            <Copy size={15} /> Copier l’image
          </button>
          <button type="button" className="btn" onClick={() => api.downloadImage(img.file)}>
            <Download size={15} /> Télécharger
          </button>
          <ConfirmButton icon={Trash2} label="Supprimer" onConfirm={() => props.onDelete(img)} />
          <button type="button" className="btn btn-icon" aria-label="Fermer" onClick={props.onClose}>
            <X size={18} />
          </button>
        </div>
      </div>
      <div className="lightbox-stage">
        {count > 1 && (
          <button
            type="button"
            className="lightbox-nav left"
            aria-label="Précédent"
            onClick={(e) => {
              e.stopPropagation()
              props.onIndex((props.index - 1 + count) % count)
            }}
          >
            <ChevronLeft size={26} />
          </button>
        )}
        <img src={imgUrl(img.file)} alt="" onClick={(e) => e.stopPropagation()} />
        {count > 1 && (
          <button
            type="button"
            className="lightbox-nav right"
            aria-label="Suivant"
            onClick={(e) => {
              e.stopPropagation()
              props.onIndex((props.index + 1) % count)
            }}
          >
            <ChevronRight size={26} />
          </button>
        )}
      </div>
    </div>
  )
}
