import { useAppContext } from '../context/useAppContext.js'
import { ACTIONS, PANTALLAS } from '../utils/consts.js'
import FormulariPersona from '../components/FormulariPersona.jsx'
import './Crear_Client.css'

// Abre el alta con las mismas comprobaciones que la edición.
export default function CrearClient() {
  const { dispatch } = useAppContext()

  // Vuelve al inicio y limpia la selección al cancelar.
  const handleCancelar = () => {
    dispatch({ type: ACTIONS.ACTUALITZAR, payload: { client: null, pantalla: PANTALLAS.INICIO } })
  }

  // Actualiza la selección después de confirmar el guardado.
  const handleGuardat = personaGuardada => {
    dispatch({ type: ACTIONS.ACTUALITZAR, payload: {
      client: personaGuardada, pantalla: PANTALLAS.INICIO
    } })
  }

  return <FormulariPersona onGuardat={handleGuardat} onCancelar={handleCancelar} />
}
