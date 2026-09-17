import { useEffect } from 'react'
import { create } from 'zustand'
import { useStore } from './store'
import { api } from './api'

let audio: AudioContext | null = null

/** Petit « clic » d'appareil photo quand un screen est pris. */
export function playShutter(): void {
  audio ??= new AudioContext()
  const ctx = audio
  const t = ctx.currentTime
  for (const [freq, start] of [
    [1320, 0],
    [1760, 0.07]
  ] as const) {
    const osc = ctx.createOscillator()
    const gain = ctx.createGain()
    osc.type = 'sine'
    osc.frequency.value = freq
    gain.gain.setValueAtTime(0.0001, t + start)
    gain.gain.exponentialRampToValueAtTime(0.2, t + start + 0.01)
    gain.gain.exponentialRampToValueAtTime(0.0001, t + start + 0.09)
    osc.connect(gain).connect(ctx.destination)
    osc.start(t + start)
    osc.stop(t + start + 0.1)
  }
}

/** Envoie des fichiers image au serveur et les range dans la zone visée. */
export async function saveFiles(files: File[]): Promise<number> {
  let count = 0
  for (const f of files) {
    if (!f.type.startsWith('image/')) continue
    const st = useStore.getState()
    try {
      const img = await api.saveImage(f)
      useStore.getState().addImage(st.captureTarget, img)
      count++
    } catch (err) {
      st.toast('error', err instanceof Error ? err.message : 'Envoi de l’image impossible')
    }
  }
  if (count === 0 && files.length > 0 && !files.some((f) => f.type.startsWith('image/'))) {
    useStore.getState().toast('error', 'Ce fichier n’est pas une image.')
  }
  return count
}

interface ShareState {
  stream: MediaStream | null
  video: HTMLVideoElement | null
  countdown: number
  start(): Promise<void>
  stop(): void
  grab(delaySeconds?: number): Promise<void>
}

/** Partage d'écran : on garde le flux ouvert et on prend une image quand on clique sur « Capturer ». */
export const useScreenShare = create<ShareState>((set, get) => ({
  stream: null,
  video: null,
  countdown: 0,

  async start() {
    const { toast } = useStore.getState()
    if (!navigator.mediaDevices?.getDisplayMedia) {
      toast('error', 'Ton navigateur ne permet pas le partage d’écran (utilise Chrome ou Edge, sur un site en https).')
      return
    }
    try {
      const stream = await navigator.mediaDevices.getDisplayMedia({ video: { frameRate: 5 }, audio: false })
      const video = document.createElement('video')
      video.muted = true
      video.playsInline = true
      video.srcObject = stream
      await video.play()
      stream.getVideoTracks()[0]?.addEventListener('ended', () => get().stop())
      set({ stream, video })
      toast('ok', 'Écran partagé : clique sur « Capturer » pour prendre un screen.')
    } catch (err) {
      if (err instanceof DOMException && err.name === 'NotAllowedError') return
      toast('error', 'Partage d’écran impossible.')
    }
  },

  stop() {
    get().stream?.getTracks().forEach((t) => t.stop())
    set({ stream: null, video: null, countdown: 0 })
  },

  async grab(delaySeconds = 0) {
    for (let s = delaySeconds; s > 0; s--) {
      set({ countdown: s })
      await new Promise((r) => setTimeout(r, 1000))
    }
    set({ countdown: 0 })
    const { video } = get()
    const st = useStore.getState()
    if (!video || !video.videoWidth) {
      st.toast('error', 'Aucun écran partagé.')
      return
    }
    const canvas = document.createElement('canvas')
    canvas.width = video.videoWidth
    canvas.height = video.videoHeight
    canvas.getContext('2d')!.drawImage(video, 0, 0)
    const blob = await new Promise<Blob | null>((ok) => canvas.toBlob(ok, 'image/png'))
    if (!blob) {
      st.toast('error', 'Capture impossible.')
      return
    }
    try {
      const img = await api.saveImage(blob)
      const cur = useStore.getState()
      const where = cur.addImage(cur.captureTarget, img)
      playShutter()
      cur.toast('ok', `Screen ajouté → ${where}`)
    } catch (err) {
      st.toast('error', err instanceof Error ? err.message : 'Envoi du screen impossible')
    }
  }
}))

/** Ctrl+V n'importe où dans la page et glisser-déposer. */
export function useCaptureBridge(): void {
  useEffect(() => {
    function onPaste(e: ClipboardEvent) {
      const files = Array.from(e.clipboardData?.files ?? []).filter((f) => f.type.startsWith('image/'))
      if (!files.length) return
      e.preventDefault()
      void saveFiles(files).then((n) => {
        if (n) useStore.getState().toast('ok', n > 1 ? `${n} images collées` : 'Image collée')
      })
    }
    // Empêche le navigateur d'ouvrir une image lâchée hors d'une zone de screens.
    const block = (e: DragEvent) => e.preventDefault()

    window.addEventListener('paste', onPaste)
    window.addEventListener('dragover', block)
    window.addEventListener('drop', block)
    return () => {
      window.removeEventListener('paste', onPaste)
      window.removeEventListener('dragover', block)
      window.removeEventListener('drop', block)
      useScreenShare.getState().stop()
    }
  }, [])
}
