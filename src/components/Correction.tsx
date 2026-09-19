import { CheckCircle2, Circle, XCircle } from 'lucide-react'
import type { PointCorrige } from '@shared/formation'

/** Copie corrigée : les questions avec leurs réponses, puis les points du dossier. */
export function Correction({ details }: { details: PointCorrige[] }) {
  const questions = details.filter((d) => d.options && d.options.length > 0)
  const dossier = details.filter((d) => !d.options || d.options.length === 0)

  return (
    <div className="stack gap-16">
      {questions.length > 0 && (
        <div className="stack gap-12">
          <span className="eyebrow">Les questions</span>
          {questions.map((d, n) => (
            <div className={`copie ${d.bon ? 'ok' : 'ko'}`} key={n}>
              <div className="copie-question">
                {d.bon ? <CheckCircle2 size={16} /> : <XCircle size={16} />}
                <strong>
                  {n + 1}. {d.libelle}
                </strong>
              </div>
              <div className="stack gap-6">
                {d.options!.map((o, k) => {
                  const etat = o.bon ? (o.choisi ? 'juste' : 'manquee') : o.choisi ? 'faux' : 'neutre'
                  return (
                    <div className={`copie-option ${etat}`} key={k}>
                      {etat === 'juste' && <CheckCircle2 size={14} />}
                      {etat === 'manquee' && <CheckCircle2 size={14} />}
                      {etat === 'faux' && <XCircle size={14} />}
                      {etat === 'neutre' && <Circle size={14} />}
                      <span>{o.texte}</span>
                      {etat === 'juste' && <small>ta réponse · bonne</small>}
                      {etat === 'manquee' && <small>bonne réponse</small>}
                      {etat === 'faux' && <small>ton choix</small>}
                    </div>
                  )
                })}
              </div>
            </div>
          ))}
        </div>
      )}

      {dossier.length > 0 && (
        <div className="stack gap-6">
          <span className="eyebrow">Le dossier</span>
          {dossier.map((d, n) => (
            <div className={`correction ${d.bon ? 'ok' : 'ko'}`} key={n}>
              {d.bon ? <CheckCircle2 size={16} /> : <XCircle size={16} />}
              <span>{d.libelle}</span>
              {!d.bon && d.donne && <small className="muted">ta réponse : {d.donne}</small>}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
