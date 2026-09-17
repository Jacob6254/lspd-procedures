import { useEffect, useState } from 'react'
import { Camera, Copy, KeyRound, Link2, LogOut, RefreshCw, Settings, ShieldCheck, Trash2, UserPlus, Users } from 'lucide-react'
import type { AccountInfo, ConfigInscription } from '@shared/types'
import { useStore } from '../store'
import { useAuth } from '../auth'
import { api } from '../api'
import { playShutter } from '../capture'
import { Badge, ChipsInput, ConfirmButton, Field, PageHeader, Panel, Segmented, TextInput } from '../components/ui'
import { dateTimeFr } from '../lib/format'

function MonCompte() {
  const me = useAuth((s) => s.me)
  const logout = useAuth((s) => s.logout)
  const toast = useStore((s) => s.toast)
  const [current, setCurrent] = useState('')
  const [next, setNext] = useState('')
  const [confirm, setConfirm] = useState('')
  const [busy, setBusy] = useState(false)

  async function change() {
    if (next !== confirm) {
      toast('error', 'Les deux nouveaux mots de passe ne sont pas identiques.')
      return
    }
    setBusy(true)
    try {
      await api.changePassword(current, next)
      toast('ok', 'Mot de passe changé.')
      setCurrent('')
      setNext('')
      setConfirm('')
    } catch (err) {
      toast('error', err instanceof Error ? err.message : 'Changement impossible')
    } finally {
      setBusy(false)
    }
  }

  return (
    <Panel
      title="Mon compte"
      icon={KeyRound}
      right={
        <button type="button" className="btn" onClick={() => void logout()}>
          <LogOut size={15} /> Se déconnecter
        </button>
      }
    >
      <p className="muted">
        Connecté en tant que <strong className="c-text">{me?.username}</strong>
        {me?.role === 'admin' ? ' (administrateur)' : ''}.
      </p>
      <div className="form-grid">
        <Field label="Mot de passe actuel" wide>
          <TextInput type="password" value={current} onChange={setCurrent} />
        </Field>
        <Field label="Nouveau mot de passe" hint="8 caractères minimum">
          <TextInput type="password" value={next} onChange={setNext} />
        </Field>
        <Field label="Confirmer">
          <TextInput type="password" value={confirm} onChange={setConfirm} />
        </Field>
      </div>
      <button type="button" className="btn" style={{ marginTop: 14 }} disabled={busy || !current || !next} onClick={() => void change()}>
        <KeyRound size={15} /> Changer le mot de passe
      </button>
    </Panel>
  )
}

function Inscriptions() {
  const toast = useStore((s) => s.toast)
  const [cfg, setCfg] = useState<ConfigInscription | null>(null)

  useEffect(() => {
    api
      .getConfig()
      .then(setCfg)
      .catch(() => undefined)
  }, [])

  async function maj(patch: { inscription?: ConfigInscription['inscription']; nouveauCode?: boolean }) {
    try {
      setCfg(await api.setConfig(patch))
      toast('ok', patch.nouveauCode ? 'Nouveau lien créé : l’ancien ne marche plus.' : 'Réglage enregistré.')
    } catch (err) {
      toast('error', err instanceof Error ? err.message : 'Enregistrement impossible')
    }
  }

  const lien = cfg ? (cfg.inscription === 'code' ? `${location.origin}/?code=${cfg.code}` : location.origin) : ''

  return (
    <Panel title="Inscription des agents" icon={Link2} className="panel-wide">
      <div className="stack gap-16">
        <Field label="Qui peut créer un compte ?" wide>
          <Segmented
            value={cfg?.inscription ?? 'ferme'}
            onChange={(v) => void maj({ inscription: v })}
            options={[
              { value: 'code' as const, label: 'Avec le lien', hint: 'recommandé' },
              { value: 'ouvert' as const, label: 'Tout le monde' },
              { value: 'ferme' as const, label: 'Personne' }
            ]}
          />
        </Field>

        {cfg?.inscription !== 'ferme' && (
          <Field label={cfg?.inscription === 'code' ? 'Lien à envoyer à tes collègues' : 'Adresse du site'} wide>
            <div className="row gap-8">
              <input className="input" readOnly value={lien} onFocus={(e) => e.currentTarget.select()} />
              <button
                type="button"
                className="btn"
                onClick={async () => {
                  await api.copyText(lien)
                  toast('ok', 'Lien copié.')
                }}
              >
                <Copy size={15} /> Copier
              </button>
              {cfg?.inscription === 'code' && (
                <button type="button" className="btn" onClick={() => void maj({ nouveauCode: true })}>
                  <RefreshCw size={15} /> Nouveau lien
                </button>
              )}
            </div>
          </Field>
        )}

        <p className="muted small">
          Avec le lien, ton collègue choisit son matricule et son mot de passe et arrive en simple agent : tu n’as rien à créer. « Personne » coupe
          l’inscription, « Tout le monde » laisse s’inscrire n’importe qui connaissant l’adresse.
        </p>
      </div>
    </Panel>
  )
}

function Comptes() {
  const me = useAuth((s) => s.me)
  const toast = useStore((s) => s.toast)
  const [accounts, setAccounts] = useState<AccountInfo[]>([])
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [role, setRole] = useState<'user' | 'admin'>('user')
  const [resetFor, setResetFor] = useState<string | null>(null)
  const [resetPwd, setResetPwd] = useState('')

  const refresh = () =>
    api
      .listAccounts()
      .then(setAccounts)
      .catch(() => undefined)

  useEffect(() => {
    void refresh()
  }, [])

  async function create() {
    try {
      await api.createAccount(username.trim(), password, role)
      toast('ok', `Compte « ${username.trim()} » créé. Donne-lui son identifiant et son mot de passe.`)
      setUsername('')
      setPassword('')
      setRole('user')
      void refresh()
    } catch (err) {
      toast('error', err instanceof Error ? err.message : 'Création impossible')
    }
  }

  async function reset(id: string) {
    try {
      await api.resetPassword(id, resetPwd)
      toast('ok', 'Mot de passe modifié. L’ancienne session de ce compte est déconnectée.')
      setResetFor(null)
      setResetPwd('')
    } catch (err) {
      toast('error', err instanceof Error ? err.message : 'Modification impossible')
    }
  }

  async function remove(a: AccountInfo) {
    try {
      await api.deleteAccount(a.id)
      toast('ok', `Compte « ${a.username} » supprimé.`)
      void refresh()
    } catch (err) {
      toast('error', err instanceof Error ? err.message : 'Suppression impossible')
    }
  }

  return (
    <Panel title="Comptes des collègues" icon={Users} className="panel-wide">
      <div className="account-list">
        {accounts.map((a) => (
          <div className="account" key={a.id}>
            <div className="account-main">
              <strong>{a.username}</strong>
              <small className="muted">Créé le {dateTimeFr(a.createdAt)}</small>
            </div>
            <Badge tone={a.role === 'admin' ? 'blue' : 'grey'}>{a.role === 'admin' ? 'Admin' : 'Agent'}</Badge>
            {resetFor === a.id ? (
              <div className="row gap-8">
                <TextInput type="password" value={resetPwd} onChange={setResetPwd} placeholder="Nouveau mot de passe" autoFocus />
                <button type="button" className="btn btn-primary" disabled={resetPwd.length < 8} onClick={() => void reset(a.id)}>
                  Valider
                </button>
                <button type="button" className="btn" onClick={() => setResetFor(null)}>
                  Annuler
                </button>
              </div>
            ) : (
              <div className="row gap-8">
                <button
                  type="button"
                  className="btn"
                  onClick={() => {
                    setResetFor(a.id)
                    setResetPwd('')
                  }}
                >
                  <KeyRound size={15} /> Mot de passe
                </button>
                {a.id !== me?.id && (
                  <ConfirmButton icon={Trash2} label="Supprimer" confirmLabel="Supprimer + ses dossiers ?" onConfirm={() => void remove(a)} />
                )}
              </div>
            )}
          </div>
        ))}
      </div>

      <div className="account-create">
        <span className="eyebrow">
          <UserPlus size={14} /> Nouveau compte
        </span>
        <div className="form-grid three">
          <Field label="Identifiant" hint="Lettres, chiffres, . _ -">
            <TextInput value={username} onChange={setUsername} placeholder="ex : jhon.parker" />
          </Field>
          <Field label="Mot de passe" hint="8 caractères minimum">
            <TextInput type="password" value={password} onChange={setPassword} />
          </Field>
          <Field label="Rôle">
            <Segmented
              value={role}
              onChange={setRole}
              options={[
                { value: 'user', label: 'Agent' },
                { value: 'admin', label: 'Admin' }
              ]}
            />
          </Field>
        </div>
        <button type="button" className="btn btn-primary" disabled={username.trim().length < 3 || password.length < 8} onClick={() => void create()}>
          <UserPlus size={15} /> Créer le compte
        </button>
        <p className="muted small">
          Utile surtout pour créer un autre admin : les simples agents peuvent s’inscrire seuls avec le lien ci-dessus. Chaque compte a ses propres
          dossiers et screens.
        </p>
      </div>
    </Panel>
  )
}

export function ReglagesPage() {
  const settings = useStore((s) => s.db.settings)
  const update = useStore((s) => s.updateSettings)
  const me = useAuth((s) => s.me)

  return (
    <div className="page">
      <PageHeader icon={Settings} title="Réglages" subtitle="Ton profil d’agent, ton compte et les screens" />
      <div className="settings-grid">
        <Panel title="Agent" icon={ShieldCheck}>
          <div className="form-grid">
            <Field label="Ton matricule" hint="Utilisé dans l’en-tête du rapport et ajouté aux agents présents.">
              <TextInput value={settings.matricule} onChange={(v) => update({ matricule: v.trim() })} placeholder="354" autoFocus={!settings.matricule} />
            </Field>
            <Field label="Nom RP (facultatif)">
              <TextInput value={settings.nomAgent} onChange={(v) => update({ nomAgent: v })} placeholder="Yohan Desir" />
            </Field>
          </div>
        </Panel>

        <Panel title="Collègues fréquents" icon={Users}>
          <Field label="Matricules proposés quand tu ajoutes les agents présents" wide>
            <ChipsInput values={settings.collegues} onChange={(v) => update({ collegues: v })} prefix="#" placeholder="Ex : 388 puis Entrée" />
          </Field>
        </Panel>

        <Panel title="Prendre les screens" icon={Camera}>
          <ol className="howto">
            <li>
              <strong>Coller :</strong> prends ton screen comme d’habitude (Win + Maj + S, Impr. écran…) puis fais <kbd>Ctrl</kbd> + <kbd>V</kbd> sur le
              site. Il arrive dans la zone visée.
            </li>
            <li>
              <strong>Glisser :</strong> glisse un fichier image sur une zone de screens.
            </li>
            <li>
              <strong>Partager l’écran du jeu :</strong> bouton en bas à gauche, choisis la <em>fenêtre FiveM</em>. Ensuite, « Capturer » prend un screen en un
              clic, sans quitter le site (le minuteur 3 s laisse le temps de revenir en jeu).
            </li>
          </ol>
          <button type="button" className="btn" onClick={playShutter}>
            Tester le son de capture
          </button>
        </Panel>

        <MonCompte />

        {me?.role === 'admin' && <Inscriptions />}

        {me?.role === 'admin' && <Comptes />}
      </div>
    </div>
  )
}
