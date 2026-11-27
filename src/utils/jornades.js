import { TAULES, TORNS } from './consts.js'
import { supabase } from './supabase.js'

export const formatDataLocal = new Intl.DateTimeFormat('sv-SE', { dateStyle: 'short' })
export const minutsDia = 24 * 60
const estatsDeCancelacio = new Set(['cancelada', 'cancelado', 'anulada', 'anulado'])

export function sumarDies(data, dies) {
  return new Date(data.getFullYear(), data.getMonth(), data.getDate() + dies)
}

function aMinuts(hora) {
  const [hores, minuts] = hora.split(':').map(Number)
  return hores * 60 + minuts
}

export function formatHora(minuts) {
  const hores = String(Math.floor(minuts / 60)).padStart(2, '0')
  return `${hores}:${String(minuts % 60).padStart(2, '0')}`
}

export function formatFranja({ inici, fi }) {
  return `${formatHora(inici)}–${formatHora(fi)}`
}

export function retallarFranja(franja, inici, fi) {
  return { ...franja, inici: Math.max(inici, franja.inici), fi: Math.min(fi, franja.fi) }
}

export function teDurada({ inici, fi }) {
  return fi > inici
}

function franjaDelDia({ fecha_inicio, fecha_fin }, dia) {
  return {
    inici: fecha_inicio.slice(0, 10) < dia ? 0 : aMinuts(fecha_inicio.slice(11)),
    fi: !fecha_fin || fecha_fin.slice(0, 10) > dia ? minutsDia : aMinuts(fecha_fin.slice(11))
  }
}

function frangesDelDia(franges, data) {
  const dia = formatDataLocal.format(data)
  const seguent = formatDataLocal.format(sumarDies(data, 1))
  return franges.filter(({ fecha_inicio, fecha_fin }) =>
    fecha_inicio.replace(' ', 'T') < `${seguent}T00:00:00` &&
    (!fecha_fin || fecha_fin.replace(' ', 'T') > `${dia}T00:00:00`)
  ).map((franja) => ({ ...franja, ...franjaDelDia(franja, dia) })).filter(teDurada)
}

function citaCancelada(tasca) {
  return [tasca.estado, tasca.cita_servicios?.citas?.estado].some((estat) =>
    estatsDeCancelacio.has(estat?.trim().toLowerCase())
  )
}

function tornsDeLaTreballadora(horaris, tornSeleccionat) {
  return horaris.flatMap((horari) => {
    const mati = [horari.hora_inicio_manana, horari.hora_fin_manana]
    const tarda = [horari.hora_inicio_tarde, horari.hora_fin_tarde]
    if (tornSeleccionat === TORNS.MATI) return [mati]
    if (tornSeleccionat === TORNS.TARDA) return [tarda]
    return [mati, tarda]
  })
    .filter(([inici, fi]) => inici && fi)
    .map(([inici, fi]) => ({ inici: aMinuts(inici), fi: aMinuts(fi) }))
    .filter(teDurada)
    .sort((a, b) => a.inici - b.inici)
}

export async function carregarJornades(data, nombreDies, tornSeleccionat, signal) {
  const primerDia = formatDataLocal.format(data)
  const limit = formatDataLocal.format(sumarDies(data, nombreDies))
  const dates = Array.from({ length: nombreDies }, (_, index) => sumarDies(data, index))
  const diesSetmana = dates.flatMap((dia) => dia.getDay() === 0 ? [0, 7] : [dia.getDay()])

  const [empleats, horaris, absencies, cites] = await Promise.all([
    supabase.from(TAULES.EMPLEADOS).select('id,nombre').eq('activo', true).is('fecha_baja', null)
      .order('nombre').abortSignal(signal),
    supabase.from(TAULES.HORARIOS_EMPLEADOS)
      .select('empleado_id,dia_semana,hora_inicio_manana,hora_fin_manana,hora_inicio_tarde,hora_fin_tarde')
      .in('dia_semana', diesSetmana).abortSignal(signal),
    supabase.from(TAULES.AUSENCIAS_EMPLEADOS).select('empleado_id,fecha_inicio,fecha_fin')
      .lt('fecha_inicio', `${limit}T00:00:00`).or(`fecha_fin.is.null,fecha_fin.gt.${primerDia}T00:00:00`)
      .abortSignal(signal),
    supabase.from(TAULES.CITA_TAREAS_EMPLEADOS)
      .select('empleado_id,cita_tareas!inner(fecha_inicio,fecha_fin,estado,tareas(nombre),cita_servicios(servicios(nombre),citas(estado)))')
      .lt('cita_tareas.fecha_inicio', `${limit}T00:00:00`)
      .gt('cita_tareas.fecha_fin', `${primerDia}T00:00:00`)
      .abortSignal(signal)
  ])

  const error = [empleats, horaris, absencies, cites].find((resposta) => resposta.error)?.error
  if (error) throw error

  const treballadores = empleats.data.map(({ id, nombre }) => ({ id, nom: nombre }))
  const assignacions = cites.data.filter(({ cita_tareas }) => !citaCancelada(cita_tareas))

  const dies = dates.map((dataDia) => ({
    data: dataDia,
    jornada: treballadores.map(({ id, nom }) => {
      const torns = tornsDeLaTreballadora(horaris.data.filter((horari) =>
        horari.empleado_id === id && horari.dia_semana % 7 === dataDia.getDay()
      ), tornSeleccionat)
      const absenciesDia = frangesDelDia(absencies.data.filter((absencia) => absencia.empleado_id === id), dataDia)
      const feines = assignacions.filter((assignacio) => assignacio.empleado_id === id).map(({ cita_tareas }) => cita_tareas)
      const horesOcupades = frangesDelDia(feines, dataDia).map((franja) => ({
        inici: franja.inici,
        fi: franja.fi,
        tasca: franja.tareas?.nombre,
        servei: franja.cita_servicios?.servicios?.nombre
      })).sort((a, b) => a.inici - b.inici)
      const ocupades = tornSeleccionat === TORNS.INDIFERENT ? horesOcupades : horesOcupades
        .flatMap((franja) => torns.map((torn) => retallarFranja(franja, torn.inici, torn.fi))).filter(teDurada)

      return { id, nom, torns, absencies: absenciesDia, ocupades }
    })
  }))

  return { treballadores, dies }
}

export function frangesLliures({ torns, absencies, ocupades }) {
  const tornsUnits = []
  for (const torn of torns) {
    const ultim = tornsUnits.at(-1)
    if (ultim && torn.inici <= ultim.fi) ultim.fi = Math.max(ultim.fi, torn.fi)
    else tornsUnits.push({ ...torn })
  }

  const bloquejos = [...absencies, ...ocupades].sort((a, b) => a.inici - b.inici)
  return tornsUnits.flatMap((torn) => {
    const lliures = []
    let iniciLliure = torn.inici
    for (const bloqueig of bloquejos) {
      if (bloqueig.fi <= iniciLliure) continue
      if (bloqueig.inici >= torn.fi) break
      if (bloqueig.inici > iniciLliure) lliures.push({ inici: iniciLliure, fi: bloqueig.inici })
      iniciLliure = Math.max(iniciLliure, bloqueig.fi)
    }
    if (iniciLliure < torn.fi) lliures.push({ inici: iniciLliure, fi: torn.fi })
    return lliures
  })
}
