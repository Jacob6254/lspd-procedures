import { useEffect, useState } from 'react'
import { RefreshCw, WifiOff } from 'lucide-react'
import { useStore } from './store'
import { useAuth } from './auth'
import { api } from './api'
import { useCaptureBridge } from './capture'
import { useWeapons } from './weapons'
import { Sidebar } from './components/Sidebar'
import { Toasts } from './components/Toasts'
import { AccueilPage } from './pages/Accueil'
import { DossierPage } from './pages/Dossier'
import { HistoriquePage } from './pages/Historique'
import { ArmesPage } from './pages/Armes'
import { CodesRadioPage } from './pages/CodesRadio'
import { SupervisionPage } from './pages/Supervision'
import { FormationPage } from './pages/Formation'
import { FormationAdminPage } from './pages/FormationAdmin'
import { NotesBanner } from './components/NotesBanner'
import { ControlBanner } from './components/ControlBanner'
import { hasUnsavedChanges } from './store'
import { NegociationsPage } from './pages/Negociations'
import { NegociationPage } from './pages/Negociation'
import { NegoGuidePage } from './pages/NegoGuide'
import { ReglagesPage } from './pages/Reglages'
import { LoginPage } from './pages/Login'

function Workspace() {
  const ready = useStore((s) => s.ready)
  const route = useStore((s) => s.route)
  const init = useStore((s) => s.init)
  const go = useStore((s) => s.go)
  const exists = useStore((s) => route.page !== 'dossier' || s.db.interventions.some((i) => i.id === route.id))
  const [error, setError] = useState('')
  useCaptureBridge()

  useEffect(() => {
    if (ready) return
    api
      .loadDb()
      .then(init)
      .catch((err) => setError(err instanceof Error ? err.message : 'Chargement impossible'))
    void useWeapons.getState().load()
  }, [ready, init])

  useEffect(() => {
    if (!exists) go({ page: 'accueil' })
  }, [exists, go])

  // Suivi en direct : si l'autre personne (agent ou superviseur) modifie le dossier, on récupère sa version.
  useEffect(() => {
    const t = setInterval(async () => {
      if (document.hidden || hasUnsavedChanges()) return
      try {
        const { rev } = await api.dbState()
        const st = useStore.getState()
        if (rev === st.rev) return
        st.replaceDb(await api.loadDb())
        st.toast('info', 'Dossier mis à jour à l’instant.')
      } catch {
        // hors ligne : on réessaiera au prochain tour
      }
    }, 4000)
    return () => clearInterval(t)
  }, [])

  if (error) {
    return (
      <div className="splash">
        <div className="stack gap-12" style={{ alignItems: 'center' }}>
          <WifiOff size={28} />
          <span>{error}</span>
          <button type="button" className="btn" onClick={() => location.reload()}>
            <RefreshCw size={15} /> Réessayer
          </button>
        </div>
      </div>
    )
  }
  if (!ready) return <div className="splash">Chargement de tes dossiers…</div>

  return (
    <div className="app">
      <Sidebar />
      <main className="main">
        <ControlBanner />
        <NotesBanner />
        {route.page === 'accueil' && <AccueilPage />}
        {route.page === 'dossier' && <DossierPage key={route.id} id={route.id} tab={route.tab} step={route.step} />}
        {route.page === 'historique' && <HistoriquePage />}
        {route.page === 'armes' && <ArmesPage />}
        {route.page === 'radio' && <CodesRadioPage />}
        {route.page === 'supervision' && <SupervisionPage />}
        {route.page === 'formation' && <FormationPage />}
        {route.page === 'formation-admin' && <FormationAdminPage />}
        {route.page === 'negociations' && <NegociationsPage />}
        {route.page === 'negociation' && <NegociationPage key={route.id} id={route.id} />}
        {route.page === 'nego-guide' && <NegoGuidePage />}
        {route.page === 'reglages' && <ReglagesPage />}
      </main>
    </div>
  )
}

export default function App() {
  const status = useAuth((s) => s.status)
  const check = useAuth((s) => s.check)
  const wasReady = useStore((s) => s.ready)

  useEffect(() => {
    void check()
  }, [check])

  return (
    <>
      {status === 'loading' && <div className="splash">Chargement…</div>}
      {status === 'offline' && (
        <div className="splash">
          <div className="stack gap-12" style={{ alignItems: 'center' }}>
            <WifiOff size={28} />
            <span>Serveur injoignable.</span>
            <button type="button" className="btn" onClick={() => void check()}>
              <RefreshCw size={15} /> Réessayer
            </button>
          </div>
        </div>
      )}
      {status === 'setup' && <LoginPage mode="setup" />}
      {/* Si la session expire en cours de route, on garde l'espace de travail monté derrière pour ne rien perdre. */}
      {status === 'login' && <LoginPage mode="login" />}
      {(status === 'ready' || (status === 'login' && wasReady)) && (
        <div className={`workspace-wrap ${status === 'login' ? 'hidden' : ''}`}>
          <Workspace />
        </div>
      )}
      <Toasts />
    </>
  )
}
