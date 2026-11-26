import { useAppContext } from '../context/useAppContext.js'
import { ACTIONS, PANTALLAS } from '../utils/consts.js'
import FormulariPersona from '../components/FormulariPersona.jsx'
import './Editar_Client.css'

// Abre la edición con los datos seleccionados.
export default function EditarClient() {
  const { state, dispatch } = useAppContext()
  const persona = state.client

  // Vuelve al inicio y limpia la selección al cancelar.
  const handleCancelar = () => {
    dispatch({ type: ACTIONS.ACTUALITZAR, payload: { client: null, pantalla: PANTALLAS.INICIO } })
  }

  // Actualiza la selección después de confirmar el guardado.
  const handleGuardat = () => {
    dispatch({ type: ACTIONS.ACTUALITZAR, payload: {
      client: null, pantalla: PANTALLAS.INICIO
    } })
  }

  if (!persona) return <button onClick={handleCancelar}>Tornar a inici</button>
  return <FormulariPersona persona={persona} onGuardat={handleGuardat} onCancelar={handleCancelar} />
}
