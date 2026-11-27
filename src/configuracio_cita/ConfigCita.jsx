import { useEffect, useState } from 'react'
import { useAppContext } from '../context/useAppContext'
import { supabase } from '../utils/supabase'
import { ACTIONS, PANTALLAS, TAULES, TORNS } from '../utils/consts.js'
import { minutsDia } from '../utils/jornades.js'
import './ConfigCita.css'

const PERSONALITZADA = 'personalitzada'
const INDIFERENT = 'indiferent'

const ConfigCita = () => {
  const { state, dispatch } = useAppContext()
  const idServei = state.servei.id
  const anterior = state.configuracioReserva?.idServei === idServei ? state.configuracioReserva : null
  const [cataleg, setCataleg] = useState(null)
  const [errorCarrega, setErrorCarrega] = useState(false)
  const [errorValidacio, setErrorValidacio] = useState('')
  const [opcions, setOpcions] = useState({})
  const [torn, setTorn] = useState(() => anterior?.torn ?? TORNS.MATI)

  useEffect(() => {
    const control = new AbortController()
    const signal = control.signal

    async function carregar() {
      const tasques = await supabase.from(TAULES.TAREAS).select('id,nombre')
        .eq('servicio_id', idServei).order('orden').abortSignal(signal)
      if (tasques.error) throw tasques.error
      if (!tasques.data.length) return []

      const ids = tasques.data.map(({ id }) => id)
      const [duracions, assignacions] = await Promise.all([
        supabase.from(TAULES.DURACIONS).select('tarea_id,duracio_minuts')
          .in('tarea_id', ids).order('duracio_minuts').abortSignal(signal),
        supabase.from(TAULES.EMPLEADO_TAREAS).select('tarea_id,empleado_id')
          .in('tarea_id', ids).abortSignal(signal)
      ])
      if (duracions.error || assignacions.error) throw duracions.error ?? assignacions.error

      return tasques.data.map(({ id, nombre }) => ({
        id,
        nom: nombre,
        habituals: duracions.data.filter(({ tarea_id }) => tarea_id === id).map(({ duracio_minuts }) => duracio_minuts),
        requereixTreballadora: !/^exposici[oó]n?(?:\s|$)/i.test(nombre),
        candidates: assignacions.data.filter(({ tarea_id }) => tarea_id === id).map(({ empleado_id }) => empleado_id)
      }))
    }

    carregar().then((tasques) => {
      if (!signal.aborted) setCataleg(tasques)
    }).catch((error) => {
      if (signal.aborted) return
      console.error('Error carregant la configuració del servei:', error)
      setErrorCarrega(true)
    })
    return () => control.abort()
  }, [idServei])

  function opcioDe(tasca) {
    const desada = anterior?.tasques.find(({ id }) => id === tasca.id)
    const habitual = tasca.habituals[0]
    const minuts = desada?.minuts ?? habitual ?? ''
    return {
      tipus: tasca.habituals.includes(minuts) ? String(minuts) : PERSONALITZADA,
      minuts,
      treballadora: desada?.treballadoraId ?? INDIFERENT,
      ...opcions[tasca.id]
    }
  }

  function canviarOpcio(tasca, canvi) {
    setOpcions((opcions) => ({ ...opcions, [tasca.id]: { ...opcions[tasca.id], ...canvi } }))
    setErrorValidacio('')
  }

  function handleSubmit(event) {
    event.preventDefault()
    if (!state.idClientReserva || !cataleg?.length) return

    const tasques = cataleg.map((tasca) => {
      const opcio = opcioDe(tasca)
      const treballadoraId = tasca.requereixTreballadora && opcio.treballadora !== INDIFERENT ? opcio.treballadora : null
      return { ...tasca, treballadoraId, minuts: Number(opcio.minuts) }
    })
    if (tasques.some(({ minuts }) => !Number.isInteger(minuts) || minuts < 1) ||
      tasques.reduce((total, { minuts }) => total + minuts, 0) > minutsDia) {
      setErrorValidacio('Introdueix minuts sencers superiors a zero. El servei ha de cabre dins d’un dia.')
      return
    }

    dispatch({
      type: ACTIONS.ACTUALITZAR,
      payload: { configuracioReserva: { idServei, tasques, torn }, pantalla: PANTALLAS.CALENDARI, torn }
    })
  }

  return (
    <>
      <button className='tornar-button' type='button' onClick={() => dispatch({
        type: ACTIONS.ACTUALITZAR, payload: { pantalla: PANTALLAS.INICIO }
      })}>
        Tornar a Inici
      </button>
      <form className='container-general' onSubmit={handleSubmit}>
        <h3 className='titulo'>{state.servei.nombre}</h3>
        {errorCarrega && <p role='alert'>No s’han pogut carregar les tasques del servei.</p>}
        {!cataleg && !errorCarrega && <p role='status'>Carregant les tasques…</p>}
        {cataleg?.length === 0 && <p>Aquest servei encara no té tasques.</p>}
        <div className='seleccio-parts'>
          {cataleg?.map((tasca) => {
            const opcio = opcioDe(tasca)
            return (
              <div key={tasca.id} className='container-part'>
                <label className='label' htmlFor={`duracio-${tasca.id}`}>{tasca.nom}</label>
                <div className='seleccions'>
                  <select id={`duracio-${tasca.id}`} value={opcio.tipus} onChange={({ target: { value } }) =>
                    canviarOpcio(tasca, { tipus: value, minuts: value === PERSONALITZADA ? opcio.minuts : Number(value) })}>
                    {tasca.habituals.map((minuts) => <option key={minuts} value={minuts}>{minuts} min</option>)}
                    <option value={PERSONALITZADA}>Altra durada…</option>
                  </select>
                  {opcio.tipus === PERSONALITZADA && (
                    <input type='number' min='1' max={minutsDia} step='1' required inputMode='numeric'
                      aria-label={`Minuts personalitzats per a ${tasca.nom}`} value={opcio.minuts}
                      onChange={({ target: { value } }) => canviarOpcio(tasca, { minuts: value })} />
                  )}
                  {tasca.requereixTreballadora && (
                    <select aria-label={`Treballadora per a ${tasca.nom}`} value={opcio.treballadora}
                      onChange={({ target: { value } }) => canviarOpcio(tasca, { treballadora: value })}>
                      <option value={INDIFERENT}>Indiferent</option>
                      {state.empleados.filter(({ id, activo, fecha_baja }) => activo && !fecha_baja && tasca.candidates.includes(id))
                        .map(({ id, nombre }) => <option key={id} value={id}>{nombre}</option>)}
                    </select>
                  )}
                </div>
              </div>
            )
          })}
        </div>
        <div className='seleccio-torn'>
          <label htmlFor='torn-servei'>Torn</label>
          <div className='torn-select-wrapper'>
            <select id='torn-servei' value={torn} onChange={({ target: { value } }) => setTorn(value)}>
              <option value={TORNS.MATI}>Matí</option>
              <option value={TORNS.TARDA}>Tarda</option>
              <option value={TORNS.INDIFERENT}>Indiferent</option>
            </select>
          </div>
        </div>
        {errorValidacio && <p role='alert'>{errorValidacio}</p>}
        <button type='submit' className='submit-button' disabled={!cataleg?.length}>Continuar</button>
      </form>
    </>
  )
}

export default ConfigCita
