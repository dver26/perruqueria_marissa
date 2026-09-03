import { useAppContext } from '../context/useAppContext'

import Card from './Card.jsx'

import './CardGrid.css'

const CardGrid = () => {
  const { state } = useAppContext()
  return (
    <div className='container-grid'>
      {state.servicios.map((servei) => {
        return <Card key={servei.id} id={servei.id} />
      })}
    </div>
  )
}

export default CardGrid
