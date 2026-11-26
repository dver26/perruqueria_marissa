import { useEffect } from 'react'
import { useAppContext } from './context/useAppContext.js'
import { fetchTablas } from './utils/supabase.js'
import { ACTIONS, PANTALLAS, TAULES } from './utils/consts.js'

import Crear_Client from './crear_client/Crear_Client.jsx'
import CardGrid from './inicio/CardGrid.jsx'
import ConfigCita from './configuracio_cita/ConfigCita.jsx'
import Editar_Client from './editar_client/Editar_Client.jsx'

import './App.css'
import Calendari from './calendari/Calendari.jsx'
import VisorDia from './visor_dia/VisorDia.jsx'

// Arranca la app y muestra la pantalla actual junto al aviso de reserva, si lo hay.
function App() {
  const { state, dispatch } = useAppContext()

  // Carga los datos de inicio al montar la app.
  useEffect(() => {
    // Trae servicios y empleados y los guarda en el estado compartido.
    const cargarDatosIniciales = async () => {
      const datos = await fetchTablas([TAULES.SERVICIOS, TAULES.EMPLEADOS])
      const fallo = Object.entries(datos).find(([, valor]) => valor === null) // busquem si ha hagut algun fallo en algun fetch

      if (fallo) {
        console.error(`No se pudo cargar: ${fallo[0]}`)
        return
      }

      dispatch({ type: ACTIONS.ACTUALITZAR, payload: datos })
    }

    cargarDatosIniciales()
  }, [])

  // Quita el cliente de la reserva y vuelve al inicio.
  const handleCancelarReserva = () => {
    dispatch({
      type: ACTIONS.ACTUALITZAR,
      payload: {
        nomClientReserva: null,
        idClientReserva: null,
        client: null,
        pantalla: PANTALLAS.INICIO
      }
    })
  }

  return (
    <>
      {state.nomClientReserva && state.pantalla && (
        <div className='avis-reserva'>
          <span role='status'>
            Estàs reservant hora per a <strong>{state.nomClientReserva}</strong>
          </span>
          <button type='button' onClick={handleCancelarReserva}>
            Cancel·lar
          </button>
        </div>
      )}
      {renderPantalla(state.pantalla)}
    </>
  )
}

// Elige qué componente mostrar según la pantalla guardada en el estado.
function renderPantalla(pantalla) {
  switch (pantalla) {
    case PANTALLAS.INICIO:
      return <CardGrid />
    case PANTALLAS.CONFIGURACIO_CITA:
      return <ConfigCita />
    case PANTALLAS.CALENDARI:
      return <Calendari />
    case PANTALLAS.VISOR_DIA:
      return <VisorDia />
    case PANTALLAS.EDITAR_CLIENT:
      return <Editar_Client />
    case PANTALLAS.EDITAR_TREBALLADOR:
      return <Editar_Treballador />
    case PANTALLAS.CREAR_CLIENT:
      return <Crear_Client />
    default:
      return <p>Error</p>
  }
}

export default App
