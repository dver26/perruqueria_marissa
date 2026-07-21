import Card from './Card'
import { useAppContext } from '../utils/useAppContext'

const CardGrid = () => {
  const { state } = useAppContext()
  return (
    <>
      <div className='container-grid'>
        {state.serveis.map((servei, i) => {
          const duracioTotal = servei.parts.reduce(
            (sum, part) => sum + part.duration,
            0
          )
          return (
            <Card key={i} id={i} servei={servei} duracioTotal={duracioTotal} />
          )
        })}
      </div>
    </>
  )
}

export default CardGrid
