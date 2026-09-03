import { useEffect } from 'react'
import { useAppContext } from './context/useAppContext.js'
import { fetchTablas } from './utils/supabase.js'
import { ACTIONS, PANTALLAS } from './utils/consts.js'

import CardGrid from './inicio/CardGrid.jsx'
import ConfigCita from './configuracio_cita/ConfigCita.jsx'

import './App.css'

function App() {
  const { state, dispatch } = useAppContext()

  useEffect(() => {
    const cargarDatosIniciales = async () => {
      const datos = await fetchTablas(['servicios', 'empleados'])
      const fallo = Object.entries(datos).find(([, valor]) => valor === null) // busquem si ha hagut algun fallo en algun fetch

      if (fallo) {
        console.error(`No se pudo cargar: ${fallo[0]}`)
        return
      }

      dispatch({ type: ACTIONS.ACTUALITZAR, payload: datos })
    }

    cargarDatosIniciales()
  }, [])

  switch (state.pantalla) {
    case PANTALLAS.INICIO:
      return <CardGrid />
    case PANTALLAS.CONFIGURACIO_CITA:
      return <ConfigCita />
    default:
      return <p>Error</p>
  }
}

export default App
