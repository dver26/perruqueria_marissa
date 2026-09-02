import { useEffect } from 'react'
import { useAppContext } from './context/useAppContext.js'
import { fetchTablas } from './utils/supabase.js'

import { ACTIONS } from './utils/consts.js'

function App() {
  const { state, dispatch } = useAppContext()

  useEffect(() => {
    const cargarDatosIniciales = async () => {
      const datos = await fetchTablas(['servicios', 'empleados'])
      const fallo = Object.entries(datos).find(([, valor]) => valor === null)

      if (fallo) {
        console.error(`No se pudo cargar: ${fallo[0]}`)
        return
      }

      dispatch({ type: ACTIONS.ACTUALITZAR, payload: datos })
    }

    cargarDatosIniciales()
  }, [])

  console.log(JSON.stringify(state))

  return (
    <>
      <p>Hola Mundo</p>
      {state.pantalla}
    </>
  )
}

export default App
