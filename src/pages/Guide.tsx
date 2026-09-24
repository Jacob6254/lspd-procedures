import { AlertTriangle, BookOpen, CheckSquare, ChevronRight, Plane, ScrollText, ShieldCheck, Target, Truck } from 'lucide-react'
import type { LucideIcon } from 'lucide-react'
import type { BlocGuide } from '../data/guides'
import { guideParId } from '../data/guides'
import { Empty, PageHeader } from '../components/ui'

const ICONES: Record<string, LucideIcon> = {
  procedure: ScrollText,
  rookie: ShieldCheck,
  convoi: Truck,
  msg: BookOpen,
  asd: Plane,
  ppa: Target
}

/** La ligne qu'on lit sans ouvrir : l'essentiel du bloc en une phrase. */
function resume(bloc: BlocGuide): string {
  if (bloc.texte) return bloc.texte
  if (bloc.points?.length) return bloc.points[0]
  if (bloc.check?.length) return bloc.check.join(' · ')
  if (bloc.alerte) return bloc.alerte
  return ''
}

function Detail({ bloc }: { bloc: BlocGuide }) {
  const sautTexte = bloc.texte && (bloc.points?.length || bloc.check?.length || bloc.table || bloc.exemple)
  return (
    <div className="guide-detail">
      {sautTexte && <p className="guide-texte">{bloc.texte}</p>}
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
    </div>
  )
}

function Ligne({ bloc, numero, ouvert }: { bloc: BlocGuide; numero?: number; ouvert?: boolean }) {
  return (
    <details className="guide-ligne" open={ouvert}>
      <summary>
        {numero !== undefined ? <span className="guide-num">{numero}</span> : <span className="guide-puce" />}
        <span className="guide-ligne-texte">
          <strong>{bloc.titre}</strong>
          <small>{resume(bloc)}</small>
        </span>
        {bloc.alerte && <AlertTriangle size={14} className="c-red" />}
        <ChevronRight size={15} className="guide-chevron" />
      </summary>
      <Detail bloc={bloc} />
    </details>
  )
}

export function GuidePage({ id }: { id: string }) {
  const guide = guideParId(id)
  if (!guide) return <Empty icon={BookOpen} title="Guide introuvable" />
  const Icone = ICONES[guide.id] ?? BookOpen

  return (
    <div className="page page-etroite">
      <PageHeader icon={Icone} title={guide.titre} subtitle={guide.sousTitre} />

      {guide.rappel && (
        <div className="guide-rappel">
          <ShieldCheck size={18} />
          <strong>{guide.rappel}</strong>
        </div>
      )}

      <div className="guide-liste">
        {guide.etapes.map((e, n) => (
          <Ligne bloc={e} numero={n + 1} key={e.titre} ouvert={n === 0} />
        ))}
      </div>

      {guide.sections && guide.sections.length > 0 && (
        <>
          <div className="section-title">
            <BookOpen size={15} /> À garder en tête
          </div>
          <div className="guide-liste">
            {guide.sections.map((s) => (
              <Ligne bloc={s} key={s.titre} />
            ))}
          </div>
        </>
      )}
    </div>
  )
}
