import { useAppContext } from '../context/useAppContext'
import { ACTIONS, PANTALLAS } from '../utils/consts.js'

import './Card.css'

// Muestra la tarjeta de un servicio para poder seleccionarlo.
const Card = ({ id }) => {
  const { state, dispatch } = useAppContext()

  const servei = state.servicios.find((servicio) => servicio.id === id)

  // Guarda el servicio elegido y abre la configuración de la cita.
  const handleClick = () => {
    dispatch({
      type: ACTIONS.ACTUALITZAR,
      payload: { pantalla: PANTALLAS.CONFIGURACIO_CITA, servei }
    })
  }

  return (
    <button type='button' onClick={handleClick} className='element-grid' disabled={!state.idClientReserva}>
      <span className='titulo'>{servei.nombre}</span>
    </button>
  )
}

export default Card
