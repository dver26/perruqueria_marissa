import { useRef, useState } from 'react'
import { useAppContext } from '../context/useAppContext.js'
import { ACTIONS, PANTALLAS, RESERVA_BUIDA } from '../utils/consts.js'
import { formatDataLocal, formatFranja } from '../utils/jornades.js'
import { proposarHores } from '../utils/reserva.js'
import { supabase } from '../utils/supabase.js'

export default function ConfirmarReserva({ data, jornada }) {
  const { state, dispatch } = useAppContext()
  const [hora, setHora] = useState('')
  const [error, setError] = useState('')
  const enviant = useRef(false)
  const configuracio = state.configuracioReserva
  if (!state.idClientReserva || !state.idReserva || !configuracio) return null

  const propostes = proposarHores(jornada, configuracio.tasques)
  const seleccio = hora === '' ? null : propostes.find(({ inici }) => inici === Number(hora))

  async function confirmar(event) {
    event.preventDefault()
    if (!seleccio || enviant.current) return
    enviant.current = true
    setError('')
    dispatch({ type: ACTIONS.ACTUALITZAR, payload: { guardantReserva: true } })
    try {
      const { error } = await supabase.rpc('confirmar_cita_perruqueria', {
        p_reserva: state.idReserva,
        p_client: state.idClientReserva,
        p_servei: configuracio.idServei,
        p_dia: formatDataLocal.format(data),
        p_torn: configuracio.torn,
        p_tasques: seleccio.assignacions
      }).abortSignal(AbortSignal.timeout(15000))
      if (error) throw error

      dispatch({
        type: ACTIONS.ACTUALITZAR,
        payload: {
          ...RESERVA_BUIDA,
          client: null,
          pantalla: PANTALLAS.INICIO,
          missatgeReserva: `Cita confirmada per a ${state.nomClientReserva} · ${new Intl.DateTimeFormat('ca-ES', { dateStyle: 'medium' }).format(data)} · ${formatFranja(seleccio)}`
        }
      })
    } catch (error) {
      console.error('Error confirmant la cita:', error)
      if (error.code === 'PGRST202') setError('Falta activar la confirmació de cites a Supabase.')
      else if (error.code === 'P0001') setError(error.message)
      else setError('No s’ha pogut verificar la confirmació. Torna-ho a provar amb la mateixa hora.')
      dispatch({ type: ACTIONS.ACTUALITZAR, payload: { guardantReserva: false } })
    } finally {
      enviant.current = false
    }
  }

  return (
    <form className='visor-confirmar-reserva' onSubmit={confirmar}>
      {propostes.length ? (
        <>
          <label htmlFor='hora-reserva'>Hora de la cita</label>
          <select id='hora-reserva' value={hora} disabled={state.guardantReserva}
            onChange={({ target: { value } }) => { setHora(value); setError('') }} required>
            <option value=''>Tria una hora…</option>
            {propostes.map((franja) => <option key={franja.inici} value={franja.inici}>{formatFranja(franja)}</option>)}
          </select>
          <button type='submit' disabled={!seleccio || state.guardantReserva}>
            {state.guardantReserva ? 'Confirmant…' : 'Confirmar cita'}
          </button>
        </>
      ) : <p>No hi ha cap hora disponible per a aquesta durada i aquest torn.</p>}
      {error && <p className='visor-error-reserva' role='alert'>{error}</p>}
    </form>
  )
}
