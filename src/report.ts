import type { Cooperation, Intervention, Saisie, Settings, Suspect, Weapon } from '@shared/types'
import type { StepKey } from './store'
import { capitalize, dateFr, heureFr, joinFr, money, sentence } from './lib/format'
import { legalityFor } from './weapons'
import { decrireVehicule } from './data/vehicules'
import { CHECKLIST_TOTAL } from './data/checklist'

export const REPORT_LIMIT = 1000

export const COOPERATION: { key: Cooperation; label: string; fem: string }[] = [
  { key: 'tres', label: 'très coopératif', fem: 'très coopérative' },
  { key: 'coop', label: 'coopératif', fem: 'coopérative' },
  { key: 'peu', label: 'peu coopératif', fem: 'peu coopérative' },
  { key: 'non', label: 'non coopératif', fem: 'non coopérative' }
]

export const COMPORTEMENTS: { label: string; fem: string }[] = [
  { label: 'calme', fem: 'calme' },
  { label: 'nerveux', fem: 'nerveuse' },
  { label: 'insultant', fem: 'insultante' },
  { label: 'agressif', fem: 'agressive' },
  { label: 'menaçant', fem: 'menaçante' },
  { label: 'violent', fem: 'violente' },
  { label: 'provocateur', fem: 'provocatrice' }
]

export const SAISIE_GROUPS: { type: Saisie['type']; title: string }[] = [
  { type: 'arme', title: 'ARMES' },
  { type: 'munition', title: 'MUNITIONS' },
  { type: 'drogue', title: 'DROGUE' },
  { type: 'argent', title: 'ARGENT NON DÉCLARÉ' },
  { type: 'autre', title: 'AUTRES OBJETS ILLÉGAUX' }
]

function others(i: Intervention, settings: Settings): string[] {
  return i.matricules.filter((m) => m.trim() && m.trim() !== settings.matricule.trim())
}

function avecAgents(list: string[]): string {
  if (list.length === 0) return ''
  return list.length === 1 ? `avec le matricule ${list[0]}` : `avec les matricules ${joinFr(list)}`
}

function saisieLine(s: Saisie, suspect: Suspect, weapons: Map<string, Weapon>): string {
  if (s.type === 'argent') return money(s.quantite ?? 0)
  const qty = s.quantite ?? '?'
  let note = ''
  const w = s.weaponId ? weapons.get(s.weaponId) : undefined
  if (w) {
    const l = legalityFor(w, suspect)
    if (l.kind === 'illegal') note = ' (arme illégale)'
    else if (l.kind === 'ppa-missing') note = l.has === 0 ? ' (sans PPA)' : ` (PPA niv. ${l.level} requis, son PPA est niv. ${l.has})`
    else if (l.kind === 'ppa-unknown') note = ` (PPA niv. ${l.level} requis)`
  }
  return `${qty} × ${s.label.trim()}${note}`
}

/** « Refus d’obtempérer » → « refus d’obtempérer », mais garde les sigles (PPA, LSPD…). */
export function lowerFirst(s: string): string {
  return /^\p{Lu}\p{Lu}/u.test(s) ? s : s.charAt(0).toLowerCase() + s.slice(1)
}

function adj(label: string, fem: boolean): string {
  const known = COMPORTEMENTS.find((c) => c.label === label)
  return fem && known ? known.fem : label
}

/** « une Sultan RS » → « d'une Sultan RS », « la voiture » → « de la voiture ». */
function deQuelqueChose(v: string): string {
  return /^[aeiouyhâàéèêîïôûAEIOUYH]/.test(v) ? `d'${v}` : `de ${v}`
}

/** Rapport d'un suspect. En version courte, les phrases sont réduites pour tenir dans le champ du MDT. */
export function generateReport(i: Intervention, suspect: Suspect, settings: Settings, weapons: Map<string, Weapon>): string {
  const court = settings.rapportCourt !== false
  const fem = suspect.civilite === 'Mme'
  const plural = i.suspects.length > 1
  const agents = others(i, settings)
  const nous = agents.length > 0
  const avec = avecAgents(agents)
  const motif = i.motif.trim() || '[motif]'
  const lieu = i.lieu.trim()
  const at = lieu ? ` ${lieu}` : ''
  const prevenu = fem ? 'la prévenue' : 'le prévenu'
  const nomComplet = `${suspect.prenom} ${suspect.nom}`.trim()

  // On nomme le suspect une seule fois, ensuite on dit « il », « elle » ou « ils ».
  let presente = false
  const sujetMin = (): string => {
    if (!presente) {
      presente = true
      if (plural) return nomComplet ? `${fem ? 'Mme' : 'M.'} ${nomComplet}` : 'le suspect'
      return prevenu
    }
    return plural ? 'il' : fem ? 'elle' : 'il'
  }
  const Sujet = (): string => capitalize(sujetMin())
  const a = plural ? 'a' : 'a'
  const accord = (masc: string, femi: string) => (fem ? femi : masc)

  const header = court
    ? [`Rapport — Matricule ${settings.matricule || '[matricule]'} · ${dateFr(i.date)} ${heureFr(i.heure)}`]
    : [`Rapport d'intervention — Matricule ${settings.matricule || '[matricule]'}`, `Date : ${dateFr(i.date)} ${heureFr(i.heure)}`]

  const intro: string[] = []
  if (court) {
    switch (i.origine) {
      case 'appel':
        intro.push(`Appel signalant ${motif}${at}.${avec ? ` Intervention ${avec}.` : ''}`)
        break
      case 'appel_citoyen':
        intro.push(`Appel d'un citoyen signalant ${motif}${at}.${avec ? ` Intervention ${avec}.` : ''}`)
        break
      case 'patrouille':
        intro.push(`En patrouille${avec ? ` ${avec}` : ''}${at} : ${motif}.`)
        break
      case 'controle':
        intro.push(`Contrôle routier${at}${avec ? ` ${avec}` : ''} : ${motif}.`)
        break
      case 'flagrant':
        intro.push(`Flagrant délit${at}${avec ? ` ${avec}` : ''} : ${motif}.`)
        break
    }
  } else {
    switch (i.origine) {
      case 'appel':
        intro.push(`À la suite d'un appel signalant ${motif}${at}, je me suis rendu sur place${avec ? ` ${avec}` : ''}.`)
        break
      case 'appel_citoyen':
        intro.push(`À la suite d'un appel d'un citoyen signalant ${motif}${at}, je me suis rendu sur place${avec ? ` ${avec}` : ''}.`)
        break
      case 'patrouille':
        intro.push(
          nous ? `J'étais en patrouille ${avec} lorsque nous avons constaté ${motif}${at}.` : `J'étais en patrouille lorsque j'ai constaté ${motif}${at}.`
        )
        break
      case 'controle':
        intro.push(
          nous ? `Lors d'un contrôle routier${at} effectué ${avec}, nous avons constaté ${motif}.` : `Lors d'un contrôle routier${at}, j'ai constaté ${motif}.`
        )
        break
      case 'flagrant':
        intro.push(
          nous ? `Alors que je me trouvais${at} ${avec}, nous avons constaté en flagrant délit ${motif}.` : `Alors que je me trouvais${at}, j'ai constaté en flagrant délit ${motif}.`
        )
        break
    }
  }
  if (i.constat.trim()) intro.push(sentence(i.constat))
  if (i.negociation.trim()) intro.push(sentence(i.negociation))

  const deroule: string[] = []
  const duree = i.fuitePiedDuree.trim()
  const dureeVoiture = i.poursuiteDuree.trim()
  const vehicule = decrireVehicule(i.poursuiteVehiculeType ?? '', i.poursuiteVehiculeCouleur ?? '', i.poursuiteVehicule ?? '')
  const destination = i.destination === 'poste' ? 'au poste' : "en salle d'interrogatoire"

  if (court) {
    if (i.refusObtemperer) deroule.push("Refus d'obtempérer.")
    if (i.fuitePied) deroule.push(`Fuite à pied${duree ? ` (${duree})` : ''}.`)
    if (i.poursuite) {
      deroule.push(
        `Course-poursuite${dureeVoiture ? ` (${dureeVoiture})` : ''}${vehicule ? `, au volant ${deQuelqueChose(vehicule)}` : ''}${
          i.poursuiteDangereuse ? ', conduite dangereuse' : ''
        }.`
      )
      if (i.poursuiteFin.trim()) deroule.push(sentence(i.poursuiteFin))
    }
    if (i.tazer) deroule.push('Usage du tazer.')
    if (i.interpellation.trim()) deroule.push(sentence(i.interpellation))
    deroule.push(`${plural ? 'Menottés puis conduits' : `${accord('Menotté', 'Menottée')} puis ${accord('conduit', 'conduite')}`} ${destination}.`)
    if (i.autres.trim()) deroule.push(sentence(i.autres))
  } else {
    if (i.refusObtemperer) deroule.push(`${Sujet()} ${plural ? 'ont' : a} refusé d'obtempérer malgré nos sommations.`)
    if (i.fuitePied) {
      const pronom = plural ? 'les ' : "l'"
      const accordP = plural ? 'poursuivis' : accord('poursuivi', 'poursuivie')
      deroule.push(
        `${Sujet()} ${plural ? 'ont' : a} pris la fuite à pied. ${nous ? 'Nous' : 'Je'} ${pronom}${nous ? 'avons' : 'ai'} ${accordP}${
          duree ? ` pendant ${duree}` : ''
        }.`
      )
    }
    if (i.poursuite) {
      let p = `Une course-poursuite a ensuite été engagée${dureeVoiture ? ` pendant ${dureeVoiture}` : ''}${
        vehicule ? `, ${plural ? 'à bord' : 'au volant'} ${deQuelqueChose(vehicule)}` : ''
      }`
      if (i.poursuiteDangereuse) p += ', avec une conduite dangereuse mettant en danger les usagers de la route'
      deroule.push(`${p}.`)
      if (i.poursuiteFin.trim()) deroule.push(sentence(i.poursuiteFin))
    }
    if (i.tazer) deroule.push(`${nous ? 'Nous avons' : "J'ai"} fait usage du tazer afin de ${plural ? 'les' : accord('le', 'la')} neutraliser.`)
    if (i.interpellation.trim()) deroule.push(sentence(i.interpellation))
    deroule.push(
      `${Sujet()} ${plural ? 'ont été menottés puis conduits' : `a été ${accord('menotté', 'menottée')} puis ${accord('conduit', 'conduite')}`} ${destination} afin d'effectuer la procédure.`
    )
    if (i.autres.trim()) deroule.push(sentence(i.autres))
  }

  const perso: string[] = []
  const traits = suspect.comportements.map((c) => adj(c, fem))
  const coop = COOPERATION.find((c) => c.key === suspect.cooperation)
  if (coop) traits.push(fem ? coop.fem : coop.label)

  if (court) {
    if (traits.length) perso.push(`Comportement : ${joinFr(traits)}.`)
    if (suspect.recherche === 'oui') perso.push('Avis de recherche en cours.')
    if (suspect.bracelet === 'oui') perso.push('Bracelet électronique.')
    if (suspect.outrage) perso.push(`Outrage : « ${suspect.outragePhrase.trim() || '[phrase exacte]'} ».`)
    if (suspect.menace) perso.push(`Menace sur agent : « ${suspect.menacePhrase.trim() || '[phrase exacte]'} ».`)
  } else {
    if (traits.length) perso.push(`${Sujet()} s'est ${accord('montré', 'montrée')} ${joinFr(traits)} durant son interpellation.`)
    if (suspect.recherche === 'oui') perso.push(`${Sujet()} faisait l'objet d'un avis de recherche.`)
    if (suspect.bracelet === 'oui') perso.push(`${Sujet()} portait un bracelet électronique.`)
    if (suspect.outrage) perso.push(`${Sujet()} a proféré l'outrage suivant envers les agents : « ${suspect.outragePhrase.trim() || '[phrase exacte]'} ».`)
    if (suspect.menace) {
      perso.push(`${Sujet()} a proféré la menace suivante envers un agent de l'État : « ${suspect.menacePhrase.trim() || '[phrase exacte]'} ».`)
    }
  }

  const fouille: string[] = []
  const saisies = suspect.saisies.filter((s) => s.label.trim() || s.type === 'argent')
  if (saisies.length === 0) {
    if (court) fouille.push(suspect.rienSurLui ? "Fouille : rien d'illégal." : 'Fouille : [à compléter].')
    else {
      fouille.push(
        suspect.rienSurLui
          ? `Lors de la fouille, ${sujetMin()} n'avait rien d'illégal sur ${fem ? 'elle' : 'lui'}.`
          : 'Lors de la fouille, [objets saisis à compléter].'
      )
    }
  } else {
    fouille.push(court ? 'Saisies :' : 'Lors de la fouille, les éléments suivants ont été saisis :')
    for (const g of SAISIE_GROUPS) {
      const items = saisies.filter((s) => s.type === g.type)
      if (!items.length) continue
      const lignes = items.map((s) => saisieLine(s, suspect, weapons))
      if (court) fouille.push(`${g.title} : ${lignes.join(', ')}`)
      else {
        fouille.push(`${g.title} :`)
        lignes.forEach((l) => fouille.push(l))
      }
    }
  }

  const fin: string[] = []
  if (suspect.accusations.length) {
    fin.push(`${court ? 'Accusations' : 'Accusations retenues'} : ${joinFr(suspect.accusations.map(lowerFirst))}.`)
  }
  if (suspect.notes.trim()) fin.push(sentence(suspect.notes))

  const blocks = [header.join('\n'), intro.join(' '), deroule.join(' '), perso.join(' '), fouille.join('\n'), fin.join('\n')]
  return blocks.filter((b) => b.trim()).join('\n\n')
}

export interface Check {
  level: 'error' | 'warn'
  text: string
  step: StepKey | 'commun'
}

/** Ce qui manque pour éviter un vice de procédure. Rien n'est bloquant. */
export function checkSuspect(i: Intervention, s: Suspect, settings: Settings, weapons: Map<string, Weapon>): Check[] {
  const out: Check[] = []
  const add = (level: Check['level'], step: Check['step'], text: string) => out.push({ level, text, step })

  if (!settings.matricule.trim()) add('error', 'commun', 'Ton matricule n’est pas renseigné (Réglages).')
  if (!i.motif.trim()) add('error', 'commun', 'Le motif de l’intervention est vide.')
  if (!i.lieu.trim()) add('warn', 'commun', 'Le lieu n’est pas précisé.')
  if (i.matricules.filter((m) => m.trim()).length === 0) add('error', 'commun', 'Aucun matricule d’agent présent.')

  if (!s.prenom.trim() || !s.nom.trim()) add('error', 'identite', 'Nom ou prénom du suspect manquant.')
  if (s.photo.length === 0) add('warn', 'identite', 'Pas de photo du suspect.')
  if (s.identite.length === 0) add('warn', 'identite', 'Pas de screen de la carte d’identité.')
  if (s.recherche === null) add('warn', 'identite', 'Avis de recherche non vérifié.')
  if (s.bracelet === null) add('warn', 'identite', 'Bracelet non vérifié.')

  if (!s.mirandaLusA) add('warn', 'miranda', 'Droits Miranda pas marqués comme lus.')

  if (s.fouilleScreens.length === 0) add('warn', 'fouille', 'Pas de screen de la fouille.')
  if (s.saisies.length === 0 && !s.rienSurLui) add('error', 'fouille', 'Fouille non renseignée (objets saisis ou « rien sur lui »).')
  for (const x of s.saisies) {
    const name = x.label.trim() || (x.type === 'argent' ? 'argent sale' : 'un objet')
    if (x.type !== 'argent' && !x.label.trim()) add('error', 'fouille', 'Un objet saisi n’a pas de nom.')
    if (!x.quantite || x.quantite <= 0) add('error', 'fouille', `Quantité manquante pour ${name}.`)
  }
  const hasPpaWeapon = s.saisies.some((x) => x.weaponId && weapons.get(x.weaponId)?.status === 'ppa')
  if (hasPpaWeapon && s.ppa === null) add('warn', 'identite', 'Arme soumise au PPA saisie : vérifie son PPA.')

  if (s.cooperation === null) add('warn', 'comportement', 'Coopérativité non renseignée.')
  if (s.outrage && !s.outragePhrase.trim()) add('error', 'comportement', 'Outrage retenu : il manque la phrase exacte.')
  if (s.menace && !s.menacePhrase.trim()) add('error', 'comportement', 'Menace sur agent retenue : il manque la phrase exacte.')
  if (s.accusations.length === 0) add('error', 'comportement', 'Aucune accusation retenue.')

  if ((s.checklist?.length ?? 0) < CHECKLIST_TOTAL) add('warn', 'checklist', 'Checklist de fin de procédure non terminée.')
  if (s.amendesScreens.length === 0) add('warn', 'sanction', 'Pas de screen des amendes.')
  if (s.casierScreens.length === 0) add('warn', 'sanction', 'Pas de screen de l’ajout au casier.')
  return out
}

export function stepState(checks: Check[], step: Check['step']): 'done' | 'warn' | 'error' {
  const mine = checks.filter((c) => c.step === step)
  if (mine.some((c) => c.level === 'error')) return 'error'
  return mine.length ? 'warn' : 'done'
}
