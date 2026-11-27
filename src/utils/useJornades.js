import { useEffect, useState } from 'react'
import { carregarJornades } from './jornades.js'

export function useJornades(data, nombreDies, tornSeleccionat) {
  const [resultat, setResultat] = useState(null)
  const [error, setError] = useState(false)

  useEffect(() => {
    const control = new AbortController()
    carregarJornades(data, nombreDies, tornSeleccionat, control.signal)
      .then((jornades) => {
        if (!control.signal.aborted) setResultat(jornades)
      })
      .catch((error) => {
        if (control.signal.aborted) return
        console.error('Error carregant els horaris:', error)
        setError(true)
      })
    return () => control.abort()
  }, [data, nombreDies, tornSeleccionat])

  return { resultat, error }
}
