import serveis from '../serveis.json'
import './App.css'

import Card from './Card'

const App = () => {
  return (
    <div className='container-grid'>
      {serveis.map((servei) => {
        const duracioTotal = servei.parts.reduce(
          (sum, part) => sum + part.duration,
          0
        )
        return <Card servei={servei} duracioTotal={duracioTotal} />
      })}
    </div>
  )
}

export default App
