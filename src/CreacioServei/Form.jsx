import { useState } from 'react'
import { useAppContext } from '../utils/useAppContext' // ajusta la ruta a la tuya
import styles from './Form.module.css'

export default function DuracioForm() {
  const { state, dispatch } = useAppContext()
  const { serveis, serveiEscollit } = state

  console.log(state)
  console.log(state.serveiEscollit)

  // duracionsTriades: { [partName]: duracioSeleccionada }
  const [duracionsTriades, setDuracionsTriades] = useState({})
  const servei = state.serveiEscollit

  //   if (!servei) {
  //     return <p className={styles.avis}>Selecciona un servei primer.</p>
  //   }

  const handleCanvi = (partName, valor) => {
    setDuracionsTriades((prev) => ({
      ...prev,
      [partName]: Number(valor)
    }))
  }

  const handleSubmit = (e) => {
    e.preventDefault()
    dispatch({
      type: 'SET_DURACIONS_SERVEI',
      payload: {
        servei: servei.name,
        duracions: duracionsTriades
      }
    })
  }

  return (
    <form className={styles.form} onSubmit={handleSubmit}>
      <h3>{servei.name}</h3>

      {serveis[servei].parts.map((part) => (
        <div className={styles.parteGroup} key={part.name}>
          <label htmlFor={part.name}>{part.name}</label>

          {part.duration.length > 1 ? (
            <select
              id={part.name}
              value={duracionsTriades[part.name] ?? part.duration[0]}
              onChange={(e) => handleCanvi(part.name, e.target.value)}
            >
              {part.duration.map((d) => (
                <option key={d} value={d}>
                  {d} min
                </option>
              ))}
            </select>
          ) : (
            <span className={styles.duracioFixa}>{part.duration[0]} min</span>
          )}
        </div>
      ))}

      <button type='submit'>Confirmar durades</button>
    </form>
  )
}
