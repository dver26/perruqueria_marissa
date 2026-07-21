import { useAppContext } from '../utils/useAppContext'
import './Card.css'

const Card = ({ id, servei }) => {
  const { dispatch } = useAppContext()

  const handleClick = () => {
    dispatch({
      type: 'CAMBIAR_PANTALLA',
      payload: { pantalla: 'escollir', serveiEscollit: id }
    })
  }

  return (
    <>
      <div onClick={handleClick} className='element-grid'>
        <div className='header'>
          <h3 className='titulo'>{servei.name}</h3>
        </div>
      </div>
    </>
  )
}

export default Card
