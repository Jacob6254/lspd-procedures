import { useState, type FormEvent } from 'react'
import { LogIn, ShieldCheck, UserPlus } from 'lucide-react'
import { api } from '../api'
import { useAuth } from '../auth'
import { setMatriculeInscription } from '../store'
import { Field, TextInput } from '../components/ui'

/** Code d'inscription passé dans le lien : /?code=xxxx */
function codeDuLien(): string {
  return new URLSearchParams(location.search).get('code') ?? ''
}

export function LoginPage(props: { mode: 'login' | 'setup' }) {
  const loggedIn = useAuth((s) => s.loggedIn)
  const expired = useAuth((s) => s.expired)
  const inscription = useAuth((s) => s.inscription)
  const setup = props.mode === 'setup'
  const [onglet, setOnglet] = useState<'connexion' | 'inscription'>(codeDuLien() && !setup ? 'inscription' : 'connexion')
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [confirm, setConfirm] = useState('')
  const [code, setCode] = useState(codeDuLien())
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)

  const creation = setup || onglet === 'inscription'
  const inscriptionPossible = !setup && inscription !== 'ferme'
  const demandeCode = onglet === 'inscription' && inscription === 'code' && !codeDuLien()

  async function submit(e: FormEvent) {
    e.preventDefault()
    setError('')
    if (creation && password !== confirm) {
      setError('Les deux mots de passe ne sont pas identiques.')
      return
    }
    setBusy(true)
    try {
      const identifiant = username.trim()
      if (setup) {
        loggedIn(await api.setup(identifiant, password))
      } else if (onglet === 'inscription') {
        const me = await api.register(identifiant, password, code.trim())
        setMatriculeInscription(identifiant)
        loggedIn(me)
      } else {
        loggedIn(await api.login(identifiant, password))
      }
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
          <img src="/lspdlogo.webp" alt="Écusson du Los Santos Police Department" width="76" height="76" />
          <div>
            <strong>L.S.P.D Procédures</strong>
            <span>OUTIL DE PROCÉDURE</span>
          </div>
        </div>

        {inscriptionPossible && (
          <div className="segmented login-tabs">
            <button type="button" className={`segment ${onglet === 'connexion' ? 'active' : ''}`} onClick={() => setOnglet('connexion')}>
              J’ai déjà un compte
            </button>
            <button type="button" className={`segment ${onglet === 'inscription' ? 'active' : ''}`} onClick={() => setOnglet('inscription')}>
              Créer mon compte
            </button>
          </div>
        )}

        <h1>{setup ? 'Créer le compte administrateur' : onglet === 'inscription' ? 'Créer mon compte' : 'Connexion'}</h1>
        <p className="muted">
          {setup
            ? 'Premier lancement : ce compte pourra ensuite créer les comptes de tes collègues.'
            : onglet === 'inscription'
              ? 'Choisis ton matricule et ton mot de passe. Tu arrives en simple agent et personne d’autre ne voit tes dossiers.'
              : expired
                ? 'Ta session a expiré, reconnecte-toi. Tes dernières modifications seront envoyées après.'
                : 'Connecte-toi pour accéder à tes procédures.'}
        </p>

        <Field label={onglet === 'inscription' && !setup ? 'Ton matricule' : 'Identifiant'}>
          <TextInput value={username} onChange={setUsername} placeholder={onglet === 'inscription' && !setup ? '400' : 'ex : yohan.desir'} autoFocus />
        </Field>
        <Field label="Mot de passe" hint={creation ? '8 caractères minimum' : undefined}>
          <TextInput type="password" value={password} onChange={setPassword} />
        </Field>
        {creation && (
          <Field label="Confirmer le mot de passe">
            <TextInput type="password" value={confirm} onChange={setConfirm} />
          </Field>
        )}
        {demandeCode && (
          <Field label="Code d’inscription" hint="Il est dans le lien envoyé par ton admin.">
            <TextInput value={code} onChange={setCode} />
          </Field>
        )}

        {error && <div className="form-error">{error}</div>}
        <button type="submit" className="btn btn-primary btn-lg" disabled={busy || !username || !password}>
          {setup ? <ShieldCheck size={17} /> : onglet === 'inscription' ? <UserPlus size={17} /> : <LogIn size={17} />}
          {setup ? 'Créer le compte' : onglet === 'inscription' ? 'Créer mon compte' : 'Se connecter'}
        </button>
      </form>
    </div>
  )
}
