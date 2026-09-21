import { useEffect } from 'react'
import { useStore } from './store'
import { api } from './api'

let audio: AudioContext | null = null

/** Petit « clic » d'appareil photo quand un screen est ajouté. */
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
    }
  }, [])
}
