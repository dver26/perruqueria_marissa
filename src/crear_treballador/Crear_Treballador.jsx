import { useAppContext } from '../context/useAppContext.js'
import { ACTIONS, PANTALLAS } from '../utils/consts.js'
import FormulariPersona from '../components/FormulariPersona.jsx'

// Abre el alta con las mismas comprobaciones que la edición.
export default function CrearTreballador() {
  const { state, dispatch } = useAppContext()

  // Vuelve al inicio y limpia la selección al cancelar.
  const handleCancelar = () => {
    dispatch({ type: ACTIONS.ACTUALITZAR, payload: { treballador: null, pantalla: PANTALLAS.INICIO } })
  }

  // Actualiza la selección y la lista de empleados después de confirmar el guardado.
  const handleGuardat = personaGuardada => {
    dispatch({ type: ACTIONS.ACTUALITZAR, payload: {
      treballador: personaGuardada, pantalla: PANTALLAS.HORARI_TREBALLADOR, altaHorari: true,
      empleados: [...state.empleados.filter(p => p.id !== personaGuardada.id), personaGuardada]
    } })
  }

  return <FormulariPersona treballador descripcio='Pas 1 de 2 · Dades personals. Després configuraràs l’horari setmanal.' textGuardar='Guardar dades i continuar' onGuardat={handleGuardat} onCancelar={handleCancelar} />
}
