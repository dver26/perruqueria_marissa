// useAppContext.js  (solo el hook)
import { useContext } from "react";
import { AppContext } from "./AppContext";

// Da acceso al estado compartido y avisa si falta el AppProvider.
export function useAppContext() {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error("useAppContext debe usarse dentro de AppProvider");
  }
  return context;
}
