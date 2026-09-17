import { useEffect, useRef } from 'react'
import { Camera, Crosshair, Eye, FileText, Home, Images, LogOut, MonitorUp, Plus, Radio, Settings, Timer, X } from 'lucide-react'
import type { LucideIcon } from 'lucide-react'
import { type Route, SLOT_LABELS, interventionTitle, suspectName, useSaveStatus, useStore } from '../store'
import { useScreenShare } from '../capture'
import { useAuth } from '../auth'

export function Badge3D() {
  return (
    <svg viewBox="0 0 40 40" width="40" height="40" aria-hidden="true">
      <path d="M20 3l14 5v10c0 9-6 16-14 19C12 34 6 27 6 18V8l14-5z" fill="#1a2440" stroke="#3a6ee8" strokeWidth="1.6" />
      <path
        d="M20 11l2.4 4.9 5.4.8-3.9 3.8.9 5.4-4.8-2.5-4.8 2.5.9-5.4-3.9-3.8 5.4-.8z"
        fill="#c9d6f5"
        stroke="#8fb1ff"
        strokeWidth=".6"
      />
    </svg>
  )
}

function NavItem(props: { icon: LucideIcon; label: string; active: boolean; onClick: () => void; count?: number }) {
  const Icon = props.icon
  return (
    <button type="button" className={`nav-item ${props.active ? 'active' : ''}`} onClick={props.onClick}>
      <Icon size={17} />
      <span>{props.label}</span>
      {!!props.count && <span className="nav-count">{props.count}</span>}
    </button>
  )
}

function SharePanel() {
  const { stream, countdown, start, stop, grab } = useScreenShare()
  const target = useStore((s) => s.captureTarget)
  const destination = useStore((s) => {
    const t = s.captureTarget
    const i = t && s.db.interventions.find((x) => x.id === t.interventionId)
    if (!t || !i) return 'Screens à trier'
    const suspect = i.suspects.find((x) => x.id === t.suspectId)
    return suspect ? `${SLOT_LABELS[t.slot]} · ${suspectName(suspect)}` : `${SLOT_LABELS[t.slot]} · ${interventionTitle(i)}`
  })
  const preview = useRef<HTMLVideoElement>(null)

  useEffect(() => {
    if (preview.current) preview.current.srcObject = stream
  }, [stream])

  return (
    <div className="share">
      {stream ? (
        <>
          <video ref={preview} className="share-preview" autoPlay muted playsInline />
          <div className="share-actions">
            <button type="button" className="btn btn-primary" disabled={countdown > 0} onClick={() => void grab()}>
              <Camera size={15} /> {countdown > 0 ? `${countdown}…` : 'Capturer'}
            </button>
            <button type="button" className="btn btn-icon" title="Capturer dans 3 secondes" disabled={countdown > 0} onClick={() => void grab(3)}>
              <Timer size={15} />
            </button>
            <button type="button" className="btn btn-icon" title="Arrêter le partage" onClick={stop}>
              <X size={15} />
            </button>
          </div>
        </>
      ) : (
        <button type="button" className="btn share-start" onClick={() => void start()}>
          <MonitorUp size={15} /> Partager l’écran du jeu
        </button>
      )}
      <div className="share-dest">
        Les screens vont dans
        <strong className={target ? 'c-blue' : ''}>{destination}</strong>
      </div>
    </div>
  )
}

export function Sidebar() {
  const route = useStore((s) => s.route)
  const go = useStore((s) => s.go)
  const openDossier = useStore((s) => s.openDossier)
  const createIntervention = useStore((s) => s.createIntervention)
  const interventions = useStore((s) => s.db.interventions)
  const inbox = useStore((s) => s.db.inbox.length)
  const matricule = useStore((s) => s.db.settings.matricule)
  const save = useSaveStatus((s) => s.state)
  const me = useAuth((s) => s.me)
  const logout = useAuth((s) => s.logout)
  const enCours = interventions.filter((i) => i.statut === 'en_cours').slice(0, 6)
  const is = (page: Route['page']) => route.page === page

  return (
    <aside className="sidebar">
      <div className="brand">
        <Badge3D />
        <div>
          <strong>L.S.P.D Procédures</strong>
          <span>OUTIL DE PROCÉDURE</span>
        </div>
      </div>

      <nav className="nav">
        <div className="nav-section">Général</div>
        <NavItem icon={Home} label="Accueil" active={is('accueil')} onClick={() => go({ page: 'accueil' })} />
        <button type="button" className="nav-new" onClick={createIntervention}>
          <Plus size={17} /> Nouvelle intervention
        </button>

        {enCours.length > 0 && <div className="nav-section">En cours</div>}
        {enCours.map((i) => (
          <button
            type="button"
            key={i.id}
            className={`nav-dossier ${route.page === 'dossier' && route.id === i.id ? 'active' : ''}`}
            onClick={() => openDossier(i.id)}
          >
            <span className="dot dot-amber" />
            <span className="nav-dossier-text">
              <span>{interventionTitle(i)}</span>
              <small>{i.suspects.map(suspectName).join(', ')}</small>
            </span>
          </button>
        ))}

        <div className="nav-section">Registre</div>
        <NavItem icon={FileText} label="Historique" active={is('historique')} onClick={() => go({ page: 'historique' })} />
        <NavItem icon={Images} label="Screens à trier" active={is('screens')} count={inbox} onClick={() => go({ page: 'screens' })} />
        <NavItem icon={Crosshair} label="Répertoire armes" active={is('armes')} onClick={() => go({ page: 'armes' })} />
        <NavItem icon={Radio} label="Code Radio" active={is('radio')} onClick={() => go({ page: 'radio' })} />

        {me?.role === 'admin' && (
          <>
            <div className="nav-section">Supervision</div>
            <NavItem icon={Eye} label="Procédures des agents" active={is('supervision')} onClick={() => go({ page: 'supervision' })} />
          </>
        )}

        <div className="nav-section">Préférences</div>
        <NavItem icon={Settings} label="Réglages" active={is('reglages')} onClick={() => go({ page: 'reglages' })} />
      </nav>

      <SharePanel />

      <div className="sidebar-foot">
        <span
          className={`dot ${save === 'error' ? 'dot-red' : save === 'saving' ? 'dot-amber' : 'dot-green'}`}
          title={save === 'error' ? 'Sauvegarde en échec, nouvel essai…' : save === 'saving' ? 'Sauvegarde…' : 'Tout est enregistré'}
        />
        <span className="sidebar-foot-text">
          <strong>{me?.username}</strong>
          <small>
            {save === 'error' ? 'Non enregistré, nouvel essai…' : save === 'saving' ? 'Enregistrement…' : 'Enregistré'}
            {matricule ? ` · Matricule ${matricule}` : ''}
          </small>
        </span>
        <button type="button" className="btn btn-icon btn-ghost" title="Se déconnecter" onClick={() => void logout()}>
          <LogOut size={16} />
        </button>
      </div>
    </aside>
  )
}
