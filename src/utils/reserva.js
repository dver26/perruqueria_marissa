import { frangesLliures, minutsDia } from './jornades.js'

const pasHora = 15

export function proposarHores(jornada, tasques) {
  const durada = tasques.reduce((total, tasca) => total + tasca.minuts, 0)
  if (!tasques.some(({ requereixTreballadora }) => requereixTreballadora) || !durada) return []

  const disponibilitat = jornada.map((treballadora) => ({
    id: treballadora.id,
    franges: treballadora.torns.flatMap((torn) => frangesLliures({ ...treballadora, torns: [torn] }))
  }))
  const propostes = []

  for (let inici = 0; inici + durada <= minutsDia; inici += pasHora) {
    const assignacions = []
    let minut = inici
    for (const tasca of tasques) {
      const fi = minut + tasca.minuts
      const treballadora = tasca.requereixTreballadora && disponibilitat.find(({ id, franges }) =>
        (!tasca.treballadoraId || tasca.treballadoraId === id) && tasca.candidates.includes(id) &&
        franges.some((franja) => franja.inici <= minut && franja.fi >= fi)
      )
      if (tasca.requereixTreballadora && !treballadora) break
      assignacions.push({ tarea_id: tasca.id, empleado_id: treballadora?.id ?? null, inici: minut, fi })
      minut = fi
    }
    if (assignacions.length === tasques.length) propostes.push({ inici, fi: minut, assignacions })
  }

  return propostes
}
