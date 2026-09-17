import { useEffect, useId, useRef, useState, type ReactNode } from 'react'
import { Check, X } from 'lucide-react'
import type { LucideIcon } from 'lucide-react'
import { normalize } from '../lib/format'

export function PageHeader(props: { icon: LucideIcon; title: string; subtitle: string; right?: ReactNode }) {
  const Icon = props.icon
  return (
    <header className="page-header">
      <div className="page-header-icon">
        <Icon size={20} />
      </div>
      <div className="page-header-text">
        <h1>{props.title}</h1>
        <p>{props.subtitle}</p>
      </div>
      <div className="page-header-right">{props.right}</div>
    </header>
  )
}

export function Panel(props: { title?: string; icon?: LucideIcon; right?: ReactNode; children: ReactNode; className?: string }) {
  const Icon = props.icon
  return (
    <section className={`panel ${props.className ?? ''}`}>
      {(props.title || props.right) && (
        <div className="panel-head">
          {props.title && (
            <h2 className="eyebrow">
              {Icon && <Icon size={14} />}
              {props.title}
            </h2>
          )}
          {props.right}
        </div>
      )}
      {props.children}
    </section>
  )
}

export function Field(props: { label: string; hint?: string; children: ReactNode; wide?: boolean }) {
  return (
    <label className={`field ${props.wide ? 'field-wide' : ''}`}>
      <span className="field-label">{props.label}</span>
      {props.children}
      {props.hint && <span className="field-hint">{props.hint}</span>}
    </label>
  )
}

export function TextInput(props: {
  value: string
  onChange: (v: string) => void
  placeholder?: string
  type?: string
  autoFocus?: boolean
  className?: string
}) {
  return (
    <input
      className={`input ${props.className ?? ''}`}
      type={props.type ?? 'text'}
      value={props.value}
      placeholder={props.placeholder}
      autoFocus={props.autoFocus}
      onChange={(e) => props.onChange(e.target.value)}
    />
  )
}

export function TextArea(props: { value: string; onChange: (v: string) => void; placeholder?: string; rows?: number; maxLength?: number }) {
  return (
    <textarea
      className="input textarea"
      rows={props.rows ?? 3}
      value={props.value}
      placeholder={props.placeholder}
      maxLength={props.maxLength}
      onChange={(e) => props.onChange(e.target.value)}
    />
  )
}

export function Segmented<T extends string | number>(props: {
  value: T | null
  options: { value: T; label: string; hint?: string }[]
  onChange: (v: T) => void
  tone?: 'default' | 'yesno'
}) {
  return (
    <div className="segmented">
      {props.options.map((o) => (
        <button
          key={String(o.value)}
          type="button"
          className={`segment ${props.value === o.value ? 'active' : ''} ${props.tone === 'yesno' ? `yn-${o.value}` : ''}`}
          onClick={() => props.onChange(o.value)}
        >
          {o.label}
          {o.hint && <span className="segment-hint">{o.hint}</span>}
        </button>
      ))}
    </div>
  )
}

export function Toggle(props: { checked: boolean; onChange: (v: boolean) => void; label: string; hint?: string }) {
  return (
    <button type="button" className={`toggle ${props.checked ? 'on' : ''}`} onClick={() => props.onChange(!props.checked)}>
      <span className="toggle-box">{props.checked && <Check size={13} strokeWidth={3} />}</span>
      <span className="toggle-text">
        {props.label}
        {props.hint && <small>{props.hint}</small>}
      </span>
    </button>
  )
}

export function Badge(props: { tone: 'green' | 'red' | 'amber' | 'blue' | 'grey' | 'purple'; children: ReactNode }) {
  return <span className={`badge badge-${props.tone}`}>{props.children}</span>
}

/** Liste d'étiquettes avec suggestions (accusations, matricules…). */
export function ChipsInput(props: {
  values: string[]
  onChange: (v: string[]) => void
  suggestions?: string[]
  placeholder?: string
  prefix?: string
}) {
  const [text, setText] = useState('')
  const [open, setOpen] = useState(false)
  const listId = useId()
  const q = normalize(text)
  const matches = (props.suggestions ?? [])
    .filter((s) => !props.values.some((v) => v.toLowerCase() === s.toLowerCase()))
    .filter((s) => !q || normalize(s).includes(q))
    .slice(0, 8)

  function add(v: string) {
    const t = v.trim()
    if (t && !props.values.some((x) => x.toLowerCase() === t.toLowerCase())) props.onChange([...props.values, t])
    setText('')
  }

  return (
    <div className="chips-input" onBlur={() => setTimeout(() => setOpen(false), 120)}>
      {props.values.map((v) => (
        <span className="chip" key={v}>
          {props.prefix}
          {v}
          <button type="button" aria-label={`Retirer ${v}`} onClick={() => props.onChange(props.values.filter((x) => x !== v))}>
            <X size={12} />
          </button>
        </span>
      ))}
      <input
        className="chips-text"
        value={text}
        placeholder={props.values.length ? '' : props.placeholder}
        aria-controls={listId}
        onFocus={() => setOpen(true)}
        onChange={(e) => {
          setText(e.target.value)
          setOpen(true)
        }}
        onKeyDown={(e) => {
          if (e.key === 'Enter' || e.key === ',') {
            e.preventDefault()
            add(text)
          } else if (e.key === 'Backspace' && !text && props.values.length) {
            props.onChange(props.values.slice(0, -1))
          }
        }}
      />
      {open && matches.length > 0 && (
        <div className="suggest" id={listId}>
          {matches.map((m) => (
            <button type="button" key={m} onMouseDown={(e) => e.preventDefault()} onClick={() => add(m)}>
              {m}
            </button>
          ))}
        </div>
      )}
    </div>
  )
}

/** Bouton qui demande un deuxième clic pour confirmer. */
export function ConfirmButton(props: { onConfirm: () => void; label: string; confirmLabel?: string; icon?: LucideIcon; className?: string }) {
  const [armed, setArmed] = useState(false)
  const timer = useRef<ReturnType<typeof setTimeout>>(undefined)
  useEffect(() => () => clearTimeout(timer.current), [])
  const Icon = props.icon
  return (
    <button
      type="button"
      className={`btn ${armed ? 'btn-danger-solid' : 'btn-danger'} ${props.className ?? ''}`}
      onClick={() => {
        if (armed) {
          clearTimeout(timer.current)
          setArmed(false)
          props.onConfirm()
          return
        }
        setArmed(true)
        timer.current = setTimeout(() => setArmed(false), 3000)
      }}
    >
      {Icon && <Icon size={15} />}
      {armed ? (props.confirmLabel ?? 'Cliquer pour confirmer') : props.label}
    </button>
  )
}

export function Empty(props: { icon: LucideIcon; title: string; text?: string; children?: ReactNode }) {
  const Icon = props.icon
  return (
    <div className="empty">
      <div className="empty-icon">
        <Icon size={22} />
      </div>
      <strong>{props.title}</strong>
      {props.text && <p>{props.text}</p>}
      {props.children}
    </div>
  )
}
