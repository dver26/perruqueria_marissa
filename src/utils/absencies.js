// Los timestamps sin zona de la BD representan la hora local del salón.
export function dataLocal(date = new Date()) {
  return new Intl.DateTimeFormat('sv-SE', {
    timeZone: 'Europe/Madrid', year: 'numeric', month: '2-digit', day: '2-digit',
    hour: '2-digit', minute: '2-digit', second: '2-digit', hourCycle: 'h23'
  }).format(date).replace(' ', 'T')
}

export function prepararAbsencia({ inici, fi, diesComplets, motiu }, empleado_id) {
  if (!inici) throw new Error('Indica l’inici de l’absència.')
  let fecha_inicio = diesComplets ? `${inici}T00:00:00` : `${inici}:00`
  let fecha_fin = fi ? (diesComplets ? `${fi}T00:00:00` : `${fi}:00`) : null
  if (diesComplets && fi) {
    const end = new Date(`${fi}T00:00:00Z`)
    end.setUTCDate(end.getUTCDate() + 1)
    fecha_fin = end.toISOString().slice(0, 19)
  }
  if (Number.isNaN(Date.parse(fecha_inicio)) || (fecha_fin && (Number.isNaN(Date.parse(fecha_fin)) || fecha_fin <= fecha_inicio))) {
    throw new Error('El final ha de ser posterior a l’inici.')
  }
  return { empleado_id, fecha_inicio, fecha_fin, motivo: motiu.trim() || null }
}
