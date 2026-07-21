import { useAppContext } from './utils/useAppContext.js'
import './App.css'

import CardGrid from './Inicio/CardGrid.jsx'
import PantallaParts from './CreacioServei/PantallaParts.jsx'

const App = () => {
  const { state } = useAppContext()

  const handleScreen = () => {
    switch (state.pantalla) {
      case 'inicio':
        return <CardGrid />
      case 'escollir':
        return <PantallaParts />
    }
  }

  return <>{handleScreen()}</>
}

export default App
