import { useAppContext } from '../context/useAppContext'
import { ACTIONS, PANTALLAS } from '../utils/consts.js'

import './Card.css'

const Card = ({ id }) => {
  const { state, dispatch } = useAppContext()

  const servei = state.servicios.find((servicio) => servicio.id === id)

  const handleClick = () => {
    console.log(servei.nombre)
    dispatch({
      type: ACTIONS.ACTUALITZAR,
      payload: { pantalla: PANTALLAS.CONFIGURACIO_CITA, servei }
    })
  }

  return (
    <div onClick={handleClick} className='element-grid'>
      <h3 className='titulo'>{servei.nombre}</h3>
    </div>
  )
}

export default Card
