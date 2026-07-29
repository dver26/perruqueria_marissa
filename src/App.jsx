import { useAppContext } from './utils/useAppContext.js'
import './App.css'

import CardGrid from './Inicio/CardGrid.jsx'
import PantallaParts from './CreacioServei/PantallaParts.jsx'
import BuscarEspai from './BuscarEspai/BuscarEspai.jsx'
import VisorDia from './BuscarEspai/VisorDia.jsx'

const App = () => {
  const { state } = useAppContext()

  const handleScreen = () => {
    switch (state.pantalla) {
      case 'inicio':
        return <CardGrid />
      case 'escollir':
        return <PantallaParts />
      case 'buscar_espai':
        return <BuscarEspai />
      case 'visor_dia':
        return <VisorDia data={state.data} />
    }
  }

  return <>{handleScreen()}</>
}

export default App
