// Los timestamps sin zona de la BD representan la hora local del salón.
export function dataLocal(date = new Date()) {
  return new Intl.DateTimeFormat('sv-SE', {
    timeZone: 'Europe/Madrid', year: 'numeric', month: '2-digit', day: '2-digit',
    hour: '2-digit', minute: '2-digit', second: '2-digit', hourCycle: 'h23'
  }).format(date).replace(' ', 'T')
}

export function prepararAbsencia({ inici, fi, diesComplets, motiu }, empleado_id, { original = null, ara = dataLocal(), iniciAra = false } = {}) {
  const usarAra = iniciAra && !diesComplets
  if (!inici && !usarAra) throw new Error('Indica l’inici de l’absència.')
  const horaCompleta = valor => valor.length === 16 ? `${valor}:00` : valor
  let fecha_inicio = usarAra ? ara : diesComplets ? `${inici}T00:00:00` : horaCompleta(inici)
  const iniciFix = original && absenciaIniciada(original, ara)
  if (iniciFix && usarAra) throw new Error('L’absència ja ha començat i no se’n pot canviar l’inici.')
  if (iniciFix) fecha_inicio = normalizarFecha(original.fecha_inicio)
  let fecha_fin = fi ? (diesComplets ? `${fi}T00:00:00` : horaCompleta(fi)) : null
  if (diesComplets && fi) {
    const end = new Date(`${fi}T00:00:00Z`)
    end.setUTCDate(end.getUTCDate() + 1)
    fecha_fin = end.toISOString().slice(0, 19)
  }
  if (Number.isNaN(Date.parse(fecha_inicio)) || (fecha_fin && (Number.isNaN(Date.parse(fecha_fin)) || fecha_fin <= fecha_inicio))) {
    throw new Error('El final ha de ser posterior a l’inici.')
  }
  if (!iniciFix && (diesComplets ? fecha_inicio.slice(0, 10) < ara.slice(0, 10) : fechaComparable(fecha_inicio) < fechaComparable(ara))) {
    throw new Error('L’inici no pot ser anterior al moment actual.')
  }
  return { empleado_id, fecha_inicio, fecha_fin, dias_completos: diesComplets, motivo: motiu.trim() || null }
}

const normalizarFecha = valor => valor.replace(' ', 'T')

export function formatarDataAbsencia(valor) {
  if (!valor) return 'Sense data final'
  const [data, hora] = normalizarFecha(valor).split('T')
  const [any, mes, dia] = data.split('-')
  return `${dia}/${mes}/${any}${hora ? ` · ${hora.slice(0, 5)}` : ''}`
}

const fechaComparable = valor => {
  const [data, fraccio = ''] = normalizarFecha(valor).split('.')
  return `${data}.${fraccio.padEnd(6, '0')}`
}

export function absenciaVigent(absencia, ara = dataLocal()) {
  return !absencia.fecha_fin || fechaComparable(absencia.fecha_fin) > fechaComparable(ara)
}

export function absenciaIniciada(absencia, ara = dataLocal()) {
  return fechaComparable(absencia.fecha_inicio) <= fechaComparable(ara)
}

export function campsPerEditarAbsencia(absencia, diesComplets = absencia.dias_completos) {
  if (diesComplets) {
    let fi = ''
    if (absencia.fecha_fin) {
      const final = new Date(`${normalizarFecha(absencia.fecha_fin).slice(0, 10)}T00:00:00Z`)
      if (/T00:00(?::00(?:\.0+)?)?$/.test(normalizarFecha(absencia.fecha_fin))) final.setUTCDate(final.getUTCDate() - 1)
      fi = final.toISOString().slice(0, 10)
    }
    return { inici: absencia.fecha_inicio.slice(0, 10), fi, diesComplets: true, motiu: absencia.motivo ?? '' }
  }
  return { inici: normalizarFecha(absencia.fecha_inicio), fi: absencia.fecha_fin ? normalizarFecha(absencia.fecha_fin) : '',
    diesComplets: false, motiu: absencia.motivo ?? '' }
}

export function canviarTipusAbsencia(camps, diesComplets, original = null, ara = dataLocal()) {
  const iniciFix = original && absenciaIniciada(original, ara)
  const inici = iniciFix ? normalizarFecha(original.fecha_inicio) : camps.inici
  if (diesComplets) {
    return { ...camps, diesComplets, inici: inici.slice(0, 10),
      fi: camps.fi ? campsPerEditarAbsencia({ fecha_inicio: inici, fecha_fin: camps.fi, motivo: camps.motiu }, true).fi : '' }
  }
  let fi = ''
  if (camps.fi) {
    const final = new Date(`${camps.fi}T00:00:00Z`)
    final.setUTCDate(final.getUTCDate() + 1)
    fi = final.toISOString().slice(0, 19)
  }
  return { ...camps, diesComplets, inici: iniciFix ? inici : inici ? `${inici}T00:00:00` : '', fi }
}
