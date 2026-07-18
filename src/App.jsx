import { useAppContext } from './utils/useAppContext.js'
import './App.css'

import CardGrid from './Inicio/CardGrid.jsx'
import CreacioServei from './CreacioServei/CreacioServei.jsx'

const App = () => {
  const { state } = useAppContext()

  const handleScreen = () => {
    switch (state.pantalla) {
      case 'inicio':
        return <CardGrid />
      case 'escollir':
        return <CreacioServei />
    }
  }

  return <>{handleScreen()}</>
}

export default App
