import { BookOpen, Crosshair, Eye, FileText, GraduationCap, Handshake, Home, LogOut, Plus, Radio, Settings } from 'lucide-react'
import type { LucideIcon } from 'lucide-react'
import { type Route, interventionTitle, negociationTitre, suspectName, useSaveStatus, useStore } from '../store'
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

export function Sidebar() {
  const route = useStore((s) => s.route)
  const go = useStore((s) => s.go)
  const openDossier = useStore((s) => s.openDossier)
  const createIntervention = useStore((s) => s.createIntervention)
  const createNegociation = useStore((s) => s.createNegociation)
  const interventions = useStore((s) => s.db.interventions)
  const matricule = useStore((s) => s.db.settings.matricule)
  const negociations = useStore((s) => s.db.negociations)
  const negosEnCours = (negociations ?? []).filter((n) => n.statut === 'en_cours').slice(0, 4)
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
        <NavItem icon={Crosshair} label="Répertoire armes" active={is('armes')} onClick={() => go({ page: 'armes' })} />
        <NavItem icon={Radio} label="Code Radio" active={is('radio')} onClick={() => go({ page: 'radio' })} />

        <div className="nav-section">Négociation</div>
        <button type="button" className="nav-new" onClick={createNegociation}>
          <Plus size={17} /> Nouvelle négociation
        </button>
        {negosEnCours.map((n) => (
          <button
            type="button"
            key={n.id}
            className={`nav-dossier ${route.page === 'negociation' && route.id === n.id ? 'active' : ''}`}
            onClick={() => go({ page: 'negociation', id: n.id })}
          >
            <span className="dot dot-amber" />
            <span className="nav-dossier-text">
              <span>{negociationTitre(n)}</span>
              <small>{n.otages.length} otage(s)</small>
            </span>
          </button>
        ))}
        <NavItem icon={Handshake} label="Mes négociations" active={is('negociations')} onClick={() => go({ page: 'negociations' })} />
        <NavItem icon={BookOpen} label="Comment négocier" active={is('nego-guide')} onClick={() => go({ page: 'nego-guide' })} />

        <div className="nav-section">Formation</div>
        <NavItem icon={GraduationCap} label="Formation casier rookie" active={is('formation')} onClick={() => go({ page: 'formation' })} />

        {me?.role === 'admin' && (
          <>
            <div className="nav-section">Supervision</div>
            <NavItem icon={Eye} label="Procédures des agents" active={is('supervision')} onClick={() => go({ page: 'supervision' })} />
            <NavItem icon={GraduationCap} label="Gestion formation" active={is('formation-admin')} onClick={() => go({ page: 'formation-admin' })} />
          </>
        )}

        <div className="nav-section">Préférences</div>
        <NavItem icon={Settings} label="Réglages" active={is('reglages')} onClick={() => go({ page: 'reglages' })} />
      </nav>

      <div className="sidebar-foot">
        <span
          className={`dot ${save === 'error' ? 'dot-red' : save === 'saving' ? 'dot-amber' : 'dot-green'}`}
          title={save === 'error' ? 'Sauvegarde en échec, nouvel essai…' : save === 'saving' ? 'Sauvegarde…' : 'Tout est enregistré'}
        />
        <span className="sidebar-foot-text">
          <strong>{me?.username}</strong>
          <small>{matricule ? `Matricule ${matricule} · ${me?.role === 'admin' ? 'Admin' : 'LSPD'}` : 'Matricule à remplir'}</small>
        </span>
        <button type="button" className="btn btn-icon btn-ghost" title="Se déconnecter" onClick={() => void logout()}>
          <LogOut size={16} />
        </button>
      </div>
    </aside>
  )
}
