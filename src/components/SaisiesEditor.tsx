import { useState } from 'react'
import { Banknote, Box, Crosshair, Pill, Plus, Trash2, Zap } from 'lucide-react'
import type { LucideIcon } from 'lucide-react'
import type { Saisie, SaisieType, Suspect, Weapon } from '@shared/types'
import { normalize, uid } from '../lib/format'
import { useStore } from '../store'
import { legalityFor, legalityLabel, legalityTone, searchWeapons, statusLabel, useWeaponsLoaded } from '../weapons'
import { Badge, Toggle } from './ui'
import type { SetSuspect } from '../pages/Dossier'

const TYPES: { type: SaisieType; label: string; icon: LucideIcon; placeholder: string }[] = [
  { type: 'arme', label: 'Arme', icon: Crosshair, placeholder: 'Tape le nom de l’arme (ex : AK, pompe, M4…)' },
  { type: 'munition', label: 'Munitions', icon: Zap, placeholder: 'Calibre (ex : 5.56, 9mm, 12 Gauge…)' },
  { type: 'drogue', label: 'Drogue', icon: Pill, placeholder: 'Ex : pochons de weed' },
  { type: 'argent', label: 'Argent sale', icon: Banknote, placeholder: '' },
  { type: 'autre', label: 'Autre objet', icon: Box, placeholder: 'Ex : kit de crochetage' }
]

const DEFAULT_DROGUES = [
  'pochons de weed',
  'pochons de cocaïne',
  'pochons de meth',
  'pochons de morphine pure',
  'pochons d’héroïne',
  'pochons d’opium',
  'comprimés d’ecstasy'
]

function WeaponField(props: { saisie: Saisie; suspect: Suspect; autoFocus: boolean; onChange: (p: Partial<Saisie>) => void }) {
  const { data } = useWeaponsLoaded()
  const [open, setOpen] = useState(false)
  const cats =
    props.saisie.type === 'munition'
      ? ['munition']
      : data?.categories.map((c) => c.key).filter((k) => k !== 'munition')
  const results = data ? searchWeapons(data.weapons, props.saisie.label, cats) : []
  const catLabel = (w: Weapon) => data?.categories.find((c) => c.key === w.category)?.label ?? w.category

  return (
    <div className="combo" onBlur={() => setTimeout(() => setOpen(false), 120)}>
      <input
        className="input"
        value={props.saisie.label}
        autoFocus={props.autoFocus}
        placeholder={TYPES.find((t) => t.type === props.saisie.type)?.placeholder}
        onFocus={() => setOpen(true)}
        onChange={(e) => {
          props.onChange({ label: e.target.value, weaponId: undefined })
          setOpen(true)
        }}
      />
      {open && results.length > 0 && (
        <div className="suggest">
          {results.map((w) => {
            const l = legalityFor(w, props.suspect)
            return (
              <button
                type="button"
                key={w.id}
                onMouseDown={(e) => e.preventDefault()}
                onClick={() => {
                  props.onChange({ label: w.name, weaponId: w.id })
                  setOpen(false)
                }}
              >
                <span className="suggest-main">
                  {w.name}
                  <small>
                    {catLabel(w)} · {statusLabel(w)}
                  </small>
                </span>
                <Badge tone={legalityTone(l)}>{legalityLabel(l)}</Badge>
              </button>
            )
          })}
        </div>
      )}
    </div>
  )
}

function TextField(props: { saisie: Saisie; suggestions: string[]; autoFocus: boolean; onChange: (p: Partial<Saisie>) => void; onDone: () => void }) {
  const [open, setOpen] = useState(false)
  const q = normalize(props.saisie.label)
  const matches = props.suggestions.filter((s) => normalize(s).includes(q) && normalize(s) !== q).slice(0, 8)
  return (
    <div
      className="combo"
      onBlur={() =>
        setTimeout(() => {
          setOpen(false)
          props.onDone()
        }, 120)
      }
    >
      <input
        className="input"
        value={props.saisie.label}
        autoFocus={props.autoFocus}
        placeholder={TYPES.find((t) => t.type === props.saisie.type)?.placeholder}
        onFocus={() => setOpen(true)}
        onChange={(e) => {
          props.onChange({ label: e.target.value })
          setOpen(true)
        }}
      />
      {open && matches.length > 0 && (
        <div className="suggest">
          {matches.map((m) => (
            <button
              type="button"
              key={m}
              onMouseDown={(e) => e.preventDefault()}
              onClick={() => {
                props.onChange({ label: m })
                setOpen(false)
              }}
            >
              {m}
            </button>
          ))}
        </div>
      )}
    </div>
  )
}

export function SaisiesEditor(props: { suspect: Suspect; onChange: SetSuspect }) {
  const learned = useStore((s) => s.db.learned)
  const learn = useStore((s) => s.learn)
  const { byId } = useWeaponsLoaded()
  const [lastAdded, setLastAdded] = useState<string | null>(null)
  const { suspect } = props

  function add(type: SaisieType) {
    const s: Saisie = { id: uid(), type, label: '', quantite: type === 'argent' ? null : 1 }
    setLastAdded(s.id)
    props.onChange((cur) => ({ saisies: [...cur.saisies, s], rienSurLui: false }))
  }

  function patch(id: string, p: Partial<Saisie>) {
    props.onChange((cur) => ({ saisies: cur.saisies.map((x) => (x.id === id ? { ...x, ...p } : x)) }))
  }

  const drogueSuggestions = [...learned.drogues, ...DEFAULT_DROGUES.filter((d) => !learned.drogues.includes(d))]

  return (
    <div className="saisies">
      <div className="quick-add">
        {TYPES.map((t) => (
          <button type="button" key={t.type} className="btn" onClick={() => add(t.type)}>
            <Plus size={14} />
            <t.icon size={15} />
            {t.label}
          </button>
        ))}
      </div>

      {suspect.saisies.length === 0 ? (
        <Toggle
          checked={suspect.rienSurLui}
          onChange={(v) => props.onChange({ rienSurLui: v })}
          label="Rien d’illégal sur lui"
          hint="À cocher seulement si la fouille n’a rien donné."
        />
      ) : (
        <div className="saisie-list">
          {suspect.saisies.map((s) => {
            const t = TYPES.find((x) => x.type === s.type)!
            const w = s.weaponId ? byId.get(s.weaponId) : undefined
            const l = w ? legalityFor(w, suspect) : null
            const missingQty = !s.quantite || s.quantite <= 0
            return (
              <div className="saisie-row" key={s.id}>
                <span className={`saisie-type type-${s.type}`}>
                  <t.icon size={15} />
                  {t.label}
                </span>
                {s.type === 'arme' || s.type === 'munition' ? (
                  <WeaponField saisie={s} suspect={suspect} autoFocus={lastAdded === s.id} onChange={(p) => patch(s.id, p)} />
                ) : s.type === 'argent' ? (
                  <span className="saisie-money-label">Argent non déclaré</span>
                ) : (
                  <TextField
                    saisie={s}
                    autoFocus={lastAdded === s.id}
                    suggestions={s.type === 'drogue' ? drogueSuggestions : learned.autres}
                    onChange={(p) => patch(s.id, p)}
                    onDone={() => learn(s.type === 'drogue' ? 'drogues' : 'autres', [s.label])}
                  />
                )}
                <div className={`qty ${missingQty ? 'qty-missing' : ''}`}>
                  <input
                    className="input"
                    type="number"
                    min={0}
                    autoFocus={s.type === 'argent' && lastAdded === s.id}
                    value={s.quantite ?? ''}
                    placeholder={s.type === 'argent' ? 'Montant' : 'Qté'}
                    onChange={(e) => patch(s.id, { quantite: e.target.value === '' ? null : Math.max(0, Number(e.target.value)) })}
                  />
                  <span>{s.type === 'argent' ? '$' : '×'}</span>
                </div>
                <div className="saisie-status">
                  {l ? (
                    <Badge tone={legalityTone(l)}>{legalityLabel(l)}</Badge>
                  ) : (s.type === 'arme' || s.type === 'munition') && s.label.trim() ? (
                    <Badge tone="grey">Hors répertoire</Badge>
                  ) : null}
                </div>
                <button
                  type="button"
                  className="btn btn-icon btn-ghost"
                  aria-label="Retirer"
                  onClick={() => props.onChange((cur) => ({ saisies: cur.saisies.filter((x) => x.id !== s.id) }))}
                >
                  <Trash2 size={15} />
                </button>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
