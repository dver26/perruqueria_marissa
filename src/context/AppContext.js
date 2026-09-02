// AppContext.js  (solo el contexto y el reducer, sin componentes)
import { createContext } from "react";

export const AppContext = createContext(null);

const estadoInicial = {
  pantalla: "calendari",
};

export function reducer(state, action) {
  switch (action.type) {
    default:
      return state;
  }
}

export { estadoInicial };
