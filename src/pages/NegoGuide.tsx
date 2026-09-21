import { Banknote, Building2, ListChecks, Plus, ShieldAlert } from 'lucide-react'
import { BRAQUAGES, CHECKLIST_OTAGES, ETAPES_NEGOCIATION, PLAFONDS_ILLEGAUX, RANCONS_AUTRES, RANCONS_GRADES } from '@shared/negociation'
import { useStore } from '../store'
import { PageHeader, Panel } from '../components/ui'

const argent = (n: number) => `${n.toLocaleString('fr-FR')} $`

export function NegoGuidePage() {
  const createNegociation = useStore((s) => s.createNegociation)

  return (
    <div className="page">
      <PageHeader
        icon={ShieldAlert}
        title="Comment procéder à une négociation"
        subtitle="Le déroulé à suivre sur le terrain, les plafonds à ne pas dépasser et le barème des rançons."
        right={
          <button type="button" className="btn btn-primary" onClick={createNegociation}>
            <Plus size={15} /> Nouvelle négociation
          </button>
        }
      />

      <div className="etapes-nego">
        {ETAPES_NEGOCIATION.map((e, n) => (
          <section className="etape-nego" key={e.titre}>
            <header>
              <span className="etape-num">{n + 1}</span>
              <h3>{e.titre}</h3>
            </header>
            <ul>
              {e.points.map((p) => (
                <li key={p}>{p}</li>
              ))}
            </ul>
          </section>
        ))}
      </div>

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
              <tr key={r.grade}>
                <td>
                  <strong>{r.grade}</strong>
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
