import { useEffect } from 'react'
import { useAppContext } from './context/useAppContext.js'
import { fetchTablas } from './utils/supabase.js'
import { ACTIONS, PANTALLAS, RESERVA_BUIDA, TAULES } from './utils/consts.js'

import Crear_Client from './crear_client/Crear_Client.jsx'
import CardGrid from './inicio/CardGrid.jsx'
import ConfigCita from './configuracio_cita/ConfigCita.jsx'
import Editar_Client from './editar_client/Editar_Client.jsx'
import Editar_Treballador from './editar_treballador/Editar_Treballador.jsx'
import Crear_Treballador from './crear_treballador/Crear_Treballador.jsx'
import HorariTreballador from './horari_treballador/HorariTreballador.jsx'
import DiesFesta from './dies_festa/DiesFesta.jsx'

import './App.css'
import Calendari from './calendari/Calendari.jsx'
import VisorDia from './visor_dia/VisorDia.jsx'
import ResumSetmanal from './resums/ResumSetmanal.jsx'

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
  }, [dispatch])

  // Quita el cliente de la reserva y vuelve al inicio.
  const handleCancelarReserva = () => {
    if (state.guardantReserva) return
    dispatch({
      type: ACTIONS.ACTUALITZAR,
      payload: {
        ...RESERVA_BUIDA,
        client: null,
        pantalla: PANTALLAS.INICIO
      }
    })
  }

  return (
    <>
      {state.nomClientReserva && state.pantalla && (
        <div className='avis-reserva'>
          <span className='avis-reserva-text' role='status'>
            <span className='avis-reserva-client' title={state.nomClientReserva}>
              <span className='avis-reserva-prefix'>Estàs reservant hora per a </span>
              <strong>{state.nomClientReserva}</strong>
            </span>
            {state.servei?.nombre && (
              <>
                <span aria-hidden='true'>·</span>
                <strong className='avis-reserva-servei' title={state.servei.nombre}>{state.servei.nombre}</strong>
              </>
            )}
          </span>
          <button type='button' onClick={handleCancelarReserva} disabled={state.guardantReserva}>
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
    case PANTALLAS.RESUM_DIARI:
      return <Calendari resum />
    case PANTALLAS.RESUM_DIA:
      return <VisorDia resum />
    case PANTALLAS.RESUM_SETMANAL:
      return <ResumSetmanal />
    case PANTALLAS.EDITAR_CLIENT:
      return <Editar_Client />
    case PANTALLAS.EDITAR_TREBALLADOR:
      return <Editar_Treballador />
    case PANTALLAS.CREAR_TREBALLADOR:
      return <Crear_Treballador />
    case PANTALLAS.HORARI_TREBALLADOR:
      return <HorariTreballador />
    case PANTALLAS.DIES_FESTA:
      return <DiesFesta />
    case PANTALLAS.CREAR_CLIENT:
      return <Crear_Client />
    default:
      return <p>Error</p>
  }
}

export default App
