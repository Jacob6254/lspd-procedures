import { useEffect, useState } from 'react'
import { Copy, FileText, IdCard, KeyRound, Link2, LogOut, RefreshCw, Settings, ShieldCheck, Trash2, UserPlus, Users } from 'lucide-react'
import type { AccountInfo, ConfigInscription } from '@shared/types'
import { useStore } from '../store'
import { useAuth } from '../auth'
import { api } from '../api'
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
              { value: 'ouvert' as const, label: 'Tout le monde', hint: 'sans code' },
              { value: 'code' as const, label: 'Seulement avec le lien', hint: 'avec un code' },
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
          « Tout le monde » : tu envoies l’adresse du site, ton collègue choisit son matricule et son mot de passe, et il arrive en simple agent.
          « Seulement avec le lien » ajoute un code dans le lien, au cas où l’adresse traînerait ailleurs. « Personne » coupe l’inscription.
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
      <PageHeader icon={Settings} title="Réglages" subtitle="Ton profil d’agent et ton compte" />
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

        <Panel title="Identité du rédacteur" icon={IdCard} className="panel-wide">
          <p className="muted small" style={{ marginTop: 0 }}>
            Repris tel quel en en-tête du rapport de négociation. Tu peux le corriger avant de générer.
          </p>
          <div className="form-grid">
            <Field label="Sexe">
              <Segmented
                value={settings.sexe ?? 'H'}
                onChange={(v: 'H' | 'F') => update({ sexe: v })}
                options={[
                  { value: 'H' as const, label: 'H' },
                  { value: 'F' as const, label: 'F' }
                ]}
              />
            </Field>
            <Field label="Nom">
              <TextInput value={settings.nom ?? ''} onChange={(v) => update({ nom: v })} placeholder="DUPONT" />
            </Field>
            <Field label="Prénom">
              <TextInput value={settings.prenom ?? ''} onChange={(v) => update({ prenom: v })} placeholder="Lucas" />
            </Field>
            <Field label="Grade">
              <TextInput value={settings.grade ?? ''} onChange={(v) => update({ grade: v })} placeholder="Officer" />
            </Field>
            <Field label="Spécialisation">
              <TextInput value={settings.specialisation ?? ''} onChange={(v) => update({ specialisation: v })} placeholder="Négociateur" />
            </Field>
          </div>
        </Panel>

        <Panel title="Cases d’en-tête du document officiel" icon={FileText} className="panel-wide">
          <p className="muted small" style={{ marginTop: 0 }}>
            L’année et le n° de dossier se remplissent tout seuls. Le n° de dossier avance d’un cran à chaque rapport généré.
          </p>
          <div className="form-grid">
            <Field label="Unit code">
              <TextInput value={settings.unitCode ?? ''} onChange={(v) => update({ unitCode: v })} placeholder="20-S" />
            </Field>
            <Field label="Nmr justice file">
              <TextInput value={settings.nmrJustice ?? ''} onChange={(v) => update({ nmrJustice: v })} placeholder="1293" />
            </Field>
            <Field label="Nmr room">
              <TextInput value={settings.nmrRoom ?? ''} onChange={(v) => update({ nmrRoom: v })} placeholder="0001" />
            </Field>
            <Field label="Prochain n° de dossier">
              <TextInput
                value={String(settings.prochainCase ?? 1)}
                onChange={(v) => update({ prochainCase: Math.max(1, Number(v.replace(/D/g, '')) || 1) })}
                type="number"
              />
            </Field>
          </div>
        </Panel>

        <Panel title="Collègues fréquents" icon={Users}>
          <Field label="Matricules proposés quand tu ajoutes les agents présents" wide>
            <ChipsInput values={settings.collegues} onChange={(v) => update({ collegues: v })} prefix="#" placeholder="Ex : 388 puis Entrée" />
          </Field>
        </Panel>

        <MonCompte />

        {me?.role === 'admin' && <Inscriptions />}

        {me?.role === 'admin' && <Comptes />}
      </div>
    </div>
  )
}
