import { useState } from 'react'
import { useAppContext } from '../utils/useAppContext'
import styles from './Form.module.css'

const TREBALLADORES = [
  { valor: 'M', nom: 'Marissa' },
  { valor: 'G', nom: 'Gemma' },
  { valor: 'R', nom: 'Ruth' }
]

export default function DuracioForm() {
  const { state, dispatch } = useAppContext()
  const { serveis, serveiEscollit } = state

  console.log(state)
  console.log(state.serveiEscollit)

  // duracionsTriades: { [partName]: duracioSeleccionada }
  const [duracionsTriades, setDuracionsTriades] = useState({})
  const [treballadoresTriades, setTreballadoresTriades] = useState({})

  const handleCanvi = (partName, valor) => {
    setDuracionsTriades((prev) => ({
      ...prev,
      [partName]: Number(valor)
    }))
  }
  const handleCanviTreballadora = (partName, valor) => {
    setTreballadoresTriades((prev) => ({
      ...prev,
      [partName]: valor
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

    const treballadoresCompletes = {}
    serveis[serveiEscollit].parts.forEach((part) => {
      if (part.name !== 'Exposició') {
        treballadoresCompletes[part.name] =
          treballadoresTriades[part.name] ?? TREBALLADORES[0].valor
      }
    })

    dispatch({
      type: 'BUSCAR_ESPAI',
      payload: { pantalla: 'buscar_espai', duracions: duracionsCompletes, treballadores: treballadoresCompletes }
    })
  }

  return (
    <form className={styles.form} onSubmit={handleSubmit}>
      <h3>{serveiEscollit.name}</h3>

      {serveis[serveiEscollit].parts.map((part) => (
        <div className={styles.parteGroup} key={part.name}>
          <label htmlFor={part.name}>{part.name}</label>
        <div className={styles.controls}> 

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
          {part.name !== 'Exposició' && (
            <select
              id={`${part.name}-treballadora`}
              aria-label={`Treballadora per ${part.name}`}
              value={treballadoresTriades[part.name] ?? TREBALLADORES[0].valor}
              onChange={(e) => handleCanviTreballadora(part.name, e.target.value)}
            >
              {TREBALLADORES.map((t) => (
                <option key={t.valor} value={t.valor} title={t.nom}>
                  {t.valor}
                </option>
              ))}
            </select>
          )}
        </div>
        </div>
      ))}

      <button type='submit'>Confirmar durades</button>
    </form>
  )
}
