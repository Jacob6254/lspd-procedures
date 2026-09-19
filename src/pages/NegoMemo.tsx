import { Banknote, Building2, ListChecks, ShieldAlert } from 'lucide-react'
import { BRAQUAGES, PLAFONDS_ILLEGAUX, RANCONS_AUTRES, RANCONS_GRADES } from '@shared/grades'
import { CHECKLIST_OTAGES } from '@shared/nego'
import { useAuth } from '../auth'
import { PageHeader, Panel } from '../components/ui'

const argent = (n: number) => `${n.toLocaleString('fr-FR')} $`

export function NegoMemoPage() {
  const me = useAuth((s) => s.me)
  const monGrade = me?.grade

  return (
    <div className="page">
      <PageHeader
        icon={ShieldAlert}
        title="Mémo négociation"
        subtitle="Barème des rançons, plafonds des braquages et checklist otages, à garder sous les yeux pendant l’intervention."
      />

      <Panel title="Checklist otages" icon={ListChecks}>
        <ol className="liste-consignes">
          {CHECKLIST_OTAGES.map((c) => (
            <li key={c}>{c}</li>
          ))}
        </ol>
      </Panel>

      <Panel title="Tableau des braquages" icon={Building2}>
        <table className="memo-table">
          <thead>
            <tr>
              <th>Lieu</th>
              <th>Braqueurs</th>
              <th>Otages</th>
              <th>Véhicules</th>
            </tr>
          </thead>
          <tbody>
            {BRAQUAGES.map((b) => (
              <tr key={b.lieu}>
                <td>
                  <strong>{b.lieu}</strong>
                </td>
                <td>{b.braqueurs}</td>
                <td>{b.otages}</td>
                <td>{b.vehicules}</td>
              </tr>
            ))}
          </tbody>
        </table>
        <small className="muted">
          On ne négocie jamais au-delà de ces plafonds. Dans les petits braquages le marchand compte comme un otage, sauf en supérette.
        </small>
      </Panel>

      <Panel title="Rançons officielles en argent sale" icon={Banknote}>
        <table className="memo-table">
          <thead>
            <tr>
              <th>Qui</th>
              <th>Montant</th>
              <th>Pochons</th>
            </tr>
          </thead>
          <tbody>
            {RANCONS_AUTRES.map((r) => (
              <tr key={r.qui}>
                <td>
                  <strong>{r.qui}</strong>
                </td>
                <td>{argent(r.montant)}</td>
                <td>{r.pochons}</td>
              </tr>
            ))}
            {RANCONS_GRADES.map((r) => (
              <tr key={r.grade} className={r.grade === monGrade ? 'memo-moi' : ''}>
                <td>
                  <strong>{r.grade}</strong>
                  {r.grade === monGrade && <small className="muted"> · toi</small>}
                </td>
                <td>{argent(r.montant)}</td>
                <td>{r.pochons}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </Panel>

      <Panel title="Plafonds indicatifs de la hiérarchie illégale" icon={Banknote}>
        <table className="memo-table">
          <thead>
            <tr>
              <th>Rang</th>
              <th>Plafond</th>
            </tr>
          </thead>
          <tbody>
            {PLAFONDS_ILLEGAUX.map((p) => (
              <tr key={p.rang}>
                <td>
                  <strong>{p.rang}</strong>
                </td>
                <td>{argent(p.montant)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </Panel>
    </div>
  )
}
