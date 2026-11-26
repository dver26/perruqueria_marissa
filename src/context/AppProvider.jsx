// AppProvider.jsx  (solo el componente)
import { useReducer } from 'react'
import { AppContext, reducer, estadoInicial } from './AppContext'

// Comparte el estado y la forma de actualizarlo con los componentes que contiene.
export function AppProvider({ children }) {
  const [state, dispatch] = useReducer(reducer, estadoInicial)
  return (
    <AppContext.Provider value={{ state, dispatch }}>
      {children}
    </AppContext.Provider>
  )
}
