import { useAppContext } from '../context/useAppContext.js'
import { ACTIONS, PANTALLAS } from '../utils/consts.js'
import FormulariPersona from '../components/FormulariPersona.jsx'
import './Editar_Treballador.css'

// Abre la edición con los datos seleccionados.
export default function EditarTreballador() {
  const { state, dispatch } = useAppContext()
  const persona = state.treballador

  // Vuelve al inicio y limpia la selección al cancelar.
  const handleCancelar = () => {
    dispatch({ type: ACTIONS.ACTUALITZAR, payload: { treballador: null, pantalla: PANTALLAS.INICIO } })
  }

  // Actualiza la selección y la lista de empleados después de confirmar el guardado.
  const handleGuardat = personaGuardada => {
    dispatch({ type: ACTIONS.ACTUALITZAR, payload: {
      treballador: null, pantalla: PANTALLAS.INICIO,
      empleados: [...state.empleados.filter(p => p.id !== personaGuardada.id), personaGuardada]
    } })
  }

  if (!persona) return <button onClick={handleCancelar}>Tornar a inici</button>
  return <FormulariPersona persona={persona} treballador onGuardat={handleGuardat} onCancelar={handleCancelar} />
}
