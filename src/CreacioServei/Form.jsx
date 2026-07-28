import { useState } from 'react'
import { useAppContext } from '../utils/useAppContext'
import styles from './Form.module.css'

export default function DuracioForm() {
  const { state, dispatch } = useAppContext()
  const { serveis, serveiEscollit } = state

  console.log(state)
  console.log(state.serveiEscollit)

  // duracionsTriades: { [partName]: duracioSeleccionada }
  const [duracionsTriades, setDuracionsTriades] = useState({})

  const handleCanvi = (partName, valor) => {
    setDuracionsTriades((prev) => ({
      ...prev,
      [partName]: Number(valor)
    }))
  }

  const handleSubmit = (e) => {
    e.preventDefault()

    const duracionsCompletes = {}
    serveis[serveiEscollit].parts.forEach((part) => {
      duracionsCompletes[part.name] =
        duracionsTriades[part.name] ?? part.duration[0]
    })

    console.log(duracionsCompletes)

    dispatch({
      type: 'BUSCAR_ESPAI',
      payload: { pantalla: 'buscar_espai', duracions: duracionsCompletes }
    })
  }

  return (
    <form className={styles.form} onSubmit={handleSubmit}>
      <h3>{serveiEscollit.name}</h3>

      {serveis[serveiEscollit].parts.map((part) => (
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
