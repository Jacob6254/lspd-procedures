import { AlertTriangle, BookOpen, CheckSquare, Plane, ScrollText, ShieldCheck, Target, Truck } from 'lucide-react'
import type { LucideIcon } from 'lucide-react'
import type { BlocGuide } from '../data/guides'
import { guideParId } from '../data/guides'
import { Empty, PageHeader, Panel } from '../components/ui'

const ICONES: Record<string, LucideIcon> = {
  procedure: ScrollText,
  rookie: ShieldCheck,
  convoi: Truck,
  msg: BookOpen,
  asd: Plane,
  ppa: Target
}

function Contenu({ bloc }: { bloc: BlocGuide }) {
  return (
    <>
      {bloc.texte && <p className="guide-texte">{bloc.texte}</p>}
      {bloc.points && (
        <ul className="guide-points">
          {bloc.points.map((p) => (
            <li key={p}>{p}</li>
          ))}
        </ul>
      )}
      {bloc.table && (
        <table className="memo-table">
          <thead>
            <tr>
              {bloc.table.entetes.map((e) => (
                <th key={e}>{e}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {bloc.table.lignes.map((l, n) => (
              <tr key={n}>
                {l.map((c, k) => (
                  <td key={k}>{k === 0 ? <strong>{c}</strong> : c}</td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      )}
      {bloc.check && (
        <div className="guide-check">
          {bloc.check.map((c) => (
            <span key={c}>
              <CheckSquare size={14} /> {c}
            </span>
          ))}
        </div>
      )}
      {bloc.exemple && <pre className="guide-exemple">{bloc.exemple}</pre>}
      {bloc.alerte && (
        <p className="guide-alerte">
          <AlertTriangle size={15} /> {bloc.alerte}
        </p>
      )}
    </>
  )
}

export function GuidePage({ id }: { id: string }) {
  const guide = guideParId(id)
  if (!guide) return <Empty icon={BookOpen} title="Guide introuvable" />
  const Icone = ICONES[guide.id] ?? BookOpen

  return (
    <div className="page">
      <PageHeader icon={Icone} title={guide.titre} subtitle={guide.sousTitre} />

      {guide.rappel && (
        <div className="guide-rappel">
          <ShieldCheck size={20} />
          <strong>{guide.rappel}</strong>
        </div>
      )}

      <div className="etapes-nego">
        {guide.etapes.map((e, n) => (
          <section className="etape-nego" key={e.titre}>
            <header>
              <span className="etape-num">{n + 1}</span>
              <h3>{e.titre}</h3>
            </header>
            <Contenu bloc={e} />
          </section>
        ))}
      </div>

      {guide.sections?.map((s) => (
        <Panel title={s.titre} key={s.titre}>
          <Contenu bloc={s} />
        </Panel>
      ))}
    </div>
  )
}
