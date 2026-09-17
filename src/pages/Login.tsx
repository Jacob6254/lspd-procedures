import { useState, type FormEvent } from 'react'
import { LogIn, ShieldCheck } from 'lucide-react'
import { api } from '../api'
import { useAuth } from '../auth'
import { Badge3D } from '../components/Sidebar'
import { Field, TextInput } from '../components/ui'

export function LoginPage(props: { mode: 'login' | 'setup' }) {
  const loggedIn = useAuth((s) => s.loggedIn)
  const expired = useAuth((s) => s.expired)
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [confirm, setConfirm] = useState('')
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)
  const setup = props.mode === 'setup'

  async function submit(e: FormEvent) {
    e.preventDefault()
    setError('')
    if (setup && password !== confirm) {
      setError('Les deux mots de passe ne sont pas identiques.')
      return
    }
    setBusy(true)
    try {
      const me = setup ? await api.setup(username.trim(), password) : await api.login(username.trim(), password)
      loggedIn(me)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Connexion impossible')
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="login">
      <form className="login-card" onSubmit={submit}>
        <div className="login-brand">
          <Badge3D />
          <div>
            <strong>L.S.P.D Procédures</strong>
            <span>OUTIL DE PROCÉDURE</span>
          </div>
        </div>
        <h1>{setup ? 'Créer le compte administrateur' : 'Connexion'}</h1>
        <p className="muted">
          {setup
            ? 'Premier lancement : ce compte pourra ensuite créer les comptes de tes collègues.'
            : expired
              ? 'Ta session a expiré, reconnecte-toi. Tes dernières modifications seront envoyées après.'
              : 'Connecte-toi pour accéder à tes procédures.'}
        </p>
        <Field label="Identifiant">
          <TextInput value={username} onChange={setUsername} placeholder="ex : yohan.desir" autoFocus />
        </Field>
        <Field label="Mot de passe" hint={setup ? '8 caractères minimum' : undefined}>
          <TextInput type="password" value={password} onChange={setPassword} />
        </Field>
        {setup && (
          <Field label="Confirmer le mot de passe">
            <TextInput type="password" value={confirm} onChange={setConfirm} />
          </Field>
        )}
        {error && <div className="form-error">{error}</div>}
        <button type="submit" className="btn btn-primary btn-lg" disabled={busy || !username || !password}>
          {setup ? <ShieldCheck size={17} /> : <LogIn size={17} />}
          {setup ? 'Créer le compte' : 'Se connecter'}
        </button>
      </form>
    </div>
  )
}
