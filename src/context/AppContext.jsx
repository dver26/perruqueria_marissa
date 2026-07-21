// context/AppContext.jsx
import { createContext, useReducer } from 'react'
import serveis from '../../serveis.json'

// eslint-disable-next-line react-refresh/only-export-components
export const AppContext = createContext()

function reducer(state, action) {
  switch (action.type) {
    case 'CAMBIAR_PANTALLA':
      return {
        ...state,
        pantalla: action.payload.pantalla,
        serveiEscollit: action.payload.serveiEscollit
      }
  }
}

export function AppProvider({ children }) {
  const [state, dispatch] = useReducer(reducer, {
    pantalla: 'inicio',
    serveis: serveis,
    serveiEscollit: null
  })

  return (
    <AppContext.Provider value={{ state, dispatch }}>
      {children}
    </AppContext.Provider>
  )
}
