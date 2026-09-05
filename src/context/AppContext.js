// AppContext.js  (solo el contexto y el reducer, sin componentes)
import { createContext } from 'react'
import { ACTIONS, PANTALLAS } from '../utils/consts.js'

export const AppContext = createContext(null)

const estadoInicial = {
  pantalla: PANTALLAS.INICIO,
  empleados: [],
  servicios: [],
  client: null
}

export function reducer(state, action) {
  switch (action.type) {
    case ACTIONS.ACTUALITZAR:
      return {
        ...state,
        ...action.payload
      }
    default:
      return state
  }
}

export { estadoInicial }
