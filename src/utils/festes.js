export function sumarDies(dia, quantitat) {
  const date = new Date(`${dia}T12:00:00Z`)
  date.setUTCDate(date.getUTCDate() + quantitat)
  return date.toISOString().slice(0, 10)
}

export function esLaborable(dia, horaris) {
  const setmana = new Date(`${dia}T12:00:00Z`).getUTCDay() || 7
  return setmana >= 2 && setmana <= 6 && horaris.some(h => h.dia_semana === setmana && (
    (h.hora_inicio_manana && h.hora_fin_manana && h.hora_inicio_manana < h.hora_fin_manana) ||
    (h.hora_inicio_tarde && h.hora_fin_tarde && h.hora_inicio_tarde < h.hora_fin_tarde)))
}

export function diesInterval(inici, final, horaris) {
  if (final < inici) throw new Error('El dia final no pot ser anterior al dia inicial.')
  const dies = []
  for (let dia = inici; dia <= final; dia = sumarDies(dia, 1)) if (esLaborable(dia, horaris)) dies.push(dia)
  return dies
}

export function diesFestaGuardats(absencies) {
  const dies = new Set()
  for (const a of absencies) {
    if (!a.fecha_fin) continue
    const fi = a.fecha_fin.replace(' ', 'T').replace(/\.0+$/, '')
    for (let dia = a.fecha_inicio.slice(0, 10); `${dia}T00:00:00` < fi; dia = sumarDies(dia, 1)) {
      if (a.fecha_inicio.replace(' ', 'T') < `${sumarDies(dia, 1)}T00:00:00`) dies.add(dia)
    }
  }
  return dies
}

export function crearMes(primerMes, offset) {
  const date = new Date(`${primerMes}-01T12:00:00Z`)
  date.setUTCMonth(date.getUTCMonth() + offset)
  const mes = date.toISOString().slice(0, 7)
  const dies = new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth() + 1, 0)).getUTCDate()
  return { mes, titol: new Intl.DateTimeFormat('ca', { month: 'long', year: 'numeric', timeZone: 'UTC' }).format(date),
    buits: (date.getUTCDay() + 6) % 7,
    dies: Array.from({ length: dies }, (_, i) => `${mes}-${String(i + 1).padStart(2, '0')}`) }
}
