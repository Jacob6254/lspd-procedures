/** Types de véhicules et couleurs, pour décrire le véhicule du suspect sans donner le modèle exact. */

export interface TypeVehicule {
  label: string
  genre: 'm' | 'f'
}

export const TYPES_VEHICULE: TypeVehicule[] = [
  { label: 'sportive', genre: 'f' },
  { label: 'berline', genre: 'f' },
  { label: 'citadine', genre: 'f' },
  { label: '4x4', genre: 'm' },
  { label: 'SUV', genre: 'm' },
  { label: 'pick-up', genre: 'm' },
  { label: 'utilitaire', genre: 'm' },
  { label: 'camion', genre: 'm' },
  { label: 'moto', genre: 'f' },
  { label: 'quad', genre: 'm' },
  { label: 'véhicule de luxe', genre: 'm' },
  { label: 'véhicule tout-terrain', genre: 'm' }
]

export interface Couleur {
  m: string
  f: string
  css: string
}

export const COULEURS: Couleur[] = [
  { m: 'noir', f: 'noire', css: '#141418' },
  { m: 'blanc', f: 'blanche', css: '#e9e9ee' },
  { m: 'gris', f: 'grise', css: '#8a8b91' },
  { m: 'bleu', f: 'bleue', css: '#3b6ee6' },
  { m: 'rouge', f: 'rouge', css: '#e5484d' },
  { m: 'vert', f: 'verte', css: '#3fb867' },
  { m: 'jaune', f: 'jaune', css: '#f0d027' },
  { m: 'orange', f: 'orange', css: '#f0932b' },
  { m: 'violet', f: 'violette', css: '#9b7cf0' },
  { m: 'marron', f: 'marron', css: '#7a5233' }
]

/** « sportive » + « noir » → « une sportive noire ». */
export function decrireVehicule(type: string, couleur: string, precision = ''): string {
  const t = TYPES_VEHICULE.find((x) => x.label === type)
  const c = COULEURS.find((x) => x.m === couleur)
  const morceaux: string[] = []
  if (t) morceaux.push(`${t.genre === 'f' ? 'une' : 'un'} ${t.label}`)
  else if (c) morceaux.push('un véhicule')
  if (c) morceaux.push(t?.genre === 'f' ? c.f : c.m)
  const base = morceaux.join(' ')
  const p = precision.trim()
  if (!base) return p
  return p ? `${base} (${p})` : base
}
