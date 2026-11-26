export const DIES_HORARI = [
  { valor: 2, nom: 'Dimarts' }, { valor: 3, nom: 'Dimecres' }, { valor: 4, nom: 'Dijous' },
  { valor: 5, nom: 'Divendres' }, { valor: 6, nom: 'Dissabte' }
]

export function crearHorari(files = []) {
  return DIES_HORARI.map(({ valor }) => {
    const fila = files.find(f => f.dia_semana === valor)
    return { dia_semana: valor,
      mati: fila ? !!fila.hora_inicio_manana : files.length === 0,
      tarda: fila ? !!fila.hora_inicio_tarde : files.length === 0,
      hora_inicio_manana: fila?.hora_inicio_manana?.slice(0, 5) ?? '09:00',
      hora_fin_manana: fila?.hora_fin_manana?.slice(0, 5) ?? '13:00',
      hora_inicio_tarde: fila?.hora_inicio_tarde?.slice(0, 5) ?? '14:00',
      hora_fin_tarde: fila?.hora_fin_tarde?.slice(0, 5) ?? '20:00' }
  })
}

export function prepararHorari(dies) {
  if (dies.length !== 5 || new Set(dies.map(d => d.dia_semana)).size !== 5) throw new Error('Revisa els cinc dies de l’horari.')
  if (!dies.some(d => d.mati || d.tarda)) throw new Error('L’horari no pot estar buit. Activa com a mínim un torn amb hores de treball.')
  return dies.map(d => {
    const dia = DIES_HORARI.find(v => v.valor === d.dia_semana)
    if (!dia) throw new Error('Només es poden configurar els dies de dimarts a dissabte.')
    const resultat = { dia_semana: d.dia_semana }
    for (const [actiu, torn] of [[d.mati, 'manana'], [d.tarda, 'tarde']]) {
      const inici = d[`hora_inicio_${torn}`], fi = d[`hora_fin_${torn}`]
      if (actiu && (!/^([01]\d|2[0-3]):[0-5]\d$/.test(inici) || !/^([01]\d|2[0-3]):[0-5]\d$/.test(fi) || inici >= fi)) {
        throw new Error(`${dia.nom}: l’hora de final ha de ser posterior a la d’inici i les hores han de ser vàlides.`)
      }
      resultat[`hora_inicio_${torn}`] = actiu ? inici : null
      resultat[`hora_fin_${torn}`] = actiu ? fi : null
    }
    if (d.mati && d.tarda && d.hora_fin_manana > d.hora_inicio_tarde) throw new Error(`${dia.nom}: els dos torns no es poden solapar.`)
    return resultat
  })
}
