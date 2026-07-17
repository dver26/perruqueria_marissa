import serveis from '../serveis.json'
import './App.css'

const App = () => {
  return (
    <div className='container-grid'>
      {serveis.map((servei) => {
        const duracioTotal = servei.parts.reduce(
          (sum, part) => sum + part.duration,
          0
        )

        return (
          <div className='element-grid' key={servei.name}>
            <div className='header'>
              <h3 className='titulo'>{servei.name}</h3>
              <span className='duracio-total'>{duracioTotal} min</span>
            </div>

            <ul className='parts-list'>
              {servei.parts.map((part, i) => (
                <li className='part' key={i}>
                  <div className='part-info'>
                    <span className='part-name'>{part.name}</span>
                    <span className='part-duration'>{part.duration} min</span>
                  </div>
                  {part.availableEmployees &&
                    part.availableEmployees.length > 0 && (
                      <div className='empleats'>
                        {part.availableEmployees.map((emp) => (
                          <span className='badge' key={emp}>
                            {emp}
                          </span>
                        ))}
                      </div>
                    )}
                </li>
              ))}
            </ul>
          </div>
        )
      })}
    </div>
  )
}

export default App
